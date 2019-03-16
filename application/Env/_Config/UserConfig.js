define('Env/_Config/UserConfig', [
    'require',
    'exports',
    'Env/_Config/UserConfigOld',
    'Env/_Config/_ConfigMapper',
    'Env/Constants',
    'optional!ParametersWebAPI/Scope'
], function (require, exports, UserConfigOld_1, _ConfigMapper_1, Constants_1, Scope) {
    'use strict';
    Object.defineProperty(exports, '__esModule', { value: true });
    var Loader;
    if (Scope && Scope.USER) {
        Loader = Scope.USER;
    }
    exports.default = _ConfigMapper_1.default(UserConfigOld_1.default, Loader, !Constants_1.constants.userConfigSupport);
});