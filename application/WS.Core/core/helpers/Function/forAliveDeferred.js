/// <amd-module name="Core/helpers/Function/forAliveDeferred" />
define("Core/helpers/Function/forAliveDeferred", ["require", "exports"], function (require, exports) {
    'use strict';
    return function (func, control) {
        var result = function () {
            var self = control || this;
            if (self.isDestroyed()) {
                return arguments[0];
            }
            return func.apply(self, arguments);
        };
        //@ts-ignore
        result.wrappedFunction = func;
        return result;
    };
});
