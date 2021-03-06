define('Browser/_Event/Server/_class/DeviceEnv', [
    'require',
    'exports',
    'Core/Deferred',
    'Env/Env',
    'Browser/Transport',
    'Browser/_Event/Server/_class/Constants',
    'Browser/_Event/Server/_class/ConnectOptions'
], function (require, exports, Deferred, Env_1, Transport_1, CONST, ConnectOptions_1) {
    'use strict';
    Object.defineProperty(exports, '__esModule', { value: true });
    function sidFromCookie() {
        var sid = document.cookie.split('; ').filter(function (i) {
            return i.substr(0, 4) == 'sid=';
        }).map(function (i) {
            return i.substr(4);
        }).pop();
        return sid;
    }
    var REQUEST_LIMIT = 2 * 1000;
    var MINUTE = 60000;
    var SECONDS_10 = 10000;
    var DeviceEnv = /** @class */
    function () {
        function DeviceEnv() {
        }    /**
         * Проверяем окружение и получем данные для соединения
         * Вызываться должно перед /info потому что на некоторых страницах из-за отсутствия
         *  авторизации получали код 401 на запрос из RabbitEnv::tryCreateChannel и уходили
         *  в бесконечную перезагрузку страницы
         *  https://online.sbis.ru/opendoc.html?guid=4fd283fb-e699-451a-be23-72778f2dff2e&des=
         * @return {Deferred} Возвращает url хоста или undefined
         */
        /**
         * Проверяем окружение и получем данные для соединения
         * Вызываться должно перед /info потому что на некоторых страницах из-за отсутствия
         *  авторизации получали код 401 на запрос из RabbitEnv::tryCreateChannel и уходили
         *  в бесконечную перезагрузку страницы
         *  https://online.sbis.ru/opendoc.html?guid=4fd283fb-e699-451a-be23-72778f2dff2e&des=
         * @return {Deferred} Возвращает url хоста или undefined
         */
        DeviceEnv.getConnectData = function (lastTimeout) {
            if (!lastTimeout) {
                lastTimeout = Math.round(Math.random() * SECONDS_10);
            }
            if (lastTimeout > MINUTE) {
                lastTimeout = MINUTE;
            }
            var def = new Deferred();
            var timer = Date.now();
            new Transport_1.XHR({
                url: '/!hash/',
                method: 'GET',
                dataType: 'json'
            }).execute().addCallback(function (response) {
                if (Date.now() - timer > REQUEST_LIMIT) {
                    Env_1.IoC.resolve('ILogger').warn('[STOMP][timeout] /!hash/ request to long: ' + (Date.now() - timer) + 'ms');
                }
                def.callback(response.result);
            }).addErrback(function (err) {
                if (err.httpError === 404) {
                    def.errback(err);
                    return;
                }    // httpError === 0 — нет соединения с интернетом
                // httpError === 0 — нет соединения с интернетом
                if (err.httpError === 0) {
                    lastTimeout = SECONDS_10;
                }
                setTimeout(function () {
                    DeviceEnv.getConnectData(lastTimeout + Math.round(Math.random() * 10000)).addCallback(function (data) {
                        def.callback(data);
                    });
                }, lastTimeout);
            });
            return def;
        };
        DeviceEnv.getOptions = function () {
            var result = new Deferred();
            DeviceEnv.getConnectData().addCallbacks(function (data) {
                var sid = data.sid;
                if (!sid) {
                    sid = sidFromCookie();
                }
                if (!sid) {
                    throw new Error(CONST.ERR_MSG_EMPTY_SID);
                }
                if (!data.user) {
                    return new Error(CONST.ERR_MSG_HASH_401);
                }
                var cid = data.cid;
                if (!cid) {
                    cid = sid.substr(0, 8);
                }
                var uid = data.uid;
                if (!uid) {
                    uid = sid.substr(9, 8);
                }
                var connectOptions;
                if (!!data.url) {
                    connectOptions = ConnectOptions_1.ConnectOptions.createForDesktop(sid, data.user, data.url, cid, uid);
                }
                var stompPath = '/stomp/';
                if (!!data.path) {
                    stompPath = data.path;
                }
                if (data.domain) {
                    connectOptions = new ConnectOptions_1.ConnectOptions(sid, data.user, location.protocol, data.domain, stompPath, data.exchange, cid, uid);
                }
                if (!connectOptions) {
                    connectOptions = ConnectOptions_1.ConnectOptions.createByLocation(sid, data.user, stompPath, cid, uid);
                }
                result.callback(connectOptions);
            }, function (err) {
                result.errback(err);
            });
            return result;
        };
        return DeviceEnv;
    }();
    exports.DeviceEnv = DeviceEnv;
});