define("Core/EventObject", ["require", "exports", "Env/Event", "Env/Env"], function (require, exports, Event_1, Env_1) {
    "use strict";
    Env_1.IoC.resolve('ILogger').log("Core/EventObject", 'module has been moved to "Env/Event:Object" and will be removed');
    return Event_1.Object;
});
