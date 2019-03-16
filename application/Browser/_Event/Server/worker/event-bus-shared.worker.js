define('Browser/_Event/Server/worker/event-bus-shared.worker', [
    'require',
    'exports'
], function (require, exports) {
    'use strict';    /**
     * Относительные пути, потому что ws может лежать в поддиректории
     */
                     // @ts-ignore
    /**
     * Относительные пути, потому что ws может лежать в поддиректории
     */
    // @ts-ignore
    importScripts('./define.worker.js', './event-bus.worker.js');
    self['onconnect'] = function (event) {
        var port = event.ports[0];
        port.onmessage = self['messageHandler'];
    };
});