/// <amd-module name="UI/_base/Start" />
define('UI/_base/Start', [
    'require',
    'exports',
    'UI/_base/Control',
    'View/Request'
], function (require, exports, Control_1, Request) {
    'use strict';
    Object.defineProperty(exports, '__esModule', { value: true });
    function createControl(control, config, dom) {
        var configReady = config || {};
        if (typeof window && window.wsConfig) {
            for (var i in window.wsConfig) {
                if (window.wsConfig.hasOwnProperty(i)) {
                    configReady[i] = window.wsConfig[i];
                }
            }
        }
        var _getChildContext = control.prototype._getChildContext;
        control.prototype._getChildContext = function () {
            var base = _getChildContext ? _getChildContext.call(this) : {};
            if (typeof window && window.startContextData) {
                for (var i in window.startContextData) {
                    if (window.startContextData.hasOwnProperty(i) && !base.hasOwnProperty(i)) {
                        base[i] = window.startContextData[i];
                    }
                }
            }
            return base;
        };
        Control_1.default.createControl(control, configReady, dom);
    }
    function startFunction(config) {
        if (typeof window !== 'undefined' && window.receivedStates) {
            //для совместимости версий. чтобы можно было влить контролы и WS одновременно
            var sr = Request.getCurrent().stateReceiver;
            sr && sr.deserialize(window.receivedStates);
        }
        var dom = document.getElementById('root');
        var dcomp = dom.attributes['rootapp'];
        if (dcomp) {
            dcomp = dcomp.value;
        }
        var module = '';
        if (dcomp && dcomp.indexOf(':') > -1) {
            dcomp = dcomp.split(':');
            module = dcomp[1];
            dcomp = dcomp[0];
        }
        require([
            dcomp || undefined,
            dom.attributes['application'].value
        ], function (result, component) {
            if (result) {
                if (module) {
                    result = result[module];
                }
                config = config || {};
                config.application = dom.attributes['application'].value;
            }
            config.buildnumber = window.buildnumber;
            createControl(result || component, config, dom);
        });
    }
    ;
    exports.default = startFunction;
});