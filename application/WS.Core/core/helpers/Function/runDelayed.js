/// <amd-module name="Core/helpers/Function/runDelayed" />
define("Core/helpers/Function/runDelayed", ["require", "exports"], function (require, exports) {
    "use strict";
    return function runDelayed(fn) {
        var win = typeof window !== 'undefined' ? window : null;
        if (win && win.requestAnimationFrame) {
            win.requestAnimationFrame(fn);
        }
        else {
            setTimeout(fn, 0);
        }
    };
});
