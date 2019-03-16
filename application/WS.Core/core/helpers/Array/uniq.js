/// <amd-module name="Core/helpers/Array/uniq" />
define("Core/helpers/Array/uniq", ["require", "exports"], function (require, exports) {
    "use strict";
    return function uniq(array) {
        if (!Array.isArray(array)) {
            throw new TypeError('Invalid type of the first argument. Array expected.');
        }
        var cache = {};
        return array.reduce(function (prev, curr) {
            if (!cache.hasOwnProperty(curr)) {
                cache[curr] = true;
                prev.push(curr);
            }
            return prev;
        }, []);
    };
});
