define('Browser/_Event/Server/_class/transport/LocalSlaveTransport', [
    'require',
    'exports',
    'tslib',
    'Browser/Event',
    'Browser/Storage',
    'Browser/_Event/Server/_class/transport/Constants',
    'Browser/_Event/Server/_class/transport/Transport',
    'Browser/_Event/Server/_class/Events',
    'Browser/_Event/Server/_class/SubscribeContainer'
], function (require, exports, tslib_1, Event_1, Storage_1, CONST, Transport_1, Events_1, SubscribeContainer_1) {
    'use strict';
    Object.defineProperty(exports, '__esModule', { value: true });
    var LocalSlaveTransport = /** @class */
    function (_super) {
        tslib_1.__extends(LocalSlaveTransport, _super);
        function LocalSlaveTransport() {
            var _this = _super.call(this) || this;
            _this.ls = new Storage_1.LocalStorage(CONST.LS_PREFIX);
            _this.taber = new Event_1.Broadcast();
            _this.subscribes = new SubscribeContainer_1.SubscribeContainer();
            _this.minInterval = CONST.CHECK_MIN_INTERVAL * 2 + Math.floor(Math.random() * CONST.RECONNECT_INTERVAL);
            _this.setDisconnectHandler(function () {
            });
            _this.subMainReady = function () {
                if (!_this.subscribes.hasChanneled()) {
                    return;
                }
                _this.destructor('Reconnect to resubscribe');
            };
            _this.taber.subscribe(CONST.KEY_MAINREADY, _this.subMainReady);
            _this.unloadWindow = _this.unloadWindow.bind(_this);
            window.addEventListener('unload', _this.unloadWindow);
            _this.taber.notify(CONST.KEY_NEW_PAGE, '');
            return _this;
        }
        LocalSlaveTransport.prototype.getLocalName = function () {
            return LocalSlaveTransport.getLocalName();
        };
        LocalSlaveTransport.getLocalName = function () {
            return 'LocalSlaveTransport';
        };
        LocalSlaveTransport.prototype.subscribe = function (subscribe) {
            this.subscribes.add(subscribe);
            this.taber.notify(CONST.KEY_SUBSCRIBE, subscribe);
        };
        LocalSlaveTransport.prototype.unsubscribe = function (subscribe) {
            this.subscribes.remove(subscribe);
            this.taber.notify(CONST.KEY_UNSUBSCRIBE, subscribe);
        };    /**
         * Функция, которая очищает ресурсы
         */
        /**
         * Функция, которая очищает ресурсы
         */
        LocalSlaveTransport.prototype.destructor = function (message, isFireCallback) {
            if (isFireCallback === void 0) {
                isFireCallback = true;
            }
            this.taber.unsubscribe(CONST.KEY_MAINREADY, this.subMainReady);
            if (this.mainChecker) {
                clearInterval(this.mainChecker);
                this.mainChecker = undefined;
            }
            this.taber = undefined;
            window.removeEventListener('unload', this.unloadWindow);
            var callback = this.disconnectCallback;
            this.disconnectCallback = function () {
            };
            _super.prototype.destructor.call(this);
            if (isFireCallback) {
                var event = message ? Events_1.create(message) : undefined;
                callback(event);
            }
        };    /**
         * Начинаю проверять о закрытии лишь после того как обработчик установили.
         * Проверяем ключ о том что мастер жив.
         * Если обнаружили, что мертв, то проверяем ключ, не начал ли кто реконнект.
         * Если истекли все таймауты, то начинаю перезагружаться сам
         * @param fn
         */
        /**
         * Начинаю проверять о закрытии лишь после того как обработчик установили.
         * Проверяем ключ о том что мастер жив.
         * Если обнаружили, что мертв, то проверяем ключ, не начал ли кто реконнект.
         * Если истекли все таймауты, то начинаю перезагружаться сам
         * @param fn
         */
        LocalSlaveTransport.prototype.setDisconnectHandler = function (fn) {
            var _this = this;
            this.disconnectCallback = fn;
            if (this.mainChecker) {
                clearInterval(this.mainChecker);
            }    // @ts-ignore
            // @ts-ignore
            this.mainChecker = setInterval(function () {
                var actualMainDate = _this.ls.getItem(CONST.KEY_ACTUAL_DATE);
                if (actualMainDate + _this.minInterval > Date.now()) {
                    return;
                }
                var isAlreadyReconnect = _this.ls.getItem(CONST.KEY_TRY_CREATE_MAIN) || 0;
                if (isAlreadyReconnect + CONST.RECONNECT_INTERVAL > Date.now()) {
                    return;
                }
                _this.ls.setItem(CONST.KEY_TRY_CREATE_MAIN, Date.now());
                _this.destructor('Main is dead');
            }, this.minInterval);
        };
        LocalSlaveTransport.prototype.unloadWindow = function () {
            /* Не вызвываем колбэк переподключения,
            что бы не стать при закрытии окна мастером */
            this.close(false);
        };    /**
         * Рассылаем уведомление об отписке и очищаем ресурсы
         */
        /**
         * Рассылаем уведомление об отписке и очищаем ресурсы
         */
        LocalSlaveTransport.prototype.close = function (isFireCallback) {
            if (isFireCallback === void 0) {
                isFireCallback = true;
            }
            for (var _i = 0, _a = this.subscribes.all(); _i < _a.length; _i++) {
                var subscribe = _a[_i];
                this.taber.notify(CONST.KEY_UNSUBSCRIBE, subscribe);
            }
            this.destructor('closeWindow', isFireCallback);
        };
        return LocalSlaveTransport;
    }(Transport_1.Transport);
    exports.LocalSlaveTransport = LocalSlaveTransport;
});