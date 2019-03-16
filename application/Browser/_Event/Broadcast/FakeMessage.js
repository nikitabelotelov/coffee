define('Browser/_Event/Broadcast/FakeMessage', [
    'require',
    'exports'
], function (require, exports) {
    'use strict';
    Object.defineProperty(exports, '__esModule', { value: true });    /** Заглушка Browser/_Event/Broadcast/Message для СП */
    /** Заглушка Browser/_Event/Broadcast/Message для СП */
    var FakeMessage = /** @class */
    function () {
        function FakeMessage() {
        }
        FakeMessage.prototype.unsubscribe = function () {
            return this;
        };
        FakeMessage.prototype.subscribe = function () {
            return this;
        };
        FakeMessage.prototype.once = function () {
            return this;
        };
        FakeMessage.prototype.destroy = function () {
        };
        FakeMessage.prototype.notify = function () {
        };
        return FakeMessage;
    }();
    exports.default = FakeMessage;
});