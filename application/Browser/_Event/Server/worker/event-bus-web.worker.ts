/**
 * Относительные пути, потому что ws может лежать в поддиректории
 */
// @ts-ignore
importScripts(
    "./define.worker.js",
    "event-bus.worker.js"
);
self.addEventListener('message', exports1["messageHandler"]);
