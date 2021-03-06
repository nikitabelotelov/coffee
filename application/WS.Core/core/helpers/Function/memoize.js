/// <amd-module name="Core/helpers/Function/memoize" />
define("Core/helpers/Function/memoize", ["require", "exports"], function (require, exports) {
    'use strict';
    var memoize = function (func, cachedFuncName) {
        var wrapFn = function memoFirst() {
            var res = func.call(this), cached = function memoCached() {
                return res;
            };
            cached.reset = function () {
                addToMemoized(this, cachedFuncName, wrapFn);
                res = undefined;
            }.bind(this);
            addToMemoized(this, cachedFuncName, cached);
            return res;
        };
        wrapFn.reset = function () { };
        wrapFn.wrappedFunction = func;
        return wrapFn;
    };
    var addToMemoized = function (instance, name, impl) {
        instance[name] = impl;
        var memoizedMethods = instance._memoizedMethods || (instance._memoizedMethods = []);
        if (memoizedMethods.indexOf(name) === -1) {
            memoizedMethods.push(name);
        }
    };
    var clearMemoized = function (instance) {
        if (instance._memoizedMethods) {
            instance._memoizedMethods.forEach(function (name) {
                if (instance[name] && instance[name].reset) {
                    instance[name].reset();
                }
            });
        }
        delete instance._memoizedMethods;
    };
    memoize.clear = clearMemoized;
    return memoize;
});
