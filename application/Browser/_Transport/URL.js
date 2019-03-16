define('Browser/_Transport/URL', [
    'require',
    'exports',
    'Browser/_Transport/URL/deserializeData',
    'Browser/_Transport/URL/serializeData',
    'Browser/_Transport/URL/getHostName',
    'Browser/_Transport/URL/getQueryParam',
    'Browser/_Transport/URL/getUrl'
], function (require, exports, deserializeData_1, serializeData_1, getHostName_1, getQueryParam_1, getUrl_1) {
    'use strict';
    Object.defineProperty(exports, '__esModule', { value: true });
    exports.deserializeData = deserializeData_1.default;
    exports.serializeData = serializeData_1.default;
    exports.getHostName = getHostName_1.default;
    exports.getQueryParam = getQueryParam_1.default;
    exports.getUrl = getUrl_1.default;
});