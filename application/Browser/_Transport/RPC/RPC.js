define('Browser/_Transport/RPC/RPC', [
    'require',
    'exports',
    'Browser/_Transport/Sbis/fetch',
    'Browser/_Transport/_utils',
    'Browser/_Transport/RPC/Body',
    'Browser/_Transport/RPC/ErrorCreator',
    'Env/Event',
    'Browser/_Transport/RPC/getFetchConfig',
    'Browser/_Transport/fetch/Errors'
], function (require, exports, fetch_1, _utils_1, Body_1, ErrorCreator, Event_1, getFetchConfig_1, Errors_1) {
    'use strict';
    var getGlobalChannel = function () {
        return Event_1.Bus.globalChannel();
    };
    var getErrorChannel = function () {
        return Event_1.Bus.channel('errors');
    };    /**
     * Транспорт для вызова методов бизнес-логики в формате json-rpc.
     * @param {Object} config
     * @param {String} config.method Метод бизнес-логики
     * @param {*} [config.body] Тело запроса
     * @param {Object} [config.headers] Дополнительные заголовки запроса
     * @param {String} [config.url] Адрес сервиса
     * @param {Boolean} [config.asyncInvoke] Устанавливать ли заголовок X-ASYNCINVOKE,
     * который отвечает за автоматическое закрытие соединение сервером,
     * не дожидаясь обработки выполнения метода бизнес логики
     * @param {Boolean} [config.recent] Признак, по которому чтение данных будет произведено из master-базы.
     * @return {Env/Transport/AbortPromise}
     *
     * @name Env/Transport/RPC
     * @author Заляев А.В.
     * @public
     * @function
     * @see Env/Transport/RPC/Error
     * @see Env/Transport/fetch
     * @see Env/Transport/sbis
     */
    /**
     * Транспорт для вызова методов бизнес-логики в формате json-rpc.
     * @param {Object} config
     * @param {String} config.method Метод бизнес-логики
     * @param {*} [config.body] Тело запроса
     * @param {Object} [config.headers] Дополнительные заголовки запроса
     * @param {String} [config.url] Адрес сервиса
     * @param {Boolean} [config.asyncInvoke] Устанавливать ли заголовок X-ASYNCINVOKE,
     * который отвечает за автоматическое закрытие соединение сервером,
     * не дожидаясь обработки выполнения метода бизнес логики
     * @param {Boolean} [config.recent] Признак, по которому чтение данных будет произведено из master-базы.
     * @return {Env/Transport/AbortPromise}
     *
     * @name Env/Transport/RPC
     * @author Заляев А.В.
     * @public
     * @function
     * @see Env/Transport/RPC/Error
     * @see Env/Transport/fetch
     * @see Env/Transport/sbis
     */
    var RPC = function (config) {
        var request = fetch_1.fetch(getFetchConfig_1.default(config), fetch_1.RESPONSE_TYPE.JSON);
        var processing = request.then(function (response) {
            var resp = response || Body_1.getEmptyResponse();    // 200, но пустой ответ или вложенная ошибка
            // 200, но пустой ответ или вложенная ошибка
            if ('error' in resp) {
                throw ErrorCreator.fromRPC(resp.error, config.method, config.url);
            }
            return resp.result;
        }, function (error) {
            if (error instanceof Errors_1.Connection) {
                var _a = config.method.split('.'), object = _a[0], method = _a[1];
                getGlobalChannel().notify('onOfflineModeError', object, method, error);
            }
            throw ErrorCreator.fromHTTP(error, config.method);
        }).catch(function (error) {
            if (error.canceled) {
                throw error;
            }
            if (!error.details) {
                var code = error.httpError || 0;
                error.details = code > 500 ? rk('Попробуйте заглянуть сюда через 15 минут') : '';
            }
            getErrorChannel().notify('onRPCError', error);
            throw error;
        });
        return _utils_1.getAbortedPromise(processing, request);
    };
    return RPC;
});