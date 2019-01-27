/// <amd-module name="Core/helpers/Number/toRoman" />
define("Core/helpers/Number/toRoman", ["require", "exports"], function (require, exports) {
    "use strict";
    var boundaries = {
        M: 1000,
        CM: 900,
        D: 500,
        CD: 400,
        C: 100,
        XC: 90,
        L: 50,
        XL: 40,
        X: 10,
        IX: 9,
        V: 5,
        IV: 4,
        I: 1
    };
    return function toRoman(num) {
        var result = '';
        for (var key in boundaries) {
            if (boundaries.hasOwnProperty(key)) {
                while (num >= boundaries[key]) {
                    result += key;
                    num -= boundaries[key];
                }
            }
        }
        return result;
    };
});