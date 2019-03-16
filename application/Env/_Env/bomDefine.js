/// <amd-module name="Env/_Env/bomDefine" />
define('Env/_Env/bomDefine', [
    'require',
    'exports'
], function (require, exports) {
    'use strict';
    var global = function () {
        return this || (0, eval)('this');
    }();
    if (typeof window === 'undefined') {
        global.window = undefined;
    }
    if (typeof document === 'undefined') {
        global.document = undefined;
    }
    if (typeof navigator === 'undefined') {
        global.navigator = undefined;
    }    // @ts-ignore
    // @ts-ignore
    if (typeof process === 'undefined') {
        global.process = undefined;
    }
});