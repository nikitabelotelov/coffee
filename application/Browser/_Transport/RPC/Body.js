define('Browser/_Transport/RPC/Body', [
    'require',
    'exports',
    'Env/Constants',
    'Browser/_Transport/URL'
], function (require, exports, Constants_1, URL_1) {
    'use strict';
    Object.defineProperty(exports, '__esModule', { value: true });    /**
     * Тело RPC вызова метода бизнес-логики
     * @name Browser/_Transport/RPC/Body
     * @public
     * @author Заляев А.В
     */
                                                                      /**
     * Получение тела RPC для GET запроса
     * @param {String} method Метод бизнес логики
     * @param {*} params Параметры БЛ
     * @param {Number} [id]
     * @return {String}
     * @name Browser/_Transport/RPC/Body#getURL
     */
    /**
     * Тело RPC вызова метода бизнес-логики
     * @name Browser/_Transport/RPC/Body
     * @public
     * @author Заляев А.В
     */
    /**
     * Получение тела RPC для GET запроса
     * @param {String} method Метод бизнес логики
     * @param {*} params Параметры БЛ
     * @param {Number} [id]
     * @return {String}
     * @name Browser/_Transport/RPC/Body#getURL
     */
    exports.getBody = function (method, params, id) {
        return JSON.stringify({
            jsonrpc: '2.0',
            protocol: Constants_1.constants.JSONRPC_PROOTOCOL_VERSION,
            method: method,
            params: params,
            id: id !== undefined ? id : 1
        });
    };    /**
     * Получение тела RPC запроса
     * @param {String} method Метод бизнес логики
     * @param {*} params Параметры БЛ
     * @param {Number} [id]
     * @return {String}
     * @name Browser/_Transport/RPC/Body#getBody
     */
    /**
     * Получение тела RPC запроса
     * @param {String} method Метод бизнес логики
     * @param {*} params Параметры БЛ
     * @param {Number} [id]
     * @return {String}
     * @name Browser/_Transport/RPC/Body#getBody
     */
    exports.getURL = function (method, params, id) {
        return '?protocol=' + Constants_1.constants.JSONRPC_PROOTOCOL_VERSION + '&method=' + encodeURI(method) + '&params=' + encodeURIComponent(URL_1.serializeData(params)) + '&id=' + (id !== undefined ? id : 1);
    };    /**
     * Шаблон пустого RPC ответа от сервиса
     * @return {Object}
     * @name Browser/_Transport/RPC/Body#getEmptyResponse
     */
    /**
     * Шаблон пустого RPC ответа от сервиса
     * @return {Object}
     * @name Browser/_Transport/RPC/Body#getEmptyResponse
     */
    exports.getEmptyResponse = function () {
        return {
            error: {
                message: rk('Получен пустой ответ от сервиса'),
                code: '',
                details: ''
            }
        };
    };
});