define('Lib/Tab/Message', [
    'require',
    'exports',
    'Browser/Event',
    'Env/Env'
], function (require, exports, Event_1, Env_1) {
    'use strict';
    Env_1.IoC.resolve('ILogger').log('Lib/Tab/Message', 'module has been moved to "Browser/Event:Broadcast" and will be removed');
    return Event_1.Broadcast;
});