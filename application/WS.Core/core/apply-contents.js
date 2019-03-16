define("Core/apply-contents", ["require", "exports", "Core/helpers/Object/isEmpty", "Env/Env"], function (require, exports, isEmpty, Env_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var global = (function () {
        return this || (0, eval)('this');
    })();
    if (global.contents && !isEmpty(global.contents)) {
        Env_1.loadContents(global.contents, false, {
            resources: Env_1.constants.resourceRoot
        });
    }
});
