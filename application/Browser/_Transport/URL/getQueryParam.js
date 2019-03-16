define('Browser/_Transport/URL/getQueryParam', [
    'require',
    'exports'
], function (require, exports) {
    'use strict';
    Object.defineProperty(exports, '__esModule', { value: true });    /// <amd-module name="Browser/_Transport/URL/getQueryParam" />
    /// <amd-module name="Browser/_Transport/URL/getQueryParam" />
    function _parseString(string, regExp) {
        var match = regExp.exec(string);
        return match && decodeURI(match[1]);
    }
    function default_1(name) {
        var
            // @ts-ignore
            req = typeof process !== 'undefined' && process.domain && process.domain.req, regExp = new RegExp('[?&]' + name + '=([^&]*)');
        return req && req.query ? req.query[name] : typeof location !== 'undefined' ? _parseString(location.search, regExp) : '';
    }
    exports.default = default_1;
    ;
});