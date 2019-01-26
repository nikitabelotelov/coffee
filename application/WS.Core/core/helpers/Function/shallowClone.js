define("Core/helpers/Function/shallowClone", ["require", "exports", "Core/core-merge"], function (require, exports, merge) {
    "use strict";
    return function (hash) {
        var result;
        if (Array.isArray(hash)) {
            result = hash.slice(0);
        }
        else {
            result = merge({}, hash, { clone: false, rec: false });
        }
        return result;
    };
});
