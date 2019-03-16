/// <amd-module name="UI/_base/HeadController" />
define('UI/_base/HeadController', [
    'require',
    'exports'
], function (require, exports) {
    'use strict';
    Object.defineProperty(exports, '__esModule', { value: true });
    function setTitle(newTitle) {
        if (typeof window !== 'undefined') {
            window.document.head.title = newTitle;
        }
    }
    exports.default = { setTitle: setTitle };
});