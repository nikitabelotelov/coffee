define('Env/_Config/ClientsGlobalConfig', [
    'require',
    'exports',
    'Env/_Config/ClientsGlobalConfigOld',
    'Env/_Config/_ConfigMapper',
    'Env/Constants',
    'optional!ParametersWebAPI/Scope'
], function (require, exports, ClientsGlobalConfigOld_1, _ConfigMapper_1, Constants_1, Scope) {
    'use strict';
    Object.defineProperty(exports, '__esModule', { value: true });
    var Loader;
    if (Scope && Scope.ACCOUNT) {
        Loader = Scope.ACCOUNT;
    }
    exports.default = _ConfigMapper_1.default(ClientsGlobalConfigOld_1.default, Loader, !Constants_1.default.globalConfigSupport);
});