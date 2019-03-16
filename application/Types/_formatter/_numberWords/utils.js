/// <amd-module name="Types/_formatter/_numberWords/utils" />
define('Types/_formatter/_numberWords/utils', [
    'require',
    'exports'
], function (require, exports) {
    'use strict';
    Object.defineProperty(exports, '__esModule', { value: true });
    function iterateNumber(numAsStr, callBack) {
        var _this = this;
        var counter = 0;
        var threes = [];
        while (numAsStr.length > 0) {
            var three = numAsStr.substr(Math.max(numAsStr.length - 3, 0), 3);
            if (three.length !== 0) {
                // @ts-ignore
                threes.unshift([
                    three.padStart(3, '0'),
                    counter++
                ]);
            }
            numAsStr = numAsStr.slice(0, -3);
        }
        threes.forEach(function (args) {
            callBack.call.apply(callBack, [_this].concat(args));
        });
    }
    exports.iterateNumber = iterateNumber;
});