define('Browser/_Transport/RPC', [
    'require',
    'exports',
    'Browser/_Transport/RPC/Body',
    'Browser/_Transport/RPC/ErrorCreator',
    'Browser/_Transport/RPC/Headers',
    'Browser/_Transport/RPC/Error',
    'Browser/_Transport/RPC/getInvocationUrl'
], function (require, exports, Body, ErrorCreator, Headers_1, Error_1, getInvocationUrl_1) {
    'use strict';
    Object.defineProperty(exports, '__esModule', { value: true });
    exports.Body = Body;
    exports.ErrorCreator = ErrorCreator;
    exports.Headers = Headers_1.default;
    exports.Error = Error_1.default;
    exports.getInvocationUrl = getInvocationUrl_1.default;
});