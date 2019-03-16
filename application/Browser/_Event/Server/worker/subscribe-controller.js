define('Browser/_Event/Server/worker/subscribe-controller', [
    'require',
    'exports',
    'Browser/_Event/Server/worker/subscribe',
    'Browser/_Event/Server/native/HashedCounter'
], function (require, exports, subscribe_1, HashedCounter_1) {
    'use strict';
    Object.defineProperty(exports, '__esModule', { value: true });
    var PortHasher = /** @class */
    function () {
        function PortHasher() {
            this.ports = new Map();
        }
        PortHasher.prototype.getHash = function (port) {
            var hash = this.ports.get(port);
            if (!hash) {
                hash = Math.random().toFixed(10).substr(2);
                this.ports.set(port, hash);
            }
            return hash;
        };
        return PortHasher;
    }();
    exports.PortHasher = PortHasher;    /**
     * Класс по хранению подписок в разрезе портов(страниц)
     * @class Browser/_Event/Server/worker/SubscribeController
     */
    /**
     * Класс по хранению подписок в разрезе портов(страниц)
     * @class Browser/_Event/Server/worker/SubscribeController
     */
    var SubscribeController = /** @class */
    function () {
        function SubscribeController() {
            this.portHasher = new PortHasher();
            this.common = new HashedCounter_1.HashedCounter(false);
            this.channeled = new HashedCounter_1.HashedCounter();    /**
             * Храним все порты соединений в одном экземпляре
             * @type {Array}
             */
            /**
             * Храним все порты соединений в одном экземпляре
             * @type {Array}
             */
            this.ports = [];
        }
        SubscribeController.prototype.register = function (eventName, port) {
            var subscribe = new subscribe_1.Subscribe(eventName, port, this.portHasher.getHash(port));
            this.common.add(subscribe);
            if (this.ports.indexOf(port) == -1) {
                this.ports.push(port);
            }
        };
        SubscribeController.prototype.registerChanneled = function (eventName, port, person) {
            var subscribe = new subscribe_1.Subscribe(eventName, port, this.portHasher.getHash(port), true, person);
            this.channeled.add(subscribe);
            if (this.ports.indexOf(port) == -1) {
                this.ports.push(port);
            }
        };
        SubscribeController.prototype.unregisterChanneled = function (eventName, port, person) {
            var subscribe = new subscribe_1.Subscribe(eventName, port, this.portHasher.getHash(port), true, person);
            this.channeled.remove(subscribe);
        };
        SubscribeController.prototype.get = function (eventName) {
            return this.common.getByName(eventName).concat(this.channeled.getByName(eventName));
        };
        SubscribeController.prototype.getPorts = function () {
            return this.ports;
        };
        SubscribeController.prototype.hasChanneled = function (eventName, person) {
            var subscribes = this.channeled.getByName(eventName);
            for (var _i = 0, subscribes_1 = subscribes; _i < subscribes_1.length; _i++) {
                var sub = subscribes_1[_i];
                if (sub.person === person) {
                    return true;
                }
            }
            return false;
        };
        SubscribeController.prototype.removePort = function (port) {
            var pos = this.ports.indexOf(port);
            if (pos === -1) {
                return;
            }
            this.removeByPort(port, this.common);
            this.removeByPort(port, this.channeled);
            this.ports.splice(pos, 1);
        };
        SubscribeController.prototype.removeByPort = function (port, cont) {
            var subs = cont.getSubscribes().filter(function (item) {
                return item.port === port;
            });
            for (var _i = 0, subs_1 = subs; _i < subs_1.length; _i++) {
                var item = subs_1[_i];
                var count = cont.getCount(item);
                for (var i = 0; i < count; i++) {
                    cont.remove(item);
                }
            }
        };    /**
         * Очищаем и возвращаем очищенные подписки
         * @return {Subscribe[]}
         */
        /**
         * Очищаем и возвращаем очищенные подписки
         * @return {Subscribe[]}
         */
        SubscribeController.prototype.clear = function () {
            var _this = this;
            var result = [];
            this.channeled.getSubscribes().forEach(function (item) {
                for (var i = 0; i < _this.common.getCount(item); i++) {
                    result.push(item);
                }
            });    /* В this.common всегда одна копия */
            /* В this.common всегда одна копия */
            result = this.common.getSubscribes().concat(result);
            this.common = new HashedCounter_1.HashedCounter(false);
            this.channeled = new HashedCounter_1.HashedCounter();
            this.ports = [];
            return result;
        };
        return SubscribeController;
    }();
    exports.SubscribeController = SubscribeController;
});