define("Core/IoC", ["require", "exports", "Env/Env"], function (require, exports, Env_1) {
    "use strict";
    Env_1.IoC.resolve('ILogger').log("Core/IoC", 'module has been moved to "Env/Env:IoC" and will be removed');
    return Env_1.IoC;
});
