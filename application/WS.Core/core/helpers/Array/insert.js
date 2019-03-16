/// <amd-module name="Core/helpers/Array/insert" />
define("Core/helpers/Array/insert", ["require", "exports"], function (require, exports) {
    "use strict";
    return function insert(arr, index) {
        if (!(arr instanceof Array)) {
            throw new TypeError('Incorrect type of the first arguments. Array expected');
        }
        if (typeof (index) === 'undefined') {
            throw new TypeError('Index must be defined');
        }
        var curIndex = index;
        for (var i = 2; i <= arguments.length; i++) {
            if (arguments.hasOwnProperty(i)) {
                arr.splice(curIndex++, 0, arguments[i]);
            }
        }
        return [];
    };
});
