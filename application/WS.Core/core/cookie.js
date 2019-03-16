define("Core/cookie", ["require", "exports", "Env/Env"], function (require, exports, Env_1) {
    "use strict";
    Env_1.IoC.resolve('ILogger').log("Core/cookie", 'module has been moved to "Env/Env:cookie" and will be removed');
    return Env_1.cookie;
});
