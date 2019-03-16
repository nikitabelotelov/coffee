define('Browser/_Event/Server/worker/event-bus.worker', [
    'require',
    'exports',
    'tslib',
    'Browser/_Event/Server/worker/subscribe-controller',
    'Browser/_Event/Server/worker/stomp-connect.worker',
    'Browser/_Event/Server/native/_IndexedDB/Connector'
], function (require, exports, tslib_1, subscribe_controller_1, WorkerStompConnect, Connector_1) {
    'use strict';
    Object.defineProperty(exports, '__esModule', { value: true });    /// <amd-module name="Browser/_Event/Server/worker/event-bus.worker" />
                                                                      /// <reference path="../resources/stomp.d.ts" />
                                                                      /// <reference path="messages.d.ts" />
    /// <amd-module name="Browser/_Event/Server/worker/event-bus.worker" />
    /// <reference path="../resources/stomp.d.ts" />
    /// <reference path="messages.d.ts" />
    var VERSION = 318.35;
    var WorkerMessage = /** @class */
    function () {
        function WorkerMessage(type, message, headers, command) {
            if (message === void 0) {
                message = '';
            }
            if (headers === void 0) {
                headers = '';
            }
            if (command === void 0) {
                command = '';
            }
            this.type = type;
            this.message = message;
            this.headers = headers;
            this.command = command;
        }
        return WorkerMessage;
    }();
    var WorkerMessEvent = /** @class */
    function () {
        function WorkerMessEvent(message) {
            this.message = message;
            this.type = 'message';
            this.headers = message.headers;
        }
        return WorkerMessEvent;
    }();
    var WorkerMessReady = /** @class */
    function (_super) {
        tslib_1.__extends(WorkerMessReady, _super);
        function WorkerMessReady(eventName) {
            return _super.call(this, 'ready', '', { 'event-type': eventName }) || this;
        }
        return WorkerMessReady;
    }(WorkerMessage);
    var WorkerMessClose = /** @class */
    function (_super) {
        tslib_1.__extends(WorkerMessClose, _super);
        function WorkerMessClose(eventName) {
            return _super.call(this, 'close', '', { 'event-type': eventName }) || this;
        }
        return WorkerMessClose;
    }(WorkerMessage);
    var WorkerMessError = /** @class */
    function (_super) {
        tslib_1.__extends(WorkerMessError, _super);
        function WorkerMessError(message) {
            return _super.call(this, 'error', message) || this;
        }
        return WorkerMessError;
    }(WorkerMessage);
    var WorkerMessDisconnect = /** @class */
    function (_super) {
        tslib_1.__extends(WorkerMessDisconnect, _super);
        function WorkerMessDisconnect() {
            return _super.call(this, 'websocket.close') || this;
        }
        return WorkerMessDisconnect;
    }(WorkerMessage);    ///endregion
                         // @ts-ignore
    ///endregion
    // @ts-ignore
    self['messageHandler'] = function (event) {
        /**
         * @type {ClientMessage}
         */
        var message = event.data;
        if (message == 'ping') {
            return;    // не будем спамить пингом
        }
        // не будем спамить пингом
        if (!message || !message.command) {
            return;
        }
        if (message.command == 'handshake' && event.ports.length != 0) {
            Context.handeshake(event.ports[0]);
            if (message.debug !== undefined) {
                Context.debug = message.debug;
            }
        }
        if (message.command == 'debug.on') {
            Context.debug = true;
        }
        if (message.command == 'debug.off') {
            Context.debug = false;
        }
        if (message.command == 'version') {
            event.ports[0].postMessage(new WorkerMessage('version', VERSION));
        }
    };
    var ERROR_SUBSCRIBE = 'Can\'t subscribe';
    var ERROR_SUBSCRIBE_CHANNEL = 'Can\'t subscribe channeled';
    var ERROR_UNSUBSCRIBE_CHANNEL = 'Can\'t unsubscribe channeled';
    var ERROR_HASH = 'Hash is not defined';
    var Context = /** @class */
    function () {
        function Context() {
        }
        Context.handeshake = function (port) {
            port.onmessage = Context.portHandler;
            port.postMessage(new WorkerMessage('handshake'));
        };    /**
         * @param event
         * event.target - это ChannelMessage::port2
         */
        /**
         * @param event
         * event.target - это ChannelMessage::port2
         */
        Context.portHandler = function (event) {
            if (!event.data) {
                return;
            }
            var message = event.data;
            var port2 = event.target;
            if (!port2) {
                return;
            }
            if (message.command == 'connect') {
                var url = message.url;
                var exchangeName = message.exchangeName;
                var sid_1 = message.sid;
                var hash_1 = message.hash;
                var persist = message.persist;
                var ack = message.ack;
                WorkerEventBus.getInstance(url, exchangeName, hash_1, persist, ack, Context.subscribes).then(function (connect) {
                    Context.sid = sid_1;
                    Context.hash = hash_1;
                    port2.postMessage(new WorkerMessage('connect'));
                    return connect;
                }).catch(function (e) {
                    port2.postMessage(new WorkerMessError(e.toString()));
                });
                return;
            }
            if (message.command == 'subscribe') {
                var eventName_1 = message.eventName;
                WorkerEventBus.getInstance().then(function (connect) {
                    connect.subscribePort(eventName_1, port2);
                }).catch(function (e) {
                    port2.postMessage(new WorkerMessError(ERROR_SUBSCRIBE));
                });
                return;
            }
            if (message.command == 'subscribe.channel') {
                var eventName_2 = message.eventName;
                WorkerEventBus.getInstance().then(function (connect) {
                    connect.subscribeChannelPort(eventName_2, port2, message.person);
                }).catch(function (e) {
                    port2.postMessage(new WorkerMessError(ERROR_SUBSCRIBE_CHANNEL));
                });
                return;
            }
            if (message.command == 'unsubscribe.channel') {
                var eventName_3 = message.eventName;
                var person_1 = message.person;
                WorkerEventBus.getInstance().then(function (connect) {
                    connect.unsubscribeChannelPort(eventName_3, port2, person_1);
                }).catch(function (e) {
                    port2.postMessage(new WorkerMessError(ERROR_UNSUBSCRIBE_CHANNEL));
                });
                return;
            }
            if (message.command == 'disconnect') {
                Context.subscribes.removePort(port2);
                return;
            }
        };
        Context.getGUID = function () {
            return exports1['getGUID']();
        };
        Context.subscribes = new subscribe_controller_1.SubscribeController();
        Context.debug = false;
        return Context;
    }();    /**
     * Класс для поднятия соединения с сервером в разрезе клиента/устройства
     * @class Browser/_Event/Server/worker/WorkerEventBus
     * @memberOf module:ServerEvent.worker
     */
    /**
     * Класс для поднятия соединения с сервером в разрезе клиента/устройства
     * @class Browser/_Event/Server/worker/WorkerEventBus
     * @memberOf module:ServerEvent.worker
     */
    var WorkerEventBus = /** @class */
    function () {
        function WorkerEventBus(hash, stompConnect, subController) {
            this.hash = hash;
            if (!subController) {
                throw Error('Subscribes is empty!');
            }
            this.subscribes = subController;
            this.stompConnect = stompConnect;
            this.stompConnect.onclose = this.closeStompHandler.bind(this);
            this.stompConnect.onmessage = this.messageHandler.bind(this);    // @ts-ignore
            // @ts-ignore
            this.eventStore = Connector_1.Connector.connect(Connector_1.Connector.DB_DEBUG, Connector_1.Connector.DEBUG_STORE_NAME).then(function (connect) {
                return connect.createWriter();
            });
        }    /**
         * Получаем экземпляр Серверной шины событий на SW.
         * NB! hash идентифицирует пользователя
         * @param url - url подключения
         * @param exchangeName - имя обменника
         * @param hash - идентификатор пользователя
         * @param persist
         * @param ack - подтверждать ли сообщения
         * @param subscribes
         * @return {Promise<WorkerEventBus>}
         */
        /**
         * Получаем экземпляр Серверной шины событий на SW.
         * NB! hash идентифицирует пользователя
         * @param url - url подключения
         * @param exchangeName - имя обменника
         * @param hash - идентификатор пользователя
         * @param persist
         * @param ack - подтверждать ли сообщения
         * @param subscribes
         * @return {Promise<WorkerEventBus>}
         */
        WorkerEventBus.getInstance = function (url, exchangeName, hash, persist, ack, subscribes) {
            if (persist === void 0) {
                persist = true;
            }
            if (ack === void 0) {
                ack = false;
            }
            if (WorkerEventBus.instance && !hash) {
                return Promise.resolve(WorkerEventBus.instance);
            }
            if (!hash) {
                return Promise.reject(ERROR_HASH);
            }
            if (WorkerEventBus.instance && WorkerEventBus.instance.hash == hash) {
                return Promise.resolve(WorkerEventBus.instance);
            }
            if (WorkerEventBus.initPromise) {
                return WorkerEventBus.initPromise;
            }
            return WorkerEventBus.initPromise = WorkerStompConnect.getConnect(url, exchangeName, hash, persist, ack).then(function (stomp) {
                WorkerEventBus.initPromise = undefined;
                return WorkerEventBus.instance = new WorkerEventBus(hash, stomp, subscribes);
            });
        };
        WorkerEventBus.prototype.closeStompHandler = function () {
            var ports = this.subscribes.getPorts();
            this.subscribes.clear().forEach(function (s) {
                try {
                    s.port.postMessage(new WorkerMessClose(s.eventName));
                } catch (e) {
                    Context.debug && console.error(e);    // eslint-disable-line no-console
                }
            });
            // eslint-disable-line no-console
            ports.forEach(function (port) {
                port.postMessage(new WorkerMessDisconnect());
            });
            WorkerEventBus.instance = undefined;
        };
        WorkerEventBus.sendMessageByPort = function (subscribe, message) {
            try {
                subscribe.port.postMessage(new WorkerMessEvent({
                    headers: message.headers,
                    body: message.body,
                    command: message.command
                }));
            } catch (e) {
                /**
                 * Если не удалось отправить сообщение, то просто отсылаем в ошибку
                 */
                Context.debug && console.error(e);    // eslint-disable-line no-console
            }
        };
        // eslint-disable-line no-console
        WorkerEventBus.prototype.messageHandler = function (message) {
            var eventName = message.headers['event-type'].toLocaleLowerCase();
            this.eventStore.then(function (writer) {
                writer.write(message);
            });
            this.subscribes.get(eventName).forEach(function (s) {
                WorkerEventBus.sendMessageByPort(s, message);
            });
        };
        WorkerEventBus.prototype.subscribePort = function (eventName, port) {
            this.subscribes.register(eventName, port);
            this.stompConnect.subscribe();
            port.postMessage(new WorkerMessReady(eventName));
        };
        WorkerEventBus.prototype.subscribeChannelPort = function (eventName, port, person) {
            if (person === void 0) {
                person = '';
            }
            if (!this.subscribes.hasChanneled(eventName, person)) {
                this.stompConnect.subscribeChanneled(eventName, person);
            }
            this.subscribes.registerChanneled(eventName, port, person);
            port.postMessage(new WorkerMessReady(eventName));
        };
        WorkerEventBus.prototype.unsubscribeChannelPort = function (eventName, port, person) {
            if (person === void 0) {
                person = '';
            }
            this.subscribes.unregisterChanneled(eventName, port, person);
            if (!this.subscribes.hasChanneled(eventName, person)) {
                this.stompConnect.unsubscribeChanneled(eventName, person);
            }
        };
        return WorkerEventBus;
    }();
});