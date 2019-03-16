define('Transport/Templates/CompoundControlTemplate', [
    'require',
    'exports',
    'Browser/TransportOld',
    'Env/Env'
], function (require, exports, TransportOld_1, Env_1) {
    'use strict';
    Env_1.IoC.resolve('ILogger').log('Transport/Templates/CompoundControlTemplate', 'module has been moved to "Browser/TransportOld:CompoundControlTemplate" and will be removed');
    return TransportOld_1.CompoundControlTemplate;
});