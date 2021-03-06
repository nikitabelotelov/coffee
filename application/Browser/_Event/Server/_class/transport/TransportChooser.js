define('Browser/_Event/Server/_class/transport/TransportChooser', [
    'require',
    'exports',
    'Core/Deferred',
    'Browser/_Event/Server/_class/logger/WatchDogAggregator',
    'Browser/_Event/Server/_class/RabbitEnv',
    'Browser/_Event/Server/_class/creator/CreatorWebSocket',
    'Browser/_Event/Server/_class/creator/CreatorSockJs',
    'Browser/_Event/Server/_class/creator/CreatorExclusive',
    'Browser/_Event/Server/_class/creator/CreatorExclusiveSockJs',
    'Browser/_Event/Server/_class/deliver/DeliveryChooser'
], function (require, exports, Deferred, WatchDogAggregator_1, RabbitEnv_1, CreatorWebSocket_1, CreatorSockJs_1, CreatorExclusive_1, CreatorExclusiveSockJs_1, DeliveryChooser_1) {
    'use strict';
    Object.defineProperty(exports, '__esModule', { value: true });    /**
     * @class Browser/_Event/Server/_class/transport/TransportChooser
     * @memberOf module:ServerEvent.class.transport
     */
    /**
     * @class Browser/_Event/Server/_class/transport/TransportChooser
     * @memberOf module:ServerEvent.class.transport
     */
    var TransportChooser = /** @class */
    function () {
        /**
         * @param {Browser/_Event/Server/_class/ConnectOptions} connectOptions
         * @param {Function} onclose коллбэк закрытия соединения. Пробрасывается в транспорт
         * @param {boolean} isExclusive создавать ли выделенное соединение для вкладки
         * @param {SEB.IWatchDogSystem} watcher класс логирования
         */
        function TransportChooser(connectOptions, onclose, isExclusive, watcher) {
            if (onclose === void 0) {
                onclose = function (v) {
                    return v;
                };
            }
            if (isExclusive === void 0) {
                isExclusive = false;
            }
            if (watcher === void 0) {
                watcher = new WatchDogAggregator_1.WatchDogAggregator();
            }
            this.connectOptions = connectOptions;
            this.onclose = onclose;
            this.isExclusive = isExclusive;
            this.watcher = watcher;
            this.builders = [];
            this.deliveryChooser = new DeliveryChooser_1.DeliveryChooser(watcher);
            var strategies = [
                CreatorWebSocket_1.CreatorWebSocket,
                CreatorSockJs_1.CreatorSockJs,
                CreatorExclusive_1.CreatorExclusive,
                CreatorExclusiveSockJs_1.CreatorExclusiveSockJs
            ];
            for (var _i = 0, strategies_1 = strategies; _i < strategies_1.length; _i++) {
                var strategy = strategies_1[_i];
                var builder = new strategy(this.connectOptions);
                if (!builder.isAvailableInEnv(this.isExclusive)) {
                    continue;
                }
                this.builders.push(builder);
            }
        }
        TransportChooser.prototype.destructor = function () {
            var _this = this;
            this.defStrategy && this.defStrategy.addCallback(function (transport) {
                _this.watcher && _this.watcher.logDisconnect('Manual disconnect');
                transport.close();
            });
        };    /**
         * Выбор стратегии транспорта сообщений.
         * @return {Deferred<ITransport>}
         */
        /**
         * Выбор стратегии транспорта сообщений.
         * @return {Deferred<ITransport>}
         */
        TransportChooser.prototype.choose = function () {
            var _this = this;
            if (this.defStrategy) {
                return this.defStrategy.createDependent();
            }
            this.defStrategy = this.build();
            this.defStrategy.addCallback(function (transport) {
                transport.setDisconnectHandler(function (event) {
                    _this.defStrategy = undefined;
                    _this.onclose(event);
                });
                transport.setWatchDog(_this.watcher);
                return _this.deliveryChooser.choose(transport).addCallback(function (deliver) {
                    transport.setDelivery(deliver);
                    return transport;
                });
            });
            return this.defStrategy.createDependent();
        };    /**
         * Метод строит транспорт и возвращает deferred
         * @return {Deferred}
         */
        /**
         * Метод строит транспорт и возвращает deferred
         * @return {Deferred}
         */
        TransportChooser.prototype.build = function () {
            var _this = this;
            var rbt = new RabbitEnv_1.RabbitEnv(this.watcher);
            return rbt.up(this.connectOptions).addCallback(function (hash) {
                return _this.createTransport(hash);
            });
        };
        TransportChooser.prototype.createTransport = function (hash) {
            var def = new Deferred();
            var _loop_1 = function (builder) {
                def.addErrback(function () {
                    return Deferred.fromPromise(builder.build(hash));
                });
            };
            for (var _i = 0, _a = this.builders; _i < _a.length; _i++) {
                var builder = _a[_i];
                _loop_1(builder);
            }
            def.addErrback(function (err) {
                return new Error('No one server event bus transport choice.');
            });    /**
             * Запускаем цепочку выбора
             */
            /**
             * Запускаем цепочку выбора
             */
            def.errback();
            return def;
        };
        return TransportChooser;
    }();
    exports.TransportChooser = TransportChooser;
});