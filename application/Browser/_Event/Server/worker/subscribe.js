define('Browser/_Event/Server/worker/subscribe', [
    'require',
    'exports'
], function (require, exports) {
    'use strict';
    Object.defineProperty(exports, '__esModule', { value: true });
    var Subscribe = /** @class */
    function () {
        function Subscribe(eventName, port, portHash, isChanneled, person) {
            if (isChanneled === void 0) {
                isChanneled = false;
            }
            if (person === void 0) {
                person = '';
            }
            this.eventName = eventName;
            this.port = port;
            this.portHash = portHash;
            this.isChanneled = isChanneled;
            this.person = person;
        }
        Subscribe.prototype.getChannelName = function () {
            return this.eventName;
        };
        Subscribe.prototype.hash = function () {
            return this.eventName + '::' + (this.isChanneled ? 'ch' : 'co') + '::' + this.portHash + '::' + this.person;
        };
        return Subscribe;
    }();
    exports.Subscribe = Subscribe;
});