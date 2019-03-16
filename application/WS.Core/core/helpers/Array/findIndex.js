/// <amd-module name="Core/helpers/Array/findIndex" />
define("Core/helpers/Array/findIndex", ["require", "exports"], function (require, exports) {
    "use strict";
    return function findIndex(array, predicate, context) {
        var result = -1;
        if (!Array.isArray(array)) {
            return result;
        }
        if (!predicate) {
            predicate = function (item) {
                return !!item;
            };
        }
        for (var i = 0, l = array.length; i < l; i++) {
            if (i in array) {
                if (predicate.call(context, array[i], i, array)) {
                    result = i;
                    break;
                }
            }
        }
        return result;
    };
});
