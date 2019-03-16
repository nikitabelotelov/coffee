define('Transport/TransportError', [
    'require',
    'exports',
    'Browser/Transport',
    'Env/Env'
], function (require, exports, Transport_1, Env_1) {
    'use strict';
    Env_1.IoC.resolve('ILogger').log('Transport/TransportError', 'module has been moved to "Browser/Transport:RPC.Error" and will be removed');
    return Transport_1.RPC.Error;
});