define('Browser/_Event/Server/native/_IndexedDB', [
    'require',
    'exports',
    'Browser/_Event/Server/native/_IndexedDB/Writer',
    'Browser/_Event/Server/native/_IndexedDB/Reader',
    'Browser/_Event/Server/native/_IndexedDB/AdapterStomp',
    'Browser/_Event/Server/native/_IndexedDB/AdapterEvent',
    'Browser/_Event/Server/native/_IndexedDB/Connector'
], function (require, exports, Writer_1, Reader_1, AdapterStomp_1, AdapterEvent_1, Connector_1) {
    'use strict';
    Object.defineProperty(exports, '__esModule', { value: true });
    exports.Writer = Writer_1.Writer;
    exports.Reader = Reader_1.Reader;
    exports.AdapterStomp = AdapterStomp_1.AdapterStomp;
    exports.AdapterEvent = AdapterEvent_1.AdapterEvent;
    exports.IMessage = AdapterEvent_1.IMessage;
    exports.Connector = Connector_1.Connector;
});