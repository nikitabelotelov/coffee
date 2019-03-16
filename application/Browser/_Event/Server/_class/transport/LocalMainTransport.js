define('Browser/_Event/Server/_class/transport/LocalMainTransport', [
    'require',
    'exports',
    'Core/UserInfo',
    'Browser/Event',
    'Browser/Storage',
    'Browser/_Event/Server/_class/transport/Constants',
    'Browser/_Event/Server/_class/transport/LocalPageTransport',
    'Browser/_Event/Server/_class/Subscribe',
    'Browser/_Event/Server/_class/Events'
], function (require, exports, UserInfo, Event_1, Storage_1, CONST, LocalPageTransport_1, Subscribe_1, Events_1) {
    'use strict';
    Object.defineProperty(exports, '__esModule', { value: true });
    var LocalMainTransport = /** @class */
    function () {
        function LocalMainTransport(stomp, hash, persistent, exchangeName) {
            if (persistent === void 0) {
                persistent = true;
            }
            var _this = this;
            this.stomp = stomp;
            this.hash = hash;
            this.persistent = persistent;
            this.exchangeName = exchangeName;
            this.ls = new Storage_1.LocalStorage(CONST.LS_PREFIX);
            this.taber = new Event_1.Broadcast();    /**
             * Ключ, котоырй указывает, что он не единственный мастер
             * Стейт появляется лишь при закрытии, что бы оно пошло по другому.
             * @type {boolean}
             */
            /**
             * Ключ, котоырй указывает, что он не единственный мастер
             * Стейт появляется лишь при закрытии, что бы оно пошло по другому.
             * @type {boolean}
             */
            this.isAloneMain = true;    /**
             * Нужно всем сообщить, что мастер готов.
             */
            /**
             * Нужно всем сообщить, что мастер готов.
             */
            this.fixMain();    // region Разрешение гонок создания
                               /**
             * Кто последний стал мастером, тот и главный.
             * Все асинхронное, поэтому проверяем по дате создания
             * @type {number}
             */
            // region Разрешение гонок создания
            /**
             * Кто последний стал мастером, тот и главный.
             * Все асинхронное, поэтому проверяем по дате создания
             * @type {number}
             */
            var now = Date.now();
            this.taber.notify(CONST.KEY_MAINREADY, now);    /**
             * Функция отключения транспорта, когда он обнаржил, что не актуален
             */
            /**
             * Функция отключения транспорта, когда он обнаржил, что не актуален
             */
            this.fnQuit = function (event, other) {
                if (other < now) {
                    return;
                }
                _this.taber.unsubscribe(CONST.KEY_MAINREADY, _this.fnQuit);
                _this.isAloneMain = false;
                _this.close(Events_1.EVENT_LATER_MAIN_TRANSPORT);
            };
            this.taber.subscribe(CONST.KEY_MAINREADY, this.fnQuit);
            this.taber.subscribe(CONST.KEY_NEW_PAGE, function (event) {
                if (!UserInfo.isValid()) {
                    _this.fnQuit(event, new Date());
                }
            });    // endregion
            // endregion
            this.ls.removeItem(CONST.KEY_TRY_CREATE_MAIN);    // @ts-ignore
            // @ts-ignore
            this.mainChecker = setInterval(function () {
                _this.fixMain();
            }, CONST.CHECK_MIN_INTERVAL);
            var isAck = 'true' === Storage_1.LocalStorageNative.getItem('shared-bus-ack');
            this.transport = new LocalPageTransport_1.LocalPageTransport(stomp, hash, persistent, exchangeName, isAck);
            this.subFromTaber = function (event, data) {
                _this.subscribe(Subscribe_1.Subscribe.create(data.channelName, data.channeled, false, data.target));
            };
            this.unsubFromTaber = function (event, data) {
                _this.unsubscribe(Subscribe_1.Subscribe.create(data.channelName, data.channeled, false, data.target));
            };
            this.taber.subscribe(CONST.KEY_SUBSCRIBE, this.subFromTaber);
            this.taber.subscribe(CONST.KEY_UNSUBSCRIBE, this.unsubFromTaber);
            window && window.addEventListener('unload', function () {
                _this.close(Events_1.EVENT_DISABLE_SEB);
            });
        }
        LocalMainTransport.prototype.fixMain = function () {
            this.ls.setItem(CONST.KEY_ACTUAL_DATE, Date.now());
        };
        LocalMainTransport.getLocalName = function () {
            return 'LocalMainTransport';
        };
        LocalMainTransport.prototype.getLocalName = function () {
            return LocalMainTransport.getLocalName();
        };
        LocalMainTransport.prototype.subscribe = function (subscribe) {
            this.transport.subscribe(subscribe);
        };
        LocalMainTransport.prototype.unsubscribe = function (subscribe) {
            this.transport.unsubscribe(subscribe);
        };
        LocalMainTransport.prototype.destructor = function (event) {
            /*
             * Может прилететь второй вызов при остановке транспорта черзе хендлер
             */
            if (this.taber) {
                this.taber.unsubscribe(CONST.KEY_SUBSCRIBE, this.subFromTaber);
                this.taber.unsubscribe(CONST.KEY_UNSUBSCRIBE, this.unsubFromTaber);
                this.taber.unsubscribe(CONST.KEY_MAINREADY, this.fnQuit);
                this.taber = undefined;
            }
            if (this.isAloneMain) {
                this.ls.removeItem(CONST.KEY_ACTUAL_DATE);
            }
            clearInterval(this.mainChecker);
            var callback = this.disconnectCallback;
            this.disconnectCallback = function () {
            };    /* @link https://online.sbis.ru/opendoc.html?guid=6a5657b5-9316-4781-9a9d-b80f1688ce8e
               Firefox продолжает выполнять JS даже после перехода на новую страницу во вкладке.
               И объекты уже могут быть очищены, но он их пытается вызывать. */
            /* @link https://online.sbis.ru/opendoc.html?guid=6a5657b5-9316-4781-9a9d-b80f1688ce8e
               Firefox продолжает выполнять JS даже после перехода на новую страницу во вкладке.
               И объекты уже могут быть очищены, но он их пытается вызывать. */
            if (!callback) {
                return;
            }
            callback(event);
        };    /**
         * Обработчик вызывается после деструктора
         * @param {(event) => any} fn
         */
        /**
         * Обработчик вызывается после деструктора
         * @param {(event) => any} fn
         */
        LocalMainTransport.prototype.setDisconnectHandler = function (fn) {
            var _this = this;
            this.disconnectCallback = fn;
            this.transport.setDisconnectHandler(function (event) {
                _this.destructor(event);
            });
        };    /**
         * Закрыте транспорта.
         * При закрытии транспорта не вызывается DisconnectHandler
         */
        /**
         * Закрыте транспорта.
         * При закрытии транспорта не вызывается DisconnectHandler
         */
        LocalMainTransport.prototype.close = function (event) {
            this.transport.close();
            this.destructor(event);
        };
        LocalMainTransport.prototype.setDelivery = function (delivery) {
            this.transport.setDelivery(delivery);
        };
        LocalMainTransport.prototype.setWatchDog = function (watcher) {
            this.transport.setWatchDog(watcher);
        };
        return LocalMainTransport;
    }();
    exports.LocalMainTransport = LocalMainTransport;
});