define('Browser/Event', [
    'require',
    'exports',
    'Browser/_Event/Server/Bus',
    'Browser/_Event/Broadcast/Message'
], function (require, exports, Bus_1, Message_1) {
    'use strict';
    Object.defineProperty(exports, '__esModule', { value: true });
    exports.Server = Bus_1.default;
    exports.Broadcast = Message_1.default;
});