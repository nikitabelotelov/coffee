define('Browser/_Event/Server/_class/transport/LocalPageTransport', [
    'require',
    'exports',
    'tslib',
    'Core/Deferred',
    'Env/Env',
    'Browser/Storage',
    'Browser/_Event/Server/_class/transport/Transport',
    'Browser/_Event/Server/_class/SubscribeContainer',
    'Browser/_Event/Server/native/AckSender',
    'Browser/_Event/Server/native/_IndexedDB/Connector',
    'Browser/_Event/Server/native/_IndexedDB/AdapterStomp'
], function (require, exports, tslib_1, Deferred, Env_1, Storage_1, Transport_1, SubscribeContainer_1, AckSender_1, Connector_1, AdapterStomp_1) {
    'use strict';
    Object.defineProperty(exports, '__esModule', { value: true });
    function subscribeIdHeaderCreator(channelName, guid, receipt, person) {
        var personPostfix = person ? '-' + person : '';
        return guid + '-' + receipt + '-' + channelName + personPostfix;
    }
    var LocalPageTransport = /** @class */
    function (_super) {
        tslib_1.__extends(LocalPageTransport, _super);
        function LocalPageTransport(stomp, hash, persistent, exchangeName, isAck) {
            if (persistent === void 0) {
                persistent = true;
            }
            if (isAck === void 0) {
                isAck = false;
            }
            var _this = _super.call(this) || this;
            _this.stomp = stomp;
            _this.hash = hash;
            _this.persistent = persistent;
            _this.exchangeName = exchangeName;
            _this.isAck = isAck;
            _this.subscribes = new SubscribeContainer_1.SubscribeContainer();
            _this.onclose = function () {
            };
            _this.hasCommon = false;    // TODO временный костыль хранения GUID устройства
            // TODO временный костыль хранения GUID устройства
            _this.guid = Storage_1.LocalStorageNative.getItem('SEB.GUID');
            if (!_this.guid) {
                _this.guid = LocalPageTransport.generateGUID();
                Storage_1.LocalStorageNative.setItem('SEB.GUID', _this.guid);
            }
            if (!persistent) {
                _this.guid = _this.guid + Math.floor(Math.random() * 10000);
            }
            _this.ackSender = AckSender_1.AckSender.createAckSender(isAck);
            _this.ackSender.start();
            _this.closeWsHandler = function (evt) {
                _this.onclose(evt);
            };
            stomp.ws.addEventListener('close', _this.closeWsHandler);
            _this.eventStore = Deferred.fail();
            if (!Env_1.detection.isMobilePlatform && !Env_1.detection.safari) {
                _this.eventStore = Connector_1.Connector.connect(Connector_1.Connector.DB_DEBUG, Connector_1.Connector.DEBUG_STORE_NAME, new AdapterStomp_1.AdapterStomp()).addCallback(function (connect) {
                    return connect.createWriter();
                });
            }
            return _this;
        }
        LocalPageTransport.getLocalName = function () {
            return 'LocalPageTransport';
        };
        LocalPageTransport.prototype.getLocalName = function () {
            return LocalPageTransport.getLocalName();
        };
        LocalPageTransport.prototype.messageHandler = function (message) {
            _super.prototype.messageHandler.call(this, message);
            this.ackSender.push(message);
            this.eventStore.addCallback(function (writer) {
                writer.write(message);
                return writer;
            });
        };
        LocalPageTransport.prototype.subscribe = function (subscribe) {
            if (subscribe.isChanneled()) {
                return this.subscribeChanneled(subscribe);
            }
            if (!this.hasCommon) {
                this.hasCommon = true;
                this.stomp.subscribe('/exchange/' + this.exchangeName + ':' + this.hash, this.messageHandler, this.createHeader());
            }
            this.subscribes.add(subscribe);
            this.delivery.deliver(subscribe.getChannelName(), 'onready');
        };
        LocalPageTransport.prototype.subscribeChanneled = function (subscribe) {
            if (this.subscribes.has(subscribe)) {
                this.subscribes.add(subscribe);
                this.delivery.deliver(subscribe.getChannelName(), 'onready');
                return;
            }
            this.subscribes.add(subscribe);
            var endpoint = subscribe.getChannelName();
            var person;
            if (subscribe.getTarget() !== null) {
                person = subscribe.getTarget();
                endpoint = person + '$' + subscribe.getChannelName();
            }
            this.stomp.subscribe('/exchange/' + this.exchangeName + '.channel/' + endpoint, this.messageHandler, this.createChanneledHeader(subscribe, person));
            this.delivery.deliver(subscribe.getChannelName(), 'onready');
        };
        LocalPageTransport.prototype.unsubscribe = function (subscribe) {
            this.subscribes.remove(subscribe);
            if (!subscribe.isChanneled()) {
                return;
            }    // TODO закладываюсь, что нет канализированных и не канализированных с одним именем
            // TODO закладываюсь, что нет канализированных и не канализированных с одним именем
            if (this.subscribes.has(subscribe)) {
                return;
            }
            var person = subscribe.getTarget();
            this.stomp.unsubscribe(subscribeIdHeaderCreator(subscribe.getChannelName(), this.guid, this.hash, person));
            this.delivery.deliver(subscribe.getChannelName(), 'ondisconnect');
        };
        LocalPageTransport.prototype.destructor = function () {
            this.callDisconnect();
            _super.prototype.destructor.call(this);
            this.ackSender.stop();
            this.eventStore.addCallback(function (writer) {
                writer.destructor();
                return writer;
            });
            this.stomp.ws.removeEventListener('close', this.closeWsHandler);
            if (this.stomp.ws.readyState == 3 || this.stomp.ws.readyState == 2) {
                return;
            }
            this.stomp.ws.close(1000);
        };
        LocalPageTransport.prototype.setDisconnectHandler = function (fn) {
            var _this = this;
            this.onclose = function (event) {
                _this.destructor();
                fn(event);
            };
        };
        LocalPageTransport.prototype.close = function () {
            this.destructor();
        };
        LocalPageTransport.prototype.callDisconnect = function () {
            var _this = this;
            var deliver = function (subscribe) {
                _this.delivery.deliver(subscribe.getChannelName(), 'ondisconnect');
            };
            this.subscribes.all().forEach(deliver);
        };
        LocalPageTransport.prototype.createHeader = function () {
            var header = {
                receipt: this.hash,
                id: this.guid + '-' + this.hash,
                persistent: this.persistent,
                'auto-delete': !this.persistent
            };
            if (this.isAck) {
                header['prefetch-count'] = 10;
                header['ack'] = 'client';
            }
            return header;
        };
        LocalPageTransport.prototype.createChanneledHeader = function (subscribe, person) {
            var id = subscribeIdHeaderCreator(subscribe.getChannelName(), this.guid, this.hash, person);
            var header = {
                receipt: this.hash,
                id: id,
                persistent: this.persistent,
                'auto-delete': !this.persistent
            };
            if (this.isAck) {
                header['prefetch-count'] = 10;
                header['ack'] = 'client';
            }
            return header;
        };
        LocalPageTransport.generateGUID = function () {
            function s4() {
                return Math.floor((1 + Math.random()) * 65536).toString(16).substring(1);
            }
            return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
        };
        return LocalPageTransport;
    }(Transport_1.Transport);
    exports.LocalPageTransport = LocalPageTransport;
});