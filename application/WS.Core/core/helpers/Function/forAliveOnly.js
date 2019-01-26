/// <amd-module name="Core/helpers/Function/forAliveOnly" />
define("Core/helpers/Function/forAliveOnly", ["require", "exports"], function (require, exports) {
    'use strict';
    return function forAliveOnly(func, control) {
        var result = function () {
            var self = control || this;
            if (!self.isDestroyed()) {
                return func.apply(self, arguments);
            }
        };
        //@ts-ignore
        result.wrappedFunction = func;
        return result;
    };
});
