(function () {
   var global = this || (0, eval)('this');

   //Check if on server side
   var IS_SERVER_SCRIPT = typeof window === 'undefined';

   //Resource loading timeout for RequireJS
   var LOADING_TIMEOUT = 60;

   //Release mode
   var RELEASE_MODE = 'release';

   //Debug mode
   var DEBUG_MODE = 'debug';

   //Application build mode
   var BUILD_MODE = global.contents && global.contents.buildMode || DEBUG_MODE;

   //Returns true if debug mode is enabled
   var IS_DEBUG = global.document && global.document.cookie && global.document.cookie.indexOf('s3debug=true') > -1;

   //Removes leading slash from string
   function removeLeadingSlash(path) {
      if (path) {
         var head = path.charAt(0);
         if (head === '/' || head === '\\') {
            path = path.substr(1);
         }
      }
      return path;
   }

   //Removes trailing slash from string
   function removeTrailingSlash(path) {
      if (path) {
         var tail = path.substr(path.length - 1);
         if (tail === '/' || tail === '\\') {
            path = path.substr(0, path.length - 1);
         }
      }
      return path;
   }

   //Joins path parts together
   function pathJoin() {
      var count = arguments.length;
      var path = [];
      var before;
      var after;
      for (var i = 0; i < count; i++) {
         before = after = arguments[i];
         if (i > 0) {
            after = removeLeadingSlash(after);
         }
         if (i < count - 1) {
            after = removeTrailingSlash(after);
         }
         if (after) {
            path.push(after);
         } else if (i === 0 && before === '/') {
            path.push(after);
         }
      }

      return path.join('/');
   }

   function onPageVisibilityChange(callback) {
      var feature = (function(features) {
         for (var i = 0; i < features.length; i++) {
            if (typeof document[features[i].property] !== 'undefined') {
               return features[i];
            }
         }
      })([
         {property: 'hidden', event: 'visibilitychange'},
         {property: 'msHidden', event: 'msvisibilitychange'},
         {property: 'webkitHidden', event: 'webkitvisibilitychange'}
      ]);

      if (feature && typeof document.addEventListener) {
         document.addEventListener(feature.event, function() {
            callback(document[feature.property]);
         }, false);
         if (document[feature.property]) {
            callback(document[feature.property]);
         }
      }
   }

   /**
    * Returns handler for RequireJS resource loader callback
    * @param {Function} parent Previous callback
    * @return {Function}
    */
   function createResourceLoader(parent) {
      return function onResourceLoad(context, map) {
         if (!map.prefix) {
            var exports = context.defined[map.id];
            if (exports && exports.__esModule && exports.default) {
               exports = exports.default;
            }
            if (typeof exports === 'function') {
               var proto = exports.prototype;
               if (!proto.hasOwnProperty('_moduleName')) {
                  proto._moduleName = map.name;
               }
            }
         }

         if (parent) {
            parent.apply(this, arguments);
         }
      };
   }

   /**
    * Creates additional handlers for RequireJS
    */
   function buildHandlers() {
      var FILE_EXTENSION = /\.([A-z0-9]+($|\?))/;
      var STATIC_DOMAINS_EXT = ['js'];
      var IGNORE_PART = '((?!\\/(cdn|rtpackage|rtpack|demo_src)\\/).)*';
      var WITH_VERSION_MATCH = new RegExp('^' + IGNORE_PART + '\\.[A-z0-9]+(\\?|$)');
      var WITH_SUFFIX_MATCH = new RegExp('^' + IGNORE_PART + '\\.(js|xhtml|tmpl|wml|css|json|jstpl)(\\?|$)');
      var FILES_SUFFIX = IS_DEBUG || BUILD_MODE !== RELEASE_MODE ? '' : '.min';

      function getBasePrefix() {
         var config = global.wsConfig;
         return config && (config._baseUrl || config.appRoot) || '';
      }

      function getResourcesPrefix() {
         var config = global.wsConfig;
         return config && config.resourceRoot || '/';
      }

      //Returns domain for certain URL
      function getDomain() {
         var domains = global.wsConfig && global.wsConfig.staticDomains instanceof Array ? global.wsConfig.staticDomains : [];
         return domains[0];
      }

      //Injects domain signature to the URL if necessary
      function getWithDomain(url) {
         var domain = getDomain(url);
         //URL is absolute and doesn't start with double slash
         if (domain && url[0] === '/' && url[1] !== '/') {
            //URL starts with base resources even if resourcesPath is relative
            var basePrefix = getResourcesPrefix();
            if (url.indexOf(basePrefix) === 0) {
               var extension = url.split('?').shift().split('.').pop().toLowerCase();
               if (STATIC_DOMAINS_EXT.indexOf(extension) !== -1) {
                  url = '//' + domain + url;
               }
            }
         }

         return url;
      }

      //Returns primary and remote services version for certain URL
      function getVersions(url) {
         var modules = global.contents && global.contents.modules || {};
         var modulePath = url;

         //Try to cut off base resources prefix. It can be a full path on server.
         var basePrefix = pathJoin(getBasePrefix(), getResourcesPrefix());
         var urlParts = modulePath.split(basePrefix, 2);
         if (urlParts.length > 1) {
            var servicePath = removeLeadingSlash(urlParts[0]);
            if (servicePath.indexOf('/') === -1) {
               modulePath = urlParts[1];
            }
         }

         //Each UI module can have an individual build number
         var moduleName = modulePath.split('/')[0];
         var moduleConfig = modules[moduleName];

         //Extract service name from module config
         if (moduleConfig && moduleConfig.service && global.contents) {
            var service = moduleConfig.service;
            global.contents.loadedServices = global.contents.loadedServices || {};
            if (!global.contents.loadedServices[service]) {
               global.contents.loadedServices[service] = true;
            }
         }

         return [global.contents && global.contents.buildnumber || global.buildnumber, moduleConfig && moduleConfig.buildnumber || ''];
      }

      //Injects version signature to the URL if necessary
      function getWithVersion(url) {
         var versions = getVersions(url);

         //Has main service version
         if (versions[0]) {
            var versionSign = versions[0] ? '?x_version=' + versions[0] : '';

            //Has foreign service version
            if (versions[1] && versions[0] !== versions[1]) {
               versionSign += '&x_remote=' + versions[1];
            }

            //Inject version signature to the URL if it don't have it yet and can be attracted to
            if (
               versionSign && url.indexOf(versionSign) === -1 &&
               WITH_VERSION_MATCH.test(url)
            ) {
               var parts = url.split('?', 2);
               url = parts[0] + versionSign + (parts[1] ? '&' + parts[1] : '');
            }
         }

         return url;
      }

      //Injects suffix signature to the URL if necessary
      function getWithSuffix(url) {
         if (FILES_SUFFIX) {
            var suffixSign = FILES_SUFFIX + '.';

            //Inject suffix signature to the URL if it don't have it yet and can be attracted to
            if (
               suffixSign && url.indexOf(suffixSign) === -1 &&
               WITH_SUFFIX_MATCH.test(url)
            ) {
               url = url.replace(FILE_EXTENSION, suffixSign + '$1');
            }
         }

         return url;
      }

      return {
         getWithDomain: getWithDomain,
         getWithSuffix: getWithSuffix,
         getWithVersion: getWithVersion
      };
   }

   /**
    * Patches nameToUrl method of specified context as decorator with URL post processing
    * @param {Object} require RequireJS root instance
    * @param {Object} handlers Patch config
    */
   function patchContext(require, handlers) {
      var context = require.s.contexts._;
      if (context.nameToUrlPatched) {
         return;
      }

      context.nameToUrlPatched = true;
      context.nameToUrl = (function(parent) {
         var HAS_PROTOCOL = /^([a-z]+:)?\/\//;
         var getWithSuffix = handlers.getWithSuffix;
         var getWithVersion = handlers.getWithVersion;
         var getWithDomain = handlers.getWithDomain;

         return function nameToUrlDecorator(name, ext, skipExt) {
            var url = parent(name, ext, skipExt);

            //Skip URLs with protocol prefix
            if (HAS_PROTOCOL.test(url)) {
               return url;
            }

            if (getWithSuffix) {
               url = getWithSuffix(url);
            }
            if (getWithVersion) {
               url = getWithVersion(url);
            }
            if (getWithDomain) {
               url = getWithDomain(url);
            }

            return url;
         };
      })(context.nameToUrl);
   }

   /**
    * Before RequireJS script node will be insert into DOM
    * @param {HTMLScriptElement} node Script DOM element
    * @param {Object} config Context config
    * @param {String} moduleName the name of the module.
    * @param {String} url Requested module URL
    */
   function onNodeCreated(node) {
      node.setAttribute('data-vdomignore', 'true');
   }

   /**
    * Creates startup config for RequireJS
    * @param {String} baseUrl Base URL
    * @param {String} wsPath WS.Core path
    * @param {String} resourcesPath Resources path
    * @param {Object} options Optional config
    * @return {Object}
    */
   function createConfig(baseUrl, wsPath, resourcesPath, options) {
      global.wsConfig = global.wsConfig || {};
      global.wsConfig._baseUrl = baseUrl;
      global.wsConfig.getWithVersion = requireHandlers.getWithVersion;
      global.wsConfig.getWithDomain = requireHandlers.getWithDomain;
      global.wsConfig.getWithSuffix = requireHandlers.getWithSuffix;
      options = options || global.contents;
      //Build config
      var config = {
         baseUrl: baseUrl,
         paths: {
            'WS': removeTrailingSlash(wsPath),
            'WS.Core': wsPath,
            'Lib': pathJoin(wsPath, 'lib'),
            'Ext': pathJoin(wsPath, 'lib/Ext'),
            'Deprecated': pathJoin(resourcesPath, 'WS.Deprecated'),

            'Helpers': pathJoin(wsPath, 'core/helpers'),
            'Transport': pathJoin(wsPath, 'transport'),
            'bootup' : pathJoin(wsPath, 'res/js/bootup'),
            'bootup-min' : pathJoin(wsPath, 'res/js/bootup-min'),
            'old-bootup' : pathJoin(wsPath, 'res/js/old-bootup'),
            'tslib': pathJoin(wsPath, 'ext/tslib'),
            'Resources': resourcesPath || '.',
            'Core': pathJoin(wsPath, 'core'),
            'css': pathJoin(wsPath, 'ext/requirejs/plugins/css'),
            'native-css': pathJoin(wsPath, 'ext/requirejs/plugins/native-css'),
            'normalize': pathJoin(wsPath, 'ext/requirejs/plugins/normalize'),
            'html': pathJoin(wsPath, 'ext/requirejs/plugins/html'),
            'tmpl': pathJoin(wsPath, 'ext/requirejs/plugins/tmpl'),
            'wml': pathJoin(wsPath, 'ext/requirejs/plugins/wml'),
            'text': pathJoin(wsPath, 'ext/requirejs/plugins/text'),
            'is': pathJoin(wsPath, 'ext/requirejs/plugins/is'),
            'is-api': pathJoin(wsPath, 'ext/requirejs/plugins/is-api'),
            'i18n': pathJoin(wsPath, 'ext/requirejs/plugins/i18n'),
            'json': pathJoin(wsPath, 'ext/requirejs/plugins/json'),
            'order': pathJoin(wsPath, 'ext/requirejs/plugins/order'),
            'template': pathJoin(wsPath, 'ext/requirejs/plugins/template'),
            'cdn': pathJoin(wsPath, 'ext/requirejs/plugins/cdn'),
            'datasource': pathJoin(wsPath, 'ext/requirejs/plugins/datasource'),
            'xml': pathJoin(wsPath, 'ext/requirejs/plugins/xml'),
            'preload': pathJoin(wsPath, 'ext/requirejs/plugins/preload'),
            'browser': pathJoin(wsPath, 'ext/requirejs/plugins/browser'),
            'optional': pathJoin(wsPath, 'ext/requirejs/plugins/optional'),
            'remote': pathJoin(wsPath, 'ext/requirejs/plugins/remote'),

            'router': pathJoin(resourcesPath, 'router'),

            'jquery': '/cdn/jquery/3.3.1/jquery-min'

         },
         map: {
            //Aliases
            '*': {
               'Core/helpers/dom&controls-helpers': 'Core/helpers/dom-and-controls-helpers',
               'Deprecated/helpers/dom&controls-helpers': 'Deprecated/helpers/dom-and-controls-helpers'
            }
         },
         onNodeCreated: onNodeCreated,
         waitSeconds: IS_SERVER_SCRIPT ? 0 : LOADING_TIMEOUT
      };

      //Check and handle some options
      if (options) {
         var prop;
         for (prop in options) {
            if (!options.hasOwnProperty(prop)) {
               continue;
            }
            config[prop] = options[prop];
         }
         if (options.modules) {
            for (var name in options.modules) {
               //skip 'Core' for backward compatibility with Core/* from WS.Core
               if (name === 'Core') {
                  continue;
               }
               if (options.modules.hasOwnProperty(name)) {
                  var moduleConfig = options.modules[name];
                  config.paths[name] = moduleConfig.hasOwnProperty('path') ? pathJoin(moduleConfig['path']) : pathJoin(resourcesPath, name);
               }
            }
         }
      }

      return config;
   }

   //Setup startup config for RequireJS
   function setupConfig(require) {
      global.wsConfig = global.wsConfig || {};

      //Application root
      var baseUrl = global.wsConfig && global.wsConfig.appRoot || '/';

      //Resources path
      var resourcesPath = global.wsConfig ? global.wsConfig.resourceRoot || 'resources' : '';

      //WS path
      var wsPath = global.wsConfig && global.wsConfig.wsRoot || pathJoin(resourcesPath, 'WS.Core');

      //Bundles post processing
      if (global.bundles && !IS_DEBUG && global.contents) {
         global.contents.bundles = global.bundles;
      }

      var config = createConfig(
         baseUrl,
         wsPath,
         resourcesPath
      );
      require.config(config);

      //Disable loading timeout on hidden page
      onPageVisibilityChange(function(isHidden) {
         require.config({
            waitSeconds: isHidden ? 0 : LOADING_TIMEOUT
         });
      });
   }

   var require = global.requirejs;
   var requireHandlers = buildHandlers();

   //Set resource load handler
   require.onResourceLoad = createResourceLoader(require.onResourceLoad);

   //Patch default context
   patchContext(require, IS_SERVER_SCRIPT ? {getWithVersion: requireHandlers.getWithVersion} : requireHandlers);

   if (IS_SERVER_SCRIPT) {
      //Just return config constructor on server
      module.exports = createConfig;
   } else {
      //Initialize RequireJS in browser
      setupConfig(require);
   }
})();
