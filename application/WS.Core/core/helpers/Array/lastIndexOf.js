/// <amd-module name="Core/helpers/Array/lastIndexOf" />
define("Core/helpers/Array/lastIndexOf", ["require", "exports"], function (require, exports) {
    "use strict";
    return function lastIndexOf(arr, searchElement /* , fromIndex */) {
        if (!(arr instanceof Array)) {
            throw new TypeError('Incorrect type of the first arguments. Array expected');
        }
        if ([].lastIndexOf) {
            // если arguments[2](fromIndex) отсутствует то всегда возвращается -1
            return arr.lastIndexOf(searchElement, arguments[2] || arr.length);
        }
        // дальнейшая реализация взята c https://developer.mozilla.org/ru/docs/Web/JavaScript/Reference/Global_Objects/Array/lastIndexOf
        var n, k, t = Object(arr), len = t.length >>> 0;
        if (len === 0) {
            return -1;
        }
        n = len - 1;
        if (arguments.length > 2) {
            n = Number(arguments[2]);
            if (n != n) {
                n = 0;
            }
            else if (n != 0 && n != (1 / 0) && n != -(1 / 0)) {
                n = (n > 0 || -1) * Math.floor(Math.abs(n));
            }
        }
        for (k = n >= 0 ? Math.min(n, len - 1) : len - Math.abs(n); k >= 0; k--) {
            if (k in t && t[k] === searchElement) {
                return k;
            }
        }
        return -1;
    };
});
