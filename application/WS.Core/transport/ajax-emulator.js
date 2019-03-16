define('Transport/ajax-emulator', [
    'require',
    'exports',
    'Browser/Transport',
    'Env/Env'
], function (require, exports, Transport_1, Env_1) {
    'use strict';
    Env_1.IoC.resolve('ILogger').log('Transport/ajax-emulator', 'module has been moved to "Browser/Transport:ajax" and will be removed');
    return Transport_1.ajax;
});