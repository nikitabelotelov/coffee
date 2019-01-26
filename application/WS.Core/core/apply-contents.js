define("Core/apply-contents", ["require", "exports", "Core/helpers/Object/isEmpty", "Core/load-contents", "Core/constants"], function (require, exports, isEmpty, loadContents, constants) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var global = (function () {
        return this || (0, eval)('this');
    })();
    if (global.contents && !isEmpty(global.contents)) {
        loadContents(global.contents, false, {
            resources: constants.resourceRoot
        });
    }
});
