define("Core/helpers/Function/throttle", ["require", "exports"], function (require, exports) {
    "use strict";
    return function throttle(original, delay, last) {
        if (typeof original !== 'function') {
            last = delay;
            delay = original;
            original = this;
        }
        var state = true, next;
        return function () {
            if (state) {
                original.apply(this, arguments);
                state = false;
                setTimeout(function () {
                    state = true;
                    if (last && next) {
                        next();
                        next = null;
                    }
                }, delay);
            }
            else if (last) {
                var argsToCallWith = Array.prototype.slice.call(arguments);
                argsToCallWith.unshift(this);
                next = original.bind.apply(original, argsToCallWith);
            }
        };
    };
});
