define("Core/compatibility", ["require", "exports", "Env/Env"], function (require, exports, Env_1) {
    "use strict";
    Env_1.IoC.resolve('ILogger').log("Core/compatibility", 'module has been moved to "Env/Env:compatibility" and will be removed');
    return Env_1.compatibility;
});
