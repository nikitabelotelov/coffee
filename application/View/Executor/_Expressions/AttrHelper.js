/// <amd-module name="View/Executor/_Expressions/AttrHelper" />
define('View/Executor/_Expressions/AttrHelper', [
    'require',
    'exports'
], function (require, exports) {
    'use strict';
    Object.defineProperty(exports, '__esModule', { value: true });
    function isAttr(string) {
        return string.indexOf('attr:') === 0;
    }
    exports.isAttr = isAttr;
    function checkAttr(attrs) {
        for (var key in attrs) {
            if (isAttr(key)) {
                return true;
            }
        }
        return false;
    }
    exports.checkAttr = checkAttr;
});