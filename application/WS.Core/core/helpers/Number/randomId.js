define("Core/helpers/Number/randomId", ["require", "exports"], function (require, exports) {
    "use strict";
    return function (prefix) {
        return (prefix || 'ws-') + Math.random().toString(36).substr(2) + (+new Date());
    };
});
