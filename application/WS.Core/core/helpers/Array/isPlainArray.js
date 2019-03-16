/// <amd-module name="Core/helpers/Array/isPlainArray" />
define("Core/helpers/Array/isPlainArray", ["require", "exports"], function (require, exports) {
    "use strict";
    return function isPlainArray(arr) {
        return Array.isArray(arr);
    };
});
