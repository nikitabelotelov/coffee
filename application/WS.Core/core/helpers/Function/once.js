/// <amd-module name="Core/helpers/Function/once" />
define("Core/helpers/Function/once", ["require", "exports"], function (require, exports) {
    "use strict";
    return function once(original) {
        if (arguments.length < 1) {
            original = this;
        }
        var called = false, result;
        return function () {
            if (!called) {
                result = original.apply(this, arguments);
                called = true;
            }
            else {
                original = null;
            }
            return result;
        };
    };
});
