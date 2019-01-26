define("Core/helpers/Function/callBeforeWithCondition", ["require", "exports", "Core/helpers/Function/callBefore"], function (require, exports, callBefore) {
    "use strict";
    return function callBeforeWithCondition(original, decorator, condition) {
        if (arguments.length < 3) {
            condition = decorator;
            decorator = original;
            original = this;
        }
        if (decorator) {
            return callBefore(original, function () {
                if (condition && condition.apply(this, [])) {
                    return decorator.apply(this, arguments);
                }
            });
        }
        return original;
    };
});
