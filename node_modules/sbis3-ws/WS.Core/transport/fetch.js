define("Transport/fetch", ["require", "exports", "Browser/Transport", "Env/Env"], function (require, exports, Transport_1, Env_1) {
    "use strict";
    Env_1.IoC.resolve('ILogger').log("Transport/fetch", 'module has been moved to "Browser/Transport:fetch.fetch" and will be removed');
    return Transport_1.fetch.fetch;
});
