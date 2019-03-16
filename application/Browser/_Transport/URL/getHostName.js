define('Browser/_Transport/URL/getHostName', [
    'require',
    'exports'
], function (require, exports) {
    'use strict';
    Object.defineProperty(exports, '__esModule', { value: true });    /// <amd-module name="Browser/_Transport/URL/getHostName" />
    /// <amd-module name="Browser/_Transport/URL/getHostName" />
    function default_1() {
        // @ts-ignore
        var req = process && process.domain && process.domain.req;
        return req ? req.hostname : location.hostname;
    }
    exports.default = default_1;
    ;
});