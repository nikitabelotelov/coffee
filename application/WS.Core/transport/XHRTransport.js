define('Transport/XHRTransport', [
    'require',
    'exports',
    'Browser/Transport',
    'Env/Env'
], function (require, exports, Transport_1, Env_1) {
    'use strict';
    Env_1.IoC.resolve('ILogger').log('Transport/XHRTransport', 'module has been moved to "Browser/Transport:XHR" and will be removed');
    return Transport_1.XHR;
});