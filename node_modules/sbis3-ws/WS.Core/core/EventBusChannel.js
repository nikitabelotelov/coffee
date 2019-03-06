define("Core/EventBusChannel", ["require", "exports", "Env/Event", "Env/Env"], function (require, exports, Event_1, Env_1) {
    "use strict";
    Env_1.IoC.resolve('ILogger').log("Core/EventBusChannel", 'module has been moved to "Env/Event:Channel" and will be removed');
    return Event_1.Channel;
});
