/**
 * @copyright (c) 2011, Yahoo! Inc.  All rights reserved.
 * @copyright (c) 2012, Log-Normal, Inc.  All rights reserved.
 * @copyright (c) 2012-2017, SOASTA, Inc. All rights reserved.
 * @copyright (c) 2017, Akamai Technologies, Inc. All rights reserved.
 * Copyrights licensed under the BSD License. See the accompanying LICENSE.txt file for terms.
 */

/**
 * @class BOOMR
 * @desc
 * boomerang measures various performance characteristics of your user's browsing
 * experience and beacons it back to your server.
 *
 * To use this you'll need a web site, lots of users and the ability to do
 * something with the data you collect.  How you collect the data is up to
 * you, but we have a few ideas.
 *
 * Everything in boomerang is accessed through the `BOOMR` object, which is
 * available on `window.BOOMR`.  It contains the public API, utility functions
 * ({@link BOOMR.utils}) and all of the plugins ({@link BOOMR.plugins}).
 *
 * Each plugin has its own API, but is reachable through {@link BOOMR.plugins}.
 *
 * ## Beacon Parameters
 *
 * The core boomerang object will add the following parameters to the beacon.
 *
 * Note that each individual {@link BOOMR.plugins plugin} will add its own
 * parameters as well.
 *
 * * `v`: Boomerang version
 * * `u`: The page's URL (for most beacons), or the `XMLHttpRequest` URL
 * * `pgu`: The page's URL (for `XMLHttpRequest` beacons)
 * * `pid`: Page ID (8 characters)
 * * `r`: Navigation referrer (from the cookie)
 * * `r2`: Navigation referrer (from `document.location`, if different than `r`)
 * * `vis.pre`: `1` if the page transitioned from prerender to visible
 * * `xhr.pg`: The `XMLHttpRequest` page group
 * * `errors`: Error messages of errors detected in Boomerang code, separated by a newline
 */

/**
 * @typedef TimeStamp
 * @type {number}
 *
 * @desc
 * A [Unix Epoch](https://en.wikipedia.org/wiki/Unix_time) timestamp (milliseconds
 * since 1970) created by [BOOMR.now()]{@link BOOMR.now}.
 *
 * If `DOMHighResTimeStamp` (`performance.now()`) is supported, it is
 * a `DOMHighResTimeStamp` (with microsecond resolution in the fractional),
 * otherwise, it is `Date.now()`.
 */

/**
 * @global
 * @type {TimeStamp}
 * @desc
 * Timestamp the boomerang.js script started executing.
 *
 * This has to be global so that we don't wait for this entire
 * script to download and execute before measuring the
 * time.  We also declare it without `var` so that we can later
 * `delete` it.  This is the only way that works on Internet Explorer.
 */
BOOMR_start = new Date().getTime();

/**
 * @function
 * @global
 * @desc
 * Check the value of `document.domain` and fix it if incorrect.
 *
 * This function is run at the top of boomerang, and then whenever
 * {@link BOOMR.init} is called.  If boomerang is running within an IFRAME, this
 * function checks to see if it can access elements in the parent
 * IFRAME.  If not, it will fudge around with `document.domain` until
 * it finds a value that works.
 *
 * This allows site owners to change the value of `document.domain` at
 * any point within their page's load process, and we will adapt to
 * it.
 *
 * @param {string} domain Domain name as retrieved from page URL
 */
function BOOMR_check_doc_domain(domain) {
	/*eslint no-unused-vars:0*/
	var test;

	if (!window) {
		return;
	}

	// If domain is not passed in, then this is a global call
	// domain is only passed in if we call ourselves, so we
	// skip the frame check at that point
	if (!domain) {
		// If we're running in the main window, then we don't need this
		if (window.parent === window || !document.getElementById("boomr-if-as")) {
			return;// true;	// nothing to do
		}

		if (window.BOOMR && BOOMR.boomerang_frame && BOOMR.window) {
			try {
				// If document.domain is changed during page load (from www.blah.com to blah.com, for example),
				// BOOMR.window.location.href throws "Permission Denied" in IE.
				// Resetting the inner domain to match the outer makes location accessible once again
				if (BOOMR.boomerang_frame.document.domain !== BOOMR.window.document.domain) {
					BOOMR.boomerang_frame.document.domain = BOOMR.window.document.domain;
				}
			}
			catch (err) {
				if (!BOOMR.isCrossOriginError(err)) {
					BOOMR.addError(err, "BOOMR_check_doc_domain.domainFix");
				}
			}
		}
		domain = document.domain;
	}

	if (domain.indexOf(".") === -1) {
		return;// false;	// not okay, but we did our best
	}

	// 1. Test without setting document.domain
	try {
		test = window.parent.document;
		return;// test !== undefined;	// all okay
	}
	// 2. Test with document.domain
	catch (err) {
		document.domain = domain;
	}
	try {
		test = window.parent.document;
		return;// test !== undefined;	// all okay
	}
	// 3. Strip off leading part and try again
	catch (err) {
		domain = domain.replace(/^[\w\-]+\./, "");
	}

	BOOMR_check_doc_domain(domain);
}

BOOMR_check_doc_domain();

