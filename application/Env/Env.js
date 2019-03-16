define('Env/Env', [
    'require',
    'exports',
    'Env/_Env/compatibility',
    'Env/_Env/detection',
    'Env/_Env/ConsoleLogger',
    'Env/_Env/ILogger',
    'Env/_Env/cookie',
    'Env/_Env/coreDebug',
    'Env/_Env/IoC',
    'Env/_Env/loadContents',
    'Env/_Env/isIncognito',
    'Env/_Env/constants'
], function (require, exports, compatibility, detection, ConsoleLogger_1, ILogger_1, cookie_1, coreDebug_1, IoC_1, loadContents_1, isIncognito_1, constants_1) {
    'use strict';
    Object.defineProperty(exports, '__esModule', { value: true });
    exports.compatibility = compatibility;
    exports.detection = detection;
    exports.ConsoleLogger = ConsoleLogger_1.default;
    exports.ILogger = ILogger_1.default;
    exports.cookie = cookie_1.default;
    exports.coreDebug = coreDebug_1.default;
    exports.IoC = IoC_1.default;
    exports.loadContents = loadContents_1.default;
    exports.isIncognito = isIncognito_1.default;
    exports.constants = constants_1.default;
});