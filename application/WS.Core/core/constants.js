define("Core/constants", ["require", "exports", "Env/Env"], function (require, exports, Env_1) {
    "use strict";
    Env_1.IoC.resolve('ILogger').log("Core/constants", 'module has been moved to "Env/Env:constants" and will be removed');
    return Env_1.constants;
});
