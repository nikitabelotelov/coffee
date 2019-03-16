define('Transport/deserializeURLData', [
    'require',
    'exports',
    'Browser/Transport',
    'Env/Env'
], function (require, exports, Transport_1, Env_1) {
    'use strict';
    Env_1.IoC.resolve('ILogger').log('Transport/deserializeURLData', 'module has been moved to "Browser/Transport:URL.deserializeData" and will be removed');
    return Transport_1.URL.deserializeData;
});