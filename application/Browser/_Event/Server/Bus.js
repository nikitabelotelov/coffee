define('Browser/_Event/Server/Bus', [
    'require',
    'exports',
    'Core/Deferred',
    'Env/Constants',
    'Env/Event',
    'Browser/Storage',
    'Env/Env',
    'Browser/_Event/Server/_class/Constants',
    'Browser/_Event/Server/_class/logger/WatchDogAggregator',
    'Browser/_Event/Server/_class/Subscribe',
    'Browser/_Event/Server/_class/SubscribeContainer',
    'Browser/_Event/Server/_class/transport/ExclusiveProxy',
    'Browser/_Event/Server/_class/Events',
    'Browser/_Event/Server/_class/logger/ConnectWatchDog'
], function (require, exports, Deferred, Constants_1, Event_1, Storage_1, Env_1, CONST, WatchDogAggregator_1, Subscribe_1, SubscribeContainer_1, ExclusiveProxy_1, Events_1, ConnectWatchDog_1) {
    /// <amd-module name="Browser/_Event/Server/Bus" />
    /**
     * FIXME проверка названия канала
     * TODO разделить получение канала, не только по имени но и по типу (isChanneled)
     */
    'use strict';
    Object.defineProperty(exports, '__esModule', { value: true });    /// region evristic ack
    /// region evristic ack
    Storage_1.LocalStorageNative.setItem('shared-bus-ack', 'true');    /// endregion
                                                                       /// region channaled scoupes
    /// endregion
    /// region channaled scoupes
    var allScopes = [CONST.CHANNEL_SCOPE.GLOBAL];
    var AuthError = /** @class */
    function () {
        function AuthError(message) {
            if (message === void 0) {
                message = 'Это приложение не имеет серверных событий';
            }
            this.message = message;
        }
        return AuthError;
    }();
    var Seb = /** @class */
    function () {
        function Seb() {
            this.subscribes = new SubscribeContainer_1.SubscribeContainer();
            this.isExclusive = false;
            this.watcher = new WatchDogAggregator_1.WatchDogAggregator([new ConnectWatchDog_1.ConnectWatchDog()]);
            this.subsDeferred = new Deferred();
            this.subscribe = this.subscribeInit.bind(this);
            this.closeChannel = this.closeChannel.bind(this);
            this.closeTransportBehavior = this.closeTransportBehavior.bind(this);
        }
        Seb.prototype.subscribe = function (subscribe) {
        };
        Seb.prototype.subscribeClear = function (tw, subscribe) {
            if (this.subscribes.has(subscribe)) {
                return;
            }
            this.subscribes.add(subscribe);
            try {
                tw.subscribe(subscribe);
            } catch (e) {
                if (e.name !== 'SubscribeExclusiveError') {
                    throw e;
                }
                this.isExclusive = true;
                this.reconnect();
            }
        };    /**
         * В момент переподсоединения транспорта мы должны только запоминать подписки.
         * Иначе возникают гонки и падают ошибки при работе с транспортом
         * @param {SEB.ISubscribe} subscribe
         */
        /**
         * В момент переподсоединения транспорта мы должны только запоминать подписки.
         * Иначе возникают гонки и падают ошибки при работе с транспортом
         * @param {SEB.ISubscribe} subscribe
         */
        Seb.prototype.subscribeBeforeReconnect = function (subscribe) {
            if (this.subscribes.has(subscribe)) {
                return;
            }
            this.subscribes.add(subscribe);
        };
        Seb.prototype.subscribeDeferred = function (subscribe) {
            var _this = this;
            this.subsDeferred.addCallback(function (transport) {
                _this.subscribeClear(transport, subscribe);
                return transport;
            });
        };
        Seb.prototype.subscribeInit = function (subscribe) {
            var _this = this;
            this.subscribe = this.subscribeDeferred;
            this.subscribeDeferred(subscribe);
            try {
                ExclusiveProxy_1.ExclusiveProxy.init(this.isExclusive || subscribe.getDeliveryType() !== CONST.DELIVERY_COMMON, this.closeTransportBehavior, this.watcher).addCallback(function (tw) {
                    _this.subscribe = _this.subscribeClear.bind(_this, tw);
                    _this.subsDeferred.callback(tw);
                }).addErrback(function (err) {
                    if (err.httpError === 404) {
                        Env_1.IoC.resolve('ILogger').warn(new AuthError().message);
                        _this.subscribe = function () {
                        };
                        return;
                    }
                    _this.subscribe = _this.subscribeInit;
                    var oldInitDeferred = _this.subsDeferred;
                    _this.subsDeferred = new Deferred();
                    oldInitDeferred.dependOn(_this.subsDeferred);
                    Env_1.IoC.resolve('ILogger').warn('Не удалось подписаться на ' + subscribe.getChannelName());
                });
            } catch (e) {
                this.subscribe = function () {
                };
            }
        };
        Seb.prototype.addWatchDog = function (watcher) {
            this.watcher.reg(watcher);
        };
        Seb.prototype.closeTransportBehavior = function (event) {
            this.watcher.logDisconnect(event);
            if (event === Events_1.EVENT_DISABLE_SEB) {
                return;
            }
            this.reInit();
        };    /**
         * Поднимаем новое соединение и переподписываеся
         */
        /**
         * Поднимаем новое соединение и переподписываеся
         */
        Seb.prototype.reInit = function () {
            this.subsDeferred = new Deferred();
            this.subscribe = this.subscribeInit;
            var oldSubs = this.subscribes.all();
            this.subscribes.clear();
            for (var _i = 0, oldSubs_1 = oldSubs; _i < oldSubs_1.length; _i++) {
                var subscribe = oldSubs_1[_i];
                this.subscribe(subscribe);
            }
        };    /**
         * Запускаем рестарт подключения. Закрываем текущие соединения.
         */
        /**
         * Запускаем рестарт подключения. Закрываем текущие соединения.
         */
        Seb.prototype.reconnect = function () {
            var _this = this;
            if (!this.subsDeferred) {
                return this.reInit();
            }
            this.subsDeferred.addCallbacks(function (tw) {
                _this.subscribe = _this.subscribeBeforeReconnect.bind(_this);
                tw.close();
                return tw;
            }, function () {
                _this.reInit();
            });
        };    /**
         * Получаем все подписки и отписываемся от них
         * @param {string} name
         */
        /**
         * Получаем все подписки и отписываемся от них
         * @param {string} name
         */
        Seb.prototype.closeChannel = function (name) {
            var _this = this;
            this.subsDeferred.addCallback(function (initializer) {
                var removed = _this.subscribes.removeByName(name);
                for (var _i = 0, removed_1 = removed; _i < removed_1.length; _i++) {
                    var item = removed_1[_i];
                    initializer.unsubscribe(item);
                }
                return initializer;
            });
        };
        return Seb;
    }();
    var seb = new Seb();
    function serverChannel(channelName, options) {
        var name = channelName.toLocaleLowerCase();
        var channel = Event_1.Bus.channel(name);
        var opts = options || {};
        setTimeout(function () {
            /*
             * Как только все scope поправим, уберём условие
             */
            if (!opts.isChanneled) {
                seb.subscribe(Subscribe_1.Subscribe.create(name, opts.isChanneled, opts.exclusive));
                return;
            }
            if (!opts.scopes) {
                Env_1.IoC.resolve('ILogger').error('В канализированных событиях необходимо указать options.scopes.             https://wi.sbis.ru/docs/js/Browser/_Event/Server/Bus/typedefs/ConnectOptions/?v=3.18.10');
            }
            var scopes = opts.scopes || allScopes;
            for (var _i = 0, scopes_1 = scopes; _i < scopes_1.length; _i++) {
                var scope = scopes_1[_i];
                seb.subscribe(Subscribe_1.Subscribe.createRaw(name, opts.isChanneled, opts.exclusive, scope));
            }
        }, 0);
        return channel;
    }
    serverChannel['reconnect'] = function () {
        seb.reconnect();
    };
    serverChannel['close'] = function (channel) {
        seb.closeChannel(channel);
    };
    serverChannel['SCOPE'] = CONST.CHANNEL_SCOPE;
    Event_1.Bus['addWatchDog'] = function (watcher) {
        seb.addWatchDog(watcher);
    };    /* Если выполняемся не на клиенте, то возвращаем просто канал событий */
    /* Если выполняемся не на клиенте, то возвращаем просто канал событий */
    if (Constants_1.constants.isBrowserPlatform) {
        Event_1.Bus['serverChannel'] = serverChannel;
    } else {
        Event_1.Bus['serverChannel'] = function (channelName) {
            return Event_1.Bus.channel(channelName);
        };
    }
    exports.default = Event_1.Bus;
});    /**
 * @public
 * @class Browser/_Event/Server/Bus
 * @author Санников К.А.
 */
       /**
 * @event Browser/_Event/Server/Bus#onready
 * @description Происходит при успешном соединении с каналом серверных событий.
 * @remark
 * В целях устранения потери сообщений, сгенерированных вызовом вашей БЛ, рекомендуется производить его в onready.
 * @param {Core/Object} eventObject Дескриптор события.
 * @example
 * <pre>
 *    define('SBIS3.MyArea.ModuleName', [... , 'Browser/_Event/Server/Bus'], function(... , bus) {
 *
 *       // в модуле должна быть объявлена именованная функция, на неё производится подписка или отписка
 *       function MyHandler (event, data) {
 *          ...
 *       }
 *       var moduleClass = CompoundControl.extend({
 *           ...
 *           var channel = bus.serverChannel('MyBLEvent');
 *           // подписываемся на onmessage до onready, т.к. все подписки асинхронные
 *           // а наш deferred иногда отрабатывает синхронно, поэтому call может сработать ранее, чем onmessage,
 *           //  если onready сделать до onmessage
 *           channel.subscribe('onmessage', myHandler);
 *           channel.once('onready', function() {
 *              sbisService.call('generateMyBLEvent');
 *           });
 *           ...
 *       });
 *       return moduleClass;
 *    });
 * </pre>
 */
       /**
 * @event Browser/_Event/Server/Bus#onmessage
 * @description Происходит при получении нового сообщения в канале.
 * @remark
 * В целях устранения потери сообщений из канала, рекомендуется сначала производить подписку
 *  на событие {@link Browser/_Event/Server/Bus#onready}, а уже потом на событие onmessage.
 * @param {Core/Object} eventObject Дескриптор события.
 * @param {String|Object} data Сообщение, переданное от БЛ-источника.
 * @param {Object} frame Объект сообщения, которое приходит в клиентскую часть приложения от STOMP-сервиса.
 * @example
 * <pre>
 *    define('SBIS3.MyArea.ModuleName', [... , 'Browser/_Event/Server/Bus'], function(... , bus) {
 *
 *       // в модуле должна быть объявлена именованная функция, на неё производится подписка или отписка
 *       function MyHandler (event, data) {
 *          ...
 *       }
 *       var moduleClass = CompoundControl.extend({
 *           ...
 *           var channel = bus.serverChannel('informer.counterhasbeenupdated');
 *           channel.subscribe('onmessage', function () { ... });
 *           ...
 *       });
 *       return moduleClass;
 *    });
 * </pre>
 */
       /**
 * @event Browser/_Event/Server/Bus#ondisconnect
 * @description Происходит при разрыве соединения с каналом серверных событий.
 * @param {Core/Object} eventObject Дескриптор события.
 */
       /**
 * @method Browser/_Event/Server/Bus#serverChannel
 * @description Устанавливает канал, из которого клиентское приложение ожидает событие.
 * @param {String} channelName Имя канала.
 * @param {ConnectOptions} [opts] Дополнительные опции.
 * Подробнее о событиях такого типа читайте в разделе
 * <a href="https://wi.sbis.ru/doc/platform/developmentapl/
 * cooperationservice/subscription-to-events-in-the-cloud/#channelized-events">Канализированные события</a>.
 * @return {Core/Channel}
 * @example
 * <pre>
 *    define('SBIS3.MyArea.ModuleName', [... , 'Browser/_Event/Server/Bus'], function(... , bus) {
 *
 *       // в модуле должна быть объявлена именованная функция, на неё производится подписка или отписка
 *       function MyHandler (event, data) {
 *          ...
 *       }
 *       var moduleClass = CompoundControl.extend({
 *           ...
 *           var channel = bus.serverChannel('informer.counterhasbeenupdated');
 *           channel.subscribe('onmessage', function () { ... });
 *           ...
 *       });
 *       return moduleClass;
 *    });
 * </pre>
 * @see {@link Core/EventBusChannel}
 * @see Browser/_Event/Server/Bus.serverChannel.close
 */
       /**
 * @method Browser/_Event/Server/Bus#close
 * @description Отключает подписку браузера от сервера на каналзированные события по имени.
 *      <strong>Отписки обработчиков от {@link Core/Channel} не происходит</strong>
 * @param {String} channelName Имя канала.
 * @example
 * <pre>
 *    define('SBIS3.MyArea.ModuleName', [... , 'Browser/_Event/Server/Bus'], function(... , bus) {
 *       var moduleClass = CompoundControl.extend({
 *           ...
 *           var channel = bus.serverChannel('informer.counterhasbeenupdated:12345',
 *              {isChanneled: true, scopes:[bus.serverChannel.SCOPE.GLOBAL]});
 *           channel.subscribe('onmessage', function () { ... });
 *           ...
 *           bus.serverChannel.close('informer.counterhasbeenupdated:12345');
 *       });
 *       return moduleClass;
 *    });
 * </pre>
 * @see Browser/_Event/Server/Bus#onready
 * @see Browser/_Event/Server/Bus#onmessage
 * @see Browser/_Event/Server/Bus#ondisconnect
 */
       /**
 * @typedef ConnectOptions
 * @property {Boolean} [exclusive=false] Признак, по которому будет создано собственное подключение
 *  к STOMP-серверу на вкладке.
 * @property {Boolean} [isChanneled=false] Признак, по которому будет произведена подписка
 *  на индивидуальный канал событий.
 *  Требуется указать область(scope) канализированных событий
 * @property {String[]} [scopes=[serverChannel.SCOPE.GLOBAL]] Область индивидуальной подписки.
 *      Возможные значения: <ul>
 *          <li>serverChannel.SCOPE.GLOBAL - глобальное канализированное</li>
 *          <li>serverChannel.SCOPE.CLIENT - канализированное по клиенту</li>
 *          <li>serverChannel.SCOPE.USER - канализированное по пользователю</li>
 *      </ul>
 */