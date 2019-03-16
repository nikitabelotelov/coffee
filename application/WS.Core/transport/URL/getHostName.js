define('Transport/URL/getHostName', [
    'require',
    'exports',
    'Browser/Transport',
    'Env/Env'
], function (require, exports, Transport_1, Env_1) {
    'use strict';
    Env_1.IoC.resolve('ILogger').log('Transport/URL/getHostName', 'module has been moved to "Browser/Transport:URL.getHostName" and will be removed');
    return Transport_1.URL.getHostName;
});