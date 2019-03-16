define("Core/ClientsGlobalConfig", ["require", "exports", "Env/Config", "Env/Env"], function (require, exports, Config_1, Env_1) {
    "use strict";
    Env_1.IoC.resolve('ILogger').log("Core/ClientsGlobalConfig", 'module has been moved to "Env/Config:ClientsGlobalConfig" and will be removed');
    return Config_1.ClientsGlobalConfig;
});
