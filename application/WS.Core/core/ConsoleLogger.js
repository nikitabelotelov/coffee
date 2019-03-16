define("Core/ConsoleLogger", ["require", "exports", "Env/Env"], function (require, exports, Env_1) {
    "use strict";
    Env_1.IoC.resolve('ILogger').log("Core/ConsoleLogger", 'module has been moved to "Env/Env:ConsoleLogger" and will be removed');
    return Env_1.ConsoleLogger;
});
