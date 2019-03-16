define('Transport/XHR/ErrorText', [
    'require',
    'exports',
    'Browser/Transport',
    'Env/Env'
], function (require, exports, Transport_1, Env_1) {
    'use strict';
    Env_1.IoC.resolve('ILogger').log('Transport/RPC/Error', 'module has been moved to "Browser/Transport:XHR.ERRORS_TEXT" and will be removed');
    return Transport_1.XHR.ERRORS_TEXT;
});