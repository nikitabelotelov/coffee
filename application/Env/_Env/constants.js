define('Env/_Env/constants', [
    'require',
    'exports',
    'Env/_Env/compatibility',
    'Env/_Env/detection',
    'Env/Constants'
], function (require, exports, compatibility, detection, Constants_1) {
    'use strict';
    Object.defineProperty(exports, '__esModule', { value: true });
    exports.default = Object.assign(Constants_1.default, {
        browser: detection,
        compatibility: compatibility
    });
});