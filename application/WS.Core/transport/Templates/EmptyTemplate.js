define('Transport/Templates/EmptyTemplate', [
    'require',
    'exports',
    'Browser/TransportOld',
    'Env/Env'
], function (require, exports, TransportOld_1, Env_1) {
    'use strict';
    Env_1.IoC.resolve('ILogger').log('Transport/Templates/EmptyTemplate', 'module has been moved to "Browser/TransportOld:EmptyTemplate" and will be removed');
    return TransportOld_1.EmptyTemplate;
});