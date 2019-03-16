define('Browser/_Event/Server/worker/stomp-connect.worker', [
    'require',
    'exports',
    'Browser/_Event/Server/native/AckSender',
    'Browser/_Event/Server/worker/web-socket-connect.worker'
], function (require, exports, AckSender_1, WebSocketConnect) {
    'use strict';    /// <amd-module name="Browser/_Event/Server/worker/stomp-connect.worker" />
                     /// <reference path="../resources/stomp.d.ts" />
                     /**
     * Вызовет падение в stomp. Использование не объявленной переменой.
     * @link https://github.com/jmesnil/stomp-websocket/blob/master/lib/stomp.js#L497
     */
                     // @ts-ignore
    /// <amd-module name="Browser/_Event/Server/worker/stomp-connect.worker" />
    /// <reference path="../resources/stomp.d.ts" />
    /**
     * Вызовет падение в stomp. Использование не объявленной переменой.
     * @link https://github.com/jmesnil/stomp-websocket/blob/master/lib/stomp.js#L497
     */
    // @ts-ignore
    importScripts('../resources/stomp.js');
    var ERROR_STOMP_CONNECT = 'STOMP connect is not started';    /**
     * Stomp не знает про Worker и его setInterval/clearInterval
     * @link https://github.com/jmesnil/stomp-websocket/blob/master/lib/stomp.js#L489
     */
    /**
     * Stomp не знает про Worker и его setInterval/clearInterval
     * @link https://github.com/jmesnil/stomp-websocket/blob/master/lib/stomp.js#L489
     */
    Stomp.setInterval = function (interval, f) {
        return setInterval(f, interval);
    };
    Stomp.clearInterval = function (id) {
        return clearInterval(id);
    };    /**
     * @class Browser/_Event/Server/worker/StompHeaders
     * @memberOf module:ServerEvent.worker
     */
    /**
     * @class Browser/_Event/Server/worker/StompHeaders
     * @memberOf module:ServerEvent.worker
     */
    var StompHeaders = /** @class */
    function () {
        /*
         * @constructor
         * @param receipt - идентификатор подписки. У нас она одна.
         * @param id - идентификатор устройства
         * @param persistent - постоянный обменник
         * @param ack
         */
        function StompHeaders(receipt, id, persistent, ack) {
            if (persistent === void 0) {
                persistent = true;
            }
            if (ack === void 0) {
                ack = false;
            }
            this.receipt = receipt;
            this.persistent = persistent;
            this.id = id || this.receipt ? id + '-' + this.receipt : '';
            this['auto-delete'] = !persistent;
            if (ack) {
                this['prefetch-count'] = 10;
                this['ack'] = ack;
            }
        }
        return StompHeaders;
    }();
    var StompChannelHeaders = /** @class */
    function () {
        function StompChannelHeaders(channel, person, receipt, id, persistent, ack) {
            if (persistent === void 0) {
                persistent = true;
            }
            if (ack === void 0) {
                ack = false;
            }
            this.receipt = receipt;
            this.persistent = persistent;
            this.id = this.receipt ? StompChannelHeaders.createId(channel, id, this.receipt, person) : '';
            this['auto-delete'] = !persistent;
            if (ack) {
                this['prefetch-count'] = 10;
                this['ack'] = ack;
            }
        }
        StompChannelHeaders.createId = function (channelName, guid, receipt, person) {
            var personPostfix = person ? '-' + person : '';
            return guid + '-' + receipt + '-' + channelName + personPostfix;
        };
        return StompChannelHeaders;
    }();    /**
     * Класс ответственныйзп откртие STOMP протокола
     * @class Browser/_Event/Server/worker/WorkerStompConnect
     * @memberOf module:ServerEvent.worker
     */
    /**
     * Класс ответственныйзп откртие STOMP протокола
     * @class Browser/_Event/Server/worker/WorkerStompConnect
     * @memberOf module:ServerEvent.worker
     */
    var WorkerStompConnect = /** @class */
    function () {
        function WorkerStompConnect(url, exchangeName, hash, persist, isAck) {
            if (isAck === void 0) {
                isAck = false;
            }
            this.url = url;
            this.exchangeName = exchangeName;
            this.hash = hash;
            this.persist = persist;
            this.isCommonSubscribe = false;
            this.channeledEvents = [];
            this.isSendAck = false;
            this.onmessage = function (message) {
            };
            this.onclose = function () {
            };
            this.isSendAck = isAck;
            this.ackSender = AckSender_1.AckSender.createAckSender(isAck);
            this.connect = this.connect.bind(this);
            this.messageHandler = this.messageHandler.bind(this);
        }
        WorkerStompConnect.getConnect = function (url, exchangeName, hash, persist, ack) {
            if (WorkerStompConnect.instance && WorkerStompConnect.instance.hash == hash) {
                return Promise.resolve(WorkerStompConnect.instance);
            }
            if (WorkerStompConnect.instance) {
                WorkerStompConnect.instance.close();
            }
            return new WorkerStompConnect(url, exchangeName, hash, persist, ack).connect().then(function (instance) {
                return WorkerStompConnect.instance = instance;
            });
        };
        WorkerStompConnect.prototype.connect = function () {
            var _this = this;
            return WebSocketConnect.getInstance(this.url).then(function (transport) {
                _this.client = Stomp.over(transport);
                _this.client.heartbeat.outgoing = WorkerStompConnect.STOMP_HEARTBEAT_OUT_TIME;
                _this.client.heartbeat.incoming = WorkerStompConnect.STOMP_HEARTBEAT_IN_TIME;
                _this.client.debug = function () {
                };
                return new Promise(function (resolve, reject) {
                    _this.client.connect(WorkerStompConnect.LOGIN, WorkerStompConnect.PASSWORD, function () {
                        resolve(transport);
                    }, function (data) {
                        reject(data);
                    });
                });
            }).catch(function (e) {
                throw new Error(e || ERROR_STOMP_CONNECT);
            }).then(function (transport) {
                _this.websocket = transport;
                _this.ackSender.start();
                transport.addEventListener('close', function () {
                    transport.close();
                    _this.ackSender.stop();
                    _this.onclose();
                    WorkerStompConnect.instance = undefined;
                });
                return _this;
            });
        };
        WorkerStompConnect.prototype.stompSubscribe = function () {
            this.client.subscribe('/exchange/' + this.exchangeName + ':' + this.hash, this.messageHandler, new StompHeaders(this.hash, exports1['getGUID'](), this.persist, this.isSendAck ? 'client' : false));
        };
        WorkerStompConnect.prototype.stompSubscribeChannel = function (channel, person) {
            if (person === void 0) {
                person = '';
            }
            var endpoint = person ? person + '$' + channel : channel;
            this.client.subscribe('/exchange/' + this.exchangeName + '.channel/' + endpoint, this.messageHandler, new StompChannelHeaders(channel, person, this.hash, exports1['getGUID'](), this.persist, this.isSendAck ? 'client' : false));
        };
        WorkerStompConnect.prototype.stompUnsubscribeChannel = function (channel, person) {
            if (person === void 0) {
                person = null;
            }
            this.client.unsubscribe(StompChannelHeaders.createId(channel, exports1['getGUID'](), this.hash, person));
        };
        WorkerStompConnect.prototype.messageHandler = function (message) {
            this.ackSender.push(message);
            this.onmessage(message);
        };
        WorkerStompConnect.prototype.subscribe = function () {
            if (this.isCommonSubscribe) {
                return;
            }
            this.stompSubscribe();
            this.isCommonSubscribe = true;
        };
        WorkerStompConnect.prototype.subscribeChanneled = function (eventName, person) {
            if (person === void 0) {
                person = '';
            }
            var key = eventName + '|' + person;
            if (this.channeledEvents.indexOf(key) !== -1) {
                return;
            }
            this.channeledEvents.push(key);
            this.stompSubscribeChannel(eventName, person);
        };
        WorkerStompConnect.prototype.unsubscribeChanneled = function (eventName, person) {
            if (person === void 0) {
                person = '';
            }
            var find = eventName + '|' + person;
            var founded = false;
            this.channeledEvents = this.channeledEvents.filter(function (key) {
                founded = true;
                return find !== key;
            });
            if (!founded) {
                return;
            }
            this.stompUnsubscribeChannel(eventName, person);
        };
        WorkerStompConnect.prototype.close = function () {
            this.ackSender.stop();
            WebSocketConnect.close();
        };
        WorkerStompConnect.STOMP_HEARTBEAT_OUT_TIME = 60000;
        WorkerStompConnect.STOMP_HEARTBEAT_IN_TIME = 0;
        WorkerStompConnect.LOGIN = 'stomp_user';
        WorkerStompConnect.PASSWORD = 'stomp_user';
        return WorkerStompConnect;
    }();
    return WorkerStompConnect;
});