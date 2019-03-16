define('Lib/ServerEvent/Bus', [
    'require',
    'exports',
    'Browser/Event',
    'Env/Env'
], function (require, exports, Event_1, Env_1) {
    'use strict';
    Env_1.IoC.resolve('ILogger').log('Lib/ServerEvent/Bus', 'module has been moved to "Browser/Event:Server" and will be removed');
    return Event_1.Server;
});