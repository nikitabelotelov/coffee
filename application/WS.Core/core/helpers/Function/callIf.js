define("Core/helpers/Function/callIf", ["require", "exports"], function (require, exports) {
    "use strict";
    return function callIf(original, condition) {
        if (arguments.length < 2) {
            condition = original;
            original = this;
        }
        return function () {
            if (condition && condition.apply(this, [])) {
                return original.apply(this, arguments);
            }
        };
    };
});
