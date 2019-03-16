define('Browser/_Transport/RPC/getFetchConfig', [
    'require',
    'exports',
    'Browser/_Transport/RPC/Body',
    'Browser/_Transport/RPC/Headers',
    'Env/Constants'
], function (require, exports, Body_1, Headers_1, Constants_1) {
    'use strict';
    Object.defineProperty(exports, '__esModule', { value: true });
    var isGetMethod = function (method) {
        if (typeof window === 'undefined' || // @ts-ignore
            !window.cachedMethods || // @ts-ignore
            !window.cachedMethods.length) {
            return false;
        }    // @ts-ignore
        // @ts-ignore
        return window.cachedMethods.indexOf(method) > -1;
    };
    var canUseGetMethod = function (url) {
        return url.length < 2 * 1024;
    };    /**
     * Получение параметров вызова Fetch
     * @param {Browser/_Transport/RPC/Config} config
     * @param {String} config.method RPC метод запроса
     * @param {String} config.url Адрес сер
     * @param {Object} [config.body] Тело запросависа
     * @param {Object} [config.headers] Объект заголовков запроса
     * @param {Boolean} [config.asyncInvoke]
     * @param {Boolean} [config.recent]
     * @param {Boolean} [config.fallback]
     * @return {Partial<FetchConfig>}
     */
    /**
     * Получение параметров вызова Fetch
     * @param {Browser/_Transport/RPC/Config} config
     * @param {String} config.method RPC метод запроса
     * @param {String} config.url Адрес сер
     * @param {Object} [config.body] Тело запросависа
     * @param {Object} [config.headers] Объект заголовков запроса
     * @param {Boolean} [config.asyncInvoke]
     * @param {Boolean} [config.recent]
     * @param {Boolean} [config.fallback]
     * @return {Partial<FetchConfig>}
     */
    var getFetchConfig = function (_a) {
        var method = _a.method, body = _a.body, url = _a.url, asyncInvoke = _a.asyncInvoke, recent = _a.recent, fallback = _a.fallback, headers = _a.headers;
        var dataUrl = '';
        var isGet = false;
        var httpMethod = 'POST';
        url = url || Constants_1.constants.defaultServiceUrl;
        if (isGetMethod(method)) {
            dataUrl = Body_1.getURL(method, body);
        }
        if (dataUrl && canUseGetMethod(dataUrl)) {
            httpMethod = 'GET';
            isGet = true;
            url += dataUrl;
        }
        return {
            method: httpMethod,
            headers: new Headers_1.default({
                method: method,
                url: url,
                httpMethod: httpMethod,
                headers: headers,
                asyncInvoke: asyncInvoke,
                recent: recent,
                fallback: fallback
            }),
            body: isGet ? '' : Body_1.getBody(method, body),
            url: url
        };
    };
    exports.default = getFetchConfig;
});