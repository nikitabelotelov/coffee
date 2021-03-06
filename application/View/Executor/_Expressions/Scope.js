/// <amd-module name="View/Executor/_Expressions/Scope" />
define('View/Executor/_Expressions/Scope', [
    'require',
    'exports'
], function (require, exports) {
    'use strict';
    Object.defineProperty(exports, '__esModule', { value: true });
    var uniteProperties = ['className'];
    exports.propertyNameToIdentifyIsolatedScope = '___$isolatedscope';
    function replaceOrUnite(valueInner, valueOuter, prop) {
        if (~uniteProperties.indexOf(prop) && valueInner && valueOuter) {
            valueInner += ' ' + valueOuter;
        } else {
            valueInner = valueOuter;
        }
        return valueInner;
    }
    function checkMergeProps(object, prop) {
        return object.hasOwnProperty(prop);
    }
    function controlPropMerge(inner, object) {
        if (!inner) {
            inner = {};
        }
        for (var prop in object) {
            if (checkMergeProps(object, prop)) {
                inner[prop] = replaceOrUnite(inner[prop], object[prop], prop);
            }
        }
        return inner;
    }
    exports.controlPropMerge = controlPropMerge;    /**
     * После uniteScope нужно понять какую функцию мерджа вызвать
     * Позвать её или вернуть просто объект, если ничего
     * мерджить не нужно
     * @param scope
     * @param mergeFn
     * @returns {*}
     */
    /**
     * После uniteScope нужно понять какую функцию мерджа вызвать
     * Позвать её или вернуть просто объект, если ничего
     * мерджить не нужно
     * @param scope
     * @param mergeFn
     * @returns {*}
     */
    function calculateScope(scope, mergeFn) {
        return scope instanceof Function && scope.__$unite ? scope(mergeFn) : scope;
    }
    exports.calculateScope = calculateScope;
});