define("Core/load-contents", ["require", "exports", "Env/Env"], function (require, exports, Env_1) {
    "use strict";
    Env_1.IoC.resolve('ILogger').log("Core/load-contents", 'module has been moved to "Env/Env:loadContents" and will be removed');
    return Env_1.loadContents;
});
