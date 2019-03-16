define('Browser/_Transport/fetch', [
    'require',
    'exports',
    'Browser/_Transport/fetch/Errors',
    'Browser/_Transport/fetch/fetch',
    'Browser/_Transport/fetch/responseParser',
    'Browser/_Transport/fetch/interface'
], function (require, exports, Errors, fetch_1, responseParser_1, interface_1) {
    'use strict';
    Object.defineProperty(exports, '__esModule', { value: true });
    exports.Errors = Errors;
    exports.fetch = fetch_1.default;
    exports.RESPONSE_TYPE = responseParser_1.RESPONSE_TYPE;
    exports.responseParser = responseParser_1.parse;
    exports.AbortPromise = interface_1.AbortPromise;
    exports.FetchConfig = interface_1.FetchConfig;
    exports.FetchTransport = interface_1.FetchTransport;
    exports.HttpMethod = interface_1.HttpMethod;
    exports.default = fetch_1.default;
});