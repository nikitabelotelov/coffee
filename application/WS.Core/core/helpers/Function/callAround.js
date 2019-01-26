/// <amd-module name="Core/helpers/Function/callAround" />
define("Core/helpers/Function/callAround", ["require", "exports"], function (require, exports) {
    "use strict";
    return function callAround(original, decorator) {
        if (arguments.length < 2) {
            decorator = original;
            original = this;
        }
        if (decorator) {
            return function () {
                Array.prototype.unshift.call(arguments, original);
                return decorator.apply(this, arguments);
            };
        }
        return original;
    };
});
