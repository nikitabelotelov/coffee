define('Env/Config', [
    'require',
    'exports',
    'Env/_Config/ClientsGlobalConfig',
    'Env/_Config/ClientsGlobalConfigOld',
    'Env/_Config/UserConfigOld',
    'Env/_Config/UserConfig',
    'Env/_Config/AbstractConfigOld'
], function (require, exports, ClientsGlobalConfig_1, ClientsGlobalConfigOld_1, UserConfigOld_1, UserConfig_1, AbstractConfigOld_1) {
    'use strict';
    Object.defineProperty(exports, '__esModule', { value: true });
    exports.ClientsGlobalConfig = ClientsGlobalConfig_1.default;
    exports.ClientsGlobalConfigOld = ClientsGlobalConfigOld_1.default;
    exports.UserConfigOld = UserConfigOld_1.default;
    exports.UserConfig = UserConfig_1.default;
    exports.AbstractConfigOld = AbstractConfigOld_1.default;
});