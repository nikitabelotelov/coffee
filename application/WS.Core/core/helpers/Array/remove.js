/// <amd-module name="Core/helpers/Array/remove" />
define("Core/helpers/Array/remove", ["require", "exports"], function (require, exports) {
    "use strict";
    return function remove(arr, index, count) {
        var resCount = count || 1;
        if (!(arr instanceof Array)) {
            throw new TypeError('Incorrect type of the first arguments. Array expected');
        }
        return arr.splice(index, resCount);
    };
});
