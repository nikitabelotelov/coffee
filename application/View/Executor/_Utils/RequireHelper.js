/// <amd-module name="View/Executor/_Utils/RequireHelper" />
define('View/Executor/_Utils/RequireHelper', [
    'require',
    'exports'
], function (require, exports) {
    'use strict';
    Object.defineProperty(exports, '__esModule', { value: true });
    var myRequireHash = {};    // require.defined returns current module if you call it with '.'
    // require.defined returns current module if you call it with '.'
    function checkModuleName(name) {
        return name.indexOf('<') === -1 && name.indexOf('>') === -1 && name.indexOf('/') > -1 && name !== '.';
    }
    function defined(name) {
        var res = false;
        if (typeof name !== 'string') {
            return false;
        }
        if (myRequireHash[name]) {
            return true;
        } else if (checkModuleName(name)) {
            // @ts-ignore
            res = require.defined(name);
            if (res) {
                // @ts-ignore
                var mod = require(name);    //It's possible that module is defined but not ready yet because it waits for its own dependencies.
                                            //If we start to build templates until this process ends we'd receive not exactly module body here.
                                            //We can get undefined or an empty object instead.
                //It's possible that module is defined but not ready yet because it waits for its own dependencies.
                //If we start to build templates until this process ends we'd receive not exactly module body here.
                //We can get undefined or an empty object instead.
                if (mod === undefined || mod && typeof mod === 'object' && Object.keys(mod).length === 0) {
                    return false;
                }
                myRequireHash[name] = mod;
            }
        }
        return res;
    }
    exports.defined = defined;
    function _require(name) {
        if (!myRequireHash[name]) {
            // @ts-ignore
            myRequireHash[name] = require(name);
        }
        return myRequireHash[name];
    }
    exports.require = _require;
});