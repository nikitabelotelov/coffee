define('Browser/Transport', [
    'require',
    'exports',
    'Browser/_Transport/fetch',
    'Browser/_Transport/URL',
    'Browser/_Transport/RPC',
    'Browser/_Transport/ajax-emulator',
    'Browser/_Transport/ITransport',
    'Browser/_Transport/RPCJSON',
    'Browser/_Transport/XHR'
], function (require, exports, fetch, URL, RPC, ajax, ITransport_1, RPCJSON_1, XHR_1) {
    'use strict';
    Object.defineProperty(exports, '__esModule', { value: true });
    exports.fetch = fetch;
    exports.URL = URL;
    exports.RPC = RPC;
    exports.ajax = ajax;
    exports.ITransport = ITransport_1.default;
    exports.RPCJSON = RPCJSON_1.default;
    exports.XHR = XHR_1.default;
});