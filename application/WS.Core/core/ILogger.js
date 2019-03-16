define("Core/ILogger", ["require", "exports", "Env/Env"], function (require, exports, Env_1) {
    "use strict";
    Env_1.IoC.resolve('ILogger').log("Core/ILogger", 'module has been moved to "Env/Env:ILogger" and will be removed');
    return Env_1.ILogger;
});
