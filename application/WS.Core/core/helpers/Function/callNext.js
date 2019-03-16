define("Core/helpers/Function/callNext", ["require", "exports"], function (require, exports) {
    "use strict";
    return function callNext(original, decorator) {
        if (arguments.length < 2) {
            decorator = original;
            original = this;
        }
        return function () {
            var originalResult = original.apply(this, arguments), decoratorResult;
            if (decorator) {
                Array.prototype.push.call(arguments, originalResult);
                decoratorResult = decorator.apply(this, arguments);
            }
            return decoratorResult === undefined ? originalResult : decoratorResult;
        };
    };
});
