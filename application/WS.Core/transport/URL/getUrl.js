define('Transport/URL/getUrl', [
    'require',
    'exports',
    'Browser/Transport',
    'Env/Env'
], function (require, exports, Transport_1, Env_1) {
    'use strict';
    Env_1.IoC.resolve('ILogger').log('Transport/URL/getUrl', 'module has been moved to "Browser/Transport:URL.getUrl" and will be removed');
    return Transport_1.URL.getUrl;
});