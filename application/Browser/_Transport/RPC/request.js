define('Browser/_Transport/RPC/request', [
    'require',
    'exports',
    'Env/Event',
    'Browser/_Transport/RPC/Body',
    'Browser/_Transport/RPC/ErrorCreator'
], function (require, exports, Event_1, RPCBody, ErrorCreator) {
    'use strict';
    Object.defineProperty(exports, '__esModule', { value: true });    /**
     * @param {Error} error
     */
    /**
     * @param {Error} error
     */
    var notify = function (error) {
        Event_1.Bus.channel('errors').notify('onRPCError', error);
    };    /**
     * @cfg {Browser/_Transport/ITransport} transport Транспорт, по которому будет осуществлён запрос
     */
          /**
     * @cfg {String} data Тело запроса в виде строки.
     */
          /**
     * @cfg {Object} headers Объект с необходимыми заголовками.
     */
          /**
     * Отправляет запрос на бизнес-логику
     * @name Browser/_Transport/RPC/request
     * @private
     * @author Заляев А.В
     */
    /**
     * @cfg {Browser/_Transport/ITransport} transport Транспорт, по которому будет осуществлён запрос
     */
    /**
     * @cfg {String} data Тело запроса в виде строки.
     */
    /**
     * @cfg {Object} headers Объект с необходимыми заголовками.
     */
    /**
     * Отправляет запрос на бизнес-логику
     * @name Browser/_Transport/RPC/request
     * @private
     * @author Заляев А.В
     */
    var request = function (_a) {
        var data = _a.data, headers = _a.headers, transport = _a.transport, method = _a.method, url = _a.url;
        return transport.execute(data, headers).addCallbacks(function (response) {
            var resp = response || RPCBody.getEmptyResponse();    // 200, но пустой ответ или вложенная ошибка
            // 200, но пустой ответ или вложенная ошибка
            if ('error' in resp) {
                return ErrorCreator.fromRPC(resp.error, method, url);
            }
            return resp.result;
        }, function (error) {
            return ErrorCreator.fromHTTP(error, method);
        }).addErrback(function (error) {
            notify(error);
            return error;
        });
    };
    exports.default = request;
});