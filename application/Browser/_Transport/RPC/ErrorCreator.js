define('Browser/_Transport/RPC/ErrorCreator', [
    'require',
    'exports',
    'Browser/_Transport/RPC/Error',
    'Env/Constants',
    'Browser/_Transport/fetch/Errors'
], function (require, exports, Error_1, Constants_1, Errors_1) {
    'use strict';
    Object.defineProperty(exports, '__esModule', { value: true });
    exports.fromRPC = function (config, methodName, url) {
        return new Error_1.default({
            httpError: config.httpError !== 'undefined' ? config.httpError : '',
            code: config.code,
            methodName: methodName,
            details: config.details,
            url: url || Constants_1.constants.defaultServiceUrl,
            message: config.message,
            classid: config.data && config.data.classid,
            errType: config.type,
            addinfo: config.data && config.data.addinfo,
            error_code: config.data && config.data.error_code
        });
    };
    exports.fromHTTP = function (error, method) {
        if (!(error instanceof Errors_1.HTTP)) {
            return error;
        }
        var config = {
            message: error.message,
            httpError: error.httpError,
            code: 0
        };
        var payload;
        try {
            payload = JSON.parse(error.payload);
        } catch (_a) {
            payload = {};
        }
        var payloadError = payload.error;
        Object.assign(config, payloadError);
        return exports.fromRPC(config, method, error.url);
    };
});