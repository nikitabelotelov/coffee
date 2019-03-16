define('Browser/_Event/Server/_class/RabbitEnv', [
    'require',
    'exports',
    'Env/Env',
    'Core/Deferred',
    'Browser/Transport',
    'Browser/_Event/Server/_class/Constants'
], function (require, exports, Env_1, Deferred, Transport_1, CONST) {
    'use strict';
    Object.defineProperty(exports, '__esModule', { value: true });
    var REQUEST_LIMIT = 2 * 1000;
    var RabbitEnv = /** @class */
    function () {
        function RabbitEnv(watcher) {
            this.watcher = watcher;
        }    /**
         * Пытаемся установить соединение с RabbitMQ.
         * При люббой ошибке связи кроме как от прямого ответа о неработоспособности кролика
         *  пытаемся переподключиться каждые 5 секунд.
         * Повторять процесс соединения нужно полностью, т.к. hash может устареть,
         *  при попытке создания обменника
         * @param {Browser/_Event/Server/_class/ConnectOptions} connectOptions
         * @return {Deferred<string>}
         */
        /**
         * Пытаемся установить соединение с RabbitMQ.
         * При люббой ошибке связи кроме как от прямого ответа о неработоспособности кролика
         *  пытаемся переподключиться каждые 5 секунд.
         * Повторять процесс соединения нужно полностью, т.к. hash может устареть,
         *  при попытке создания обменника
         * @param {Browser/_Event/Server/_class/ConnectOptions} connectOptions
         * @return {Deferred<string>}
         */
        RabbitEnv.prototype.up = function (connectOptions) {
            var _this = this;
            var def = new Deferred();
            var timer = Date.now();
            this.tryCreateChannel(connectOptions).addCallback(function (hash) {
                if (Date.now() - timer > REQUEST_LIMIT) {
                    Env_1.IoC.resolve('ILogger').warn('[STOMP][timeout] /!info request to long: ' + (Date.now() - timer) + 'ms');
                }
                def.callback(hash);
            }).addErrback(function (err) {
                if (err.message == CONST.ERR_MSG_RABBIT_OFF) {
                    def.errback(err);
                    return;
                }
                setTimeout(function () {
                    _this.up(connectOptions).addCallback(function (hash) {
                        def.callback(hash);
                    });
                }, 5000);
            });
            return def;
        };    /**
         * Запрос создания обменника на RabbitMQ
         * @param {Browser/_Event/Server/_class/ConnectOptions} connectOptions
         * @return {Deferred}
         */
        /**
         * Запрос создания обменника на RabbitMQ
         * @param {Browser/_Event/Server/_class/ConnectOptions} connectOptions
         * @return {Deferred}
         */
        RabbitEnv.prototype.tryCreateChannel = function (connectOptions) {
            var _this = this;
            var url = connectOptions.getUrl();
            return new Transport_1.XHR({
                url: url,
                method: 'GET',
                dataType: 'json'
            }).execute().addCallback(function (response) {
                if (!response.websocket) {
                    return new Error(CONST.ERR_MSG_RABBIT_OFF);
                }
                return connectOptions.hash;
            }).addErrback(function (err) {
                _this.watcher.logConnect({
                    message: 'error get info',
                    url: url,
                    err: err
                });
                return err;
            });
        };
        return RabbitEnv;
    }();
    exports.RabbitEnv = RabbitEnv;
});