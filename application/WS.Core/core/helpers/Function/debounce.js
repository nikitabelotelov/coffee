/// <amd-module name="Core/helpers/Function/debounce" />
define("Core/helpers/Function/debounce", ["require", "exports"], function (require, exports) {
    "use strict";
    return function debounce(original, delay, first) {
        if (typeof original !== 'function') {
            first = delay;
            delay = original;
            original = this;
        }
        var wait = false, timer;
        return function () {
            if (wait) {
                return;
            }
            if (first && !timer) {
                original.apply(this, arguments);
                wait = true;
                setTimeout(function () {
                    wait = false;
                }, delay);
                return;
            }
            if (timer) {
                clearTimeout(timer);
            }
            var argsToCallWith = Array.prototype.slice.call(arguments);
            argsToCallWith.unshift(this);
            // original.bind(this, arg1, arg2, arg3, ...);
            timer = setTimeout(original.bind.apply(original, argsToCallWith), delay);
        };
    };
});
