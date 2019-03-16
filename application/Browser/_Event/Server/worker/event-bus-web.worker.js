define('Browser/_Event/Server/worker/event-bus-web.worker', [
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
    importScripts('./define.worker.js', 'event-bus.worker.js');
    self.addEventListener('message', exports1['messageHandler']);
});