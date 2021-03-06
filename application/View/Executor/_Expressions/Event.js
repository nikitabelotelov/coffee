/// <amd-module name="View/Executor/_Expressions/Event" />
define('View/Executor/_Expressions/Event', [
    'require',
    'exports'
], function (require, exports) {
    'use strict';
    Object.defineProperty(exports, '__esModule', { value: true });
    var originDOMEventNames = {
        mozmousepixelscroll: 'MozMousePixelScroll',
        domautocomplete: 'DOMAutoComplete'
    };
    function isEvent(titleAttribute) {
        return /^(on:[A-z0-9])\w*$/.test(titleAttribute);
    }
    exports.isEvent = isEvent;
    function getEventName(eventAttribute) {
        return eventAttribute.slice(3).toLowerCase();
    }
    exports.getEventName = getEventName;
    function fixUppercaseDOMEventName(name) {
        var fixedName = originDOMEventNames[name];
        return fixedName || name;
    }
    exports.fixUppercaseDOMEventName = fixUppercaseDOMEventName;
});