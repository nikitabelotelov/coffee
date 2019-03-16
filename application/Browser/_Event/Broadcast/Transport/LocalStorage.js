define('Browser/_Event/Broadcast/Transport/LocalStorage', [
    'require',
    'exports',
    'Browser/Storage',
    'Env/Env'
], function (require, exports, Storage_1, Env_1) {
    'use strict';
    Object.defineProperty(exports, '__esModule', { value: true });
    var NAME = 'TabMessage';
    var removeTimers = {};
    var LocalStorageTransport = /** @class */
    function () {
        // @ts-ignore
        function LocalStorageTransport(channel) {
            var _this = this;
            this.channel = channel;
            this.storage = new Storage_1.LocalStorage(NAME, undefined, false);    // @ts-ignore
            // @ts-ignore
            this.storage.subscribe('onChange', function (event, message, data) {
                _this.channel.notify(message, data);
            });
        }
        LocalStorageTransport.prototype.notify = function (message, data) {
            var _this = this;
            this.storage.setItem(message, data);
            if (!Env_1.detection.isIE) {
                return this.storage.removeItem(message);
            }    /**
             * Необходимо почистить хранилище за собой, однако в IE событие onStorage на больших строках не вызывается
             * поэтому внутри он записывает вспомогательное значение. чтобы вызвать фейкоое событие на всех вкладках
             * тут получается проблема, что есть делать set + remove на одной вкладке, вспомогательное событие на другой
             * может отработать позже remove и когда полезет за данными через get их уже не будет там,
             * что в итоге приведёт к двум событиям onremove на вкладках получателях.
             */
            /**
             * Необходимо почистить хранилище за собой, однако в IE событие onStorage на больших строках не вызывается
             * поэтому внутри он записывает вспомогательное значение. чтобы вызвать фейкоое событие на всех вкладках
             * тут получается проблема, что есть делать set + remove на одной вкладке, вспомогательное событие на другой
             * может отработать позже remove и когда полезет за данными через get их уже не будет там,
             * что в итоге приведёт к двум событиям onremove на вкладках получателях.
             */
            if (removeTimers[message]) {
                clearTimeout(removeTimers[message]);
            }
            removeTimers[message] = setTimeout(function () {
                _this.storage.removeItem(message);
            }, 500);
        };
        LocalStorageTransport.prototype.destroy = function () {
            this.storage.destroy();
        };
        return LocalStorageTransport;
    }();
    exports.LocalStorageTransport = LocalStorageTransport;
});