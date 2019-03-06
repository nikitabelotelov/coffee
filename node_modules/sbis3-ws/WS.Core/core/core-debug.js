define("Core/core-debug", ["require", "exports", "Env/Env"], function (require, exports, Env_1) {
    "use strict";
    Env_1.IoC.resolve('ILogger').log("Core/core-debug", 'module has been moved to "Env/Env:coreDebug" and will be removed');
    return Env_1.coreDebug;
});
