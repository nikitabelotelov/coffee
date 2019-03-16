define("Core/helpers/Array/flatten", ["require", "exports"], function (require, exports) {
    "use strict";
    return function flatten(arr, skipundefined) {
        var result = [], i, ln = arr.length;
        for (i = 0; i !== ln; i++) {
            if (Array.isArray(arr[i])) {
                result = result.concat(flatten(arr[i], skipundefined));
            }
            else {
                if (skipundefined && arr[i] === undefined) {
                    continue;
                }
                result.push(arr[i]);
            }
        }
        return result;
    };
});
