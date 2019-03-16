define('Browser/_Transport/URL/getUrl', [
    'require',
    'exports'
], function (require, exports) {
    'use strict';
    Object.defineProperty(exports, '__esModule', { value: true });    /// <amd-module name="Browser/_Transport/URL/getUrl" />
    /// <amd-module name="Browser/_Transport/URL/getUrl" />
    function default_1() {
        // @ts-ignore
        var req = process && process.domain && process.domain.req;
        return req ? req.originalUrl : location ? location.href : '';
    }
    exports.default = default_1;
    ;
});