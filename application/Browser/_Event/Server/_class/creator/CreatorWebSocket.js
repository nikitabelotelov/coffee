define('Browser/_Event/Server/_class/creator/CreatorWebSocket', [
    'require',
    'exports',
    'Env/Env',
    'Core/UserInfo',
    'Browser/Storage',
    'Browser/_Event/Server/_class/creator/TransportConnect',
    'Browser/_Event/Server/_class/transport/Constants'
], function (require, exports, Env_1, UserInfo, Storage_1, TransportConnect_1, CONST) {
    'use strict';
    Object.defineProperty(exports, '__esModule', { value: true });
    var CreatorWebSocket = /** @class */
    function () {
        function CreatorWebSocket(connectOptions, transportConnect) {
            if (transportConnect === void 0) {
                transportConnect = new TransportConnect_1.TransportConnect();
            }
            this.connectOptions = connectOptions;
            this.transportConnect = transportConnect;
            this.ls = new Storage_1.LocalStorage('SEB');
            var userName = UserInfo.get('ЛогинПользователя') || '';
            this.isGuestAccess = userName.indexOf('__сбис__гость__') > -1;
        }
        CreatorWebSocket.prototype.isAvailableInEnv = function (isExclusive) {
            if (isExclusive) {
                return false;
            }
            return !this.connectOptions.isDesktop() && !Env_1.detection.isMobileIOS;
        };
        CreatorWebSocket.prototype.build = function (hash) {
            var _this = this;
            return this.chooseTransportConstructor().then(function (ctor) {
                return _this.createTransport(ctor, hash);
            });
        };
        CreatorWebSocket.prototype.createTransport = function (ctor, hash) {
            var _this = this;
            if (ctor.getLocalName() === 'LocalSlaveTransport') {
                return Promise.resolve(new ctor());
            }
            return this.transportConnect.connect(this.connectOptions, true).then(function (connect) {
                return new ctor(connect, hash, !_this.isGuestAccess, _this.connectOptions.exchange);
            });
        };
        CreatorWebSocket.prototype.chooseTransportConstructor = function () {
            var _this = this;
            var timestamp = this.ls.getItem(CONST.KEY_ACTUAL_DATE);
            return new Promise(function (resolve, reject) {
                if (!timestamp) {
                    return resolve(_this.loadMainTransport());
                }
                var last = new Date(timestamp + CONST.CHECK_MIN_INTERVAL * 2);
                if (last < new Date() || isNaN(last.valueOf())) {
                    return resolve(_this.loadMainTransport());
                }    // @ts-ignore
                // @ts-ignore
                require(['Browser/_Event/Server/_class/transport/LocalSlaveTransport'], function (module) {
                    if (!module.LocalSlaveTransport) {
                        return reject(new Error('Browser/_Event/Server/_class/transport/LocalSlaveTransport not found'));
                    }
                    resolve(module.LocalSlaveTransport);
                });
            });
        };
        CreatorWebSocket.prototype.loadMainTransport = function () {
            return new Promise(function (resolve, reject) {
                // @ts-ignore
                require(['Browser/_Event/Server/_class/transport/LocalMainTransport'], function (module) {
                    if (!module.LocalMainTransport) {
                        return reject(new Error('Browser/_Event/Server/_class/transport/LocalMainTransport not found'));
                    }
                    resolve(module.LocalMainTransport);
                });
            });
        };
        return CreatorWebSocket;
    }();
    exports.CreatorWebSocket = CreatorWebSocket;
});