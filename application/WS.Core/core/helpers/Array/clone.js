define("Core/helpers/Array/clone", ["require", "exports", "Core/core-merge"], function (require, exports, merge) {
    "use strict";
    return function clone(array) {
        var plainProto = Object.prototype;
        var copy = array.slice();
        for (var i = 0, l = copy.length; i < l; i++) {
            var item = copy[i];
            if (item) {
                if (Array.isArray(item)) {
                    copy[i] = clone(item);
                }
                else if (typeof item === 'object' && Object.getPrototypeOf(item) === plainProto) {
                    var obj = copy[i] = merge({}, item);
                    for (var j in obj) {
                        if (obj.hasOwnProperty(j) && Array.isArray(obj[j])) {
                            obj[j] = clone(obj[j]);
                        }
                    }
                }
            }
        }
        return copy;
    };
});