// Construct BOOMR
// w is window
(function(w) {
	var impl, boomr, d, createCustomEvent, dispatchEvent, visibilityState, visibilityChange, orig_w = w;

	// If the window that boomerang is running in is not top level (ie, we're running in an iframe)
	// and if this iframe contains a script node with an id of "boomr-if-as",
	// Then that indicates that we are using the iframe loader, so the page we're trying to measure
	// is w.parent
	//
	// Note that we use `document` rather than `w.document` because we're specifically interested in
	// the document of the currently executing context rather than a passed in proxy.
	//
	// The only other place we do this is in `BOOMR.utils.getMyURL` below, for the same reason, we
	// need the full URL of the currently executing (boomerang) script.
	if (w.parent !== w &&
	    document.getElementById("boomr-if-as") &&
	    document.getElementById("boomr-if-as").nodeName.toLowerCase() === "script") {
		w = w.parent;
	}

	d = w.document;

	// Short namespace because I don't want to keep typing BOOMERANG
	if (!w.BOOMR) {
		w.BOOMR = {};
	}

	BOOMR = w.BOOMR;

	// don't allow this code to be included twice
	if (BOOMR.version) {
		return;
	}

	/**
	 * Boomerang version, formatted as major.minor.patchlevel.
	 *
	 * This variable is replaced during build (`grunt build`).
	 *
	 * @type {string}
	 *
	 * @memberof BOOMR
	 */
	BOOMR.version = "1.568.0";

	/**
	 * The main document window.
	 * * If Boomerang was loaded in an IFRAME, this is the parent window
	 * * If Boomerang was loaded inline, this is the current window
	 *
	 * @type {Window}
	 *
	 * @memberof BOOMR
	 */
	BOOMR.window = w;

	/**
	 * The Boomerang frame:
	 * * If Boomerang was loaded in an IFRAME, this is the IFRAME
	 * * If Boomerang was loaded inline, this is the current window
	 *
	 * @type {Window}
	 *
	 * @memberof BOOMR
	 */
	BOOMR.boomerang_frame = orig_w;

	/**
	 * @class BOOMR.plugins
	 * @desc
	 * Boomerang plugin namespace.
	 *
	 * All plugins should add their plugin object to `BOOMR.plugins`.
	 *
	 * A plugin should have, at minimum, the following exported functions:
	 * * `init(config)`
	 * * `is_complete()`
	 *
	 * See {@tutorial creating-plugins} for details.
	 */
	if (!BOOMR.plugins) {
		BOOMR.plugins = {};
	}

	// CustomEvent proxy for IE9 & 10 from https://developer.mozilla.org/en-US/docs/Web/API/CustomEvent
	(function() {
		try {
			if (new w.CustomEvent("CustomEvent") !== undefined) {
				createCustomEvent = function(e_name, params) {
					return new w.CustomEvent(e_name, params);
				};
			}
		}
		catch (ignore) {
			// empty
		}

		try {
			if (!createCustomEvent && d.createEvent && d.createEvent("CustomEvent")) {
				createCustomEvent = function(e_name, params) {
					var evt = d.createEvent("CustomEvent");
					params = params || { cancelable: false, bubbles: false };
					evt.initCustomEvent(e_name, params.bubbles, params.cancelable, params.detail);

					return evt;
				};
			}
		}
		catch (ignore) {
			// empty
		}

		if (!createCustomEvent && d.createEventObject) {
			createCustomEvent = function(e_name, params) {
				var evt = d.createEventObject();
				evt.type = evt.propertyName = e_name;
				evt.detail = params.detail;

				return evt;
			};
		}

		if (!createCustomEvent) {
			createCustomEvent = function() { return undefined; };
		}
	}());

	/**
	 * Dispatch a custom event to the browser
	 * @param {string} e_name The custom event name that consumers can subscribe to
	 * @param {object} e_data Any data passed to subscribers of the custom event via the `event.detail` property
	 * @param {boolean} async By default, custom events are dispatched immediately.
	 * Set to true if the event should be dispatched once the browser has finished its current
	 * JavaScript execution.
	 */
	dispatchEvent = function(e_name, e_data, async) {
		var ev = createCustomEvent(e_name, {"detail": e_data});
		if (!ev) {
			return;
		}

		function dispatch() {
			try {
				if (d.dispatchEvent) {
					d.dispatchEvent(ev);
				}
				else if (d.fireEvent) {
					d.fireEvent("onpropertychange", ev);
				}
			}
			catch (e) {
				BOOMR.debug("Error when dispatching " + e_name);
			}
		}

		if (async) {
			BOOMR.setImmediate(dispatch);
		}
		else {
			dispatch();
		}
	};

	// visibilitychange is useful to detect if the page loaded through prerender
	// or if the page never became visible
	// http://www.w3.org/TR/2011/WD-page-visibility-20110602/
	// http://www.nczonline.net/blog/2011/08/09/introduction-to-the-page-visibility-api/
	// https://developer.mozilla.org/en-US/docs/Web/Guide/User_experience/Using_the_Page_Visibility_API

	// Set the name of the hidden property and the change event for visibility
	if (typeof d.hidden !== "undefined") {
		visibilityState = "visibilityState";
		visibilityChange = "visibilitychange";
	}
	else if (typeof d.mozHidden !== "undefined") {
		visibilityState = "mozVisibilityState";
		visibilityChange = "mozvisibilitychange";
	}
	else if (typeof d.msHidden !== "undefined") {
		visibilityState = "msVisibilityState";
		visibilityChange = "msvisibilitychange";
	}
	else if (typeof d.webkitHidden !== "undefined") {
		visibilityState = "webkitVisibilityState";
		visibilityChange = "webkitvisibilitychange";
	}

	// impl is a private object not reachable from outside the BOOMR object.
	// Users can set properties by passing in to the init() method.
	impl = {
		// Beacon URL
		beacon_url: "",

		// List of string regular expressions that must match the beacon_url.  If
		// not set, or the list is empty, all beacon URLs are allowed.
		beacon_urls_allowed: [],

		// Beacon request method, either GET, POST or AUTO. AUTO will check the
		// request size then use GET if the request URL is less than MAX_GET_LENGTH
		// chars. Otherwise, it will fall back to a POST request.
		beacon_type: "AUTO",

		// Beacon authorization key value. Most systems will use the 'Authentication'
		// keyword, but some some services use keys like 'X-Auth-Token' or other
		// custom keys.
		beacon_auth_key: "Authorization",

		// Beacon authorization token. This is only needed if your are using a POST
		// and the beacon requires an Authorization token to accept your data.
		beacon_auth_token: undefined,

		// Strip out everything except last two parts of hostname.
		// This doesn't work well for domains that end with a country tld,
		// but we allow the developer to override site_domain for that.
		// You can disable all cookies by setting site_domain to a falsy value.
		site_domain: w.location.hostname.
					replace(/.*?([^.]+\.[^.]+)\.?$/, "$1").
					toLowerCase(),

		// User's ip address determined on the server.  Used for the BW cookie.
		user_ip: "",

		// Whether or not to send beacons on page load
		autorun: true,

		// Whether or not we've sent a page load beacon
		hasSentPageLoadBeacon: false,

		// cookie referrer
		r: undefined,

		// document.referrer
		r2: undefined,

		// strip_query_string: false,

		// onloadfired: false,

		// handlers_attached: false,
		events: {
			/**
			 * Boomerang event, subscribe via {@link BOOMR.subscribe}.
			 *
			 * Fired when the page is usable by the user.
			 *
			 * By default this is fired when `window.onload` fires, but if you
			 * set `autorun` to false when calling {@link BOOMR.init}, then you
			 * must explicitly fire this event by calling {@link BOOMR#event:page_ready}.
			 *
			 * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/GlobalEventHandlers/onload}
			 * @event BOOMR#page_ready
			 * @property {Event} [event] Event triggering the page_ready
			 */
			"page_ready": [],

			/**
			 * Boomerang event, subscribe via {@link BOOMR.subscribe}.
			 *
			 * Fired just before the browser unloads the page.
			 *
			 * The first event of `window.pagehide`, `window.beforeunload`,
			 * or `window.unload` will trigger this.
			 *
			 * @see {@link https://developer.mozilla.org/en-US/docs/Web/Events/pagehide}
			 * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/WindowEventHandlers/onbeforeunload}
			 * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/WindowEventHandlers/onunload}
			 * @event BOOMR#page_unload
			 */
			"page_unload": [],

			/**
			 * Boomerang event, subscribe via {@link BOOMR.subscribe}.
			 *
			 * Fired before the document is about to be unloaded.
			 *
			 * `window.beforeunload` will trigger this.
			 *
			 * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/WindowEventHandlers/onbeforeunload}
			 * @event BOOMR#before_unload
			 */
			"before_unload": [],

			/**
			 * Boomerang event, subscribe via {@link BOOMR.subscribe}.
			 *
			 * Fired on `document.DOMContentLoaded`.
			 *
			 * The `DOMContentLoaded` event is fired when the initial HTML document
			 * has been completely loaded and parsed, without waiting for stylesheets,
			 * images, and subframes to finish loading
			 *
			 * @see {@link https://developer.mozilla.org/en-US/docs/Web/Events/DOMContentLoaded}
			 * @event BOOMR#dom_loaded
			 */
			"dom_loaded": [],

			/**
			 * Boomerang event, subscribe via {@link BOOMR.subscribe}.
			 *
			 * Fired on `document.visibilitychange`.
			 *
			 * The `visibilitychange` event is fired when the content of a tab has
			 * become visible or has been hidden.
			 *
			 * @see {@link https://developer.mozilla.org/en-US/docs/Web/Events/visibilitychange}
			 * @event BOOMR#visibility_changed
			 */
			"visibility_changed": [],

			/**
			 * Boomerang event, subscribe via {@link BOOMR.subscribe}.
			 *
			 * Fired when the `visibilityState` of the document has changed from
			 * `prerender` to `visible`
			 *
			 * @see {@link https://developer.mozilla.org/en-US/docs/Web/Events/visibilitychange}
			 * @event BOOMR#prerender_to_visible
			 */
			"prerender_to_visible": [],

			/**
			 * Boomerang event, subscribe via {@link BOOMR.subscribe}.
			 *
			 * Fired when a beacon is about to be sent.
			 *
			 * The subscriber can still add variables to the beacon at this point,
			 * either by modifying the `vars` paramter or calling {@link BOOMR.addVar}.
			 *
			 * @event BOOMR#before_beacon
			 * @property {object} vars Beacon variables
			 */
			"before_beacon": [],

			/**
			 * Boomerang event, subscribe via {@link BOOMR.subscribe}.
			 *
			 * Fired when a beacon was sent.
			 *
			 * The beacon variables cannot be modified at this point.  Any calls
			 * to {@link BOOMR.addVar} or {@link BOOMR.removeVar} will apply to the
			 * next beacon.
			 *
			 * Also known as `onbeacon`.
			 *
			 * @event BOOMR#beacon
			 * @property {object} vars Beacon variables
			 */
			"beacon": [],

			/**
			 * Boomerang event, subscribe via {@link BOOMR.subscribe}.
			 *
			 * Fired when the page load beacon has been sent.
			 *
			 * This event should only happen once on a page.  It does not apply
			 * to SPA soft navigations.
			 *
			 * @event BOOMR#page_load_beacon
			 * @property {object} vars Beacon variables
			 */
			"page_load_beacon": [],

			/**
			 * Boomerang event, subscribe via {@link BOOMR.subscribe}.
			 *
			 * Fired when an XMLHttpRequest has finished, or, if something calls
			 * {@link BOOMR.responseEnd}.
			 *
			 * @event BOOMR#xhr_load
			 * @property {object} data Event data
			 */
			"xhr_load": [],

			/**
			 * Boomerang event, subscribe via {@link BOOMR.subscribe}.
			 *
			 * Fired when the `click` event has happened on the `document`.
			 *
			 * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/GlobalEventHandlers/onclick}
			 * @event BOOMR#click
			 */
			"click": [],

			/**
			 * Boomerang event, subscribe via {@link BOOMR.subscribe}.
			 *
			 * Fired when any `FORM` element is submitted.
			 *
			 * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/HTMLFormElement/submit}
			 * @event BOOMR#form_submit
			 */
			"form_submit": [],

			/**
			 * Boomerang event, subscribe via {@link BOOMR.subscribe}.
			 *
			 * Fired whenever new configuration data is applied via {@link BOOMR.init}.
			 *
			 * Also known as `onconfig`.
			 *
			 * @event BOOMR#config
			 * @property {object} data Configuration data
			 */
			"config": [],

			/**
			 * Boomerang event, subscribe via {@link BOOMR.subscribe}.
			 *
			 * Fired whenever `XMLHttpRequest.open` is called.
			 *
			 * This event will only happen if {@link BOOMR.plugins.AutoXHR} is enabled.
			 *
			 * @event BOOMR#xhr_init
			 * @property {string} type XHR type ("xhr")
			 */
			"xhr_init": [],

			/**
			 * Boomerang event, subscribe via {@link BOOMR.subscribe}.
			 *
			 * Fired whenever a SPA plugin is about to track a new navigation.
			 *
			 * @event BOOMR#spa_init
			 * @property {string} navType Navigation type (`spa` or `spa_hard`)
			 * @property {object} param SPA navigation parameters
			 */
			"spa_init": [],

			/**
			 * Boomerang event, subscribe via {@link BOOMR.subscribe}.
			 *
			 * Fired whenever a SPA navigation is complete.
			 *
			 * @event BOOMR#spa_navigation
			 */
			"spa_navigation": [],

			/**
			 * Boomerang event, subscribe via {@link BOOMR.subscribe}.
			 *
			 * Fired whenever `XMLHttpRequest.send` is called.
			 *
			 * This event will only happen if {@link BOOMR.plugins.AutoXHR} is enabled.
			 *
			 * @event BOOMR#xhr_send
			 * @property {object} xhr `XMLHttpRequest` object
			 */
			"xhr_send": [],

			/**
			 * Boomerang event, subscribe via {@link BOOMR.subscribe}.
			 *
			 * Fired whenever and `XMLHttpRequest` has an error (if its `status` is
			 * set).
			 *
			 * This event will only happen if {@link BOOMR.plugins.AutoXHR} is enabled.
			 *
			 * Also known as `onxhrerror`.
			 *
			 * @event BOOMR#xhr_error
			 * @property {object} data XHR data
			 */
			"xhr_error": [],

			/**
			 * Boomerang event, subscribe via {@link BOOMR.subscribe}.
			 *
			 * Fired whenever a page error has happened.
			 *
			 * This event will only happen if {@link BOOMR.plugins.Errors} is enabled.
			 *
			 * Also known as `onerror`.
			 *
			 * @event BOOMR#error
			 * @property {object} err Error
			 */
			"error": [],

			/**
			 * Boomerang event, subscribe via {@link BOOMR.subscribe}.
			 *
			 * Fired whenever an `XMLHttpRequest.send()` is called
			 *
			 * This event will only happen if {@link BOOMR.plugins.AutoXHR} is enabled.
			 *
			 * @event BOOMR#xhr_send
			 * @property {object} req XMLHttpRequest
			 */
			"xhr_send": [],

			/**
			 * Boomerang event, subscribe via {@link BOOMR.subscribe}.
			 *
			 * Fired whenever connection information changes via the
			 * Network Information API.
			 *
			 * This event will only happen if {@link BOOMR.plugins.Mobile} is enabled.
			 *
			 * @event BOOMR#netinfo
			 * @property {object} connection `navigator.connection`
			 */
			"netinfo": [],

			/**
			 * Boomerang event, subscribe via {@link BOOMR.subscribe}.
			 *
			 * Fired whenever a Rage Click is detected.
			 *
			 * This event will only happen if {@link BOOMR.plugins.Continuity} is enabled.
			 *
			 * @event BOOMR#rage_click
			 * @property {Event} e Event
			 */
			"rage_click": []
		},

		/**
		 * Public events
		 */
		public_events: {
			/**
			 * Public event (fired on `document`), and can be subscribed via
			 * `document.addEventListener("onBeforeBoomerangBeacon", ...)` or
			 * `document.attachEvent("onpropertychange", ...)`.
			 *
			 * Maps to {@link BOOMR#event:before_beacon}
			 *
			 * @event document#onBeforeBoomerangBeacon
			 * @property {object} vars Beacon variables
			 */
			"before_beacon": "onBeforeBoomerangBeacon",

			/**
			 * Public event (fired on `document`), and can be subscribed via
			 * `document.addEventListener("onBoomerangBeacon", ...)` or
			 * `document.attachEvent("onpropertychange", ...)`.
			 *
			 * Maps to {@link BOOMR#event:before_beacon}
			 *
			 * @event document#onBoomerangBeacon
			 * @property {object} vars Beacon variables
			 */
			"beacon": "onBoomerangBeacon",

			/**
			 * Public event (fired on `document`), and can be subscribed via
			 * `document.addEventListener("onBoomerangLoaded", ...)` or
			 * `document.attachEvent("onpropertychange", ...)`.
			 *
			 * Fired when {@link BOOMR} has loaded and can be used.
			 *
			 * @event document#onBoomerangLoaded
			 */
			"onboomerangloaded": "onBoomerangLoaded"
		},

		/**
		 * Maps old event names to their updated name
		 */
		translate_events: {
			"onbeacon": "beacon",
			"onconfig": "config",
			"onerror": "error",
			"onxhrerror": "xhr_error"
		},

		listenerCallbacks: {},

		vars: {},
		singleBeaconVars: {},

		/**
		 * Variable priority lists:
		 * -1 = first
		 *  1 = last
		 */
		varPriority: {
			"-1": {},
			"1": {}
		},

		errors: {},

		disabled_plugins: {},

		localStorageSupported: false,
		LOCAL_STORAGE_PREFIX: "_boomr_",

		xb_handler: function(type) {
			return function(ev) {
				var target;
				if (!ev) { ev = w.event; }
				if (ev.target) { target = ev.target; }
				else if (ev.srcElement) { target = ev.srcElement; }
				if (target.nodeType === 3) {  // defeat Safari bug
					target = target.parentNode;
				}

				// don't capture events on flash objects
				// because of context slowdowns in PepperFlash
				if (target &&
				    target.nodeName &&
				    target.nodeName.toUpperCase() === "OBJECT" &&
				    target.type === "application/x-shockwave-flash") {
					return;
				}
				impl.fireEvent(type, target);
			};
		},

		clearEvents: function() {
			var eventName;

			for (eventName in this.events) {
				if (this.events.hasOwnProperty(eventName)) {
					this.events[eventName] = [];
				}
			}
		},

		clearListeners: function() {
			var type, i;

			for (type in impl.listenerCallbacks) {
				if (impl.listenerCallbacks.hasOwnProperty(type)) {
					// remove all callbacks -- removeListener is guaranteed
					// to remove the element we're calling with
					while (impl.listenerCallbacks[type].length) {
						BOOMR.utils.removeListener(
						    impl.listenerCallbacks[type][0].el,
						    type,
						    impl.listenerCallbacks[type][0].fn);
					}
				}
			}

			impl.listenerCallbacks = {};
		},

		fireEvent: function(e_name, data) {
			var i, handler, handlers, handlersLen;

			e_name = e_name.toLowerCase();

			// translate old names
			if (this.translate_events[e_name]) {
				e_name = this.translate_events[e_name];
			}

			if (!this.events.hasOwnProperty(e_name)) {
				return;// false;
			}

			if (this.public_events.hasOwnProperty(e_name)) {
				dispatchEvent(this.public_events[e_name], data);
			}

			handlers = this.events[e_name];

			// Before we fire any event listeners, let's call real_sendBeacon() to flush
			// any beacon that is being held by the setImmediate.
			if (e_name !== "before_beacon" && e_name !== "beacon") {
				BOOMR.real_sendBeacon();
			}

			// only call handlers at the time of fireEvent (and not handlers that are
			// added during this callback to avoid an infinite loop)
			handlersLen = handlers.length;
			for (i = 0; i < handlersLen; i++) {
				try {
					handler = handlers[i];
					handler.fn.call(handler.scope, data, handler.cb_data);
				}
				catch (err) {
					BOOMR.addError(err, "fireEvent." + e_name + "<" + i + ">");
				}
			}

			// remove any 'once' handlers now that we've fired all of them
			for (i = 0; i < handlersLen; i++) {
				if (handlers[i].once) {
					handlers.splice(i, 1);
					handlersLen--;
					i--;
				}
			}

			return;// true;
		},

		spaNavigation: function() {
			// a SPA navigation occured, force onloadfired to true
			impl.onloadfired = true;
		},

		/**
		 * Determines whether a beacon URL is allowed based on
		 * `beacon_urls_allowed` config
		 *
		 * @param {string} url URL to test
		 *
		 */
		beaconUrlAllowed: function(url) {
			if (!impl.beacon_urls_allowed || impl.beacon_urls_allowed.length === 0) {
				return true;
			}

			for (var i = 0; i < impl.beacon_urls_allowed.length; i++) {
				var regEx = new RegExp(impl.beacon_urls_allowed[i]);
				if (regEx.exec(url)) {
					return true;
				}
			}

			return false;
		},

		/**
		 * Checks browser for localStorage support
		 */
		checkLocalStorageSupport: function() {
			var name = impl.LOCAL_STORAGE_PREFIX + "clss";
			impl.localStorageSupported = false;

			// we need JSON and localStorage support
			if (!w.JSON || !w.localStorage) {
				return;
			}

			// Browsers with cookies disabled or in private/incognito mode may throw an
			// error when accessing the localStorage variable
			try {
				w.localStorage.setItem(name, name);
				impl.localStorageSupported = (w.localStorage.getItem(name) === name);
				w.localStorage.removeItem(name);
			}
			catch (ignore) {
				impl.localStorageSupported = false;
			}
		}
	};

	// We create a boomr object and then copy all its properties to BOOMR so that
	// we don't overwrite anything additional that was added to BOOMR before this
	// was called... for example, a plugin.
	boomr = {
		/**
		 * The timestamp when boomerang.js showed up on the page.
		 *
		 * This is the value of `BOOMR_start` we set earlier.
		 * @type {TimeStamp}
		 *
		 * @memberof BOOMR
		 */
		t_start: BOOMR_start,

		/**
		 * When the Boomerang plugins have all run.
		 *
		 * This value is generally set in zzz-last-plugin.js.
		 * @type {TimeStamp}
		 *
		 * @memberof BOOMR
		 */
		t_end: undefined,

		/**
		 * URL of boomerang.js.
		 *
		 * @type {string}
		 *
		 * @memberof BOOMR
		 */
		url: "",

		/**
		 * Whether or not Boomerang was loaded after the `onload` event.
		 *
		 * @type {boolean}
		 *
		 * @memberof BOOMR
		 */
		loadedLate: false,

		/**
		 * Constants visible to the world
		 * @class BOOMR.constants
		 */
		constants: {
			/**
			 * SPA beacon types
			 *
			 * @type {string[]}
			 *
			 * @memberof BOOMR.constants
			 */
			BEACON_TYPE_SPAS: ["spa", "spa_hard"],

			/**
			 * Maximum GET URL length.
			 * Using 2000 here as a de facto maximum URL length based on:
 			 * http://stackoverflow.com/questions/417142/what-is-the-maximum-length-of-a-url-in-different-browsers
			 *
			 * @type {number}
			 *
			 * @memberof BOOMR.constants
			 */
			MAX_GET_LENGTH: 2000
		},

		/**
		 * @class BOOMR.utils
		 */
		utils: {
			/**
			 * Determines whether or not the browser has `postMessage` support
			 *
			 * @returns {boolean} True if supported
			 */
			hasPostMessageSupport: function() {
				if (!w.postMessage || typeof w.postMessage !== "function" && typeof w.postMessage !== "object") {
					return false;
				}
				return true;
			},

			/**
			 * Converts an object to a string.
			 *
			 * @param {object} o Object
			 * @param {string} separator Member separator
			 * @param {number} nest_level Number of levels to recurse
			 *
			 * @returns {string} String representation of the object
			 *
			 * @memberof BOOMR.utils
			 */
			objectToString: function(o, separator, nest_level) {
				var value = [], k;

				if (!o || typeof o !== "object") {
					return o;
				}
				if (separator === undefined) {
					separator = "\n\t";
				}
				if (!nest_level) {
					nest_level = 0;
				}

				if (BOOMR.utils.isArray(o)) {
					for (k = 0; k < o.length; k++) {
						if (nest_level > 0 && o[k] !== null && typeof o[k] === "object") {
							value.push(
								this.objectToString(
									o[k],
									separator + (separator === "\n\t" ? "\t" : ""),
									nest_level - 1
								)
							);
						}
						else {
							if (separator === "&") {
								value.push(encodeURIComponent(o[k]));
							}
							else {
								value.push(o[k]);
							}
						}
					}
					separator = ",";
				}
				else {
					for (k in o) {
						if (Object.prototype.hasOwnProperty.call(o, k)) {
							if (nest_level > 0 && o[k] !== null && typeof o[k] === "object") {
								value.push(encodeURIComponent(k) + "=" +
									this.objectToString(
										o[k],
										separator + (separator === "\n\t" ? "\t" : ""),
										nest_level - 1
									)
								);
							}
							else {
								if (separator === "&") {
									value.push(encodeURIComponent(k) + "=" + encodeURIComponent(o[k]));
								}
								else {
									value.push(k + "=" + o[k]);
								}
							}
						}
					}
				}

				return value.join(separator);
			},

			/**
			 * Gets the value of the cookie identified by `name`.
			 *
			 * @param {string} name Cookie name
			 *
			 * @returns {string|null} Cookie value, if set.
			 *
			 * @memberof BOOMR.utils
			 */
			getCookie: function(name) {
				if (!name) {
					return null;
				}

				name = " " + name + "=";

				var i, cookies;
				cookies = " " + d.cookie + ";";
				if ((i = cookies.indexOf(name)) >= 0) {
					i += name.length;
					cookies = cookies.substring(i, cookies.indexOf(";", i)).replace(/^"/, "").replace(/"$/, "");
					return cookies;
				}
			},

			/**
			 * Sets the cookie named `name` to the serialized value of `subcookies`.
			 *
			 * @param {string} name The name of the cookie
			 * @param {object} subcookies Key/value pairs to write into the cookie.
			 * These will be serialized as an & separated list of URL encoded key=value pairs.
			 * @param {number} max_age Lifetime in seconds of the cookie.
			 * Set this to 0 to create a session cookie that expires when
			 * the browser is closed. If not set, defaults to 0.
			 *
			 * @returns {boolean} True if the cookie was set successfully
			 *
			 * @example
			 * BOOMR.utils.setCookie("RT", { s: t_start, r: url });
			 *
			 * @memberof BOOMR.utils
			 */
			setCookie: function(name, subcookies, max_age) {
				var value, nameval, savedval, c, exp;

				if (!name || !impl.site_domain || typeof subcookies === "undefined") {
					BOOMR.debug("Invalid parameters or site domain: " + name + "/" + subcookies + "/" + impl.site_domain);

					BOOMR.addVar("nocookie", 1);
					return false;
				}

				value = this.objectToString(subcookies, "&");
				nameval = name + "=\"" + value + "\"";

				if (nameval.length < 500) {
					c = [nameval, "path=/", "domain=" + impl.site_domain];
					if (typeof max_age === "number") {
						exp = new Date();
						exp.setTime(exp.getTime() + max_age * 1000);
						exp = exp.toGMTString();
						c.push("expires=" + exp);
					}

					d.cookie = c.join("; ");
					// confirm cookie was set (could be blocked by user's settings, etc.)
					savedval = this.getCookie(name);
					// the saved cookie should be the same or undefined in the case of removeCookie
					if (value === savedval ||
					    (typeof savedval === "undefined" && typeof max_age === "number" && max_age <= 0)) {
						return true;
					}
					BOOMR.warn("Saved cookie value doesn't match what we tried to set:\n" + value + "\n" + savedval);
				}
				else {
					BOOMR.warn("Cookie too long: " + nameval.length + " " + nameval);
				}

				BOOMR.addVar("nocookie", 1);
				return false;
			},

			/**
			 * Parse a cookie string returned by {@link BOOMR.utils.getCookie} and
			 * split it into its constituent subcookies.
			 *
			 * @param {string} cookie Cookie value
			 *
			 * @returns {object} On success, an object of key/value pairs of all
			 * sub cookies. Note that some subcookies may have empty values.
			 * `null` if `cookie` was not set or did not contain valid subcookies.
			 *
			 * @memberof BOOMR.utils
			 */
			getSubCookies: function(cookie) {
				var cookies_a,
				    i, l, kv,
				    gotcookies = false,
				    cookies = {};

				if (!cookie) {
					return null;
				}

				if (typeof cookie !== "string") {
					BOOMR.debug("TypeError: cookie is not a string: " + typeof cookie);
					return null;
				}

				cookies_a = cookie.split("&");

				for (i = 0, l = cookies_a.length; i < l; i++) {
					kv = cookies_a[i].split("=");
					if (kv[0]) {
						kv.push("");  // just in case there's no value
						cookies[decodeURIComponent(kv[0])] = decodeURIComponent(kv[1]);
						gotcookies = true;
					}
				}

				return gotcookies ? cookies : null;
			},

			/**
			 * Removes the cookie identified by `name` by nullifying its value,
			 * and making it a session cookie.
			 *
			 * @param {string} name Cookie name
			 *
			 * @memberof BOOMR.utils
			 */
			removeCookie: function(name) {
				return this.setCookie(name, {}, -86400);
			},

			/**
			 * Retrieve items from localStorage
			 *
			 * @param {string} name Name of storage
			 *
			 * @returns {object|null} Returns object retrieved from localStorage.
			 *                       Returns undefined if not found or expired.
			 *                       Returns null if parameters are invalid or an error occured
			 *
			 * @memberof BOOMR.utils
			 */
			getLocalStorage: function(name) {
				var value, data;
				if (!name || !impl.localStorageSupported) {
					return null;
				}

				try {
					value = w.localStorage.getItem(impl.LOCAL_STORAGE_PREFIX + name);
					if (value === null) {
						return undefined;
					}
					data = w.JSON.parse(value);
				}
				catch (e) {
					BOOMR.warn(e);
					return null;
				}

				if (!data || typeof data.items !== "object") {
					// Items are invalid
					this.removeLocalStorage(name);
					return null;
				}
				if (typeof data.expires === "number") {
					if (BOOMR.now() >= data.expires) {
						// Items are expired
						this.removeLocalStorage(name);
						return undefined;
					}
				}
				return data.items;
			},

			/**
			 * Saves items in localStorage
			 * The value stored in localStorage will be a JSON string representation of {"items": items, "expiry": expiry}
			 * where items is the object we're saving and expiry is an optional epoch number of when the data is to be
			 * considered expired
			 *
			 * @param {string} name Name of storage
			 * @param {object} items Items to be saved
			 * @param {number} max_age Age in seconds before items are to be considered expired
			 *
			 * @returns {boolean} True if the localStorage was set successfully
			 *
			 * @memberof BOOMR.utils
			 */
			setLocalStorage: function(name, items, max_age) {
				var data, value, savedval;

				if (!name || !impl.localStorageSupported || typeof items !== "object") {
					return false;
				}

				data = {"items": items};

				if (typeof max_age === "number") {
					data.expires = BOOMR.now() + (max_age * 1000);
				}

				value = w.JSON.stringify(data);

				if (value.length < 50000) {
					try {
						w.localStorage.setItem(impl.LOCAL_STORAGE_PREFIX + name, value);
						// confirm storage was set (could be blocked by user's settings, etc.)
						savedval = w.localStorage.getItem(impl.LOCAL_STORAGE_PREFIX + name);
						if (value === savedval) {
							return true;
						}
					}
					catch (ignore) {
						// Empty
					}
					BOOMR.warn("Saved storage value doesn't match what we tried to set:\n" + value + "\n" + savedval);
				}
				else {
					BOOMR.warn("Storage items too large: " + value.length + " " + value);
				}

				return false;
			},

			/**
			 * Remove items from localStorage
			 *
			 * @param {string} name Name of storage
			 *
			 * @returns {boolean} True if item was removed from localStorage.
			 *
			 * @memberof BOOMR.utils
			 */
			removeLocalStorage: function(name) {
				if (!name || !impl.localStorageSupported) {
					return false;
				}
				try {
					w.localStorage.removeItem(impl.LOCAL_STORAGE_PREFIX + name);
					return true;
				}
				catch (ignore) {
					// Empty
				}
				return false;
			},

			/**
			 * Cleans up a URL by removing the query string (if configured), and
			 * limits the URL to the specified size.
			 *
			 * @param {string} url URL to clean
			 * @param {number} urlLimit Maximum size, in characters, of the URL
			 *
			 * @returns {string} Cleaned up URL
			 *
			 * @memberof BOOMR.utils
			 */
			cleanupURL: function(url, urlLimit) {
				if (!url || BOOMR.utils.isArray(url)) {
					return "";
				}

				if (impl.strip_query_string) {
					url = url.replace(/\?.*/, "?qs-redacted");
				}

				if (typeof urlLimit !== "undefined" && url && url.length > urlLimit) {
					// We need to break this URL up.  Try at the query string first.
					var qsStart = url.indexOf("?");
					if (qsStart !== -1 && qsStart < urlLimit) {
						url = url.substr(0, qsStart) + "?...";
					}
					else {
						// No query string, just stop at the limit
						url = url.substr(0, urlLimit - 3) + "...";
					}
				}

				return url;
			},

			/**
			 * Gets the URL with the query string replaced with a MD5 hash of its contents.
			 *
			 * @param {string} url URL
			 * @param {boolean} stripHash Whether or not to strip the hash
			 *
			 * @returns {string} URL with query string hashed
			 *
			 * @memberof BOOMR.utils
			 */
			hashQueryString: function(url, stripHash) {
				if (!url) {
					return url;
				}
				if (!url.match) {
					BOOMR.addError("TypeError: Not a string", "hashQueryString", typeof url);
					return "";
				}
				if (url.match(/^\/\//)) {
					url = location.protocol + url;
				}
				if (!url.match(/^(https?|file):/)) {
					BOOMR.error("Passed in URL is invalid: " + url);
					return "";
				}
				if (stripHash) {
					url = url.replace(/#.*/, "");
				}
				if (!BOOMR.utils.MD5) {
					return url;
				}
				return url.replace(/\?([^#]*)/, function(m0, m1) {
					return "?" + (m1.length > 10 ? BOOMR.utils.MD5(m1) : m1);
				});
			},

			/**
			 * Sets the object's properties if anything in config matches
			 * one of the property names.
			 *
			 * @param {object} o The plugin's `impl` object within which it stores
			 * all its configuration and private properties
			 * @param {object} config The config object passed in to the plugin's
			 * `init()` method.
			 * @param {string} plugin_name The plugin's name in the {@link BOOMR.plugins} object.
			 * @param {string[]} properties An array containing a list of all configurable
			 * properties that this plugin has.
			 *
			 * @returns {boolean} True if a property was set
			 *
			 * @memberof BOOMR.utils
			 */
			pluginConfig: function(o, config, plugin_name, properties) {
				var i, props = 0;

				if (!config || !config[plugin_name]) {
					return false;
				}

				for (i = 0; i < properties.length; i++) {
					if (config[plugin_name][properties[i]] !== undefined) {
						o[properties[i]] = config[plugin_name][properties[i]];
						props++;
					}
				}

				return (props > 0);
			},

			/**
			 * `filter` for arrays
			 *
			 * @param {Array} array The array to iterate over.
			 * @param {Function} predicate The function invoked per iteration.
			 *
			 * @returns {Array} Returns the new filtered array.
			 *
			 * @memberof BOOMR.utils
			 */
			arrayFilter: function(array, predicate) {
				var result = [];

				if (!(this.isArray(array) || (array && typeof array.length === "number")) ||
				    typeof predicate !== "function") {
					return result;
				}

				if (typeof array.filter === "function") {
					result = array.filter(predicate);
				}
				else {
					var index = -1,
					    length = array.length,
					    value;

					while (++index < length) {
						value = array[index];
						if (predicate(value, index, array)) {
							result[result.length] = value;
						}
					}
				}
				return result;
			},

			/**
			 * `find` for Arrays
			 *
			 * @param {Array} array The array to iterate over
			 * @param {Function} predicate The function invoked per iteration
			 *
			 * @returns {Array} Returns the value of first element that satisfies
			 * the predicate
			 *
			 * @memberof BOOMR.utils
			 */
			arrayFind: function(array, predicate) {
				if (!(this.isArray(array) || (array && typeof array.length === "number")) ||
				    typeof predicate !== "function") {
					return undefined;
				}

				if (typeof array.find === "function") {
					return array.find(predicate);
				}
				else {
					var index = -1,
					    length = array.length,
					    value;

					while (++index < length) {
						value = array[index];
						if (predicate(value, index, array)) {
							return value;
						}
					}
					return undefined;
				}
			},

			/**
			 * MutationObserver feature detection
			 *
			 * @returns {boolean} Returns true if MutationObserver is supported.
			 * Always returns false for IE 11 due several bugs in it's implementation that MS flagged as Won't Fix.
			 * In IE11, XHR responseXML might be malformed if MO is enabled (where extra newlines get added in nodes with UTF-8 content).
			 * Another IE 11 MO bug can cause the process to crash when certain mutations occur.
			 * For the process crash issue, see https://developer.microsoft.com/en-us/microsoft-edge/platform/issues/8137215/ and
			 * https://developer.microsoft.com/en-us/microsoft-edge/platform/issues/15167323/
			 *
			 * @memberof BOOMR.utils
			 */
			isMutationObserverSupported: function() {
				// We can only detect IE 11 bugs by UA sniffing.
				var ie11 = (w && w.navigator && w.navigator.userAgent && w.navigator.userAgent.match(/Trident.*rv[ :]*11\./));
				return (!ie11 && w && w.MutationObserver && typeof w.MutationObserver === "function");
			},

			/**
			 * The callback function may return a falsy value to disconnect the
			 * observer after it returns, or a truthy value to keep watching for
			 * mutations. If the return value is numeric and greater than 0, then
			 * this will be the new timeout. If it is boolean instead, then the
			 * timeout will not fire any more so the caller MUST call disconnect()
			 * at some point.
			 *
			 * @callback BOOMR~addObserverCallback
			 * @param {object[]} mutations List of mutations detected by the observer or `undefined` if the observer timed out
			 * @param {object} callback_data Is the passed in `callback_data` parameter without modifications
			 */

			/**
			 * Add a MutationObserver for a given element and terminate after `timeout`ms.
			 *
			 * @param {DOMElement} el DOM element to watch for mutations
			 * @param {MutationObserverInit} config MutationObserverInit object (https://developer.mozilla.org/en-US/docs/Web/API/MutationObserver#MutationObserverInit)
			 * @param {number} timeout Number of milliseconds of no mutations after which the observer should be automatically disconnected.
			 * If set to a falsy value, the observer will wait indefinitely for Mutations.
			 * @param {BOOMR~addObserverCallback} callback Callback function to call either on timeout or if mutations are detected.
			 * @param {object} callback_data Any data to be passed to the callback function as its second parameter.
			 * @param {object} callback_ctx An object that represents the `this` object of the `callback` method.
			 * Leave unset the callback function is not a method of an object.
			 *
			 * @returns {object|null}
			 * - `null` if a MutationObserver could not be created OR
			 * - An object containing the observer and the timer object:
			 *   `{ observer: <MutationObserver>, timer: <Timeout Timer if any> }`
			 * - The caller can use this to disconnect the observer at any point
			 *   by calling `retval.observer.disconnect()`
			 * - Note that the caller should first check to see if `retval.observer`
			 *   is set before calling `disconnect()` as it may have been cleared automatically.
			 *
			 * @memberof BOOMR.utils
			 */
			addObserver: function(el, config, timeout, callback, callback_data, callback_ctx) {
				var o = {observer: null, timer: null};

				if (!this.isMutationObserverSupported() || !callback || !el) {
					return null;
				}

				function done(mutations) {
					var run_again = false;

					if (o.timer) {
						clearTimeout(o.timer);
						o.timer = null;
					}

					if (callback) {
						run_again = callback.call(callback_ctx, mutations, callback_data);

						if (!run_again) {
							callback = null;
						}
					}

					if (!run_again && o.observer) {
						o.observer.disconnect();
						o.observer = null;
					}

					if (typeof run_again === "number" && run_again > 0) {
						o.timer = setTimeout(done, run_again);
					}
				}

				o.observer = new BOOMR.window.MutationObserver(done);

				if (timeout) {
					o.timer = setTimeout(done, o.timeout);
				}

				o.observer.observe(el, config);

				return o;
			},

			/**
			 * Adds an event listener.
			 *
			 * @param {DOMElement} el DOM element
			 * @param {string} type Event name
			 * @param {function} fn Callback function
			 * @param {boolean} passive Passive mode
			 *
			 * @memberof BOOMR.utils
			 */
			addListener: function(el, type, fn, passive) {
				var opts = false;
				if (el.addEventListener) {
					if (passive && BOOMR.browser.supportsPassive()) {
						opts = {
							capture: false,
							passive: true
						};
					}

					el.addEventListener(type, fn, opts);
				}
				else if (el.attachEvent) {
					el.attachEvent("on" + type, fn);
				}

				// ensure the type arry exists
				impl.listenerCallbacks[type] = impl.listenerCallbacks[type] || [];

				// save a reference to the target object and function
				impl.listenerCallbacks[type].push({ el: el, fn: fn});
			},

			/**
			 * Removes an event listener.
			 *
			 * @param {DOMElement} el DOM element
			 * @param {string} type Event name
			 * @param {function} fn Callback function
			 *
			 * @memberof BOOMR.utils
			 */
			removeListener: function(el, type, fn) {
				var i;

				if (el.removeEventListener) {
					// NOTE: We don't need to match any other options (e.g. passive)
					// from addEventListener, as removeEventListener only cares
					// about captive.
					el.removeEventListener(type, fn, false);
				}
				else if (el.detachEvent) {
					el.detachEvent("on" + type, fn);
				}

				if (impl.listenerCallbacks.hasOwnProperty(type)) {
					for (var i = 0; i < impl.listenerCallbacks[type].length; i++) {
						if (fn === impl.listenerCallbacks[type][i].fn &&
						    el === impl.listenerCallbacks[type][i].el) {
							impl.listenerCallbacks[type].splice(i, 1);
							return;
						}
					}
				}
			},

			/**
			 * Determines if the specified object is an `Array` or not
			 *
			 * @param {object} ary Object in question
			 *
			 * @returns {boolean} True if the object is an `Array`
			 *
			 * @memberof BOOMR.utils
			 */
			isArray: function(ary) {
				return Object.prototype.toString.call(ary) === "[object Array]";
			},

			/**
			 * Determines if the specified value is in the array
			 *
			 * @param {object} val Value to check
			 * @param {object} ary Object in question
			 *
			 * @returns {boolean} True if the value is in the Array
			 *
			 * @memberof BOOMR.utils
			 */
			inArray: function(val, ary) {
				var i;

				if (typeof val === "undefined" || typeof ary === "undefined" || !ary.length) {
					return false;
				}

				for (i = 0; i < ary.length; i++) {
					if (ary[i] === val) {
						return true;
					}
				}

				return false;
			},

			/**
			 * Get a query parameter value from a URL's query string
			 *
			 * @param {string} param Query parameter name
			 * @param {string|Object} [url] URL containing the query string, or a link object.
			 * Defaults to `BOOMR.window.location`
			 *
			 * @returns {string|null} URI decoded value or null if param isn't a query parameter
			 *
			 * @memberof BOOMR.utils
			 */
			getQueryParamValue: function(param, url) {
				var l, params, i, kv;
				if (!param) {
					return null;
				}

				if (typeof url === "string") {
					l = BOOMR.window.document.createElement("a");
					l.href = url;
				}
				else if (typeof url === "object" && typeof url.search === "string") {
					l = url;
				}
				else {
					l = BOOMR.window.location;
				}

				// Now that we match, pull out all query string parameters
				params = l.search.slice(1).split(/&/);

				for (i = 0; i < params.length; i++) {
					if (params[i]) {
						kv = params[i].split("=");
						if (kv.length && kv[0] === param) {
							return decodeURIComponent(kv[1].replace(/\+/g, " "));
						}
					}
				}
				return null;
			},

			/**
			 * Generates a pseudo-random UUID (Version 4):
			 * https://en.wikipedia.org/wiki/Universally_unique_identifier
			 *
			 * @returns {string} UUID
			 *
			 * @memberof BOOMR.utils
			 */
			generateUUID: function() {
				return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function(c) {
					var r = Math.random() * 16 | 0;
					var v = c === "x" ? r : (r & 0x3 | 0x8);
					return v.toString(16);
				});
			},

			/**
			 * Generates a random ID based on the specified number of characters.  Uses
			 * characters a-z0-9.
			 *
			 * @param {number} chars Number of characters (max 40)
			 *
			 * @returns {string} Random ID
			 *
			 * @memberof BOOMR.utils
			 */
			generateId: function(chars) {
				return "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx".substr(0, chars || 40).replace(/x/g, function(c) {
					var c = (Math.random() || 0.01).toString(36);

					// some implementations may return "0" for small numbers
					if (c === "0") {
						return "0";
					}
					else {
						return c.substr(2, 1);
					}
				});
			},

			/**
			 * Attempt to serialize an object, preferring JSURL over JSON.stringify
			 *
			 * @param {Object} value Object to serialize
			 * @returns {string} serialized version of value, empty-string if not possible
			 */
			serializeForUrl: function(value) {
				if (BOOMR.utils.Compression && BOOMR.utils.Compression.jsUrl) {
					return BOOMR.utils.Compression.jsUrl(value);
				}
				if (window.JSON) {
					return JSON.stringify(value);
				}
				// not supported
				BOOMR.debug("JSON is not supported");
				return "";
			},

			/**
			 * Attempt to identify the URL of boomerang itself using multiple methods for cross-browser support
			 *
			 * This method uses document.currentScript (which cannot be called from an event handler), script.readyState (IE6-10),
			 * and the stack property of a caught Error object.
			 *
			 * @returns {string} The URL of the currently executing boomerang script.
			 */
			getMyURL: function() {
				var stack;
				// document.currentScript works in all browsers except for IE: https://caniuse.com/#feat=document-currentscript
				// #boomr-if-as works in all browsers if the page uses our standard iframe loader
				// #boomr-scr-as works in all browsers if the page uses our preloader loader
				// BOOMR_script will be undefined on IE for pages that do not use our standard loaders

				// Note that we do not use `w.document` or `d` here because we need the current execution context
				var BOOMR_script = (document.currentScript || document.getElementById("boomr-if-as") || document.getElementById("boomr-scr-as"));

				if (BOOMR_script) {
					return BOOMR_script.src;
				}

				// For IE 6-10 users on pages not using the standard loader, we iterate through all scripts backwards
				var scripts = document.getElementsByTagName("script"), i;

				// i-- is both a decrement as well as a condition, ie, the loop will terminate when i goes from 0 to -1
				for (i = scripts.length; i--;) {
					// We stop at the first script that has its readyState set to interactive indicating that it is currently executing
					if (scripts[i].readyState === "interactive") {
						return scripts[i].src;
					}
				}

				// For IE 11, we throw an Error and inspect its stack property in the catch block
				// This also works on IE10, but throwing is disruptive so we try to avoid it and use
				// the less disruptive script iterator above
				try {
					throw new Error();
				}
				catch (e) {
					if ("stack" in e) {
						stack = this.arrayFilter(e.stack.split(/\n/), function(l) { return l.match(/https?:\/\//); });
						if (stack && stack.length) {
							return stack[0].replace(/.*(https?:\/\/.+?)(:\d+)+\D*$/m, "$1");
						}
					}
					// FWIW, on IE 8 & 9, the Error object does not contain a stack property, but if you have an uncaught error,
					// and a `window.onerror` handler (not using addEventListener), then the second argument to that handler is
					// the URL of the script that threw. The handler needs to `return true;` to prevent the default error handler
					// This flow is asynchronous though (due to the event handler), so won't work in a function return scenario
					// like this (we can't use promises because we would only need this hack in browsers that don't support promises).
				}

				return "";
			},

			/*
			 * Gets the Scroll x and y (rounded) for a page
			 *
			 * @returns {object} Scroll x and y coordinates
			 */
			scroll: function() {
				// Adapted from:
				// https://developer.mozilla.org/en-US/docs/Web/API/Window/scrollY
				var supportPageOffset = w.pageXOffset !== undefined;
				var isCSS1Compat = ((w.document.compatMode || "") === "CSS1Compat");

				var ret = {
					x: 0,
					y: 0
				};

				if (supportPageOffset) {
					if (typeof w.pageXOffset === "function") {
						ret.x = w.pageXOffset();
						ret.y = w.pageYOffset();
					}
					else {
						ret.x = w.pageXOffset;
						ret.y = w.pageYOffset;
					}
				}
				else if (isCSS1Compat) {
					ret.x = w.document.documentElement.scrollLeft;
					ret.y = w.document.documentElement.scrollTop;
				}
				else {
					ret.x = w.document.body.scrollLeft;
					ret.y = w.document.body.scrollTop;
				}

				// round to full numbers
				if (typeof ret.sx === "number") {
					ret.sx = Math.round(ret.sx);
				}

				if (typeof ret.sy === "number") {
					ret.sy = Math.round(ret.sy);
				}

				return ret;
			},

			/**
			 * Gets the window height
			 *
			 * @returns {number} Window height
			 */
			windowHeight: function() {
				return w.innerHeight || w.document.documentElement.clientHeight || w.document.body.clientHeight;
			},

			/**
			 * Gets the window width
			 *
			 * @returns {number} Window width
			 */
			windowWidth: function() {
				return w.innerWidth || w.document.documentElement.clientWidth || w.document.body.clientWidth;
			}


		}, // closes `utils`

		/**
		 * Browser feature detection flags.
		 *
		 * @class BOOMR.browser
		 */
		browser: {
			results: {},

			/**
			 * Whether or not the browser supports 'passive' mode for event
			 * listeners
			 *
			 * @returns {boolean} True if the browser supports passive mode
			 */
			supportsPassive: function() {
				if (typeof BOOMR.browser.results.supportsPassive === "undefined") {
					BOOMR.browser.results.supportsPassive = false;

					if (!Object.defineProperty) {
						return false;
					}

					try {
						var opts = Object.defineProperty({}, "passive", {
							get: function() {
								BOOMR.browser.results.supportsPassive = true;
							}
						});
						window.addEventListener("test", null, opts);
					}
					catch (e) {
						// NOP
					}
				}

				return BOOMR.browser.results.supportsPassive;
			}
		},

		/**
		 * Initializes Boomerang by applying the specified configuration.
		 *
		 * All plugins' `init()` functions will be called with the same config as well.
		 *
		 * @param {object} config Configuration object
		 * @param {boolean} [config.autorun] By default, boomerang runs automatically
		 * and attaches its `page_ready` handler to the `window.onload` event.
		 * If you set `autorun` to `false`, this will not happen and you will
		 * need to call {@link BOOMR.page_ready} yourself.
		 * @param {string} config.beacon_auth_key Beacon authorization key value
		 * @param {string} config.beacon_auth_token Beacon authorization token.
		 * @param {string} config.beacon_url The URL to beacon results back to.
		 * If not set, no beacon will be sent.
		 * @param {string} config.beacon_type `GET`, `POST` or `AUTO`
		 * @param {string} [config.site_domain] The domain that all cookies should be set on
		 * Boomerang will try to auto-detect this, but unless your site is of the
		 * `foo.com` format, it will probably get it wrong. It's a good idea
		 * to set this to whatever part of your domain you'd like to share
		 * bandwidth and performance measurements across.
		 * Set this to a falsy value to disable all cookies.
		 * @param {boolean} [config.strip_query_string] Whether or not to strip query strings from all URLs (e.g. `u`, `pgu`, etc.)
		 * @param {string} [config.user_ip] Despite its name, this is really a free-form
		 * string used to uniquely identify the user's current internet
		 * connection. It's used primarily by the bandwidth test to determine
		 * whether it should re-measure the user's bandwidth or just use the
		 * value stored in the cookie. You may use IPv4, IPv6 or anything else
		 * that you think can be used to identify the user's network connection.
		 * @param {function} [config.log] Logger to use. Set to `null` to disable logging.
		 * @param {function} [<plugins>] Each plugin has its own section
		 *
		 * @returns {BOOMR} Boomerang object
		 *
		 * @memberof BOOMR
		 */
		init: function(config) {
			var i, k,
			    properties = [
				    "autorun",
				    "beacon_auth_key",
				    "beacon_auth_token",
				    "beacon_url",
				    "beacon_type",
				    "site_domain",
				    "strip_query_string",
				    "user_ip"
			    ];

			BOOMR_check_doc_domain();

			if (!config) {
				config = {};
			}

			// ensure logging is setup properly (or null'd out for production)
			if (config.log !== undefined) {
				this.log = config.log;
			}

			if (!this.log) {
				this.log = function(/* m,l,s */) {};
			}

			if (!this.pageId) {
				// generate a random page ID for this page's lifetime
				this.pageId = BOOMR.utils.generateId(8);
				BOOMR.debug("Generated PageID: " + this.pageId);
			}

			if (config.primary && impl.handlers_attached) {
				return this;
			}

			// Set autorun if in config right now, as plugins that listen for page_ready
			// event may fire when they .init() if onload has already fired, and whether
			// or not we should fire page_ready depends on config.autorun.
			if (typeof config.autorun !== "undefined") {
				impl.autorun = config.autorun;
			}

			for (k in this.plugins) {
				if (this.plugins.hasOwnProperty(k)) {
					// config[plugin].enabled has been set to false
					if (config[k] &&
					    config[k].hasOwnProperty("enabled") &&
					    config[k].enabled === false) {
						impl.disabled_plugins[k] = 1;

						if (typeof this.plugins[k].disable === "function") {
							this.plugins[k].disable();
						}

						continue;
					}

					// plugin was previously disabled
					if (impl.disabled_plugins[k]) {

						// and has not been explicitly re-enabled
						if (!config[k] ||
						    !config[k].hasOwnProperty("enabled") ||
						    config[k].enabled !== true) {
							continue;
						}

						if (typeof this.plugins[k].enable === "function") {
							this.plugins[k].enable();
						}

						// plugin is now enabled
						delete impl.disabled_plugins[k];
					}

					// plugin exists and has an init method
					if (typeof this.plugins[k].init === "function") {
						try {
							this.plugins[k].init(config);
						}
						catch (err) {
							BOOMR.addError(err, k + ".init");
						}
					}
				}
			}

			for (i = 0; i < properties.length; i++) {
				if (config[properties[i]] !== undefined) {
					impl[properties[i]] = config[properties[i]];
				}
			}

			if (impl.handlers_attached) {
				return this;
			}

			// The developer can override onload by setting autorun to false
			if (!impl.onloadfired && (config.autorun === undefined || config.autorun !== false)) {
				if (BOOMR.hasBrowserOnloadFired()) {
					BOOMR.loadedLate = true;
				}
				BOOMR.attach_page_ready(BOOMR.page_ready_autorun);
			}

			BOOMR.utils.addListener(w, "DOMContentLoaded", function() { impl.fireEvent("dom_loaded"); });
			BOOMR.fireEvent("config", config);
			BOOMR.subscribe("config", function(beaconConfig) {
				if (beaconConfig.beacon_url) {
					impl.beacon_url = beaconConfig.beacon_url;
				}
			});

			BOOMR.subscribe("spa_navigation", impl.spaNavigation, null, impl);

			(function() {
				var forms, iterator;
				if (visibilityChange !== undefined) {
					BOOMR.utils.addListener(d, visibilityChange, function() { impl.fireEvent("visibility_changed"); });

					// save the current visibility state
					impl.lastVisibilityState = BOOMR.visibilityState();

					BOOMR.subscribe("visibility_changed", function() {
						var visState = BOOMR.visibilityState();

						// record the last time each visibility state occurred
						BOOMR.lastVisibilityEvent[visState] = BOOMR.now();
						BOOMR.debug("Visibility changed from " + impl.lastVisibilityState + " to " + visState);

						// if we transitioned from prerender to hidden or visible, fire the prerender_to_visible event
						if (impl.lastVisibilityState === "prerender" &&
						    visState !== "prerender") {
							// note that we transitioned from prerender on the beacon for debugging
							BOOMR.addVar("vis.pre", "1");

							// let all listeners know
							impl.fireEvent("prerender_to_visible");
						}

						impl.lastVisibilityState = visState;
					});
				}

				BOOMR.utils.addListener(d, "mouseup", impl.xb_handler("click"));

				forms = d.getElementsByTagName("form");
				for (iterator = 0; iterator < forms.length; iterator++) {
					BOOMR.utils.addListener(forms[iterator], "submit", impl.xb_handler("form_submit"));
				}

				if (!w.onpagehide && w.onpagehide !== null) {
					// This must be the last one to fire
					// We only clear w on browsers that don't support onpagehide because
					// those that do are new enough to not have memory leak problems of
					// some older browsers
					BOOMR.utils.addListener(w, "unload", function() { BOOMR.window = w = null; });
				}
			}());

			impl.handlers_attached = true;
			return this;
		},

		/**
		 * Attach a callback to the `pageshow` or `onload` event if `onload` has not
		 * been fired otherwise queue it to run immediately
		 *
		 * @param {function} cb Callback to run when `onload` fires or page is visible (`pageshow`)
		 *
		 * @memberof BOOMR
		 */
		attach_page_ready: function(cb) {
			if (BOOMR.hasBrowserOnloadFired()) {
				this.setImmediate(cb, null, null, BOOMR);
			}
			else {
				// Use `pageshow` if available since it will fire even if page came from a back-forward page cache.
				// Browsers that support `pageshow` will not fire `onload` if navigation was through a back/forward button
				// and the page was retrieved from back-forward cache.
				if (w.onpagehide || w.onpagehide === null) {
					BOOMR.utils.addListener(w, "pageshow", cb);
				}
				else {
					BOOMR.utils.addListener(w, "load", cb);
				}
			}
		},

		/**
		 * Sends the `page_ready` event only if `autorun` is still true after
		 * {@link BOOMR.init} is called.
		 *
		 * @param {Event} ev Event
		 *
		 * @memberof BOOMR
		 */
		page_ready_autorun: function(ev) {
			if (impl.autorun) {
				BOOMR.page_ready(ev, true);
			}
		},

		/**
		 * Method that fires the {@link BOOMR#event:page_ready} event. Call this
		 * only if you've set `autorun` to `false` when calling the {@link BOOMR.init}
		 * method. You should call this method when you determine that your page
		 * is ready to be used by your user. This will be the end-time used in
		 * the page load time measurement. Optionally, you can pass a Unix Epoch
		 * timestamp as a parameter or set the global `BOOMR_page_ready` var that will
		 * be used as the end-time instead.
		 *
		 * @param {Event|number} [ev] Ready event or optional load event end timestamp if called manually
		 * @param {boolean} auto True if called by `page_ready_autorun`
		 *
		 * @returns {BOOMR} Boomerang object
		 *
		 * @example
		 * BOOMR.init({ autorun: false, ... });
		 * // wait until the page is ready, i.e. your view has loaded
		 * BOOMR.page_ready();
		 *
		 * @memberof BOOMR
		 */
		page_ready: function(ev, auto) {
			var tm_page_ready;

			// a number can be passed as the first argument if called manually which
			// will be used as the loadEventEnd time
			if (!auto && typeof ev === "number") {
				tm_page_ready = ev;
				ev = null;
			}

			if (!ev) {
				ev = w.event;
			}

			if (!ev) {
				ev = {
					name: "load"
				};
			}

			// if we were called manually or global BOOMR_page_ready was set then
			// add loadEventEnd and note this was 'pr' on the beacon
			if (!auto) {
				ev.timing = ev.timing || {};
				// use timestamp parameter or global BOOMR_page_ready if set, otherwise use
				// the current timestamp
				if (tm_page_ready) {
					ev.timing.loadEventEnd = tm_page_ready;
				}
				else if (typeof w.BOOMR_page_ready === "number") {
					ev.timing.loadEventEnd = w.BOOMR_page_ready;
				}
				else {
					ev.timing.loadEventEnd = BOOMR.now();
				}

				BOOMR.addVar("pr", 1, true);
			}
			else if (typeof w.BOOMR_page_ready === "number") {
				ev.timing = ev.timing || {};
				// the global BOOMR_page_ready will override our loadEventEnd
				ev.timing.loadEventEnd = w.BOOMR_page_ready;

				BOOMR.addVar("pr", 1, true);
			}

			if (impl.onloadfired) {
				return this;
			}

			impl.fireEvent("page_ready", ev);
			impl.onloadfired = true;
			return this;
		},

		/**
		 * Determines whether or not the page's `onload` event has fired
		 *
		 * @returns {boolean} True if page's onload was called
		 */
		hasBrowserOnloadFired: function() {
			var p = BOOMR.getPerformance();
			// if the document is `complete` then the `onload` event has already occurred, we'll fire the callback immediately.
			// When `document.write` is used to replace the contents of the page and inject boomerang, the document `readyState`
			// will go from `complete` back to `loading` and then to `complete` again. The second transition to `complete`
			// doesn't fire a second `pageshow` event in some browsers (e.g. Safari). We need to check if
			// `performance.timing.loadEventStart` or `BOOMR_onload` has occurred to detect this scenario. Will not work for
			// older Safari that doesn't have NavTiming
			return ((d.readyState && d.readyState === "complete") ||
			    (p && p.timing && p.timing.loadEventStart > 0) ||
			    w.BOOMR_onload > 0);
		},

		/**
		 * Determines whether or not the page's `onload` event has fired, or
		 * if `autorun` is false, whether {@link BOOMR.page_ready} was called.
		 *
		 * @returns {boolean} True if `onload` or {@link BOOMR.page_ready} were called
		 *
		 * @memberof BOOMR
		 */
		onloadFired: function() {
			return impl.onloadfired;
		},

		/**
		 * The callback function may return a falsy value to disconnect the observer
		 * after it returns, or a truthy value to keep watching for mutations. If
		 * the return value is numeric and greater than 0, then this will be the new timeout.
		 * If it is boolean instead, then the timeout will not fire any more so
		 * the caller MUST call disconnect() at some point
		 *
		 * @callback BOOMR~setImmediateCallback
		 * @param {object} data The passed in `data` object
		 * @param {object} cb_data The passed in `cb_data` object
		 * @param {Error} callstack An Error object that holds the callstack for
		 * when `setImmediate` was called, used to determine what called the callback
		 */

		/**
		 * Defer the function `fn` until the next instant the browser is free from
		 * user tasks.
		 *
		 * @param {BOOMR~setImmediateCallback} fn The callback function.
		 * @param {object} [data] Any data to pass to the callback function
		 * @param {object} [cb_data] Any passthrough data for the callback function.
		 * This differs from `data` when `setImmediate` is called via an event
		 * handler and `data` is the Event object
		 * @param {object} [cb_scope] The scope of the callback function if it is a method of an object
		 *
		 * @returns nothing
		 *
		 * @memberof BOOMR
		 */
		setImmediate: function(fn, data, cb_data, cb_scope) {
			var cb, cstack;


			cb = function() {
				fn.call(cb_scope || null, data, cb_data || {}, cstack);
				cb = null;
			};

			if (w.requestIdleCallback) {
				// set a timeout since rIC doesn't get called reliably in chrome headless
				w.requestIdleCallback(cb, {timeout: 1000});
			}
			else if (w.setImmediate) {
				w.setImmediate(cb);
			}
			else {
				setTimeout(cb, 10);
			}
		},

		/**
		 * Gets the current time in milliseconds since the Unix Epoch (Jan 1 1970).
		 *
		 * In browsers that support `DOMHighResTimeStamp`, this will be replaced
		 * by a function that adds `performance.now()` to `navigationStart`
		 * (with milliseconds.microseconds resolution).
		 *
		 * @function
		 *
		 * @returns {TimeStamp} Milliseconds since Unix Epoch
		 *
		 * @memberof BOOMR
		 */
		now: (function() {
			return Date.now || function() { return new Date().getTime(); };
		}()),

		/**
		 * Gets the `window.performance` object of the root window.
		 *
		 * Checks vendor prefixes for older browsers (e.g. IE9).
		 *
		 * @returns {Performance|undefined} `window.performance` if it exists
		 *
		 * @memberof BOOMR
		 */
		getPerformance: function() {
			try {
				if (BOOMR.window) {
					if ("performance" in BOOMR.window && BOOMR.window.performance) {
						return BOOMR.window.performance;
					}

					// vendor-prefixed fallbacks
					return BOOMR.window.msPerformance ||
					    BOOMR.window.webkitPerformance ||
					    BOOMR.window.mozPerformance;
				}
			}
			catch (ignore) {
				// empty
			}
		},

		/**
		 * Get high resolution delta timestamp from time origin
		 *
		 * This function needs to approximate the time since the performance timeOrigin
		 * or Navigation Timing API's `navigationStart` time.
		 * If available, `performance.now()` can provide this value.
		 * If not we either get the navigation start time from the RT plugin or
		 * from `t_lstart` or `t_start`. Those values are subtracted from the current
		 * time to derive a time since `navigationStart` value.
		 *
		 * @returns {float} Exact or approximate time since the time origin.
		 */
		hrNow: function() {
			var now, navigationStart, p = BOOMR.getPerformance();

			if (p && p.now) {
				now = p.now();
			}
			else {
				navigationStart = (BOOMR.plugins.RT && BOOMR.plugins.RT.navigationStart &&
					BOOMR.plugins.RT.navigationStart()) || BOOMR.t_lstart || BOOMR.t_start;

				// if navigationStart is undefined, we'll be returning NaN
				now = BOOMR.now() - navigationStart;
			}

			return now;
		},

		/**
		 * Gets the `document.visibilityState`, or `visible` if Page Visibility
		 * is not supported.
		 *
		 * @function
		 *
		 * @returns {string} Visibility state
		 *
		 * @memberof BOOMR
		 */
		visibilityState: (visibilityState === undefined ? function() {
			return "visible";
		} : function() {
			return d[visibilityState];
		}),

		/**
		 * An mapping of visibliity event states to the latest time they happened
		 *
		 * @type {object}
		 *
		 * @memberof BOOMR
		 */
		lastVisibilityEvent: {},

		/**
		 * Registers a Boomerang event.
		 *
		 * @param {string} e_name Event name
		 *
		 * @returns {BOOMR} Boomerang object
		 *
		 * @memberof BOOMR
		 */
		registerEvent: function(e_name) {
			if (impl.events.hasOwnProperty(e_name)) {
				// already registered
				return this;
			}

			// create a new queue of handlers
			impl.events[e_name] = [];

			return this;
		},

		/**
		 * Disables boomerang from doing anything further:
		 * 1. Clears event handlers (such as onload)
		 * 2. Clears all event listeners
		 *
		 * @memberof BOOMR
		 */
		disable: function() {
			impl.clearEvents();
			impl.clearListeners();
		},

		/**
		 * Fires a Boomerang event
		 *
		 * @param {string} e_name Event name
		 * @param {object} data Event payload
		 *
		 * @returns {BOOMR} Boomerang object
		 *
		 * @memberof BOOMR
		 */
		fireEvent: function(e_name, data) {
			return impl.fireEvent(e_name, data);
		},

		/**
		 * @callback BOOMR~subscribeCallback
		 * @param {object} eventData Event data
		 * @param {object} cb_data Callback data
		 */

		/**
		 * Subscribes to a Boomerang event
		 *
		 * @param {string} e_name Event name, i.e. {@link BOOMR#event:page_ready}.
		 * @param {BOOMR~subscribeCallback} fn Callback function
		 * @param {object} cb_data Callback data, passed as the second parameter to the callback function
		 * @param {object} cb_scope Callback scope.  If set to an object, then the
		 * callback function is called as a method of this object, and all
		 * references to `this` within the callback function will refer to `cb_scope`.
		 * @param {boolean} once Whether or not this callback should only be run once
		 *
		 * @returns {BOOMR} Boomerang object
		 *
		 * @memberof BOOMR
		 */
		subscribe: function(e_name, fn, cb_data, cb_scope, once) {
			var i, handler, ev;

			e_name = e_name.toLowerCase();

			// translate old names
			if (impl.translate_events[e_name]) {
				e_name = impl.translate_events[e_name];
			}

			if (!impl.events.hasOwnProperty(e_name)) {
				// allow subscriptions before they're registered
				impl.events[e_name] = [];
			}

			ev = impl.events[e_name];

			// don't allow a handler to be attached more than once to the same event
			for (i = 0; i < ev.length; i++) {
				handler = ev[i];
				if (handler && handler.fn === fn && handler.cb_data === cb_data && handler.scope === cb_scope) {
					return this;
				}
			}

			ev.push({
				fn: fn,
				cb_data: cb_data || {},
				scope: cb_scope || null,
				once: once || false
			});

			// attaching to page_ready after onload fires, so call soon
			if (e_name === "page_ready" && impl.onloadfired && impl.autorun) {
				this.setImmediate(fn, null, cb_data, cb_scope);
			}

			// Attach unload handlers directly to the window.onunload and
			// window.onbeforeunload events. The first of the two to fire will clear
			// fn so that the second doesn't fire. We do this because technically
			// onbeforeunload is the right event to fire, but not all browsers
			// support it.  This allows us to fall back to onunload when onbeforeunload
			// isn't implemented
			if (e_name === "page_unload" || e_name === "before_unload") {
				(function() {
					var unload_handler, evt_idx = ev.length;

					unload_handler = function(evt) {
						if (fn) {
							fn.call(cb_scope, evt || w.event, cb_data);
						}

						// If this was the last unload handler, we'll try to send the beacon immediately after it is done
						// The beacon will only be sent if one of the handlers has queued it
						if (e_name === "page_unload" && evt_idx === impl.events[e_name].length) {
							BOOMR.real_sendBeacon();
						}
					};

					if (e_name === "page_unload") {
						// pagehide is for iOS devices
						// see http://www.webkit.org/blog/516/webkit-page-cache-ii-the-unload-event/
						if (w.onpagehide || w.onpagehide === null) {
							BOOMR.utils.addListener(w, "pagehide", unload_handler);
						}
						else {
							BOOMR.utils.addListener(w, "unload", unload_handler);
						}
					}
					BOOMR.utils.addListener(w, "beforeunload", unload_handler);
				}());
			}

			return this;
		},

		/**
		 * Logs an internal Boomerang error.
		 *
		 * If the {@link BOOMR.plugins.Errors} plugin is enabled, this data will
		 * be compressed on the `err` beacon parameter.  If not, it will be included
		 * in uncompressed form on the `errors` parameter.
		 *
		 * @param {string|object} err Error
		 * @param {string} [src] Source
		 * @param {object} [extra] Extra data
		 *
		 * @memberof BOOMR
		 */
		addError: function BOOMR_addError(err, src, extra) {
			var str, E = BOOMR.plugins.Errors;

			//
			// Use the Errors plugin if it's enabled
			//
			if (E && E.is_supported()) {
				if (typeof err === "string") {
					E.send({
						message: err,
						extra: extra,
						functionName: src,
						noStack: true
					}, E.VIA_APP, E.SOURCE_BOOMERANG);
				}
				else {
					if (typeof src === "string") {
						err.functionName = src;
					}

					if (typeof extra !== "undefined") {
						err.extra = extra;
					}

					E.send(err, E.VIA_APP, E.SOURCE_BOOMERANG);
				}

				return;
			}

			if (typeof err !== "string") {
				str = String(err);
				if (str.match(/^\[object/)) {
					str = err.name + ": " + (err.description || err.message).replace(/\r\n$/, "");
				}
				err = str;
			}
			if (src !== undefined) {
				err = "[" + src + ":" + BOOMR.now() + "] " + err;
			}
			if (extra) {
				err += ":: " + extra;
			}

			if (impl.errors[err]) {
				impl.errors[err]++;
			}
			else {
				impl.errors[err] = 1;
			}
		},

		/**
		 * Determines if the specified Error is a Cross-Origin error.
		 *
		 * @param {string|object} err Error
		 *
		 * @returns {boolean} True if the Error is a Cross-Origin error.
		 *
		 * @memberof BOOMR
		 */
		isCrossOriginError: function(err) {
			// These are expected for cross-origin iframe access, although the Internet Explorer check will only
			// work for browsers using English.
			return err.name === "SecurityError" ||
				(err.name === "TypeError" && err.message === "Permission denied") ||
				(err.name === "Error" && err.message && err.message.match(/^(Permission|Access is) denied/));
		},

		/**
		 * Add one or more parameters to the beacon.
		 *
		 * This method may either be called with a single object containing
		 * key/value pairs, or with two parameters, the first is the variable
		 * name and the second is its value.
		 *
		 * All names should be strings usable in a URL's query string.
		 *
		 * We recommend only using alphanumeric characters and underscores, but you
		 * can use anything you like.
		 *
		 * Values should be strings (or numbers), and have the same restrictions
		 * as names.
		 *
		 * Parameters will be on all subsequent beacons unless `singleBeacon` is
		 * set.
		 *
		 * @param {string} name Variable name
		 * @param {string|object} val Value
		 * @param {boolean} singleBeacon Whether or not to add to a single beacon
		 * or all beacons
		 *
		 * @returns {BOOMR} Boomerang object
		 *
		 * @example
		 * BOOMR.addVar("page_id", 123);
		 * BOOMR.addVar({"page_id": 123, "user_id": "Person1"});
		 *
		 * @memberof BOOMR
		 */
		 addVar: function(name, value, singleBeacon) {
			if (typeof name === "string") {
				impl.vars[name] = value;
			}
			else if (typeof name === "object") {
				var o = name, k;
				for (k in o) {
					if (o.hasOwnProperty(k)) {
						impl.vars[k] = o[k];
					}
				}
			}

			if (singleBeacon) {
				impl.singleBeaconVars[name] = 1;
			}

			return this;
		},

		/**
		 * Appends data to a beacon.
		 *
		 * If the value already exists, a comma is added and the new data is applied.
		 *
		 * @param {string} name Variable name
		 * @param {string} val Value
		 *
		 * @returns {BOOMR} Boomerang object
		 *
		 * @memberof BOOMR
		 */
		appendVar: function(name, value) {
			var existing = BOOMR.getVar(name) || "";
			if (existing) {
				existing += ",";
			}

			BOOMR.addVar(name, existing + value);

			return this;
		},

		/**
		 * Removes one or more variables from the beacon URL. This is useful within
		 * a plugin to reset the values of parameters that it is about to set.
		 *
		 * Plugins can also use this in the {@link BOOMR#event:beacon} event to clear
		 * any variables that should only live on a single beacon.
		 *
		 * This method accepts either a list of variable names, or a single
		 * array containing a list of variable names.
		 *
		 * @param {string[]|string} name Variable name or list
		 *
		 * @returns {BOOMR} Boomerang object
		 *
		 * @memberof BOOMR
		 */
		removeVar: function(arg0) {
			var i, params;
			if (!arguments.length) {
				return this;
			}

			if (arguments.length === 1 && BOOMR.utils.isArray(arg0)) {
				params = arg0;
			}
			else {
				params = arguments;
			}

			for (i = 0; i < params.length; i++) {
				if (impl.vars.hasOwnProperty(params[i])) {
					delete impl.vars[params[i]];
				}
			}

			return this;
		},

		/**
		 * Determines whether or not the beacon has the specified variable.
		 *
		 * @param {string} name Variable name
		 *
		 * @returns {boolean} True if the variable is set.
		 *
		 * @memberof BOOMR
		 */
		hasVar: function(name) {
			return impl.vars.hasOwnProperty(name);
		},

		/**
		 * Gets the specified variable.
		 *
		 * @param {string} name Variable name
		 *
		 * @returns {object|undefined} Variable, or undefined if it isn't set
		 *
		 * @memberof BOOMR
		 */
		getVar: function(name) {
			return impl.vars[name];
		},

		/**
		 * Sets a variable's priority in the beacon URL.
		 * -1 = beginning of the URL
		 * 0  = middle of the URL (default)
		 * 1  = end of the URL
		 *
		 * @param {string} name Variable name
		 * @param {number} pri Priority (-1 or 1)
		 *
		 * @returns {BOOMR} Boomerang object
		 *
		 * @memberof BOOMR
		 */
		setVarPriority: function(name, pri) {
			if (typeof pri !== "number" || Math.abs(pri) !== 1) {
				return this;
			}

			impl.varPriority[pri][name] = 1;

			return this;
		},

		/**
		 * Sets the Referrers variables.
		 *
		 * @param {string} r Referrer from the cookie
		 * @param {string} [r2] Referrer from document.referrer, if different
		 *
		 * @memberof BOOMR
		 */
		setReferrer: function(r, r2) {
			// cookie referrer
			impl.r = r;

			// document.referrer, if different
			if (r2 && r !== r2) {
				impl.r2 = r2;
			}
			else {
				impl.r2 = undefined;
			}
		},

		/**
		 * Starts a timer for a dynamic request.
		 *
		 * Once the named request has completed, call `loaded()` to send a beacon
		 * with the duration.
		 *
		 * @example
		 * var timer = BOOMR.requestStart("my-timer");
		 * // do stuff
		 * timer.loaded();
		 *
		 * @param {string} name Timer name
		 *
		 * @returns {object} An object with a `.loaded()` function that you can call
		 *     when the dynamic timer is complete.
		 *
		 * @memberof BOOMR
		 */
		requestStart: function(name) {
			var t_start = BOOMR.now();
			BOOMR.plugins.RT.startTimer("xhr_" + name, t_start);

			return {
				loaded: function(data) {
					BOOMR.responseEnd(name, t_start, data);
				}
			};
		},

		/**
		 * Determines if Boomerang can send a beacon.
		 *
		 * Queryies all plugins to see if they implement `readyToSend()`,
		 * and if so, that they return `true`.
		 *
		 * If not, the beacon cannot be sent.
		 *
		 * @returns {boolean} True if Boomerang can send a beacon
		 *
		 * @memberof BOOMR
		 */
		readyToSend: function() {
			var plugin;

			for (plugin in this.plugins) {
				if (this.plugins.hasOwnProperty(plugin)) {
					if (impl.disabled_plugins[plugin]) {
						continue;
					}

					if (typeof this.plugins[plugin].readyToSend === "function" &&
					    this.plugins[plugin].readyToSend() === false) {
						BOOMR.debug("Plugin " + plugin + " is not ready to send");
						return false;
					}
				}
			}

			return true;
		},

		/**
		 * Sends a beacon for a dynamic request.
		 *
		 * @param {string|object} name Timer name or timer object data.
		 * @param {string} [name.initiator] Initiator, such as `xhr` or `spa`
		 * @param {string} [name.url] URL of the request
		 * @param {TimeStamp} t_start Start time
		 * @param {object} data Request data
		 * @param {TimeStamp} t_end End time
		 *
		 * @memberof BOOMR
		 */
		responseEnd: function(name, t_start, data, t_end) {
			// take the now timestamp for start and end, if unspecified, in case we delay this beacon
			t_start = typeof t_start === "number" ? t_start : BOOMR.now();
			t_end = typeof t_end === "number" ? t_end : BOOMR.now();

			// wait until all plugins are ready to send
			if (!BOOMR.readyToSend()) {
				BOOMR.debug("Attempted to call responseEnd before all plugins were Ready to Send, trying again...");

				// try again later
				setTimeout(function() {
					BOOMR.responseEnd(name, t_start, data, t_end);
				}, 1000);

				return;
			}

			// Wait until we've sent the Page Load beacon first
			if (!BOOMR.hasSentPageLoadBeacon() &&
			    !BOOMR.utils.inArray(name.initiator, BOOMR.constants.BEACON_TYPE_SPAS)) {
				// wait for a beacon, then try again
				BOOMR.subscribe("page_load_beacon", function() {
					BOOMR.responseEnd(name, t_start, data, t_end);
				}, null, BOOMR, true);

				return;
			}

			if (typeof name === "object") {
				if (!name.url) {
					BOOMR.debug("BOOMR.responseEnd: First argument must have a url property if it's an object");
					return;
				}

				impl.fireEvent("xhr_load", name);
			}
			else {
				// flush out any queue'd beacons before we set the Page Group
				// and timers
				BOOMR.real_sendBeacon();

				BOOMR.addVar("xhr.pg", name);
				BOOMR.plugins.RT.startTimer("xhr_" + name, t_start);
				impl.fireEvent("xhr_load", {
					name: "xhr_" + name,
					data: data,
					timing: {
						loadEventEnd: t_end
					}
				});
			}
		},

		//
		// uninstrumentXHR and instrumentXHR are stubs that will be replaced
		// by auto-xhr.js if active.
		//
		/**
		 * Undo XMLHttpRequest instrumentation and reset the original `XMLHttpRequest`
		 * object
		 *
		 * This is implemented in `plugins/auto-xhr.js` {@link BOOMR.plugins.AutoXHR}.
		 *
		 * @memberof BOOMR
		 */
		uninstrumentXHR: function() {
		},

		/**
		 * Instrument all requests made via XMLHttpRequest to send beacons.
		 *
		 * This is implemented in `plugins/auto-xhr.js` {@link BOOMR.plugins.AutoXHR}.
		 *
		 * @memberof BOOMR
		 */
		instrumentXHR: function() { },

		/**
		 * Request boomerang to send its beacon with all queued beacon data
		 * (via {@link BOOMR.addVar}).
		 *
		 * Boomerang may ignore this request.
		 *
		 * When this method is called, boomerang checks all plugins. If any
		 * plugin has not completed its checks (ie, the plugin's `is_complete()`
		 * method returns `false`, then this method does nothing.
		 *
		 * If all plugins have completed, then this method fires the
		 * {@link BOOMR#event:before_beacon} event with all variables that will be
		 * sent on the beacon.
		 *
		 * After all {@link BOOMR#event:before_beacon} handlers return, this method
		 * checks if a `beacon_url` has been configured and if there are any
		 * beacon parameters to be sent. If both are true, it fires the beacon.
		 *
		 * The {@link BOOMR#event:beacon} event is then fired.
		 *
		 * `sendBeacon()` should be called any time a plugin goes from
		 * `is_complete() = false` to `is_complete = true` so the beacon is
		 * sent.
		 *
		 * The actual beaconing is handled in {@link BOOMR.real_sendBeacon} after
		 * a short delay (via {@link BOOMR.setImmediate}).  If other calls to
		 * `sendBeacon` happen before {@link BOOMR.real_sendBeacon} is called,
		 * those calls will be discarded (so it's OK to call this in quick
		 * succession).
		 *
		 * @param {string} [beacon_url_override] Beacon URL override
		 *
		 * @memberof BOOMR
		 */
		sendBeacon: function(beacon_url_override) {
			// This plugin wants the beacon to go somewhere else,
			// so update the location
			if (beacon_url_override) {
				impl.beacon_url_override = beacon_url_override;
			}

			if (!impl.beaconQueued) {
				impl.beaconQueued = true;
				BOOMR.setImmediate(BOOMR.real_sendBeacon, null, null, BOOMR);
			}

			return true;
		},

		/**
		 * Sends all beacon data.
		 *
		 * This function should be called directly any time a "new" beacon is about
		 * to be constructed.  For example, if you're creating a new XHR or other
		 * custom beacon, you should ensure the existing beacon data is flushed
		 * by calling `BOOMR.real_sendBeacon();` first.
		 *
		 * @memberof BOOMR
		 */
		real_sendBeacon: function() {
			var k, form, url, errors = [], params = [], paramsJoined, varsSent = {}, _if;

			if (!impl.beaconQueued) {
				return false;
			}

			impl.beaconQueued = false;

			BOOMR.debug("Checking if we can send beacon");

			// At this point someone is ready to send the beacon.  We send
			// the beacon only if all plugins have finished doing what they
			// wanted to do
			for (k in this.plugins) {
				if (this.plugins.hasOwnProperty(k)) {
					if (impl.disabled_plugins[k]) {
						continue;
					}
					if (!this.plugins[k].is_complete(impl.vars)) {
						BOOMR.debug("Plugin " + k + " is not complete, deferring beacon send");
						return false;
					}
				}
			}

			// Sanity test that the browser is still available (and not shutting down)
			if (!window || !window.Image || !window.navigator || !BOOMR.window) {
				BOOMR.debug("DOM not fully available, not sending a beacon");
				return false;
			}

			// For SPA apps, don't strip hashtags as some SPA frameworks use #s for tracking routes
			// instead of History pushState() APIs. Use d.URL instead of location.href because of a
			// Safari bug.
			var isSPA = BOOMR.utils.inArray(impl.vars["http.initiator"], BOOMR.constants.BEACON_TYPE_SPAS);
			var isPageLoad = typeof impl.vars["http.initiator"] === "undefined" || isSPA;

			if (!impl.vars.pgu) {
				impl.vars.pgu = isSPA ? d.URL : d.URL.replace(/#.*/, "");
			}
			impl.vars.pgu = BOOMR.utils.cleanupURL(impl.vars.pgu);

			// Use the current document.URL if it hasn't already been set, or for SPA apps,
			// on each new beacon (since each SPA soft navigation might change the URL)
			if (!impl.vars.u || isSPA) {
				impl.vars.u = impl.vars.pgu;
			}

			if (impl.vars.pgu === impl.vars.u) {
				delete impl.vars.pgu;
			}

			// Add cleaned-up referrer URLs to the beacon, if available
			if (impl.r) {
				impl.vars.r = BOOMR.utils.cleanupURL(impl.r);
			}
			else {
				delete impl.vars.r;
			}

			if (impl.r2) {
				impl.vars.r2 = BOOMR.utils.cleanupURL(impl.r2);
			}
			else {
				delete impl.vars.r2;
			}

			impl.vars.v = BOOMR.version;

			if (BOOMR.visibilityState()) {
				impl.vars["vis.st"] = BOOMR.visibilityState();
				if (BOOMR.lastVisibilityEvent.visible) {
					impl.vars["vis.lv"] = BOOMR.now() - BOOMR.lastVisibilityEvent.visible;
				}
				if (BOOMR.lastVisibilityEvent.hidden) {
					impl.vars["vis.lh"] = BOOMR.now() - BOOMR.lastVisibilityEvent.hidden;
				}
			}

			impl.vars["ua.plt"] = navigator.platform;
			impl.vars["ua.vnd"] = navigator.vendor;

			if (this.pageId) {
				impl.vars.pid = this.pageId;
			}

			if (w !== window) {
				_if = "if";  // work around uglifyJS minification that breaks in IE8 and quirks mode
				impl.vars[_if] = "";
			}

			for (k in impl.errors) {
				if (impl.errors.hasOwnProperty(k)) {
					errors.push(k + (impl.errors[k] > 1 ? " (*" + impl.errors[k] + ")" : ""));
				}
			}

			if (errors.length > 0) {
				impl.vars.errors = errors.join("\n");
			}

			impl.errors = {};

			// If we reach here, all plugins have completed
			impl.fireEvent("before_beacon", impl.vars);

			// clone the vars object for two reasons: first, so all listeners of
			// 'beacon' get an exact clone (in case listeners are doing
			// BOOMR.removeVar), and second, to help build our priority list of vars.
			for (k in impl.vars) {
				if (impl.vars.hasOwnProperty(k)) {
					varsSent[k] = impl.vars[k];
				}
			}

			BOOMR.removeVar("qt");

			// remove any vars that should only be on a single beacon
			for (var singleVarName in impl.singleBeaconVars) {
				if (impl.singleBeaconVars.hasOwnProperty(singleVarName)) {
					BOOMR.removeVar(singleVarName);
				}
			}

			// clear single beacon vars list
			impl.singleBeaconVars = {};

			// keep track of page load beacons
			if (!impl.hasSentPageLoadBeacon && isPageLoad) {
				impl.hasSentPageLoadBeacon = true;

				// let this beacon go out first
				BOOMR.setImmediate(function() {
					impl.fireEvent("page_load_beacon", varsSent);
				});
			}

			// send the beacon data
			BOOMR.sendBeaconData(varsSent);

			return true;
		},

		/**
		 * Determines whether or not a Page Load beacon has been sent.
		 *
		 * @returns {boolean} True if a Page Load beacon has been sent.
		 */
		hasSentPageLoadBeacon: function() {
			return impl.hasSentPageLoadBeacon;
		},

		/**
		 * Sends beacon data via the Beacon API, XHR or Image
		 *
		 * @param {object} data Data
		 */
		sendBeaconData: function(data) {
			var urlFirst = [], urlLast = [], params, paramsJoined,
			    url, img, useImg = true, xhr, ret;

			BOOMR.debug("Ready to send beacon: " + BOOMR.utils.objectToString(data));

			// Use the override URL if given
			impl.beacon_url = impl.beacon_url_override || impl.beacon_url;

			// Check that the beacon_url was set first
			if (!impl.beacon_url) {
				BOOMR.debug("No beacon URL, so skipping.");
				return false;
			}

			if (!impl.beaconUrlAllowed(impl.beacon_url)) {
				BOOMR.debug("Beacon URL not allowed: " + impl.beacon_url);
				return false;
			}

			// Check that we have data to send
			if (data.length === 0) {
				return false;
			}

			// If we reach here, we've figured out all of the beacon data we'll send.
			impl.fireEvent("beacon", data);

			// get high- and low-priority variables first, which remove any of
			// those vars from data
			urlFirst = this.getVarsOfPriority(data, -1);
			urlLast  = this.getVarsOfPriority(data, 1);

			// merge the 3 lists
			params = urlFirst.concat(this.getVarsOfPriority(data, 0), urlLast);
			paramsJoined = params.join("&");

			// if there are already url parameters in the beacon url,
			// change the first parameter prefix for the boomerang url parameters to &
			url = impl.beacon_url + ((impl.beacon_url.indexOf("?") > -1) ? "&" : "?") + paramsJoined;

			//
			// Try to send an IMG beacon if possible (which is the most compatible),
			// otherwise send an XHR beacon if the  URL length is longer than 2,000 bytes.
			//
			if (impl.beacon_type === "POST" || url.length > BOOMR.constants.MAX_GET_LENGTH) {
				// switch to a XHR beacon if the the user has specified a POST OR GET length is too long
				useImg = false;
			}

			//
			// Try the sendBeacon API first
			//
			if (w && w.navigator &&
			    typeof w.navigator.sendBeacon === "function" &&
			    typeof w.Blob === "function") {
				// note we're using sendBeacon with &sb=1
				var blobData = new w.Blob([paramsJoined + "&sb=1"], {
					type: "application/x-www-form-urlencoded"
				});

				if (w.navigator.sendBeacon(impl.beacon_url, blobData)) {
					return true;
				}

				// sendBeacon was not successful, try Image or XHR beacons
			}

			// If we don't have XHR available, force an image beacon and hope
			// for the best
			if (!BOOMR.orig_XMLHttpRequest && (!w || !w.XMLHttpRequest)) {
				useImg = true;
			}

			if (useImg) {
				//
				// Image beacon
				//

				// just in case Image isn't a valid constructor
				try {
					img = new Image();
				}
				catch (e) {
					BOOMR.debug("Image is not a constructor, not sending a beacon");
					return false;
				}

				img.src = url;
			}
			else {
				//
				// XHR beacon
				//

				// Send a form-encoded XHR POST beacon
				xhr = new (BOOMR.window.orig_XMLHttpRequest || BOOMR.orig_XMLHttpRequest || BOOMR.window.XMLHttpRequest)();
				try {
					this.sendXhrPostBeacon(xhr, paramsJoined);
				}
				catch (e) {
					// if we had an exception with the window XHR object, try our IFRAME XHR
					xhr = new BOOMR.boomerang_frame.XMLHttpRequest();
					this.sendXhrPostBeacon(xhr, paramsJoined);
				}
			}

			return true;
		},

		/**
		 * Determines whether or not a Page Load beacon has been sent.
		 *
		 * @returns {boolean} True if a Page Load beacon has been sent.
		 *
		 * @memberof BOOMR
		 */
		hasSentPageLoadBeacon: function() {
			return impl.hasSentPageLoadBeacon;
		},

		/**
		 * Sends a beacon via XMLHttpRequest
		 *
		 * @param {object} xhr XMLHttpRequest object
		 * @param {object} [paramsJoined] XMLHttpRequest.send() argument
		 *
		 * @memberof BOOMR
		 */
		sendXhrPostBeacon: function(xhr, paramsJoined) {
			xhr.open("POST", impl.beacon_url);

			xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded");

			if (typeof impl.beacon_auth_token !== "undefined") {
				if (typeof impl.beacon_auth_key === "undefined") {
					impl.beacon_auth_key = "Authorization";
				}

				xhr.setRequestHeader(impl.beacon_auth_key, impl.beacon_auth_token);
			}

			xhr.send(paramsJoined);
		},

		/**
		 * Gets all variables of the specified priority
		 *
		 * @param {object} vars Variables (will be modified for pri -1 and 1)
		 * @param {number} pri Priority (-1, 0, or 1)
		 *
		 * @return {string[]} Array of URI-encoded vars
		 *
		 * @memberof BOOMR
		 */
		getVarsOfPriority: function(vars, pri) {
			var name, url = [];

			if (pri !== 0) {
				// if we were given a priority, iterate over that list
				for (name in impl.varPriority[pri]) {
					if (impl.varPriority[pri].hasOwnProperty(name)) {
						// if this var is set, add it to our URL array
						if (vars.hasOwnProperty(name)) {
							url.push(this.getUriEncodedVar(name, vars[name]));

							// remove this name from vars so it isn't also added
							// to the non-prioritized list when pri=0 is called
							delete vars[name];
						}
					}
				}
			}
			else {
				// if we weren't given a priority, iterate over all of the vars
				// that are left (from not being removed via earlier pri -1 or 1)
				for (name in vars) {
					if (vars.hasOwnProperty(name)) {
						url.push(this.getUriEncodedVar(name, vars[name]));
					}
				}
			}

			return url;
		},

		/**
		 * Gets a URI-encoded name/value pair.
		 *
		 * @param {string} name Name
		 * @param {string} value Value
		 *
		 * @returns {string} URI-encoded string
		 *
		 * @memberof BOOMR
		 */
		getUriEncodedVar: function(name, value) {
			if (value === undefined || value === null) {
				value = "";
			}

			if (typeof value === "object") {
				value = BOOMR.utils.serializeForUrl(value);
			}

			var result = encodeURIComponent(name) +
				"=" + encodeURIComponent(value);

			return result;
		},

		/**
		 * Gets the latest ResourceTiming entry for the specified URL.
		 *
		 * Default sort order is chronological startTime.
		 *
		 * @param {string} url Resource URL
		 * @param {function} [sort] Sort the entries before returning the last one
		 *
		 * @returns {PerformanceEntry|undefined} Entry, or undefined if ResourceTiming is not
		 *  supported or if the entry doesn't exist
		 *
		 * @memberof BOOMR
		 */
		getResourceTiming: function(url, sort) {
			var entries, p = BOOMR.getPerformance();

			try {
				if (p && typeof p.getEntriesByName === "function") {
					entries = p.getEntriesByName(url);
					if (entries && entries.length) {
						if (typeof sort === "function") {
							entries.sort(sort);
						}
						return entries[entries.length - 1];
					}
				}
			}
			catch (ignore) {
				// empty
			}
		}

	};

	boomr.url = boomr.utils.getMyURL();



	delete BOOMR_start;

	/**
	 * @global
	 * @type {TimeStamp}
	 * @name BOOMR_lstart
	 * @desc
	 * Time the loader script started fetching boomerang.js (if the asynchronous
	 * loader snippet is used).
	 */
	if (typeof BOOMR_lstart === "number") {
		/**
		 * Time the loader script started fetching boomerang.js (if using the
		 * asynchronous loader snippet) (`BOOMR_lstart`)
		 * @type {TimeStamp}
		 *
		 * @memberof BOOMR
		 */
		boomr.t_lstart = BOOMR_lstart;
		delete BOOMR_lstart;
	}
	else if (typeof BOOMR.window.BOOMR_lstart === "number") {
		boomr.t_lstart = BOOMR.window.BOOMR_lstart;
	}

	/**
	 * Time the `window.onload` event fired (if using the asynchronous loader snippet).
	 *
	 * This timestamp is logged in the case boomerang.js loads after the onload event
	 * for browsers that don't support NavigationTiming.
	 *
	 * @global
	 * @name BOOMR_onload
	 * @type {TimeStamp}
	 */
	if (typeof BOOMR.window.BOOMR_onload === "number") {
		/**
		 * Time the `window.onload` event fired (if using the asynchronous loader snippet).
		 *
		 * This timestamp is logged in the case boomerang.js loads after the onload event
		 * for browsers that don't support NavigationTiming.
		 *
		 * @type {TimeStamp}
		 * @memberof BOOMR
		 */
		boomr.t_onload = BOOMR.window.BOOMR_onload;
	}

	(function() {
		var make_logger;

		if (typeof console === "object" && console.log !== undefined) {
			/**
			 * Logs the message to the console
			 *
			 * @param {string} m Message
			 * @param {string} l Log level
			 * @param {string} [s] Source
			 *
			 * @function log
			 *
			 * @memberof BOOMR
			 */
			boomr.log = function(m, l, s) {
				console.log("(" + BOOMR.now() + ") " +
					"{" + BOOMR.pageId + "}" +
					": " + s +
					": [" + l + "] " +
					m);
			};
		}
		else {
			// NOP for browsers that don't support it
			boomr.log = function() {};
		}

		make_logger = function(l) {
			return function(m, s) {
				this.log(m, l, "boomerang" + (s ? "." + s : ""));
				return this;
			};
		};

		/**
		 * Logs debug messages to the console
		 *
		 * Debug messages are stripped out of production builds.
		 *
		 * @param {string} m Message
		 * @param {string} [s] Source
		 *
		 * @function debug
		 *
		 * @memberof BOOMR
		 */
		boomr.debug = make_logger("debug");

		/**
		 * Logs info messages to the console
		 *
		 * @param {string} m Message
		 * @param {string} [s] Source
		 *
		 * @function info
		 *
		 * @memberof BOOMR
		 */
		boomr.info = make_logger("info");

		/**
		 * Logs warning messages to the console
		 *
		 * @param {string} m Message
		 * @param {string} [s] Source
		 *
		 * @function warn
		 *
		 * @memberof BOOMR
		 */
		boomr.warn = make_logger("warn");

		/**
		 * Logs error messages to the console
		 *
		 * @param {string} m Message
		 * @param {string} [s] Source
		 *
		 * @function error
		 *
		 * @memberof BOOMR
		 */
		boomr.error = make_logger("error");
	}());

	// If the browser supports performance.now(), swap that in for BOOMR.now
	try {
		var p = boomr.getPerformance();
		if (p &&
		    typeof p.now === "function" &&
		    // #545 handle bogus performance.now from broken shims
		    /\[native code\]/.test(String(p.now)) &&
		    p.timing &&
		    p.timing.navigationStart) {
			boomr.now = function() {
				return Math.round(p.now() + p.timing.navigationStart);
			};
		}
	}
	catch (ignore) {
		// empty
	}

	impl.checkLocalStorageSupport();

	(function() {
		var ident;
		for (ident in boomr) {
			if (boomr.hasOwnProperty(ident)) {
				BOOMR[ident] = boomr[ident];
			}
		}

		if (!BOOMR.xhr_excludes) {
			/**
			 * URLs to exclude from automatic `XMLHttpRequest` instrumentation.
			 *
			 * You can put any of the following in it:
			 * * A full URL
			 * * A hostname
			 * * A path
			 *
			 * @example
			 * 
			 * BOOMR.xhr_excludes = {
			 *   "mysite.com": true,
			 *   "/dashboard/": true,
			 *   "https://mysite.com/dashboard/": true
			 * };
			 *
			 * @memberof BOOMR
			 */
			BOOMR.xhr_excludes = {};
		}
	}());


	dispatchEvent("onBoomerangLoaded", { "BOOMR": BOOMR }, true);

}(window));


// end of boomerang beaconing section

/**
 * The Continuity plugin measures performance and user experience metrics beyond
 * just the traditional Page Load timings.
 *
 * ## Approach
 *
 * The goal of the Continuity plugin is to capture the important aspects of your
 * visitor's overall _user experience_ during page load and beyond.  For example, the
 * plugin measures when the site appeared _Visually Ready_, and when it was _Interactive_.
 *
 * In addition, the Continuity plugin captures in-page interactions (such as keys,
 * clicks and scrolls), and monitors how the site performed when responding to
 * these inputs.
 *
 * Finally, the Continuity plugin is utilizing cutting-edge browser
 * performance APIs like [LongTasks](https://w3c.github.io/longtasks/) to get
 * important insights into how the browser is performing.
 *
 * Here are some of the metrics that the Continuity plugin captures:
 *
 * * Timers:
 *     * **Time to Visually Ready**: When did the user feel like they could interact
 *         with the site?  When did it look ready? (see below for details)
 *     * **Time to Interactive**: After the page was Visually Ready, when was the
 *         first time the user could have interacted with the site, and had a
 *         good (performant) experience? (see below for details)
 *     * **Time to First Interaction**: When was the first time the user tried to
 *         interact (key, click or scroll) with the site?
 *     * **First Input Delay**: For the first interaction on the page, how
 *         responsive was it?
 * * Interaction metrics:
 *     * **Interactions**: Keys, mouse movements, clicks, and scrolls (counts and
 *         an event log)
 *     * **Delayed Interactions**: How often was the user's interaction delayed
 *         more than 50ms?
 *     * **Rage Clicks**: Did the user repeatedly clicked on the same element/region?
 * * Page performance metrics:
 *     * **Frame Rate data**: FPS during page load, minimum FPS, number of long frames
 *     * **Long Task data**: Number of Long Tasks, how much time they took, attribution
 *         to what caused them
 *     * **Page Busy**: Measurement of the page's busyness
 *
 * This data is captured during the page load, as well as when the user later
 * interacts with the site (if configured via
 * {@link BOOMR.plugins.Continuity.init `afterOnload`}).
 * These metrics are reported at regular intervals, so you can see how they
 * change over time.
 *
 * If configured, the Continuity plugin can send additional beacons after a page
 * interaction happens (via {@link BOOMR.plugins.Continuity.init `monitorInteractions`}).
 *
 * ## Configuration
 *
 * The `Continuity` plugin has a variety of options to configure what it does (and
 * what it doesn't do):
 *
 * ### Monitoring Long Tasks
 *
 * If {@link BOOMR.plugins.Continuity.init `monitorLongTasks`} is turned on,
 * the Continuity plugin will monitor [Long Tasks](https://w3c.github.io/longtasks/)
 * (if the browser supports it).
 *
 * Long Tasks represent work being done on the browser's UI thread that monopolize
 * the UI thread and block other critical tasks from being executed (such as reacting
 * to user input).  Long Tasks can be caused by anything from JavaScript
 * execution, to parsing, to layout.  The browser fires `LongTask` events
 * (via the `PerformanceObserver`) when a task takes over 50 milliseconds to execute.
 *
 * Long Tasks are important to measure as a Long Task will block all other user input
 * (e.g. clicks, keys and scrolls).
 *
 * Long Tasks are powerful because they can give _attribution_ about what component
 * caused the task, i.e. the source JavaScript file.
 *
 * If {@link BOOMR.plugins.Continuity.init `monitorLongTasks`} is enabled:
 *
 * * A `PerformanceObserver` will be turned on to capture all Long Tasks that happen
 *     on the page.
 * * Long Tasks will be used to calculate _Time to Interactive_
 * * A log (`c.lt`), timeline (`c.t.lt`) and other Long Task metrics (`c.lt.*`) will
 *     be added to the beacon (see Beacon Parameters details below)
 *
 * The log `c.lt` is a JSON (or JSURL) object of compressed `LongTask` data.  See
 * the source code for what each attribute maps to.
 *
 * Long Tasks are currently a cutting-edge browser feature and will not be available
 * in older browsers.
 *
 * Enabling Long Tasks should not have a performance impact on the page load experience,
 * as collecting of the tasks are via the lightweight `PerformanceObserver` interface.
 *
 * ### Monitoring Page Busy
 *
 * If {@link BOOMR.plugins.Continuity.init `monitorPageBusy`} is turned on,
 * the Continuity plugin will measure Page Busy.
 *
 * Page Busy is a way of measuring how much work was being done on the page (how "busy"
 * it was).  Page Busy is calculated via `setInterval()` polling: a timeout is scheduled
 * on the page at a regular interval, and _busyness_ is detected if that timeout does
 * not fire at the time it was expected to.
 *
 * Page Busy is a percentage -- 100% means that the browser was entirely busy doing other
 * things, while 0% means the browser was idle.
 *
 * Page Busy is _just an estimate_, as it uses sampling.  As an example, if you have
 * a high number of small tasks that execute frequently, Page Busy might run at
 * a frequency that it either detects 100% (busy) or 0% (idle).
 *
 * Page Busy is not the most efficient way of measuring what the browser is doing,
 * but since it is calculated via `setInterval()`, it is supported in all browsers.
 * The Continuity plugin currently measures Page Busy by polling every 32 milliseconds.
 *
 * Page Busy can be an indicator of how likely the user will have a good experience
 * when they interact with it. If Page Busy is 100%, the user may see the page lag
 * behind their input.
 *
 * If {@link BOOMR.plugins.Continuity.init `monitorPageBusy`} is enabled:
 *
 * * The Page Busy monitor will be active (polling every 32 milliseconds) (unless
 *     Long Tasks is supported and enabled)
 * * Page Busy will be used to calculate _Time to Interactive_
 * * A timeline (`c.t.busy`) and the overall Page Busy % (`c.b`) will be added to the
 *     beacon (see Beacon Parameters details below)
 *
 * Enabling Page Busy monitoring should not have a noticable effect on the page load
 * experience.  The 32-millisecond polling is lightweight and should barely register
 * on JavaScript CPU profiles.
 *
 * ### Monitoring Frame Rate
 *
 * If {@link BOOMR.plugins.Continuity.init `monitorFrameRate`} is turned on,
 * the Continuity plugin will measure the Frame Rate of the page via
 * [`requestAnimationFrame`](https://developer.mozilla.org/en-US/docs/Web/API/window/requestAnimationFrame).
 *
 * `requestAnimationFrame` is a browser API that can be used to schedule animations
 * that run at the device's refresh rate.  It can also be used to measure how many
 * frames were actually delivered to the screen, which can be an indicator of how
 * good the user's experience is.
 *
 * `requestAnimationFrame` is available in
 * [all modern browsers](https://caniuse.com/#feat=requestanimationframe).
 *
 * If {@link BOOMR.plugins.Continuity.init `monitorFrameRate`} is enabled:
 *
 * * `requestAnimationFrame` will be used to measure Frame Rate
 * * Frame Rate will be used to calculate _Time to Interactive_
 * * A timeline (`c.t.fps`) and many Frame Rate metrics (`c.f.*`) will be added to the
 *     beacon (see Beacon Parameters details below)
 *
 * Enabling Frame Rate monitoring should not have a noticable effect on the page load
 * experience.  The frame callback may happen up to the device's refresh rate (which
 * is often 60 FPS), and the work done in the callback should be barely visible
 * in JavaScript CPU profiles (often less than 5ms over a page load).
 *
 * ### Monitoring Interactions
 *
 * If {@link BOOMR.plugins.Continuity.init `monitorInteractions`} is turned on,
 * the Continuity plugin will measure user interactions during the page load and beyond.
 *
 * Interactions include:
 *
 * * Mouse Clicks: Where the user clicked on the screen
 *     * Rage Clicks: Clicks to the same area repeatedly
 * * Mouse Movement: Rough mouse movement will be tracked, but these interactions will
 *    not send a beacon on their own, nor be used for _Time to First Interaction_
 *    calculations.
 * * Keyboard Presses: Individual key codes are not captured
 * * Scrolls: How frequently and far the user scrolled
 *     * Distinct Scrolls: Scrolls that happened over 2 seconds since the last scroll
 * * Page Visibility changes
 * * Orientation changes
 *
 * These interactions are monitored and instrumented throughout the page load.  By using
 * the event's `timeStamp`, we can detect how long it took for the physical event (e.g.
 * mouse click) to execute the JavaScript listening handler (in the Continuity plugin).
 * If there is a delay, this is tracked as an _Interaction Delay_.  Interaction Delays
 * can be an indicator that the user is having a degraded experience.
 *
 * The very first interaction delay will be added to the beacon as the
 * _First Input Delay_ - this is tracked as the user's first experience
 * with your site is important.
 *
 * In addition, if {@link BOOMR.plugins.Continuity.init `afterOnLoad`} is enabled,
 * these interactions (except Mouse Movements) can also trigger an `interaction`
 * beacon after the Page Load.  {@link BOOMR.plugins.Continuity.init `afterOnLoadMaxLength`}
 * can be used to control how many milliseconds after Page Load interactions will be
 * measured for.
 *
 * After a post-Load interaction occurs, the plugin will wait for
 * {@link BOOMR.plugins.Continuity.init `afterOnLoadMinWait`} milliseconds before
 * sending the `interaction` beacon.  If another interaction happens within that
 * timeframe, the plugin will wait another {@link BOOMR.plugins.Continuity.init `afterOnLoadMinWait`}
 * milliseconds.  This is to ensure that groups of interactions will be batched
 * together.  The plugin will wait up to 60 seconds to batch groups of interactions
 * together, at which point a beacon will be sent immediately.
 *
 * If {@link BOOMR.plugins.Continuity.init `monitorInteractions`} is enabled:
 *
 * * Passive event handlers will be added to monitor clicks, keys, etc.
 * * A log and many interaction metrics (`c.f.*`) will be added to the
 *     beacon (see Beacon Parameters details below)
 *
 * For `interaction` beacons, the following will be set:
 *
 * * `rt.tstart` will be the timestamp of the first interaction
 * * `rt.end` will be the timestamp of the last interaction
 * * `rt.start = 'manual'`
 * * `http.initiator = 'interaction'`
 *
 * Enabling interaction monitoring will add lightweight passive event handlers
 * to `scroll`, `click`, `mousemove` and `keydown` events.  These event handlers
 * should not delay the user's interaction, and are used to measure delays and
 * keep a log of interaction events.
 *
 * ### Monitoring Page Statistics
 *
 * If {@link BOOMR.plugins.Continuity.init `monitorStats`} is turned on,
 * the Continuity plugin will measure statistics about the page and browser over time.
 *
 * These statistics include:
 *
 * * Memory Usage: `usedJSHeapSize` (Chrome-only)
 * * [Battery Level](https://developer.mozilla.org/en-US/docs/Web/API/Battery_Status_API)
 * * DOM Size: Number of bytes of HTML in the root frame
 * * DOM Length: Number of DOM nodes in the root frame
 * * Mutations: How often and how much the page is changing
 *
 * If {@link BOOMR.plugins.Continuity.init `monitorStats`} is enabled:
 *
 * * Events and polls will be setup to monitor the above statistics
 * * A timeline (`c.t.*`) of these statistics will be added to the beacon (see
 *     details below)
 *
 * Enabling Page Statistic monitoring adds a poll to the page every second, gathering
 * the above statistics.  These statistics should take less than 5ms JavaScript CPU
 * on a desktop browser each poll, but this monitoring is probably the most
 * expensive of the Continuity plugin monitors.
 *
 * ## New Timers
 *
 * There are 4 new timers from the Continuity plugin that center around user
 * interactions:
 *
 * * **Time to Visually Ready** (VR)
 * * **Time to Interactive** (TTI)
 * * **Time to First Interaction** (TTFI)
 * * **First Input Delay** (FID)
 *
 * _Time to Interactive_ (TTI), at it's core, is a measurement (timestamp) of when the
 * page was interact-able. In other words, at what point does the user both believe
 * the page could be interacted with, and if they happened to try to interact with
 * it then, would they have a good experience?
 *
 * To calculate Time to Interactive, we need to figure out two things:
 *
 * * Does the page appear to the visitor to be interactable?
 *     * We'll use one or more Visually Ready Signals to determine this
 * * If so, what's the first time a user could interact with the page and have a good
 *     experience?
 *     * We'll use several Time to Interactive Signals to determine this
 *
 * ### Visually Ready
 *
 * For the first question, "does the page appear to be interactable?", we need to
 * determine when the page would _look_ to the user like they _could_ interact with it.
 *
 * It's only after this point that TTI could happen. Think of Visually Ready (VR) as
 * the anchor point of TTI -- it's the earliest possible timestamp in the page's
 * lifecycle that TTI could happen.
 *
 * We have a few signals that might be appropriate to use as Visually Ready:
 * * First Paint (if available)
 *     * We should wait at least for the first paint on the page
 *     * i.e. IE's [`msFirstPaint`](https://msdn.microsoft.com/en-us/library/ff974719)
 *         or Chrome's `firstPaintTime`
 *     * These might just be paints of white, so they're not the only signal we should use
 * * First Contentful Paint (if available)
 *     * Via [PaintTiming](https://www.w3.org/TR/paint-timing/)
 * * [domContentLoadedEventEnd](https://msdn.microsoft.com/en-us/library/ff974719)
 *     * "The DOMContentLoaded event is fired when the initial HTML document has been
 *         completely loaded and parsed, without waiting for stylesheets, images,
 *         and subframes to finish loading"
 *     * This happens after `domInteractive`
 *     * Available in NavigationTiming browsers via a timestamp and all other
 *         browser if we're on the page in time to listen for readyState change events
 * * Hero Images (if defined)
 *     * Instead of tracking all Above-the-Fold images, it could be useful to know
 *         which specific images are important to the site owner
 *     * Defined via a simple CSS selector (e.g. `.hero-images`)
 *     * Can be measured via ResourceTiming
 *     * Will add Hero Images Ready `c.tti.hi` to the beacon
 * * "My Framework is Ready" (if defined)
 *     * A catch-all for other things that we can't automatically track
 *     * This would be an event or callback from the page author saying their page is ready
 *     * They could fire this for whatever is important to them, i.e. when their page's
 *         click handlers have all registered
 *     * Will add Framework Ready `c.tti.fr` to the beacon
 *
 * Once the last of all of the above have happened, Visually Ready has occurred.
 *
 * Visually Ready will add `c.tti.vr` to the beacon.
 *
 * #### Controlling Visually Ready via Framework Ready
 *
 * There are two additional options for controlling when Visually Ready happens:
 * via Framework Ready or Hero Images.
 *
 * If you want to wait for your framework to be ready (e.g. your SPA has loaded or
 * a button has a click handler registered), you can add an
 * option {@link BOOMR.plugins.Continuity.init `ttiWaitForFrameworkReady`}.
 *
 * Once enabled, TTI won’t be calculated until the following is called:
 *
 * ```
 * // my framework is ready
 * if (BOOMR && BOOMR.plugins && BOOMR.plugins.Continuity) {
 *     BOOMR.plugins.Continuity.frameworkReady();
 * }
 * ```
 *
 * #### Controlling Visually Ready via Hero Images
 *
 * If you want to wait for your hero/main images to be loaded before Visually Ready
 * is measured, you can give the plugin a CSS selector via
 * {@link BOOMR.plugins.Continuity.init `ttiWaitForHeroImages`}.
 * If set, Visually Ready will be delayed until all IMGs that match that selector
 * have loaded, e.g.:
 *
 * ```
 * window.BOOMR_config = {
 *   Continuity: {
 *     enabled: true,
 *     ttiWaitForHeroImages: ".hero-image"
 *   }
 * };
 * ```
 *
 * Note this only works in ResourceTiming-supported browsers (and won’t be used in
 * older browsers).
 *
 * If no images match the CSS selector at Page Load, this setting will be ignored
 * (the plugin will not wait for a match).
 *
 * ### Time to Interactive
 *
 * After the page is Visually Ready for the user, if they were to try to interact
 * with the page (click, scroll, type), when would they have a good experience (i.e.
 * the page responded in a satisfactory amount of time)?
 *
 * We can use some of the signals below, when available:
 *
 * * Frame Rate (FPS)
 *     * Available in all modern browsers: by using `requestAnimationFrame` we can
 *         get a sense of the overall frame rate (FPS)
 *     * To ensure a "smooth" page load experience, ideally the page should never drop
 *         below 20 FPS.
 *     * 20 FPS gives about 50ms of activity to block the main thread at any one time
 * * Long Tasks
 *     * Via the PerformanceObserver, a Long Tasks fires any time the main thread
 *         was blocked by a task that took over 50ms such as JavaScript, layout, etc
 *     * Great indicator both that the page would not have been interact-able and
 *         in some cases, attribution as to why
 * * Page Busy via `setInterval`
 *     * By measuring how long it takes for a regularly-scheduled callback to fire,
 *         we can detect other tasks that got in the way
 *     * Can give an estimate for Page Busy Percentage (%)
 *     * Available in every browser
 * * Delayed interactions
 *     * If the user interacted with the page and there was a delay in responding
 *         to the input
 *
 * The {@link BOOMR.plugins.Continuity.init `waitAfterOnload`} option will delay
 * the beacon for up to that many milliseconds if Time to Interactive doesn't
 * happen by the browser's `load` event.  You shouldn't set it too high, or
 * the likelihood that the page load beacon will be lost increases (because of
 * the user navigating away first, or closing their browser). If
 * {@link BOOMR.plugins.Continuity.init `waitAfterOnload`} is reached and TTI
 * hasn't happened yet, the beacon will be sent immediately (missing the TTI timer).
 *
 * If you set {@link BOOMR.plugins.Continuity.init `waitAfterOnload`} to `0`
 * (or it's not set), Boomerang will send the beacon at the regular page load
 * event.  If TTI didn’t yet happen, it won’t be reported.
 *
 * If you want to set {@link BOOMR.plugins.Continuity.init `waitAfterOnload`},
 * we'd recommend a value between `1000` and `5000` (1 and 5 seconds).
 *
 * Time to Interaction will add `c.tti` to the beacon.  It will also add `c.tti.m`,
 * which is the higest-accuracy method available for TTI calculation: `lt` (Long Tasks),
 * `raf` (FPS), or `b` (Page Busy).
 *
 * #### Algorithm
 *
 * Putting these two timers together, here's how we measure Visually Ready and
 * Time to Interactive:
 *
 * 1. Determine the highest Visually Ready timestamp (VRTS):
 *     * First Contentful Paint (if available)
 *     * First Paint (if available)
 *     * `domContentLoadedEventEnd`
 *     * Hero Images are loaded (if configured)
 *     * Framework Ready (if configured)
 *
 * 2. After VRTS, calculate Time to Interactive by finding the first period of
 *     500ms where all of the following are true:
 *     * There were no Long Tasks
 *     * The FPS was always above 20 (if available)
 *     * Page Busy was less than 10% (if the above aren't available)
 *
 * ### Time to First Interaction
 *
 * Time to First Interaction (TTFI) is the first time a user interacted with the
 * page.  This may happen during or after the page's `load` event.
 *
 * Time to First Interaction will add `c.ttfi` to the beacon.
 *
 * If the user does not interact with the page by the beacon, there will be no
 * `c.ttfi` on the beacon.
 *
 * ### First Input Delay
 *
 * If the user interacted with the page by the time the beacon was sent, the
 * Continuity plugin will also measure how long it took for the JavaScript
 * event handler to fire.
 *
 * This can give you an indication of the page being otherwise busy and unresponsive
 * to the user if the callback is delayed.
 *
 * This time (measured in milliseconds) is added to the beacon as `c.fid`.
 *
 * ## Timelines
 *
 * If {@link BOOMR.plugins.Continuity.init `sendTimeline`} is enabled, many of
 * the above options will add bucketed "timelines" to the beacon.
 *
 * The Continuity plugin keeps track of statistics, interactions and metrics over time
 * by keeping track of these counts at a granularity of 100-millisecond intervals.
 *
 * As an example, if you are measuring Long Tasks, its timeline will have entries
 * whenever a Long Task occurs.
 *
 * Not every timeline will have data for every interval.  As an example, the click
 * timeline will be sparse except for the periods where there was a click.  Statistics
 * like DOM Size are captured only once every second.  The Continuity plugin is
 * optimized to use as little memory as possible for these cases.
 *
 * ### Compressed Timeline Format
 *
 * If {@link BOOMR.plugins.Continuity.init `sendTimeline`} is enabled, the
 * Continuity plugin will add several timelines as `c.t.[name]` to the beacon
 * in a compressed format.
 *
 * An example timeline may look like this:
 *
 * ```
 * c.t.fps      = 03*a*657576576566766507575*8*65
 * c.t.domsz    = 11o3,1o4
 * c.t.mousepct = 2*5*0053*4*00050718
 * ```
 *
 * The format of the compressed timeline is as follows:
 *
 * `[Compression Type - 1 character][Data - everything else]`
 *
 * * Compression Type is a single character that denotes how each timeline's bucket
 *     numbers are compressed:
 *     * `0` (for smaller numbers):
 *         * Each number takes a single character, encoded in Base-64
 *         * If a number is >= 64, the number is converted to Base-36 and wrapped in
 *             `.` characters
 *     * `1` (for larger numbers)
 *         * Each number is separated by `,`s
 *         * Each number is encoded in Base-36
 *     * `2` (for percentages)
 *         * Each number takes two characters, encoded in Base-10
 *         * If a number is <= 0, it is `00`
 *         * If a number is >= 100, it is `__`
 *
 * In addition, for repeated numbers, the format is as follows:
 *
 * `*[Repeat Count]*[Number]`
 *
 * Where:
 *
 * * Repeat Count is encoded Base-36
 * * Number is encoded per the rules above
 *
 * From the above example, the data would be decompressed to:
 *
 * ```
 * c.t.fps =
 *     [3, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 5, 7, 5, 7, 6, 5, 7, 6, 5, 6, 6, 7, 6,
 *     6, 5, 0, 7, 5, 7, 5, 6, 6, 6, 6, 6, 6, 6, 6, 5];
 *
 * c.t.domsz = [2163, 2164];
 *
 * c.t.mousepct = [0, 0, 0, 0, 0, 53, 0, 5, 7, 18];
 * ```
 *
 * The timeline can be decompressed via
 * {@link BOOMR.plugins.Continuity.decompressBucketLog `decompressBucketLog`}
 * (for debug builds).
 *
 * The Continuity Epoch (`c.e`) and Continuity Last Beacon (`c.lb`) are timestamps
 * (Base-36) that indicate what timestamp the first bucket represents.  If both are
 * given, the Last Beacon timestamp should be used.
 *
 * For example:
 *
 * ```
 * c.e=j5twmlbv       // 1501611350395
 * c.lb=j5twmlyk      // 1501611351212
 * c.t.domsz=11o3,1o4 // 2163, 2164 using method 1
 * ```
 *
 * In the above example, the first value of `2163` (`1o3` Base-36) happened
 * at `1501611351212`.  The second value of `2164` (`1o4` Base-36) happened
 * at `1501611351212 + 100 = 1501611351312`.
 *
 * For all of the available timelines, see the Beacon Parameters list below.
 *
 * ## Logs
 *
 * If {@link BOOMR.plugins.Continuity.init `sendLog`} is enabled, the Continuity
 * plugin will add a log to the beacon as `c.l`.
 *
 * The following events will generate a Log entry with the listed parameters:
 *
 * * Scrolls (type `0`):
 *     * `y`: Y pixels
 * * Clicks (type `1`):
 *     * `x`: X pixels
 *     * `y`: Y pixels
 * * Mouse Movement (type `2`):
 *     * Data is captured at minimum 10 pixel granularity
 *     * `x`: X pixels
 *     * `y`: Y pixels
 * * Keyboard presses (type `3`):
 *     * (no data is captured)
 * * Visibility Changes (type `4`):
 *     * `s`
 *         * `0`: `visible`
 *         * `1`: `hidden`
 *         * `2`: `prerender`
 *         * `3`: `unloaded`
 * * Orientation Changes (type `5`):
 *     * `a`: Angle
 *
 * The log is put on the beacon in a compressed format.  Here is an example log:
 *
 * ```
 * c.l=214y,xk9,y8p|142c,xk5,y8v|34kh
 * ```
 *
 * The format of the compressed timeline is as follows:
 *
 * ```
 * [Type][Timestamp],[Param1 type][Param 1 value],[... Param2 ...]|[... Event2 ...]
 * ```
 *
 * * Type is a single character indicating what type of event it is, per above
 * * Timestamp (`navigationStart` epoch in milliseconds) is Base-36 encoded
 * * Each parameter follows, separated by commas:
 *     * The first character indicates the type of parameter
 *     * The subsequent characters are the value of the parameter, Base-36 encoded
 *
 * From the above example, the data would be decompressed to:
 *
 * ```
 * [
 *     {
 *         "type": "mouse",
 *         "time": 1474,
 *         "x": 729,
 *         "y": 313
 *     },
 *     {
 *         "type": "click",
 *         "time": 5268,
 *         "x": 725,
 *         "y": 319
 *     },
 *     {
 *         "type": "key",
 *         "time": 5921,
 *     }
 * ]
 * ```
 *
 * The plugin will keep track of the last
 * {@link BOOMR.plugins.Continuity.init `logMaxEntries`} entries in the log
 * (default 100).
 *
 * The timeline can be decompressed via
 * {@link BOOMR.plugins.Continuity.decompressBucketLog `decompressLog`} (for
 * debug builds).
 *
 * ## Overhead
 *
 * When enabled, the Continuity plugin adds new layers of instrumentation to
 * each page load.  It also keeps some of this instrumentation enabled
 * after the `load` event, if configured.  By default, these instrumentation
 * "monitors" will be turned on:
 *
 * * Long Tasks via `PerformanceObserver`
 * * Frame Rate (FPS) via `requestAnimationFrame`
 * * Page Busy via `setInterval` polling (if Long Tasks aren't supported)
 * * Monitoring of interactions such as mouse clicks, movement, keys, and scrolls
 * * Page statistics like DOM size/length, memory usage, and mutations
 *
 * Each of these monitors is designed to be as lightweight as possible, but
 * enabling instrumentation will always incur non-zero CPU time.  Please read
 * the above sections for overhead information on each monitor.
 *
 * With the Continuity plugin enabled, during page load, you may see the plugin's
 * total CPU usage over the entire length of that page load reach 10-35ms, depending on
 * the hardware and makeup of the host-site. In general, for most modern websites,
 * this means Boomerang should still only account for a few percentage points of
 * overall page CPU usage with the Continuity plugin enabled.
 *
 * The majority of this CPU usage increase is from Page Statistics reporting and
 * FPS monitoring.  You can disable either of these monitors individually if desired
 * ({@link BOOMR.plugins.Continuity.init `monitorStats`} and
 * {@link BOOMR.plugins.Continuity.init `monitorFrameRate`}).
 *
 * During idle periods (after page load), the Continuity plugin will continue
 * monitoring the above items if {@link BOOMR.plugins.Continuity.init `afterOnload`}
 * is enabled.  This may increase Boomerang JavaScript CPU usage as well.  Again,
 * the majority of this CPU usage increase is from Page Statistic reporting and
 * Frame Rate monitoring, and can be disabled.
 *
 * When Long Tasks aren't supported by the browser, Page Busy monitoring via
 * `setInterval` should only 1-2ms CPU during and after page load.
 *
 * ## Beacon Parameters
 *
 * The following parameters will be added to the beacon:
 *
 * * `c.e`: Continuity Epoch timestamp (when everything started measuring) (Base-36)
 * * `c.l`: Log (compressed)
 * * `c.lt`: Long Task data (compressed)
 * * `c.lt.n`: Number of Long Tasks (Base-10)
 * * `c.lt.tt`: Total duration of Long Tasks (Base-10)
 * * `c.b`: Page Busy percentage (Base-10)
 * * `c.t.fps`: Frame Rate timeline (compressed)
 * * `c.t.inter`: Interactions timeline (compressed)
 * * `c.t.interdly`: Delayed Interactions timeline (compressed)
 * * `c.t.key`: Keyboard press timeline (compressed)
 * * `c.t.click`: Click timeline (compressed)
 * * `c.t.mouse`: Mouse movements timeline (compressed)
 * * `c.t.mousepct`: Mouse movement percentage (of full screen) timeline (compressed)
 * * `c.t.mem`: Memory usage timeline (compressed)
 * * `c.t.domsz`: DOM Size timeline (compressed)
 * * `c.t.domln`: DOM Length timeline (compressed)
 * * `c.t.mut`: DOM Mutations timeline (compressed)
 * * `c.tti.vr`: Visually Ready (Base-10)
 * * `c.tti.hi`: Hero Images ready (Base-10)
 * * `c.tti.fr`: Framework Ready (Base-10)
 * * `c.tti.m`: Time to Interactive Method (`lt`, `raf`, `b`)
 * * `c.tti`: Time to Interactive (Base-10)
 * * `c.f`: Average Frame Rate over the Frame Rate Duration (Base-10)
 * * `c.f.d`: Frame Rate duration (how long it has been measuring) (Base-10)
 * * `c.f.m`: Minimum Frame Rate (Base-10)
 * * `c.f.l`: Number of Long Frames (>= 50ms) (Base-10)
 * * `c.f.s`: Frame Rate measurement start time (Base-36)
 * * `c.k`: Keyboard event count (Base-10)
 * * `c.k.e`: Keyboard ESC count (Base-10)
 * * `c.c`: Click count (Base-10)
 * * `c.c.r`: Rage click count (Base-10)
 * * `c.m.p`: Mouse movement percentage (Base-10)
 * * `c.m.n`: Mouse movement pixels (Base-10)
 * * `c.ttfi`: Time to First Interactive (Base-10)
 * * `c.i.dc`: Delayed interaction count (Base-10)
 * * `c.i.dt`: Delayed interaction time (Base-10)
 * * `c.i.a`: Average interaction delay (Base-10)
 * * `c.fid`: First Input Delay (Base-10)
 * * `c.lb`: Last Beacon timestamp (Base-36)
 * * `c.s`: Scroll count (Base-10)
 * * `c.s.p`: Scroll percentage (Base-10)
 * * `c.s.y`: Scroll y (pixels) (Base-10)
 * * `c.s.d`: Distinct scrolls (scrolls that happen 2 seconds after the last) (Base-10)
 *
 * @class BOOMR.plugins.Continuity
 */
(function() {
	

	

	if (BOOMR.plugins.Continuity) {
		return;
	}

	//
	// Constants available to all Continuity classes
	//
	/**
	 * Timeline collection interval
	 */
	var COLLECTION_INTERVAL = 100;

	/**
	 * Maximum length (ms) that events will be recorded, if not
	 * a SPA.
	 */
	var DEFAULT_AFTER_ONLOAD_MAX_LENGTH = 60000;

	/**
	 * Time to Interactive polling period (after onload, how often we'll
	 * check to see if TTI fired yet)
	 */
	var TIME_TO_INTERACTIVE_WAIT_POLL_PERIOD = 500;

	/**
	 * Compression Modes
	 */

	/**
	 * Most numbers are expected to be 0-63, though larger numbers are
	 * allowed.
	 */
	var COMPRESS_MODE_SMALL_NUMBERS = 0;

	/**
	 * Most numbers are expected to be larger than 63.
	 */
	var COMPRESS_MODE_LARGE_NUMBERS = 1;

	/**
	 * Numbers are from 0 to 100
	 */
	var COMPRESS_MODE_PERCENT = 2;

	/**
	 * Log types
	 */
	var LOG_TYPE_SCROLL = 0;
	var LOG_TYPE_CLICK = 1;
	var LOG_TYPE_MOUSE = 2;
	var LOG_TYPE_KEY = 3;
	var LOG_TYPE_VIS = 4;
	var LOG_TYPE_ORIENTATION = 5;

	/**
	 * Base64 number encoding
	 */
	var BASE64_NUMBER = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ-_";

	/**
	 * Large number delimiter (.)
	 *
	 * For COMPRESS_MODE_SMALL_NUMBERS, numbers larger than 63 are wrapped in this
	 * character.
	 */
	var LARGE_NUMBER_WRAP = ".";

	// Performance object
	var p = BOOMR.getPerformance();

	// Metrics that will be exported
	var externalMetrics = {};

	/**
	 * Epoch - when to base all relative times from.
	 *
	 * If the browser supports NavigationTiming, this is navigationStart.
	 *
	 * If not, just use 'now'.
	 */
	var epoch = p && p.timing && p.timing.navigationStart ?
		p.timing.navigationStart : BOOMR.now();

	/**
	 * Debug logging
	 *
	 * @param {string} msg Message
	 */
	function debug(msg) {
		BOOMR.debug(msg, "Continuity");
	}

	/**
	 * Compress JSON to a string for a URL parameter in the best way possible.
	 *
	 * If UserTimingCompression is available (which has JSURL), use that.  The
	 * data will start with the character `~`
	 *
	 * Otherwise, use JSON.stringify.  The data will start with the character `{`.
	 *
	 * @param {object} obj Data
	 *
	 * @returns {string} Compressed data
	 */
	function compressJson(data) {
		var utc = window.UserTimingCompression || BOOMR.window.UserTimingCompression;

		if (utc) {
			return utc.jsUrl(data);
		}
		else if (window.JSON) {
			return JSON.stringify(data);
		}
		else {
			// JSON isn't available
			return "";
		}
	}

	/**
	 * Gets a compressed bucket log.
	 *
	 * Each bucket is represented by a single character (the value of the
	 * bucket base 64), unless:
	 *
	 * 1. There are 4 or more duplicates in a row. Then the format is:
	 *   *[count of dupes]*[number base 64]
	 * 2. The value is greater than 63, then the format is:
	 *   _[number base 36]_
	 *
	 * @param {number} type Compression type
	 * @param {boolean} backfill Backfill
	 * @param {object} dataSet Data
	 * @param {number} sinceBucket Lowest bucket
	 * @param {number} endBucket Highest bucket
	 *
	 * @returns {string} Compressed log
	 */
	function compressBucketLog(type, backfill, dataSet, sinceBucket, endBucket) {
		var out = "", val = 0, i, j, dupes, valStr, nextVal, wroteSomething;

		if (!dataSet || !BOOMR.utils.Compression) {
			return "";
		}

		// if we know there's no data, return an empty string
		if (dataSet.length === 0) {
			return "";
		}

		if (backfill) {
			if (typeof dataSet[sinceBucket] === "undefined") {
				dataSet[sinceBucket] = 0;
			}

			// pre-fill buckets
			for (i = sinceBucket + 1; i <= endBucket; i++) {
				if (typeof dataSet[i] === "undefined") {
					dataSet[i] = dataSet[i - 1];
				}
			}
		}

		for (i = sinceBucket; i <= endBucket; i++) {
			val = (typeof dataSet[i] === "number" && !isNaN(dataSet[i])) ?
			    dataSet[i] : 0;

			//
			// Compression modes
			//
			if (type === COMPRESS_MODE_SMALL_NUMBERS) {
				// Small numbers can be max 63 for our single-digit encoding
				if (val <= 63) {
					valStr = BASE64_NUMBER.charAt(val);
				}
				else {
					// large numbers get wrapped in .s
					valStr = LARGE_NUMBER_WRAP + val.toString(36) + LARGE_NUMBER_WRAP;
				}
			}
			else if (type === COMPRESS_MODE_LARGE_NUMBERS) {
				// large numbers just get Base36 encoding by default
				valStr = val.toString(36);
			}
			else if (type === COMPRESS_MODE_PERCENT) {
				//
				// Percentage characters take two digits always, with
				// 100 = __
				//
				if (val < 99) {
					// 0-pad
					valStr = val <= 9 ? ("0" + Math.max(val, 0)) : val;
				}
				else {
					// 100 or higher
					valStr = "__";
				}
			}

			// compress sequences of the same number 4 or more times
			if ((i + 3) <= endBucket &&
			    (dataSet[i + 1] === val || (val === 0 && dataSet[i + 1] === undefined)) &&
			    (dataSet[i + 2] === val || (val === 0 && dataSet[i + 2] === undefined)) &&
			    (dataSet[i + 3] === val || (val === 0 && dataSet[i + 3] === undefined))) {
				dupes = 1;

				// loop until we're past the end bucket or we find a non-dupe
				while (i < endBucket) {
					if (dataSet[i + 1] === val || (val === 0 && dataSet[i + 1] === undefined)) {
						dupes++;
					}
					else {
						break;
					}

					i++;
				}

				nextVal = "*" + dupes.toString(36) + "*" + valStr;
			}
			else {
				nextVal = valStr;
			}

			// add this value if it isn't just 0s at the end
			if (val !== 0 || i !== endBucket) {
				//
				// Small numbers fit into a single character (or are delimited
				// by _s), so can just be appended to each other.
				//
				// Percentage always takes two characters.
				//
				if (type === COMPRESS_MODE_LARGE_NUMBERS) {
					//
					// Large numbers need to be separated by commas
					//
					if (wroteSomething) {
						out += ",";
					}
				}

				wroteSomething = true;
				out += nextVal;
			}
		}

		return wroteSomething ? (type.toString() + out) : "";
	}


	/**
	 * Timeline data
	 *
	 * Responsible for:
	 *
	 * * Keeping track of counts of events that happen over time (in
	 *   COLLECTION_INTERVAL intervals).
	 * * Keeps a log of raw events.
	 * * Calculates Time to Interactive (TTI) and Visually Ready.
	 *
	 * @class BOOMR.plugins.Continuity.Timeline
	 */
	var Timeline = function(startTime) {
		//
		// Constants
		//
		/**
		 * Number of "idle" intervals (of COLLECTION_INTERVAL ms) before
		 * Time to Interactive is called.
		 *
		 * 5 * 100 = 500ms (of no long tasks > 50ms and FPS >= 20)
		 */
		var TIME_TO_INTERACTIVE_IDLE_INTERVALS = 15;

		/**
		 * For Time to Interactive, minimum FPS.
		 *
		 * ~20 FPS or max ~50ms blocked
		 */
		var TIME_TO_INTERACTIVE_MIN_FPS = 20;

		/**
		 * For Time to Interactive, minimum FPS per COLLECTION_INTERVAL.
		 */
		var TIME_TO_INTERACTIVE_MIN_FPS_PER_INTERVAL =
			TIME_TO_INTERACTIVE_MIN_FPS / (1000 / COLLECTION_INTERVAL);

		/**
		 * For Time to Interactive, max Page Busy (if LongTasks aren't supported)
		 *
		 * ~50%
		 */
		var TIME_TO_INTERACTIVE_MAX_PAGE_BUSY = 50;

		//
		// Local Members
		//

		// timeline data
		var data = {};

		// timeline data options
		var dataOptions = {};

		// timeline log
		var dataLog = [];

		// time-to-interactive timestamp
		var tti = 0;

		// visually ready timestamp
		var visuallyReady = 0;

		// hero images timestamp
		var heroImagesReady = 0;

		// check for pre-Boomerang FPS log
		if (BOOMR.fpsLog && BOOMR.fpsLog.length) {
			// start at the first frame instead of now
			startTime = BOOMR.fpsLog[0] + epoch;

			// NOTE: FrameRateMonitor will remove fpsLog
		}

		//
		// Functions
		//
		/**
		 * Registers a monitor
		 *
		 * @param {string} type Type
		 * @param {number} [compressMode] Compression mode
		 * @param {boolean} [backfillLast] Whether or not to backfill missing entries
		 * with the most recent value.
		 */
		function register(type, compressMode, backfillLast) {
			if (!data[type]) {
				data[type] = [];
			}

			dataOptions[type] = {
				compressMode: compressMode ? compressMode : COMPRESS_MODE_SMALL_NUMBERS,
				backfillLast: backfillLast
			};
		}

		/**
		 * Gets the current time bucket
		 *
		 * @returns {number} Current time bucket
		 */
		function getTimeBucket() {
			return Math.floor((BOOMR.now() - startTime) / COLLECTION_INTERVAL);
		}

		/**
		 * Sets data for the specified type.
		 *
		 * The type should be registered first via {@link register}.
		 *
		 * @param {string} type Type
		 * @param {number} [value] Value
		 * @param {number} [bucket] Time bucket
		 */
		function set(type, value, bucket) {
			if (typeof bucket === "undefined") {
				bucket = getTimeBucket();
			}

			if (!data[type]) {
				return;
			}

			data[type][bucket] = value;
		}

		/**
		 * Increments data for the specified type
		 *
		 * The type should be registered first via {@link register}.
		 *
		 * @param {string} type Type
		 * @param {number} [value] Value
		 * @param {number} [bucket] Time bucket
		 */
		function increment(type, value, bucket) {
			if (typeof bucket === "undefined") {
				bucket = getTimeBucket();
			}

			if (typeof value === "undefined") {
				value = 1;
			}

			if (!data[type]) {
				return;
			}

			if (!data[type][bucket]) {
				data[type][bucket] = 0;
			}

			data[type][bucket] += value;
		}

		/**
		 * Log an event
		 *
		 * @param {string} type Type
		 * @param {number} [bucket] Time bucket
		 * @param {array} [val] Event data
		 */
		function log(type, bucket, val) {
			if (typeof bucket === "undefined") {
				bucket = getTimeBucket();
			}

			dataLog.push({
				type: type,
				time: bucket,
				val: val
			});

			// trim to logMaxEntries
			if (dataLog.length > impl.logMaxEntries) {
				Array.prototype.splice.call(
					dataLog,
					0,
					(dataLog.length - impl.logMaxEntries)
				);
			}
		}

		/**
		 * Gets stats for a type since the specified start time.
		 *
		 * @param {string} type Type
		 * @param {number} since Start time
		 *
		 * @returns {object} Stats for the type
		 */
		function getStats(type, since) {
			var count = 0,
			    total = 0,
			    min = Infinity,
			    max = 0,
			    val,
			    sinceBucket = Math.floor((since - startTime) / COLLECTION_INTERVAL);

			if (!data[type]) {
				return 0;
			}

			for (var bucket in data[type]) {
				bucket = parseInt(bucket, 10);

				if (bucket >= sinceBucket) {
					if (data[type].hasOwnProperty(bucket)) {
						val = data[type][bucket];

						// calculate count, total and minimum
						count++;
						total += val;

						min = Math.min(min, val);
						max = Math.max(max, val);
					}
				}
			}

			// return the stats
			return {
				total: total,
				count: count,
				min: min,
				max: max
			};
		}

		/**
		 * Given a CSS selector, determine the load time of any IMGs matching
		 * that selector and/or IMGs underneath it.
		 *
		 * @param {string} selector CSS selector
		 *
		 * @returns {number} Last image load time
		 */
		function determineImageLoadTime(selector) {
			var combinedSelector, elements, latestTs = 0, i, j, src, entries;

			// check to see if we have querySelectorAll available
			if (!BOOMR.window ||
			    !BOOMR.window.document ||
			    typeof BOOMR.window.document.querySelectorAll !== "function") {
				// can't use querySelectorAll
				return 0;
			}

			// check to see if we have ResourceTiming available
			if (!p ||
			    typeof p.getEntriesByType !== "function") {
				// can't use ResourceTiming
				return 0;
			}

			// find any images matching this selector or underneath this selector
			combinedSelector = selector + ", " + selector + " * img";

			// use QSA to find all matching
			elements = BOOMR.window.document.querySelectorAll(combinedSelector);
			if (elements && elements.length) {
				for (i = 0; i < elements.length; i++) {
					src = elements[i].src;
					if (src) {
						entries = p.getEntriesByName(src);
						if (entries && entries.length) {
							for (j = 0; j < entries.length; j++) {
								latestTs = Math.max(latestTs, entries[j].responseEnd);
							}
						}
					}
				}
			}

			return latestTs ? Math.floor(latestTs + epoch) : 0;
		}

		/**
		 * Determine Visually Ready time.  This is the last of:
		 * 1. First Contentful Paint (if available)
		 * 2. First Paint (if available)
		 * 3. domContentLoadedEventEnd
		 * 4. Hero Images are loaded (if configured)
		 * 5. Framework Ready (if configured)
		 *
		 * @returns {number|undefined} Timestamp, if everything is ready, or
		 *    `undefined` if not
		 */
		function determineVisuallyReady() {
			var latestTs = 0;

			// start with Framework Ready (if configured)
			if (impl.ttiWaitForFrameworkReady) {
				if (!impl.frameworkReady) {
					return;
				}

				latestTs = impl.frameworkReady;
			}

			// use First Contentful Paint (if available) or
			if (BOOMR.plugins.PaintTiming &&
			    BOOMR.plugins.PaintTiming.is_supported() &&
			    p &&
			    p.timeOrigin) {
				var fp = BOOMR.plugins.PaintTiming.getTimingFor("first-contentful-paint");
				if (!fp) {
					// or get First Paint directly from PaintTiming
					fp = BOOMR.plugins.PaintTiming.getTimingFor("first-paint");
				}

				if (fp) {
					latestTs = Math.max(latestTs, Math.round(fp + p.timeOrigin));
				}
			}
			else if (p && p.timing && p.timing.msFirstPaint) {
				// use IE's First Paint (if available) or
				latestTs = Math.max(latestTs, p.timing.msFirstPaint);
			}
			else if (BOOMR.window &&
			    BOOMR.window.chrome &&
			    typeof BOOMR.window.chrome.loadTimes === "function") {
				// use Chrome's firstPaintTime (if available)
				var loadTimes = BOOMR.window.chrome.loadTimes();
				if (loadTimes && loadTimes.firstPaintTime) {
					latestTs = Math.max(latestTs, loadTimes.firstPaintTime * 1000);
				}
			}

			// Use domContentLoadedEventEnd (if available)
			if (p && p.timing && p.timing.domContentLoadedEventEnd) {
				latestTs = Math.max(latestTs, p.timing.domContentLoadedEventEnd);
			}

			// look up any Hero Images (if configured)
			if (impl.ttiWaitForHeroImages) {
				heroImagesReady = determineImageLoadTime(impl.ttiWaitForHeroImages);

				if (heroImagesReady) {
					latestTs = Math.max(latestTs, heroImagesReady);
				}
			}

			return latestTs;
		}

		/**
		 * Adds the compressed data log to the beacon
		 */
		function addCompressedLogToBeacon() {
			var val = "";

			for (var i = 0; i < dataLog.length; i++) {
				var evt = dataLog[i];

				if (i !== 0) {
					// add a separator between events
					val += "|";
				}

				// add the type
				val += evt.type;

				// add the time: offset from epoch, base36
				val += Math.round(evt.time - epoch).toString(36);

				// add each parameter
				for (var param in evt.val) {
					if (evt.val.hasOwnProperty(param)) {
						val += "," + param;

						if (typeof evt.val[param] === "number") {
							// base36
							val += evt.val[param].toString(36);
						}
						else {
							val += evt.val[param];
						}
					}
				}
			}

			if (val !== "") {
				impl.addToBeacon("c.l", val);
			}
		}

		/**
		 * Gets the bucket log for our data
		 *
		 * @param {string} type Type
		 * @param {number} sinceBucket Lowest bucket
		 *
		 * @returns {string} Compressed log of our data
		 */
		function getCompressedBucketLogFor(type, since) {
			return compressBucketLog(
				dataOptions[type].compressMode,
				dataOptions[type].backfillLast,
				data[type],
				since !== 0 ? Math.floor((since - startTime) / COLLECTION_INTERVAL) : 0,
				getTimeBucket());
		}

		/**
		 * Adds the timeline to the beacon compressed.
		 *
		 * @param {number} [since] Since timestamp
		 */
		function addCompressedTimelineToBeacon(since) {
			var type, compressedLog;

			for (type in data) {
				if (data.hasOwnProperty((type))) {
					// get the compressed data
					compressedLog = getCompressedBucketLogFor(type, since);

					// add to the beacon
					if (compressedLog !== "") {
						impl.addToBeacon("c.t." + type, compressedLog);
					}
				}
			}
		}

		/**
		 * Analyzes metrics such as Time To Interactive
		 *
		 * @param {number} timeOfLastBeacon Time we last sent a beacon
		 */
		function analyze(timeOfLastBeacon) {
			var endBucket = getTimeBucket(),
			    j = 0,
			    idleIntervals = 0;

			// add log
			if (impl.sendLog && typeof timeOfLastBeacon !== "undefined") {
				addCompressedLogToBeacon();
			}

			// add timeline
			if (impl.sendTimeline && typeof timeOfLastBeacon !== "undefined") {
				addCompressedTimelineToBeacon(timeOfLastBeacon);
			}

			if (tti) {
				return;
			}

			// need to get Visually Ready first
			if (!visuallyReady) {
				visuallyReady = determineVisuallyReady();
				if (!visuallyReady) {
					return;
				}
			}

			// add Visually Ready to the beacon
			impl.addToBeacon("c.tti.vr", externalMetrics.timeToVisuallyReady());

			// add Framework Ready to the beacon
			impl.addToBeacon("c.tti.fr", externalMetrics.timeToFrameworkReady());

			// add Framework Ready to the beacon
			impl.addToBeacon("c.tti.hi", externalMetrics.timeToHeroImagesReady());

			// Calculate TTI
			if (!data.longtask && !data.fps && !data.busy) {
				// can't calculate TTI
				return;
			}

			// determine the first bucket we'd use
			var startBucket = Math.floor((visuallyReady - startTime) / COLLECTION_INTERVAL);

			for (j = startBucket; j <= endBucket; j++) {
				if (data.longtask && data.longtask[j]) {
					// had a long task during this interval
					idleIntervals = 0;
					continue;
				}

				if (data.fps && (!data.fps[j] || data.fps[j] < TIME_TO_INTERACTIVE_MIN_FPS_PER_INTERVAL)) {
					// No FPS or less than 20 FPS during this interval
					idleIntervals = 0;
					continue;
				}

				if (data.busy && (data.busy[j] > TIME_TO_INTERACTIVE_MAX_PAGE_BUSY)) {
					// Too busy
					idleIntervals = 0;
					continue;
				}

				if (data.interdly && data.interdly[j]) {
					// a delayed interaction happened
					idleIntervals = 0;
					continue;
				}

				// this was an idle interval
				idleIntervals++;

				// if we've found enough idle intervals, mark TTI as the beginning
				// of this idle period
				if (idleIntervals >= TIME_TO_INTERACTIVE_IDLE_INTERVALS) {
					tti = startTime + ((j - TIME_TO_INTERACTIVE_IDLE_INTERVALS) * COLLECTION_INTERVAL);

					// ensure we don't set TTI before TTVR
					tti = Math.max(tti, visuallyReady);
					break;
				}
			}

			// we were able to calculate a TTI
			if (tti > 0) {
				impl.addToBeacon("c.tti", externalMetrics.timeToInteractive());
			}
		}

		//
		// External metrics
		//

		/**
		 * Time to Interactive
		 */
		externalMetrics.timeToInteractive = function() {
			if (tti) {
				// milliseconds since nav start
				return tti - epoch;
			}

			// no data
			return;
		};

		/**
		 * Time to Visually Ready
		 */
		externalMetrics.timeToVisuallyReady = function() {
			if (visuallyReady) {
				// milliseconds since nav start
				return visuallyReady - epoch;
			}

			// no data
			return;
		};

		/**
		 * Time to Hero Images Ready
		 */
		externalMetrics.timeToHeroImagesReady = function() {
			if (impl.ttiWaitForHeroImages && heroImagesReady) {
				return heroImagesReady - epoch;
			}

			// not configured or not set
			return;
		};

		/**
		 * Time to Framework Ready
		 */
		externalMetrics.timeToFrameworkReady = function() {
			if (impl.ttiWaitForFrameworkReady && impl.frameworkReady) {
				return impl.frameworkReady - epoch;
			}

			// not configured or not set
			return;
		};

		externalMetrics.log = function() {
			return dataLog;
		};

		/**
		 * Disables the monitor
		 */
		function stop() {
			data = {};
			dataLog = [];
		}

		/**
		 * Resets on beacon
		 */
		function onBeacon() {
			// clear the buckets
			for (var type in data) {
				if (data.hasOwnProperty(type)) {
					data[type] = [];
				}
			}

			// reset the data log
			dataLog = [];
		}

		return {
			register: register,
			set: set,
			log: log,
			increment: increment,
			getTimeBucket: getTimeBucket,
			getStats: getStats,
			analyze: analyze,
			stop: stop,
			onBeacon: onBeacon
		};
	};

	/**
	 * Monitors LongTasks
	 *
	 * @class BOOMR.plugins.Continuity.LongTaskMonitor
	 */
	var LongTaskMonitor = function(w, t) {
		if (!w.PerformanceObserver || !w.PerformanceLongTaskTiming) {
			return;
		}

		//
		// Constants
		//
		/**
		 * LongTask attribution types
		 */
		var ATTRIBUTION_TYPES = {
			"unknown": 0,
			"self": 1,
			"same-origin-ancestor": 2,
			"same-origin-descendant": 3,
			"same-origin": 4,
			"cross-origin-ancestor": 5,
			"cross-origin-descendant": 6,
			"cross-origin-unreachable": 7,
			"multiple-contexts": 8
		};

		/**
		 * LongTask culprit attribution names
		 */
		var CULPRIT_ATTRIBUTION_NAMES = {
			"unknown": 0,
			"script": 1,
			"layout": 2
		};

		/**
		 * LongTask culprit types
		 */
		var CULPRIT_TYPES = {
			"unknown": 0,
			"iframe": 1,
			"embed": 2,
			"object": 3
		};

		//
		// Local Members
		//

		// PerformanceObserver
		var perfObserver = new w.PerformanceObserver(onPerformanceObserver);

		try {
			perfObserver.observe({ entryTypes: ["longtask"] });
		}
		catch (e) {
			// longtask not supported
			return;
		}

		// register this type
		t.register("longtask", COMPRESS_MODE_SMALL_NUMBERS);

		// Long Tasks array
		var longTasks = [];

		// whether or not we're enabled
		var enabled = true;

		// total time of long tasks
		var longTasksTime = 0;

		/**
		 * Callback for the PerformanceObserver
		 */
		function onPerformanceObserver(list) {
			var entries, i;

			if (!enabled) {
				return;
			}

			// just capture all of the data for now, we'll analyze at the beacon
			entries = list.getEntries();
			Array.prototype.push.apply(longTasks, entries);

			// add total time and count of long tasks
			for (i = 0; i < entries.length; i++) {
				longTasksTime += entries[i].duration;
			}

			// add to the timeline
			t.increment("longtask", entries.length);
		}

		/**
		 * Gets the current list of tasks
		 *
		 * @returns {PerformanceEntry[]} Tasks
		 */
		function getTasks() {
			return longTasks;
		}

		/**
		 * Clears the Long Tasks
		 */
		function clearTasks() {
			longTasks = [];

			longTasksTime = 0;
		}

		/**
		 * Analyzes LongTasks
		 */
		function analyze(startTime) {
			var i, j, task, obj, objs = [], attrs = [], attr;

			if (longTasks.length === 0) {
				return;
			}

			for (i = 0; i < longTasks.length; i++) {
				task = longTasks[i];

				// compress the object a bit
				obj = {
					s: Math.round(task.startTime).toString(36),
					d: Math.round(task.duration).toString(36),
					n: ATTRIBUTION_TYPES[task.name] ? ATTRIBUTION_TYPES[task.name] : 0
				};

				attrs = [];

				for (j = 0; j < task.attribution.length; j++) {
					attr = task.attribution[j];

					// skip script/iframe with no attribution
					if (attr.name === "script" &&
					    attr.containerType === "iframe" &&
					    !attr.containerName &&
						!attr.containerId && !attr.containerSrc) {
						continue;
					}

					// only use containerName if not the same as containerId
					var containerName = attr.containerName ? attr.containerName : undefined;
					var containerId = attr.containerId ? attr.containerId : undefined;
					if (containerName === containerId) {
						containerName = undefined;
					}

					// only use containerSrc if containerId is undefined
					var containerSrc = containerId === undefined ? attr.containerSrc : undefined;

					attrs.push({
						a: CULPRIT_ATTRIBUTION_NAMES[attr.name] ? CULPRIT_ATTRIBUTION_NAMES[attr.name] : 0,
						t: CULPRIT_TYPES[attr.containerType] ? CULPRIT_TYPES[attr.containerType] : 0,
						n: containerName,
						i: containerId,
						s: containerSrc
					});
				}

				if (attrs.length > 0) {
					obj.a = attrs;
				}

				objs.push(obj);
			}

			// add data to beacon
			impl.addToBeacon("c.lt.n", externalMetrics.longTasksCount(), true);
			impl.addToBeacon("c.lt.tt", externalMetrics.longTasksTime());

			impl.addToBeacon("c.lt", compressJson(objs));
		}

		/**
		 * Disables the monitor
		 */
		function stop() {
			enabled = false;

			perfObserver.disconnect();

			clearTasks();
		}

		/**
		 * Resets on beacon
		 */
		function onBeacon() {
			clearTasks();
		}

		//
		// External metrics
		//

		/**
		 * Total time of LongTasks (ms)
		 */
		externalMetrics.longTasksTime = function() {
			return longTasksTime;
		};

		/**
		 * Number of LongTasks
		 */
		externalMetrics.longTasksCount = function() {
			return longTasks.length;
		};

		return {
			getTasks: getTasks,
			clearTasks: clearTasks,
			analyze: analyze,
			stop: stop,
			onBeacon: onBeacon
		};
	};

	/**
	 * Monitors Page Busy if LongTasks isn't supported
	 *
	 * @class BOOMR.plugins.Continuity.PageBusyMonitor
	 */
	var PageBusyMonitor = function(w, t) {
		// register this type
		t.register("busy", COMPRESS_MODE_PERCENT);

		//
		// Constants
		//

		/**
		 * How frequently to poll (ms).
		 *
		 * IE and Edge clamp polling to the nearest 16ms.  With 32ms, we
		 * will see approximately 3 polls per 100ms.
		 */
		var POLLING_INTERVAL = 32;

		/**
		 * How much deviation from the expected time to allow (ms)
		 */
		var ALLOWED_DEVIATION_MS = 4;

		/**
		 * How often to report on Page Busy (ms)
		 */
		var REPORT_INTERVAL = 100;

		/**
		 * How many polls there were per-report
		 */
		var POLLS_PER_REPORT =
		    Math.floor(REPORT_INTERVAL / POLLING_INTERVAL);

		/**
		 * How many missed polls should we go backwards? (10 seconds worth)
		 */
		var MAX_MISSED_REPORTS = 100;

		//
		// Local Members
		//

		// last time we ran
		var last = BOOMR.now();

		// total callbacks
		var total = 0;

		// late callbacks
		var late = 0;

		// overall total and late callbacks (reset on beacon)
		var overallTotal = 0;
		var overallLate = 0;

		// whether or not we're enabled
		var enabled = true;

		// intervals
		var pollInterval = false;
		var reportInterval = false;

		/**
		 * Polling interval
		 */
		function onPoll() {
			var now = BOOMR.now();
			var delta = now - last;
			last = now;

			// if we're more than 2x the polling interval
			// + deviation, we missed at least one period completely
			if (delta > ((POLLING_INTERVAL * 2) + ALLOWED_DEVIATION_MS)) {
				var missedPolls = Math.floor((delta - POLLING_INTERVAL) / POLLING_INTERVAL);

				total += missedPolls;
				late += missedPolls;
				delta -= (missedPolls * POLLING_INTERVAL);
			}

			// total intervals increased by one
			total++;

			// late intervals increased by one if we're more than the interval + deviation
			if (delta > (POLLING_INTERVAL + ALLOWED_DEVIATION_MS)) {
				late++;
			}
		}

		/**
		 * Each reporting interval, log page busy
		 */
		function onReport() {
			var reportTime = t.getTimeBucket();
			var curTime = reportTime;
			var missedReports = 0;

			if (total === 0) {
				return;
			}

			// if we had more polls than we expect in each
			// collection period (we allow one extra for wiggle room), we
			// must not have been able to report, so assume those periods were 100%
			while (total > (POLLS_PER_REPORT + 1) &&
			       missedReports <= MAX_MISSED_REPORTS) {
				t.set("busy", 100, --curTime);

				// reset the period by one
				total -= POLLS_PER_REPORT;
				late   = Math.max(late - POLLS_PER_REPORT, 0);

				// this was a busy period
				overallTotal += POLLS_PER_REPORT;
				overallLate += POLLS_PER_REPORT;

				missedReports++;
			}

			// update the total stats
			overallTotal += total;
			overallLate += late;

			t.set("busy", Math.round(late / total * 100), reportTime);

			// reset stats
			total = 0;
			late = 0;
		}

		/**
		 * Analyzes Page Busy
		 */
		function analyze(startTime) {
			// add data to beacon
			impl.addToBeacon("c.b", externalMetrics.pageBusy());
		}

		/**
		 * Disables the monitor
		 */
		function stop() {
			enabled = false;

			if (pollInterval) {
				clearInterval(pollInterval);
				pollInterval = false;
			}

			if (reportInterval) {
				clearInterval(reportInterval);
				reportInterval = false;
			}
		}

		/**
		 * Resets on beacon
		 */
		function onBeacon() {
			overallTotal = 0;
			overallLate = 0;
		}

		//
		// External metrics
		//

		/**
		 * Total Page Busy time
		 */
		externalMetrics.pageBusy = function() {
			if (overallTotal === 0) {
				return 0;
			}

			return Math.round(overallLate / overallTotal * 100);
		};

		//
		// Setup
		//
		pollInterval = setInterval(onPoll, POLLING_INTERVAL);
		reportInterval = setInterval(onReport, REPORT_INTERVAL);

		return {
			analyze: analyze,
			stop: stop,
			onBeacon: onBeacon
		};
	};

	/**
	 * Monitors framerate (FPS)
	 *
	 * @class BOOMR.plugins.Continuity.FrameRateMonitor
	 */
	var FrameRateMonitor = function(w, t) {
		// register this type
		t.register("fps", COMPRESS_MODE_SMALL_NUMBERS);

		//
		// Constants
		//

		// long frame maximum milliseconds
		var LONG_FRAME_MAX = 50;

		//
		// Local Members
		//

		// total frames seen
		var totalFrames = 0;

		// long frames
		var longFrames = 0;

		// time we started monitoring
		var frameStartTime;

		// last frame we saw
		var lastFrame;

		// whether or not we're enabled
		var enabled = true;

		// check for pre-Boomerang FPS log
		if (BOOMR.fpsLog && BOOMR.fpsLog.length) {
			lastFrame = frameStartTime = BOOMR.fpsLog[0] + epoch;

			// transition any FPS log events to our timeline
			for (var i = 0; i < BOOMR.fpsLog.length; i++) {
				var ts = epoch + BOOMR.fpsLog[i];

				// update the frame count for this time interval
				t.increment("fps", 1, Math.floor((ts - frameStartTime) / COLLECTION_INTERVAL));

				// calculate how long this frame took
				if (ts - lastFrame >= LONG_FRAME_MAX) {
					longFrames++;
				}

				// last frame timestamp
				lastFrame = ts;
			}

			totalFrames = BOOMR.fpsLog.length;

			delete BOOMR.fpsLog;
		}
		else {
			frameStartTime = BOOMR.now();
		}

		/**
		 * requestAnimationFrame callback
		 */
		function frame(now) {
			if (!enabled) {
				return;
			}

			// calculate how long this frame took
			if (now - lastFrame >= LONG_FRAME_MAX) {
				longFrames++;
			}

			// last frame timestamp
			lastFrame = now;

			// keep track of total frames we've seen
			totalFrames++;

			// increment the FPS
			t.increment("fps");

			// request the next frame
			w.requestAnimationFrame(frame);
		}

		/**
		 * Analyzes FPS
		 */
		function analyze(startTime) {
			impl.addToBeacon("c.f", externalMetrics.fps());
			impl.addToBeacon("c.f.d", externalMetrics.fpsDuration());
			impl.addToBeacon("c.f.m", externalMetrics.fpsMinimum());
			impl.addToBeacon("c.f.l", externalMetrics.fpsLongFrames());
			impl.addToBeacon("c.f.s", externalMetrics.fpsStart());
		}

		/**
		 * Disables the monitor
		 */
		function stop() {
			enabled = false;
			frameStartTime = 0;
		}

		/**
		 * Resets on beacon
		 */
		function onBeacon() {
			if (enabled) {
				// restart to now
				frameStartTime = BOOMR.now();
			}

			totalFrames = 0;
			longFrames = 0;
		}

		// start the first frame
		w.requestAnimationFrame(frame);

		//
		// External metrics
		//

		/**
		 * Frame Rate since fpsStart
		 */
		externalMetrics.fps = function() {
			var dur = externalMetrics.fpsDuration();
			if (dur) {
				return Math.floor(totalFrames / (dur / 1000));
			}
		};

		/**
		 * How long FPS was being tracked for
		 */
		externalMetrics.fpsDuration = function() {
			if (frameStartTime) {
				return BOOMR.now() - frameStartTime;
			}
		};

		/**
		 * Minimum FPS during the period
		 */
		externalMetrics.fpsMinimum = function() {
			var dur = externalMetrics.fpsDuration();
			if (dur) {
				var min = t.getStats("fps", frameStartTime).min;
				return min !== Infinity ? min : undefined;
			}
		};

		/**
		 * Number of long frames (over 18ms)
		 */
		externalMetrics.fpsLongFrames = function() {
			return longFrames;
		};

		/**
		 * When FPS tracking started (base 36)
		 */
		externalMetrics.fpsStart = function() {
			return frameStartTime ? frameStartTime.toString(36) : 0;
		};

		return {
			analyze: analyze,
			stop: stop,
			onBeacon: onBeacon
		};
	};

	/**
	 * Monitors scrolling
	 *
	 * @class BOOMR.plugins.Continuity.ScrollMonitor
	 */
	var ScrollMonitor = function(w, t, i) {
		if (!w || !w.document || !w.document.body || !w.document.documentElement) {
			// something's wrong with the DOM, abort
			return;
		}

		//
		// Constants
		//

		// number of milliseconds between each distinct scroll
		var DISTINCT_SCROLL_SECONDS = 2000;

		// number of pixels to change before logging a scroll event
		var MIN_SCROLL_Y_CHANGE_FOR_LOG = 20;

		//
		// Local Members
		//

		// last scroll Y
		var lastY = 0;

		// last scroll Y logged
		var lastYLogged = 0;

		// scroll % this period
		var intervalScrollPct = 0;

		// scroll % total
		var totalScrollPct = 0;

		// number of scroll events
		var scrollCount = 0;

		// total scroll pixels
		var scrollPixels = 0;

		// number of distinct scrolls (scroll which happened
		// over DISTINCT_SCROLL_SECONDS seconds apart)
		var distinctScrollCount = 0;

		// last time we scrolled
		var lastScroll = 0;

		// collection interval id
		var collectionInterval = false;

		// body and html element
		var body = w.document.body;
		var html = w.document.documentElement;

		// register this type
		t.register("scroll", COMPRESS_MODE_SMALL_NUMBERS);
		t.register("scrollpct", COMPRESS_MODE_PERCENT);

		// height of the document
		var documentHeight = Math.max(
			body.scrollHeight,
			body.offsetHeight,
			html.clientHeight,
			html.scrollHeight,
			html.offsetHeight) - BOOMR.utils.windowHeight();

		/**
		 * Fired when a scroll event happens
		 *
		 * @param {Event} e Scroll event
		 */
		function onScroll(e) {
			var now = BOOMR.now();

			scrollCount++;

			// see if this is a unique scroll
			if (now - lastScroll > DISTINCT_SCROLL_SECONDS) {
				distinctScrollCount++;
			}

			lastScroll = now;

			// determine how many pixels were scrolled
			var curY = BOOMR.utils.scroll().y;
			var diffY = Math.abs(lastY - curY);

			scrollPixels += diffY;

			// update the timeline
			t.increment("scroll", diffY);

			// only log the event if we're over the threshold
			if (lastYLogged === 0 || Math.abs(lastYLogged - curY) > MIN_SCROLL_Y_CHANGE_FOR_LOG) {
				// add to the log
				t.log(LOG_TYPE_SCROLL, now, {
					y: curY
				});

				lastYLogged = curY;
			}

			// update the interaction monitor
			i.interact("scroll", now, e);

			// calculate percentage of document scrolled
			intervalScrollPct += Math.round(diffY / documentHeight * 100);
			totalScrollPct += Math.round(diffY / documentHeight * 100);

			lastY = curY;
		}

		/**
		 * Reports on the number of scrolls seen
		 */
		function reportScroll() {
			var pct = Math.min(intervalScrollPct, 100);

			if (pct !== 0) {
				t.set("scrollpct", pct);
			}

			// reset count
			intervalScrollPct = 0;
		}

		/**
		 * Analyzes Scrolling events
		 */
		function analyze(startTime) {
			impl.addToBeacon("c.s", externalMetrics.scrollCount());
			impl.addToBeacon("c.s.p", externalMetrics.scrollPct());
			impl.addToBeacon("c.s.y", externalMetrics.scrollPixels());
			impl.addToBeacon("c.s.d", externalMetrics.scrollDistinct());
		}

		/**
		 * Disables the monitor
		 */
		function stop() {
			if (collectionInterval) {
				clearInterval(collectionInterval);

				collectionInterval = false;
			}

			BOOMR.utils.removeListener(w, "scroll", onScroll);
		}

		/**
		 * Resets on beacon
		 */
		function onBeacon() {
			totalScrollPct = 0;
			scrollCount = 0;
			scrollPixels = 0;
			distinctScrollCount = 0;
		}

		//
		// External metrics
		//

		/**
		 * Percentage of the screen that was scrolled.
		 *
		 * All the way to the bottom = 100%
		 */
		externalMetrics.scrollPct = function() {
			return totalScrollPct;
		};

		/**
		 * Number of scrolls
		 */
		externalMetrics.scrollCount = function() {
			return scrollCount;
		};

		/**
		 * Number of scrolls (more than two seconds apart)
		 */
		externalMetrics.scrollDistinct = function() {
			return distinctScrollCount;
		};

		/**
		 * Number of pixels scrolled
		 */
		externalMetrics.scrollPixels = function() {
			return scrollPixels;
		};

		// startup
		BOOMR.utils.addListener(w, "scroll", onScroll, true);

		collectionInterval = setInterval(reportScroll, COLLECTION_INTERVAL);

		return {
			analyze: analyze,
			stop: stop,
			onBeacon: onBeacon
		};
	};

	/**
	 * Monitors mouse clicks
	 *
	 * @class BOOMR.plugins.Continuity.ClickMonitor
	 */
	var ClickMonitor = function(w, t, i) {
		// register this type
		t.register("click", COMPRESS_MODE_SMALL_NUMBERS);

		//
		// Constants
		//

		// number of pixels area for Rage Clicks
		var PIXEL_AREA = 10;

		// number of clicks in the same area to trigger a Rage Click
		var RAGE_CLICK_THRESHOLD = 3;

		//
		// Local Members
		//

		// number of click events
		var clickCount = 0;

		// number of clicks in the same PIXEL_AREA area
		var sameClicks = 0;

		// number of Rage Clicks
		var rageClicks = 0;

		// last coordinates
		var x = 0;
		var y = 0;

		// last click target
		var lastTarget = null;

		/**
		 * Fired when a `click` event happens.
		 *
		 * @param {Event} e Event
		 */
		function onClick(e) {
			var now = BOOMR.now();

			var newX = e.clientX;
			var newY = e.clientY;

			// track total number of clicks
			clickCount++;

			// calculate number of pixels moved
			var pixels = Math.round(
				Math.sqrt(Math.pow(y - newY, 2) +
				Math.pow(x - newX, 2)));

			// track Rage Clicks
			if (lastTarget === e.target || pixels <= PIXEL_AREA) {
				sameClicks++;

				if ((sameClicks + 1) >= RAGE_CLICK_THRESHOLD) {
					rageClicks++;

					// notify any listeners
					BOOMR.fireEvent("rage_click", e);
				}
			}
			else {
				sameClicks = 0;
			}

			// track last click coordinates and element
			x = newX;
			y = newY;
			lastTarget = e.target;

			// update the timeline
			t.increment("click");

			// add to the log
			t.log(LOG_TYPE_CLICK, now, {
				x: newX,
				y: newY
			});

			// update the interaction monitor
			i.interact("click", now, e);
		}

		/**
		 * Analyzes Click events
		 */
		function analyze(startTime) {
			impl.addToBeacon("c.c", externalMetrics.clicksCount());
			impl.addToBeacon("c.c.r", externalMetrics.clicksRage());
		}

		/**
		 * Disables the monitor
		 */
		function stop() {
			BOOMR.utils.removeListener(w.document, "click", onClick);
		}

		/**
		 * Resets on beacon
		 */
		function onBeacon() {
			clickCount = 0;
			sameClicks = 0;
			rageClicks = 0;
		}

		//
		// External metrics
		//
		externalMetrics.clicksCount = function() {
			return clickCount;
		};

		externalMetrics.clicksRage = function() {
			return rageClicks;
		};

		//
		// Startup
		//
		BOOMR.utils.addListener(w.document, "click", onClick, true);

		return {
			analyze: analyze,
			stop: stop,
			onBeacon: onBeacon
		};
	};

	/**
	 * Monitors keyboard events
	 *
	 * @class BOOMR.plugins.Continuity.KeyMonitor
	 */
	var KeyMonitor = function(w, t, i) {
		// register this type
		t.register("key", COMPRESS_MODE_SMALL_NUMBERS);

		//
		// Local members
		//

		// key presses
		var keyCount = 0;

		// esc key presses
		var escKeyCount = 0;

		/**
		 * Fired on key down
		 *
		 * @param {Event} e keydown event
		 */
		function onKeyDown(e) {
			var now = BOOMR.now();

			keyCount++;

			if (e.keyCode === 27) {
				escKeyCount++;
			}

			// update the timeline
			t.increment("key");

			// add to the log (don't track the actual keys)
			t.log(LOG_TYPE_KEY, now);

			// update the interaction monitor
			i.interact("key", now, e);
		}

		/**
		 * Analyzes Key events
		 */
		function analyze(startTime) {
			impl.addToBeacon("c.k", externalMetrics.keyCount());
			impl.addToBeacon("c.k.e", externalMetrics.keyEscapes());
		}

		/**
		 * Disables the monitor
		 */
		function stop() {
			BOOMR.utils.removeListener(w.document, "keydown", onKeyDown);
		}

		/**
		 * Resets on beacon
		 */
		function onBeacon() {
			keyCount = 0;
			escKeyCount = 0;
		}

		//
		// External metrics
		//
		externalMetrics.keyCount = function() {
			return keyCount;
		};

		externalMetrics.keyEscapes = function() {
			return escKeyCount;
		};

		// start
		BOOMR.utils.addListener(w.document, "keydown", onKeyDown, true);

		return {
			analyze: analyze,
			stop: stop,
			onBeacon: onBeacon
		};
	};

	/**
	 * Monitors mouse movement
	 *
	 * @class BOOMR.plugins.Continuity.MouseMonitor
	 */
	var MouseMonitor = function(w, t, i) {
		// register the mouse movements and overall percentage moved
		t.register("mouse", COMPRESS_MODE_SMALL_NUMBERS);
		t.register("mousepct", COMPRESS_MODE_PERCENT);

		//
		// Constants
		//

		/**
		 * Minimum number of pixels that change from last before logging
		 */
		var MIN_LOG_PIXEL_CHANGE = 10;

		/**
		 * Mouse log interval
		 */
		var REPORT_LOG_INTERVAL = 250;

		//
		// Local members
		//

		// last movement coordinates
		var lastX = 0;
		var lastY = 0;

		// last reported X/Y
		var lastLogX = 0;
		var lastLogY = 0;

		// mouse move screen percent this interval
		var intervalMousePct = 0;

		// total mouse move percent
		var totalMousePct = 0;

		// total mouse move pixels
		var totalMousePixels = 0;

		// interval ids
		var reportMousePctInterval = false;
		var reportMouseLogInterval = false;

		// screen pixel count
		var screenPixels = Math.round(Math.sqrt(
			Math.pow(BOOMR.utils.windowHeight(), 2) +
			Math.pow(BOOMR.utils.windowWidth(), 2)));

		/**
		 * Fired when a `mousemove` event happens.
		 *
		 * @param {Event} e Event
		 */
		function onMouseMove(e) {
			var now = BOOMR.now();

			var newX = e.clientX;
			var newY = e.clientY;

			// calculate number of pixels moved
			var pixels = Math.round(Math.sqrt(Math.pow(lastY - newY, 2) +
			                        Math.pow(lastX - newX, 2)));

			// calculate percentage of screen moved (upper-left to lower-right = 100%)
			var newPct = Math.round(pixels / screenPixels * 100);
			intervalMousePct += newPct;
			totalMousePct += newPct;
			totalMousePixels += pixels;

			lastX = newX;
			lastY = newY;

			// Note: don't mark a mouse movement as an interaction (i.interact)

			t.increment("mouse", pixels);
		}

		/**
		 * Reports on the mouse percentage change
		 */
		function reportMousePct() {
			var pct = Math.min(intervalMousePct, 100);

			if (pct !== 0) {
				t.set("mousepct", pct);
			}

			// reset count
			intervalMousePct = 0;
		}

		/**
		 * Updates the log if the mouse has moved enough
		 */
		function reportMouseLog() {
			// Only log if X,Y have changed and have changed over the specified
			// minimum theshold.
			if (lastLogX !== lastX ||
			    lastLogY !== lastY) {
				var pixels = Math.round(Math.sqrt(Math.pow(lastLogY - lastY, 2) +
										Math.pow(lastLogX - lastX, 2)));

				if (pixels >= MIN_LOG_PIXEL_CHANGE) {
					// add to the log
					t.log(LOG_TYPE_MOUSE, BOOMR.now(), {
						x: lastX,
						y: lastY
					});

					lastLogX = lastX;
					lastLogY = lastY;
				}
			}
		}

		/**
		 * Analyzes Mouse events
		 */
		function analyze(startTime) {
			impl.addToBeacon("c.m.p", externalMetrics.mousePct());
			impl.addToBeacon("c.m.n", externalMetrics.mousePixels());
		}

		/**
		 * Disables the monitor
		 */
		function stop() {
			if (reportMousePctInterval) {
				clearInterval(reportMousePctInterval);

				reportMousePctInterval = false;
			}

			if (reportMouseLogInterval) {
				clearInterval(reportMouseLogInterval);

				reportMouseLogInterval = false;
			}

			BOOMR.utils.removeListener(w.document, "mousemove", onMouseMove);
		}

		/**
		 * Resets on beacon
		 */
		function onBeacon() {
			totalMousePct = 0;
			totalMousePixels = 0;
		}

		//
		// External metrics
		//

		/**
		 * Percentage the mouse moved
		 */
		externalMetrics.mousePct = function() {
			return totalMousePct;
		};

		/**
		 * Pixels the mouse moved
		 */
		externalMetrics.mousePixels = function() {
			return totalMousePixels;
		};

		reportMousePctInterval = setInterval(reportMousePct, COLLECTION_INTERVAL);
		reportMouseLogInterval = setInterval(reportMouseLog, REPORT_LOG_INTERVAL);

		// start
		BOOMR.utils.addListener(w.document, "mousemove", onMouseMove, true);

		return {
			analyze: analyze,
			stop: stop,
			onBeacon: onBeacon
		};
	};

	/**
	 * Interaction monitor
	 *
	 * @class BOOMR.plugins.Continuity.InteractionMonitor
	 */
	var InteractionMonitor = function(w, t, afterOnloadMinWait) {
		// register this type
		t.register("inter", COMPRESS_MODE_SMALL_NUMBERS);
		t.register("interdly", COMPRESS_MODE_SMALL_NUMBERS);

		//
		// Constants
		//

		/**
		 * Interaction maximum delay (ms)
		 */
		var INTERACTION_MAX_DELAY = 50;

		/**
		 * How long after an interaction to wait before sending a beacon (ms).
		 */
		var INTERACTION_MIN_WAIT_FOR_BEACON = afterOnloadMinWait;

		/**
		 * Maximum amount of time after the first interaction before sending
		 * a beacon (ms).
		 */
		var INTERACTION_MAX_WAIT_FOR_BEACON = 30000;

		//
		// Local Members
		//

		// Time of first interaction
		var timeToFirstInteraction = 0;

		// First Input Delay
		var firstInputDelay = null;

		// Interaction count
		var interactions = 0;

		// Interaction delay total
		var interactionsDelay = 0;

		// Delayed interactions
		var delayedInteractions = 0;

		// Delayed interaction time
		var delayedInteractionTime = 0;

		// whether or not we're enabled
		var enabled = true;

		// interaction beacon start time
		var beaconStartTime = 0;

		// interaction beacon end time
		var beaconEndTime = 0;

		// interaction beacon timers
		var beaconMinTimeout = false;
		var beaconMaxTimeout = false;

		// whether or not a SPA nav is happening
		var isSpaNav = false;

		/**
		 * Logs an interaction
		 *
		 * @param {string} type Interaction type
		 * @param {number} now Time of callback
		 * @param {Event} e Event
		 */
		function interact(type, now, e) {
			now = now || BOOMR.now();

			if (!enabled) {
				return;
			}

			interactions++;

			if (!timeToFirstInteraction) {
				timeToFirstInteraction = now;
			}

			// check for interaction delay
			var delay = 0;
			if (e && e.timeStamp) {
				if (e.timeStamp > 1400000000000) {
					delay = now - e.timeStamp;
				}
				else {
					// if timeStamp is a DOMHighResTimeStamp, convert BOOMR.now() to same
					delay = (now - epoch) - e.timeStamp;
				}

				interactionsDelay += delay;

				// log first input delay
				if (firstInputDelay === null) {
					firstInputDelay = Math.round(delay);
				}

				// log as a delayed interaction
				if (delay > INTERACTION_MAX_DELAY) {
					t.increment("interdly");

					delayedInteractions++;
					delayedInteractionTime += delay;
				}
			}

			// increment the FPS
			t.increment("inter");

			//
			// If we're doing after-page-load monitoring, start a timer to report
			// on this interaction.  We will wait up to INTERACTION_MIN_WAIT_FOR_BEACON
			// ms before sending the beacon, sliding the window if there are
			// more interactions, up to a max of INTERACTION_MAX_WAIT_FOR_BEACON ms.
			//
			if (!isSpaNav && impl.afterOnloadMonitoring) {
				// mark now as the latest interaction
				beaconEndTime = BOOMR.now();

				if (!beaconStartTime) {
					debug("Interaction detected, sending a beacon after " +
						INTERACTION_MIN_WAIT_FOR_BEACON + " ms");

					// first interaction for this beacon
					beaconStartTime = beaconEndTime;

					// set a timer for the max timeout
					beaconMaxTimeout = setTimeout(sendInteractionBeacon,
						INTERACTION_MAX_WAIT_FOR_BEACON);
				}

				// if there was a timer for the min timeout, clear it first
				if (beaconMinTimeout) {
					debug("Clearing previous interaction timeout");

					clearTimeout(beaconMinTimeout);
					beaconMinTimeout = false;
				}

				// set a timer for the min timeout
				beaconMinTimeout = setTimeout(sendInteractionBeacon,
					INTERACTION_MIN_WAIT_FOR_BEACON);
			}
		}

		/**
		 * Fired on spa_init
		 */
		function onSpaInit() {
			// note we're in a SPA nav right now
			isSpaNav = true;

			// clear any interaction beacon timers
			clearBeaconTimers();
		}

		/**
		 * Clears interaction beacon timers.
		 */
		function clearBeaconTimers() {
			if (beaconMinTimeout) {
				clearTimeout(beaconMinTimeout);
				beaconMinTimeout = false;
			}

			if (beaconMaxTimeout) {
				clearTimeout(beaconMaxTimeout);
				beaconMaxTimeout = false;
			}
		}

		/**
		 * Fired when an interaction beacon timed-out
		 */
		function sendInteractionBeacon() {
			debug("Sending interaction beacon");

			clearBeaconTimers();

			// notify anyone listening for an interaction event
			BOOMR.fireEvent("interaction");

			// add data to the beacon
			impl.addToBeacon("rt.tstart", beaconStartTime);
			impl.addToBeacon("rt.end", beaconEndTime);
			impl.addToBeacon("rt.start", "manual");
			impl.addToBeacon("http.initiator", "interaction");

			BOOMR.sendBeacon();
		}

		/**
		 * Analyzes Interactions
		 */
		function analyze(startTime) {
			impl.addToBeacon("c.ttfi", externalMetrics.timeToFirstInteraction());
			impl.addToBeacon("c.i.dc", externalMetrics.interactionDelayed());
			impl.addToBeacon("c.i.dt", externalMetrics.interactionDelayedTime());
			impl.addToBeacon("c.i.a", externalMetrics.interactionAvgDelay());

			if (firstInputDelay !== null) {
				impl.addToBeacon("c.fid", externalMetrics.firstInputDelay(), true);
			}
		}

		/**
		 * Disables the monitor
		 */
		function stop() {
			enabled = false;
		}

		/**
		 * Resets on beacon
		 */
		function onBeacon() {
			delayedInteractionTime = 0;
			delayedInteractions = 0;
			interactions = 0;
			interactionsDelay = 0;

			beaconStartTime = 0;
			beaconEndTime = 0;

			// no longer in a SPA nav
			isSpaNav = false;

			// if we had queued an interaction beacon, but something else is
			// firing instead, use that data
			clearBeaconTimers();
		}

		//
		// External metrics
		//
		externalMetrics.interactionDelayed = function() {
			return delayedInteractions;
		};

		externalMetrics.interactionDelayedTime = function() {
			return Math.round(delayedInteractionTime);
		};

		externalMetrics.interactionAvgDelay = function() {
			if (interactions > 0) {
				return Math.round(interactionsDelay / interactions);
			}
		};

		externalMetrics.timeToFirstInteraction = function() {
			if (timeToFirstInteraction) {
				// milliseconds since nav start
				return timeToFirstInteraction - epoch;
			}

			// no data
			return;
		};

		externalMetrics.firstInputDelay = function() {
			if (firstInputDelay !== null) {
				return firstInputDelay;
			}

			// no data
			return;
		};

		//
		// Setup
		//

		// clear interaction beacon timer if a SPA is starting
		BOOMR.subscribe("spa_init", onSpaInit, null, impl);

		return {
			interact: interact,
			analyze: analyze,
			stop: stop,
			onBeacon: onBeacon
		};
	};

	/**
	 * Monitors for visibility state changes
	 *
	 * @class BOOMR.plugins.Continuity.VisibilityMonitor
	 */
	var VisibilityMonitor = function(w, t, i) {
		// register this type
		t.register("vis", COMPRESS_MODE_SMALL_NUMBERS);

		//
		// Constants
		//

		/**
		 * Maps visibilityState from a string to a number
		 */
		var VIS_MAP = {
			"visible": 0,
			"hidden": 1,
			"prerender": 2,
			"unloaded": 3
		};

		//
		// Locals
		//
		var enabled = true;

		BOOMR.subscribe("visibility_changed", function(e) {
			var now = BOOMR.now();

			if (!enabled) {
				return;
			}

			// update the timeline
			t.increment("vis");

			// add to the log (don't track the actual keys)
			t.log(LOG_TYPE_VIS, now, {
				s: VIS_MAP[BOOMR.visibilityState()]
			});

			// update the interaction monitor
			i.interact("vis", now, e);
		});

		/**
		 * Stops this monitor
		 */
		function stop() {
			enabled = false;
		}

		return {
			stop: stop
		};
	};

	/**
	 * Monitors for orientation changes
	 *
	 * @class BOOMR.plugins.Continuity.OrientationMonitor
	 */
	var OrientationMonitor = function(w, t, i) {
		// register this type
		t.register("orn", COMPRESS_MODE_SMALL_NUMBERS);

		//
		// Locals
		//
		var enabled = true;

		/**
		 * Fired when the orientation changes
		 *
		 * @param {Event} e Event
		 */
		function onOrientationChange(e) {
			var now = BOOMR.now();

			if (!enabled) {
				return;
			}

			// update the timeline
			t.increment("orn");

			// add to the log (don't track the actual keys)
			t.log(LOG_TYPE_ORIENTATION, now, {
				a: screen.orientation.angle
			});

			// update the interaction monitor
			i.interact("orn", now, e);
		}

		/**
		 * Stops this monitor
		 */
		function stop() {
			enabled = false;

			BOOMR.utils.removeListener(w, "orientationchange", onOrientationChange);
		}

		//
		// Setup
		//
		BOOMR.utils.addListener(w, "orientationchange", onOrientationChange, true);

		return {
			stop: stop
		};
	};

	/**
	 * Monitors for misc stats such as memory usage, battery level, etc.
	 *
	 * Note: Not reporting on ResourceTiming entries or Errors since those
	 * will be captured by the respective plugins.
	 *
	 * @class BOOMR.plugins.Continuity.StatsMonitor
	 */
	var StatsMonitor = function(w, t) {
		// register types
		t.register("mem", COMPRESS_MODE_LARGE_NUMBERS, true);
		t.register("bat", COMPRESS_MODE_PERCENT, true);
		t.register("domsz", COMPRESS_MODE_LARGE_NUMBERS, true);
		t.register("domln", COMPRESS_MODE_LARGE_NUMBERS, true);
		t.register("mut", COMPRESS_MODE_SMALL_NUMBERS);

		//
		// Constants
		//

		/**
		 * Report stats every second
		 */
		var REPORT_INTERVAL = 1000;

		//
		// Locals
		//
		var d = w.document;

		/**
		 * Whether or not we're enabled
		 */
		var enabled = true;

		/**
		 * Report interval ID
		 */
		var reportInterval = false;

		/**
		 * navigator.getBattery() object
		 */
		var battery = null;

		/**
		 * Number of mutations since last reset
		 */
		var mutationCount = 0;

		/**
		 * DOM length
		 */
		var domLength = 0;

		/**
		 * Live HTMLCollection of found elements
		 *
		 * Keep this live collection around as it's cheaper to call
		 * .length on it over time than re-running getElementsByTagName()
		 * each time
		 */
		var domAllNodes = d.getElementsByTagName("*");

		/**
		 * MutationObserver
		 */
		var observer;

		/**
		 * Fired on an interval to report stats such as memory usage
		 */
		function reportStats() {
			//
			// Memory
			//
			var mem = p &&
			    p.memory &&
			    p.memory.usedJSHeapSize;

			if (mem) {
				t.set("mem", mem);
			}

			//
			// DOM sizes (bytes) and length (node count)
			//
			domLength = domAllNodes.length;

			t.set("domsz", d.documentElement.innerHTML.length);
			t.set("domln", domLength);

			//
			// DOM mutations
			//
			if (mutationCount > 0) {
				// report as % of DOM size
				var deltaPct = Math.min(Math.round(mutationCount / domLength * 100), 100);

				t.set("mut", deltaPct);

				mutationCount = 0;
			}
		}

		/**
		 * Fired when the battery level changes
		 */
		function onBatteryLevelChange() {
			if (!enabled || !battery) {
				return;
			}

			t.set("bat", battery.level);
		}

		/**
		 * Fired on MutationObserver callback
		 */
		function onMutationObserver(mutations) {
			mutations.forEach(function(mutation) {
				// only listen for childList changes
				if (mutation.type !== "childList") {
					return;
				}

				for (var i = 0; i < mutation.addedNodes.length; i++) {
					var node = mutation.addedNodes[i];

					// add mutations for this node and all sub-nodes
					mutationCount++;
					mutationCount += node.getElementsByTagName ?
						node.getElementsByTagName("*").length : 0;
				}
			});
		}

		/**
		 * Stops this monitor
		 */
		function stop() {
			enabled = false;

			// stop reporting on metrics
			if (reportInterval) {
				clearInterval(reportInterval);
				reportInterval = false;
			}

			// disconnect MO
			if (observer) {
				observer.disconnect();
			}

			// stop listening for battery info
			if (battery && battery.onlevelchange) {
				battery.onlevelchange = null;
			}

			domAllNodes = null;
		}

		//
		// Setup
		//

		// misc stats
		reportInterval = setInterval(reportStats, REPORT_INTERVAL);

		// Battery
		if (w.navigator && typeof w.navigator.getBattery === "function") {
			w.navigator.getBattery().then(function(b) {
				battery = b;

				if (battery.onlevelchange) {
					battery.onlevelchange = onBatteryLevelChange;
				}
			});
		}

		// MutationObserver
		if (typeof w.MutationObserver === "function") {
			observer = new w.MutationObserver(onMutationObserver);

			// configure the observer
			observer.observe(d, { childList: true, subtree: true });
		}

		return {
			stop: stop
		};
	};

	//
	// Continuity implementation
	//
	impl = {
		//
		// Config
		//
		/**
		 * Whether or not to monitor longTasks
		 */
		monitorLongTasks: true,

		/**
		 * Whether or not to monitor Page Busy
		 */
		monitorPageBusy: true,

		/**
		 * Whether or not to monitor FPS
		 */
		monitorFrameRate: true,

		/**
		 * Whether or not to monitor interactions
		 */
		monitorInteractions: true,

		/**
		 * Whether or not to monitor page stats
		 */
		monitorStats: true,

		/**
		 * Whether to monitor for interactions after onload
		 */
		afterOnload: false,

		/**
		 * Max recording length after onload (if not a SPA) (ms)
		 */
		afterOnloadMaxLength: DEFAULT_AFTER_ONLOAD_MAX_LENGTH,

		/**
		 * Minium number of ms after an interaction to wait before sending
		 * an interaction beacon
		 */
		afterOnloadMinWait: 5000,

		/**
		 * Number of milliseconds after onload to wait for TTI, or,
		 * false if not configured.
		 */
		waitAfterOnload: false,

		/**
		 * Whether or not to wait for a call to
		 * frameworkReady() before starting TTI calculations
		 */
		ttiWaitForFrameworkReady: false,

		/**
		 * If set, wait for the specified CSS selector of hero images to have
		 * loaded before starting TTI calculations
		 */
		ttiWaitForHeroImages: false,

		/**
		 * Whether or not to send a detailed log of all events.
		 */
		sendLog: true,

		/**
		 * Whether or not to send a compressed timeline of events
		 */
		sendTimeline: true,

		/**
		 * Maximum number of long entries to keep
		 */
		logMaxEntries: 100,

		//
		// State
		//
		/**
		 * Whether or not we're initialized
		 */
		initialized: false,

		/**
		 * Whether we're ready to send a beacon
		 */
		complete: false,

		/**
		 * Whether or not this is an SPA app
		 */
		isSpa: false,

		/**
		 * Whether Page Ready has fired or not
		 */
		firedPageReady: false,

		/**
		 * Whether or not we're currently monitoring for interactions
		 * after the Page Load beacon
		 */
		afterOnloadMonitoring: false,

		/**
		 * Framework Ready time, if configured
		 */
		frameworkReady: null,

		/**
		 * Timeline
		 */
		timeline: null,

		/**
		 * TTI method used (highest accuracy):
		 * * `lt` (LongTasks)
		 * * `raf` (requestAnimationFrame)
		 * * `b` (Page Busy polling)
		 */
		ttiMethod: null,

		/**
		 * LongTaskMonitor
		 */
		longTaskMonitor: null,

		/**
		 * PageBusyMonitor
		 */
		pageBusyMonitor: null,

		/**
		 * FrameRateMonitor
		 */
		frameRateMonitor: null,

		/**
		 * InteractionMonitor
		 */
		interactionMonitor: null,

		/**
		 * ScrollMontior
		 */
		scrollMonitor: null,

		/**
		 * ClickMonitor
		 */
		clickMonitor: null,

		/**
		 * KeyMonitor
		 */
		keyMonitor: null,

		/**
		 * MouseMonitor
		 */
		mouseMonitor: null,

		/**
		 * VisibilityMonitor
		 */
		visibilityMonitor: null,

		/**
		 * OrientationMonitor
		 */
		orientationMonitor: null,

		/**
		 * StatsMonitor
		 */
		statsMonitor: null,

		/**
		 * Vars we added to the beacon
		 */
		addedVars: [],

		/**
		 * All possible monitors
		 */
		monitors: [
			"timeline",
			"longTaskMonitor",
			"pageBusyMonitor",
			"frameRateMonitor",
			"scrollMonitor",
			"keyMonitor",
			"clickMonitor",
			"mouseMonitor",
			"interactionMonitor",
			"visibilityMonitor",
			"orientationMonitor",
			"statsMonitor"
		],

		/**
		 * When we last sent a beacon
		 */
		timeOfLastBeacon: 0,

		/**
		 * Whether or not we've added data to this beacon
		 */
		hasAddedDataToBeacon: false,

		//
		// Callbacks
		//
		/**
		 * Callback before the beacon is going to be sent
		 */
		onBeforeBeacon: function() {
			impl.runAllAnalyzers();
		},

		/**
		 * Runs all analyzers
		 */
		runAllAnalyzers: function() {
			var i, mon;

			if (impl.hasAddedDataToBeacon) {
				// don't add data twice
				return;
			}

			for (i = 0; i < impl.monitors.length; i++) {
				mon = impl[impl.monitors[i]];

				if (mon && typeof mon.analyze === "function") {
					mon.analyze(impl.timeOfLastBeacon);
				}
			}

			// add last time the data was reset, if ever
			impl.addToBeacon("c.lb", impl.timeOfLastBeacon ? impl.timeOfLastBeacon.toString(36) : 0);

			// keep track of when we last added data
			impl.timeOfLastBeacon = BOOMR.now();

			// note we've added data
			impl.hasAddedDataToBeacon = true;
		},

		/**
		 * Callback after the beacon is ready to send, so we can clear
		 * our added vars and do other cleanup.
		 */
		onBeacon: function() {
			var i;

			// remove added vars
			if (impl.addedVars && impl.addedVars.length > 0) {
				BOOMR.removeVar(impl.addedVars);

				impl.addedVars = [];
			}

			// let any other monitors know that a beacon was sent
			for (i = 0; i < impl.monitors.length; i++) {
				var monitor = impl[impl.monitors[i]];

				if (monitor) {
					// disable ourselves if we're not doing anything after the first beacon
					if (!impl.afterOnload) {
						if (typeof monitor.stop === "function") {
							monitor.stop();
						}
					}

					// notify all plugins that there's been a beacon
					if (typeof monitor.onBeacon === "function") {
						monitor.onBeacon();
					}
				}
			}

			// we haven't added data any more
			impl.hasAddedDataToBeacon = false;
		},

		/**
		 * Callback when an XHR load happens
		 *
		 * @param {object} data XHR data
		 */
		onXhrLoad: function(data) {
			// note this is an SPA for later
			if (data && BOOMR.utils.inArray(data.initiator, BOOMR.constants.BEACON_TYPE_SPAS)) {
				impl.isSpa = true;
			}

			if (data && data.initiator === "spa_hard") {
				impl.onPageReady();
			}
		},

		/**
		 * Callback when the page is ready
		 */
		onPageReady: function() {
			impl.firedPageReady = true;

			//
			// If we're monitoring interactions after onload, set a timer to
			// disable them if configured
			//
			if (impl.afterOnload &&
			    impl.monitorInteractions) {
				impl.afterOnloadMonitoring = true;

				// disable after the specified amount if not a SPA
				if (!impl.isSpa && typeof impl.afterOnloadMaxLength === "number") {
					setTimeout(function() {
						impl.afterOnloadMonitoring = false;
					}, impl.afterOnloadMaxLength);
				}
			}

			if (impl.waitAfterOnload) {
				var start = BOOMR.now();

				setTimeout(function checkTti() {
					// wait for up to the defined time after onload
					if (BOOMR.now() - start > impl.waitAfterOnload) {
						// couldn't calculate TTI, send the beacon anyways
						impl.complete = true;
						BOOMR.sendBeacon();
					}
					else {
						// run the TTI calculation
						impl.timeline.analyze();

						// if we got something, mark as complete and send
						if (externalMetrics.timeToInteractive()) {
							impl.complete = true;
							BOOMR.sendBeacon();
						}
						else {
							// poll again
							setTimeout(checkTti, TIME_TO_INTERACTIVE_WAIT_POLL_PERIOD);
						}
					}
				}, TIME_TO_INTERACTIVE_WAIT_POLL_PERIOD);
			}
			else {
				impl.complete = true;
			}
		},

		//
		// Misc
		//
		/**
		 * Adds a variable to the beacon, tracking the names so we can
		 * remove them later.
		 *
		 * @param {string} name Name
		 * @param {string} val Value.  If 0 or undefined, the value is removed from the beacon.
		 * @param {number} force Force adding the variable, even if 0
		 */
		addToBeacon: function(name, val, force) {
			if ((val === 0 || typeof val === "undefined") && !force) {
				BOOMR.removeVar(name);
				return;
			}

			BOOMR.addVar(name, val);

			impl.addedVars.push(name);
		}
	};

	//
	// External Plugin
	//
	BOOMR.plugins.Continuity = {
		/**
		 * Initializes the plugin.
		 *
		 * @param {object} config Configuration
		 * @param {boolean} [config.Continuity.monitorLongTasks=true] Whether or not to
		 * monitor Long Tasks.
		 * @param {boolean} [config.Continuity.monitorPageBusy=true] Whether or not to
		 * monitor Page Busy.
		 * @param {boolean} [config.Continuity.monitorFrameRate=true] Whether or not to
		 * monitor Frame Rate.
		 * @param {boolean} [config.Continuity.monitorInteractions=true] Whether or not to
		 * monitor Interactions.
		 * @param {boolean} [config.Continuity.monitorStats=true] Whether or not to
		 * monitor Page Statistics.
		 * @param {boolean} [config.Continuity.afterOnload=true] Whether or not to
		 * monitor Long Tasks, Page Busy, Frame Rate, interactions and Page Statistics
		 * after `onload` (up to `afterOnloadMaxLength`).
		 * @param {number} [config.Continuity.afterOnloadMaxLength=60000] Maximum time
		 * (milliseconds) after `onload` to monitor.
		 * @param {boolean} [config.Continuity.afterOnloadMinWait=5000] Minimum
		 * time after an interaction to wait for more interactions before batching
		 * the interactions into a beacon.
		 * @param {boolean|number} [config.Continuity.waitAfterOnload=false] If set
		 * to a `number`, how long after `onload` to wait for Time to Interactive to
		 * happen before sending a beacon (without TTI).
		 * @param {boolean} [config.Continuity.ttiWaitForFrameworkReady=false] Whether
		 * or not to wait for {@link BOOMR.plugins.Continuity.frameworkReady} before
		 * Visually Ready (and thus Time to Interactive) can happen.
		 * @param {boolean|string} [config.Continuity.ttiWaitForHeroImages=false] If
		 * set to a `string`, the CSS selector will wait until the specified images
		 * have been loaded before Visually Ready (and thus Time to Interactive) can happen.
		 * @param {boolean} [config.Continuity.sendLog=true] Whether or not to
		 * send the event log with each beacon.
		 * @param {boolean} [config.Continuity.logMaxEntries=100] How many log
		 * entries to keep.
		 * @param {boolean} [config.Continuity.sendTimeline=true] Whether or not to
		 * send the timeline with each beacon.
		 *
		 * @returns {@link BOOMR.plugins.Continuity} The Continuity plugin for chaining
		 * @memberof BOOMR.plugins.Continuity
		 */
		init: function(config) {
			BOOMR.utils.pluginConfig(impl, config, "Continuity",
				["monitorLongTasks", "monitorPageBusy", "monitorFrameRate", "monitorInteractions",
					"monitorStats", "afterOnload", "afterOnloadMaxLength", "afterOnloadMinWait",
					"waitAfterOnload", "ttiWaitForFrameworkReady", "ttiWaitForHeroImages",
					"sendLog", "logMaxEntries", "sendTimeline"]);

			if (impl.initialized) {
				return this;
			}

			impl.initialized = true;

			// create the timeline
			impl.timeline = new Timeline(BOOMR.now());

			//
			// Setup
			//
			if (BOOMR.window) {
				//
				// LongTasks
				//
				if (impl.monitorLongTasks &&
				    BOOMR.window.PerformanceObserver &&
				    BOOMR.window.PerformanceLongTaskTiming) {
					impl.longTaskMonitor = new LongTaskMonitor(BOOMR.window, impl.timeline);

					impl.ttiMethod = "lt";
				}

				//
				// FPS
				//
				if (impl.monitorFrameRate &&
				    typeof BOOMR.window.requestAnimationFrame === "function") {
					impl.frameRateMonitor = new FrameRateMonitor(BOOMR.window, impl.timeline);

					if (!impl.ttiMethod) {
						impl.ttiMethod = "raf";
					}
				}

				//
				// Page Busy (if LongTasks aren't supported or aren't enabled)
				//
				if (impl.monitorPageBusy &&
					(!BOOMR.window.PerformanceObserver || !BOOMR.window.PerformanceLongTaskTiming || !impl.monitorLongTasks)) {
					impl.pageBusyMonitor = new PageBusyMonitor(BOOMR.window, impl.timeline);

					if (!impl.ttiMethod) {
						impl.ttiMethod = "b";
					}
				}

				//
				// Interactions
				//
				if (impl.monitorInteractions) {
					impl.interactionMonitor = new InteractionMonitor(BOOMR.window, impl.timeline, impl.afterOnloadMinWait);
					impl.scrollMonitor = new ScrollMonitor(BOOMR.window, impl.timeline, impl.interactionMonitor);
					impl.keyMonitor = new KeyMonitor(BOOMR.window, impl.timeline, impl.interactionMonitor);
					impl.clickMonitor = new ClickMonitor(BOOMR.window, impl.timeline, impl.interactionMonitor);
					impl.mouseMonitor = new MouseMonitor(BOOMR.window, impl.timeline, impl.interactionMonitor);
					impl.visibilityMonitor = new VisibilityMonitor(BOOMR.window, impl.timeline, impl.interactionMonitor);
					impl.orientationMonitor = new OrientationMonitor(BOOMR.window, impl.timeline, impl.interactionMonitor);
				}

				//
				// Stats
				//
				if (impl.monitorStats) {
					impl.statsMonitor = new StatsMonitor(BOOMR.window, impl.timeline, impl.interactionMonitor);
				}
			}

			// add epoch and polling method to every beacon
			BOOMR.addVar("c.e", epoch.toString(36));
			BOOMR.addVar("c.tti.m", impl.ttiMethod);

			// event handlers
			BOOMR.subscribe("before_beacon", impl.onBeforeBeacon, null, impl);
			BOOMR.subscribe("beacon", impl.onBeacon, null, impl);
			BOOMR.subscribe("page_ready", impl.onPageReady, null, impl);
			BOOMR.subscribe("xhr_load", impl.onXhrLoad, null, impl);

			return this;
		},

		/**
		 * Whether or not this plugin is complete
		 *
		 * @returns {boolean} `true` if the plugin is complete
		 * @memberof BOOMR.plugins.Continuity
		 */
		is_complete: function(vars) {
			// allow error beacons to go through even if we're not complete
			return impl.complete || (vars && vars["http.initiator"] === "error");
		},

		/**
		 * Signal that the framework is ready
		 *
		 * @memberof BOOMR.plugins.Continuity
		 */
		frameworkReady: function() {
			impl.frameworkReady = BOOMR.now();
		},

		// external metrics
		metrics: externalMetrics

	};
}());

/*
 * Copyright (c), Buddy Brewer.
 */
/**
 * The Navigation Timing plugin collects performance metrics collected by modern
 * user agents that support the W3C [NavigationTiming]{@link http://www.w3.org/TR/navigation-timing/}
 * specification.
 *
 * This plugin also adds similar [ResourceTiming]{@link https://www.w3.org/TR/resource-timing-1/}
 * metrics for any XHR beacons.
 *
 * For information on how to include this plugin, see the {@tutorial building} tutorial.
 *
 * ## Beacon Parameters
 *
 * All beacon parameters are prefixed with `nt_`.
 *
 * This plugin adds the following parameters to the beacon for Page Loads:
 *
 * * `nt_red_cnt`: `performance.navigation.redirectCount`
 * * `nt_nav_type`: `performance.navigation.type`
 * * `nt_nav_st`: `performance.timing.navigationStart`
 * * `nt_red_st`: `performance.timing.redirectStart`
 * * `nt_red_end`: `performance.timing.redirectEnd`
 * * `nt_fet_st`: `performance.timing.fetchStart`
 * * `nt_dns_st`: `performance.timing.domainLookupStart`
 * * `nt_dns_end`: `performance.timing.domainLookupEnd`
 * * `nt_con_st`: `performance.timing.connectStart`
 * * `nt_con_end`: `performance.timing.connectEnd`
 * * `nt_req_st`: `performance.timing.requestStart`
 * * `nt_res_st`: `performance.timing.responseStart`
 * * `nt_res_end`: `performance.timing.responseEnd`
 * * `nt_domloading`: `performance.timing.domLoading`
 * * `nt_domint`: `performance.timing.domInteractive`
 * * `nt_domcontloaded_st`: `performance.timing.domContentLoadedEventStart`
 * * `nt_domcontloaded_end`: `performance.timing.domContentLoadedEventEnd`
 * * `nt_domcomp`: `performance.timing.domComplete`
 * * `nt_load_st`: `performance.timing.loadEventStart`
 * * `nt_load_end`: `performance.timing.loadEventEnd`
 * * `nt_unload_st`: `performance.timing.unloadEventStart`
 * * `nt_unload_end`: `performance.timing.unloadEventEnd`
 * * `nt_ssl_st`: `performance.timing.secureConnectionStart`
 * * `nt_spdy`: `1` if page was loaded over SPDY, `0` otherwise.  Only available
 *   in Chrome when it _doesn't_ support NavigationTiming2.  If NavigationTiming2
 *   is supported, `nt_protocol` will be added instead.
 * * `nt_first_paint`: The time when the first paint happened. If the browser
 *   supports the Paint Timing API, this is the `first-paint` time in milliseconds
 *   since the epoch. Else, on Internet Explorer, this is the `msFirstPaint`
 *   value, in milliseconds since the epoch. On Chrome, this is using
 *   `loadTimes().firstPaintTime` and is converted from seconds.microseconds
 *   into milliseconds since the epoch.
 * * `nt_cinf`: Chrome `chrome.loadTimes().connectionInfo`.  Only available
 *   in Chrome when it _doesn't_ support NavigationTiming2.  If NavigationTiming2
 *   is supported, `nt_protocol` will be added instead.
 * * `nt_protocol`: NavigationTiming2's `nextHopProtocol`
 * * `nt_bad`: If we detected that any NavigationTiming metrics looked odd,
 *   such as `responseEnd` in the far future or `fetchStart` before `navigationStart`.
 * * `nt_worker_start`: NavigationTiming2 `workerStart`
 * * `nt_enc_size`: NavigationTiming2 `encodedBodySize`
 * * `nt_dec_size`: NavigationTiming2 `decodedBodySize`
 * * `nt_trn_size`: NavigationTiming2 `transferSize`
 *
 * For XHR beacons, the following parameters are added (via ResourceTiming):
 *
 * * `nt_red_st`: `redirectStart`
 * * `nt_red_end`: `redirectEnd`
 * * `nt_fet_st`: `fetchStart`
 * * `nt_dns_st`: `domainLookupStart`
 * * `nt_dns_end`: `domainLookupEnd`
 * * `nt_con_st`: `connectStart`
 * * `nt_con_end`: `connectEnd`
 * * `nt_req_st`: `requestStart`
 * * `nt_res_st`: `responseStart`
 * * `nt_res_end`: `responseEnd`
 * * `nt_load_st`: `loadEventStart`
 * * `nt_load_end`: `loadEventEnd`
 * * `nt_ssl_st`: `secureConnectionStart`
 *
 * @see {@link http://www.w3.org/TR/navigation-timing/}
 * @see {@link https://www.w3.org/TR/resource-timing-1/}
 * @class BOOMR.plugins.NavigationTiming
 */
(function() {
	
	

	if (BOOMR.plugins.NavigationTiming) {
		return;
	}

	/**
	 * Calculates a NavigationTiming timestamp for the beacon, in milliseconds
	 * since the Unix Epoch.
	 *
	 * The offset should be 0 if using a timestamp from performance.timing (which
	 * are already in milliseconds since Unix Epoch), or the value of navigationStart
	 * if using getEntriesByType("navigation") (which are DOMHighResTimestamps).
	 *
	 * The number is stripped of any decimals.
	 *
	 * @param {number} offset navigationStart offset (0 if using NavTiming1)
	 * @param {number} val DOMHighResTimestamp
	 *
	 * @returns {number} Timestamp for beacon
	 */
	function calcNavTimingTimestamp(offset, val) {
		if (typeof val !== "number" || val === 0) {
			return undefined;
		}

		return Math.floor((offset || 0) + val);
	}

	// A private object to encapsulate all your implementation details
	var impl = {
		complete: false,
		sendBeacon: function() {
			this.complete = true;
			BOOMR.sendBeacon();
		},
		xhr_done: function(edata) {
			var p;

			if (edata && edata.initiator === "spa_hard") {
				// Single Page App - Hard refresh: Send page's NavigationTiming data, if
				// available.
				impl.done(edata);
				return;
			}
			else if (edata && edata.initiator === "spa") {
				// Single Page App - Soft refresh: The original hard navigation is no longer
				// relevant for this soft refresh, nor is the "URL" for this page, so don't
				// add NavigationTiming or ResourceTiming metrics.
				impl.sendBeacon();
				return;
			}

			var w = BOOMR.window, res, data = {}, k;

			if (!edata) {
				return;
			}

			if (edata.data) {
				edata = edata.data;
			}

			p = BOOMR.getPerformance();

			// if we previously saved the correct ResourceTiming entry, use it
			if (p && edata.restiming) {
				data = {
					nt_red_st: edata.restiming.redirectStart,
					nt_red_end: edata.restiming.redirectEnd,
					nt_fet_st: edata.restiming.fetchStart,
					nt_dns_st: edata.restiming.domainLookupStart,
					nt_dns_end: edata.restiming.domainLookupEnd,
					nt_con_st: edata.restiming.connectStart,
					nt_con_end: edata.restiming.connectEnd,
					nt_req_st: edata.restiming.requestStart,
					nt_res_st: edata.restiming.responseStart,
					nt_res_end: edata.restiming.responseEnd
				};

				if (edata.restiming.secureConnectionStart) {
					// secureConnectionStart is OPTIONAL in the spec
					data.nt_ssl_st = edata.restiming.secureConnectionStart;
				}

				for (k in data) {
					if (data.hasOwnProperty(k) && data[k]) {
						data[k] += p.timing.navigationStart;

						// don't need to send microseconds
						data[k] = Math.floor(data[k]);
					}
				}
			}

			if (edata.timing) {
				res = edata.timing;
				if (!data.nt_req_st) {
					// requestStart will be 0 if Timing-Allow-Origin header isn't set on the xhr response
					data.nt_req_st = res.requestStart;
				}
				if (!data.nt_res_st) {
					// responseStart will be 0 if Timing-Allow-Origin header isn't set on the xhr response
					data.nt_res_st = res.responseStart;
				}
				if (!data.nt_res_end) {
					data.nt_res_end = res.responseEnd;
				}
				data.nt_domint = res.domInteractive;
				data.nt_domcomp = res.domComplete;
				data.nt_load_st = res.loadEventEnd;
				data.nt_load_end = res.loadEventEnd;
			}

			for (k in data) {
				if (data.hasOwnProperty(k) && !data[k]) {
					delete data[k];
				}
			}

			BOOMR.addVar(data);

			try { impl.addedVars.push.apply(impl.addedVars, Object.keys(data)); }
			catch (ignore) { /* empty */ }

			impl.sendBeacon();
		},

		done: function() {
			var w = BOOMR.window, p, pn, chromeTimes, pt, data = {}, offset = 0, i,
			    paintTiming;

			if (this.complete) {
				return this;
			}

			impl.addedVars = [];

			p = BOOMR.getPerformance();

			if (p) {
				if (typeof p.getEntriesByType === "function") {
					pt = p.getEntriesByType("navigation");
					if (pt && pt.length) {
						BOOMR.info("This user agent supports NavigationTiming2", "nt");

						pt = pt[0];

						// ensure DOMHighResTimestamps are added to navigationStart
						offset = p.timing ? p.timing.navigationStart : 0;
					}
					else {
						pt = undefined;
					}
				}

				if (!pt && p.timing) {
					BOOMR.info("This user agent supports NavigationTiming", "nt");
					pt = p.timing;
				}

				if (pt) {
					data = {
						// start is `navigationStart` on .timing, `startTime` is always 0 on timeline entry
						nt_nav_st: p.timing ? p.timing.navigationStart : 0,

						// all other entries have the same name on .timing vs timeline entry
						nt_red_st: calcNavTimingTimestamp(offset, pt.redirectStart),
						nt_red_end: calcNavTimingTimestamp(offset, pt.redirectEnd),
						nt_fet_st: calcNavTimingTimestamp(offset, pt.fetchStart),
						nt_dns_st: calcNavTimingTimestamp(offset, pt.domainLookupStart),
						nt_dns_end: calcNavTimingTimestamp(offset, pt.domainLookupEnd),
						nt_con_st: calcNavTimingTimestamp(offset, pt.connectStart),
						nt_con_end: calcNavTimingTimestamp(offset, pt.connectEnd),
						nt_req_st: calcNavTimingTimestamp(offset, pt.requestStart),
						nt_res_st: calcNavTimingTimestamp(offset, pt.responseStart),
						nt_res_end: calcNavTimingTimestamp(offset, pt.responseEnd),
						nt_domloading: calcNavTimingTimestamp(offset, pt.domLoading),
						nt_domint: calcNavTimingTimestamp(offset, pt.domInteractive),
						nt_domcontloaded_st: calcNavTimingTimestamp(offset, pt.domContentLoadedEventStart),
						nt_domcontloaded_end: calcNavTimingTimestamp(offset, pt.domContentLoadedEventEnd),
						nt_domcomp: calcNavTimingTimestamp(offset, pt.domComplete),
						nt_load_st: calcNavTimingTimestamp(offset, pt.loadEventStart),
						nt_load_end: calcNavTimingTimestamp(offset, pt.loadEventEnd),
						nt_unload_st: calcNavTimingTimestamp(offset, pt.unloadEventStart),
						nt_unload_end: calcNavTimingTimestamp(offset, pt.unloadEventEnd)
					};

					// domLoading doesn't exist on NavigationTiming2, so fetch it
					// from performance.timing if available.
					if (!data.nt_domloading && p && p.timing && p.timing.domLoading) {
						// value on performance.timing will be in Unix Epoch milliseconds
						data.nt_domloading = p.timing.domLoading;
					}

					if (pt.secureConnectionStart) {
						// secureConnectionStart is OPTIONAL in the spec
						data.nt_ssl_st = calcNavTimingTimestamp(offset, pt.secureConnectionStart);
					}

					if (p.timing && p.timing.msFirstPaint) {
						// msFirstPaint is IE9+ http://msdn.microsoft.com/en-us/library/ff974719
						// and is in Unix Epoch format
						data.nt_first_paint = p.timing.msFirstPaint;
					}

					if (pt.workerStart) {
						// ServiceWorker time
						data.nt_worker_start = calcNavTimingTimestamp(offset, pt.workerStart);
					}

					// Need to check both decodedSize and transferSize as
					// transferSize is 0 for cached responses and
					// decodedSize is 0 for empty responses (eg: beacons, 204s, etc.)
					if (pt.decodedBodySize || pt.transferSize) {
						data.nt_enc_size = pt.encodedBodySize;
						data.nt_dec_size = pt.decodedBodySize;
						data.nt_trn_size = pt.transferSize;
					}

					if (pt.nextHopProtocol) {
						data.nt_protocol = pt.nextHopProtocol;
					}
				}

				//
				// Get First Paint from Paint Timing API
				// https://www.w3.org/TR/paint-timing/
				//
				if (!data.nt_first_paint && BOOMR.plugins.PaintTiming) {
					paintTiming = BOOMR.plugins.PaintTiming.getTimingFor("first-paint");

					if (paintTiming) {
						data.nt_first_paint = calcNavTimingTimestamp(offset, paintTiming);
					}
				}

				//
				// Chrome provides window.chrome.loadTimes(), but this is deprecated
				// in Chrome 64+ and will be removed at some point.  The data it
				// provides may be available in more modern performance APIs:
				//
				// * .connectionInfo (nt_cinf): Navigation Timing 2 nextHopProtocol
				// * .wasFetchedViaSpdy (nt_spdy): Could be calculated via above,
				//       so we don't need to add if it's not available directly
				// * .firstPaintTime (nt_first_paint): Paint Timing's first-paint
				//
				// If we've already queried that data, don't also query
				// loadTimes() as it will generate a console warning.
				//
				if ((!data.nt_protocol || !data.nt_first_paint) &&
					w.chrome &&
					typeof w.chrome.loadTimes === "function") {
					chromeTimes = w.chrome.loadTimes();
					if (chromeTimes) {
						data.nt_spdy = (chromeTimes.wasFetchedViaSpdy ? 1 : 0);
						data.nt_cinf = chromeTimes.connectionInfo;

						// Chrome firstPaintTime is in seconds.microseconds, so
						// we need to multiply it by 1000 to be consistent with
						// msFirstPaint and other NavigationTiming timestamps that
						// are in milliseconds.microseconds.
						if (typeof chromeTimes.firstPaintTime === "number" && chromeTimes.firstPaintTime !== 0) {
							data.nt_first_paint = Math.round(chromeTimes.firstPaintTime * 1000);
						}
					}
				}

				//
				// Navigation Type and Redirect Count
				//
				if (p.navigation) {
					pn = p.navigation;

					data.nt_red_cnt  = pn.redirectCount;
					data.nt_nav_type = pn.type;
				}

				// Remove any properties that are undefined
				for (k in data) {
					if (data.hasOwnProperty(k) && data[k] === undefined) {
						delete data[k];
					}
				}

				BOOMR.addVar(data);

				//
				// Basic browser bug detection for known cases where NavigationTiming
				// timestamps might not be trusted.
				//
				if (pt && (
				    (pt.requestStart && pt.navigationStart && pt.requestStart < pt.navigationStart) ||
				    (pt.responseStart && pt.navigationStart && pt.responseStart < pt.navigationStart) ||
				    (pt.responseStart && pt.fetchStart && pt.responseStart < pt.fetchStart) ||
				    (pt.navigationStart && pt.fetchStart < pt.navigationStart) ||
				    (pt.responseEnd && pt.responseEnd > BOOMR.now() + 8.64e+7)
				)) {
					BOOMR.addVar("nt_bad", 1);
					impl.addedVars.push("nt_bad");
				}

				// ensure all vars are removed at beacon
				try {
					impl.addedVars.push.apply(impl.addedVars, Object.keys(data));
				}
				catch (ignore) {
					/* empty */
				}
			}

			impl.sendBeacon();
		},

		clear: function() {
			if (impl.addedVars && impl.addedVars.length > 0) {
				BOOMR.removeVar(impl.addedVars);
				impl.addedVars = [];
			}
			this.complete = false;
		},

		prerenderToVisible: function() {
			// ensure we add our data to the beacon even if we had added it
			// during prerender (in case another beacon went out in between)
			this.complete = false;

			// add our data to the beacon
			this.done();
		}
	};

	//
	// Exports
	//
	BOOMR.plugins.NavigationTiming = {
		/**
		 * Initializes the plugin.
		 *
		 * This plugin does not have any configuration.
		 * @returns {@link BOOMR.plugins.NavigationTiming} The NavigationTiming plugin for chaining
		 * @memberof BOOMR.plugins.NavigationTiming
		 */
		init: function() {
			if (!impl.initialized) {
				// we'll fire on whichever happens first
				BOOMR.subscribe("page_ready", impl.done, null, impl);
				BOOMR.subscribe("prerender_to_visible", impl.prerenderToVisible, null, impl);
				BOOMR.subscribe("xhr_load", impl.xhr_done, null, impl);
				// The NavigationTiming plugin makes error by subscribing to "before_unload" event in initialization.
            // Page reloads many times after logout. Can work without it, so we comment it for now.
				//BOOMR.subscribe("before_unload", impl.done, null, impl);
				BOOMR.subscribe("beacon", impl.clear, null, impl);

				impl.initialized = true;
			}
			return this;
		},

		/**
		 * Whether or not this plugin is complete
		 *
		 * @returns {boolean} `true` if the plugin is complete
		 * @memberof BOOMR.plugins.NavigationTiming
		 */
		is_complete: function() {
			return true;
		}
	};

}());

// This code is run after all plugins have initialized
BOOMR.init({
	log: null,
	Continuity: {
      enabled: true,
      clearOnBeacon: true,
      waitAfterOnload: 5000
   }
});

BOOMR.t_end = new Date().getTime();

typeof boomerangBeacon === 'function' && boomerangBeacon();

BOOMR.subscribe('before_beacon', function() {
	BOOMR.fireEvent('onBeacon');
});
