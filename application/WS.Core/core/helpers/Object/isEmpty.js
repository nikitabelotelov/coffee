/// <amd-module name="Core/helpers/Object/isEmpty" />
define("Core/helpers/Object/isEmpty", ["require", "exports"], function (require, exports) {
    "use strict";
    return function isEmpty(obj) {
        if (obj === null || typeof (obj) !== 'object') {
            return false;
        }
        if (obj instanceof Object) {
            for (var i in obj) {
                return false;
            }
        }
        else if (obj instanceof Array) {
            return obj.length === 0;
        }
        return true;
    };
});
