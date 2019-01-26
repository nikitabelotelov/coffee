define("Core/helpers/Function/callNextWithCondition", ["require", "exports", "Core/helpers/Function/callNext"], function (require, exports, callNext) {
    "use strict";
    return function callNextWithCondition(original, decorator, condition) {
        if (arguments.length < 3) {
            condition = decorator;
            decorator = original;
            original = this;
        }
        if (decorator) {
            return callNext(original, function () {
                if (condition && condition.apply(this, [])) {
                    return decorator.apply(this, arguments);
                }
            });
        }
        return original;
    };
});
