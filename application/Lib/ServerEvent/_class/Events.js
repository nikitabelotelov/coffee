/// <amd-module name="Lib/ServerEvent/_class/Events" />
define("Lib/ServerEvent/_class/Events", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var STR_DISABLE = 'disableservereventbus';
    var STR_LATE_MAIN = 'detectlatermain';
    var FakeEvent = /** @class */ (function () {
        function FakeEvent(type) {
            /**
             * Returns true or false depending on how event was initialized. True if event goes through its target's ancestors in reverse tree order, and false otherwise.
             */
            this.bubbles = false;
            this.cancelBubble = false;
            this.cancelable = false;
            this.type = type;
        }
        FakeEvent.prototype.composedPath = function () { return []; };
        FakeEvent.prototype.initEvent = function (type, bubbles, cancelable) { };
        FakeEvent.prototype.preventDefault = function () { };
        /**
         * Invoking this method prevents event from reaching
         * any registered event listeners after the current one finishes running and, when dispatched in a tree, also prevents event from reaching any
         * other objects.
         */
        FakeEvent.prototype.stopImmediatePropagation = function () { };
        /**
         * When dispatched in a tree, invoking this method prevents event from reaching any objects other than the current object.
         */
        FakeEvent.prototype.stopPropagation = function () { };
        return FakeEvent;
    }());
    function create(type) {
        try {
            return new Event(type);
        }
        catch (e) {
            if (typeof document === 'undefined') {
                return new FakeEvent(type);
            }
            // For Internet Explorer 11:
            var event_1 = document.createEvent('Event');
            event_1.initEvent(type, false, false);
            return event_1;
        }
    }
    exports.create = create;
    exports.EVENT_DISABLE_SEB = create(STR_DISABLE);
    exports.EVENT_LATER_MAIN_TRANSPORT = create(STR_LATE_MAIN);
});
