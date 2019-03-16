/// <amd-module name="Browser/_Event/Server/_class/Events" />
define('Browser/_Event/Server/_class/Events', [
    'require',
    'exports',
    'tslib'
], function (require, exports, tslib_1) {
    'use strict';
    Object.defineProperty(exports, '__esModule', { value: true });
    var STR_DISABLE = 'disableservereventbus';
    var STR_LATE_MAIN = 'detectlatermain';
    var FakeEvent = /** @class */
    function () {
        function FakeEvent(type, options) {
            if (options === void 0) {
                options = {};
            }    /**
             * Returns true or false depending on how event was initialized.
             * True if event goes through its target's ancestors in reverse tree order, and false otherwise.
             */
            /**
             * Returns true or false depending on how event was initialized.
             * True if event goes through its target's ancestors in reverse tree order, and false otherwise.
             */
            this.bubbles = false;
            this.cancelBubble = false;
            this.cancelable = false;
            this.type = type;
            for (var key in options) {
                this[key] = options[key];
            }
        }
        FakeEvent.prototype.composedPath = function () {
            return [];
        };
        FakeEvent.prototype.initEvent = function (type, bubbles, cancelable) {
        };
        FakeEvent.prototype.preventDefault = function () {
        };    /**
         * Invoking this method prevents event from reaching
         * any registered event listeners after the current one finishes running and,
         * when dispatched in a tree, also prevents event from reaching any
         * other objects.
         */
        /**
         * Invoking this method prevents event from reaching
         * any registered event listeners after the current one finishes running and,
         * when dispatched in a tree, also prevents event from reaching any
         * other objects.
         */
        FakeEvent.prototype.stopImmediatePropagation = function () {
        };    /**
         * When dispatched in a tree, invoking this method prevents event
         * from reaching any objects other than the current object.
         */
        /**
         * When dispatched in a tree, invoking this method prevents event
         * from reaching any objects other than the current object.
         */
        FakeEvent.prototype.stopPropagation = function () {
        };
        return FakeEvent;
    }();
    var FakeMessageEvent = /** @class */
    function (_super) {
        tslib_1.__extends(FakeMessageEvent, _super);
        function FakeMessageEvent() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        return FakeMessageEvent;
    }(FakeEvent);    /**
     * Create Event
     * @param type EventType
     * @returns {Event}
     */
    /**
     * Create Event
     * @param type EventType
     * @returns {Event}
     */
    function create(type) {
        try {
            return new Event(type);
        } catch (e) {
            if (typeof document === 'undefined') {
                return new FakeEvent(type);
            }    // For Internet Explorer 11:
            // For Internet Explorer 11:
            var event = document.createEvent('Event');
            event.initEvent(type, false, false);
            return event;
        }
    }
    exports.create = create;    /**
     * Create MessageEvent
     * @param type EventType
     * @returns {MessageEvent}
     */
    /**
     * Create MessageEvent
     * @param type EventType
     * @returns {MessageEvent}
     */
    function createME(type, options) {
        if (options === void 0) {
            options = {};
        }
        try {
            return new MessageEvent(type, options);
        } catch (e) {
            if (typeof document === 'undefined') {
                return new FakeMessageEvent(type);
            }    // For Internet Explorer 11:
            // For Internet Explorer 11:
            var event = document.createEvent('MessageEvent');
            event.initEvent(type, false, false);
            return event;
        }
    }
    exports.createME = createME;
    exports.EVENT_DISABLE_SEB = create(STR_DISABLE);
    exports.EVENT_LATER_MAIN_TRANSPORT = create(STR_LATE_MAIN);
});