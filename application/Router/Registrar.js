/// <amd-module name="Router/Registrar" />
define('Router/Registrar', [
    'require',
    'exports'
], function (require, exports) {
    'use strict';
    Object.defineProperty(exports, '__esModule', { value: true });
    var Registrar = /** @class */
    function () {
        function Registrar() {
            this._registry = null;
            this._registry = {};
        }
        Registrar.prototype.register = function (event, component, callback) {
            this._registry[component.getInstanceId()] = {
                component: component,
                callback: callback
            };
            event.stopPropagation();
        };
        Registrar.prototype.unregister = function (event, component) {
            delete this._registry[component.getInstanceId()];
            event.stopPropagation();
        };
        Registrar.prototype.startAsync = function (objectNew, objectOld) {
            if (!this._registry) {
                return;
            }
            var promises = [];
            for (var i in this._registry) {
                if (this._registry.hasOwnProperty(i)) {
                    var obj = this._registry[i];
                    var res = obj && obj.callback.apply(obj.component, arguments);
                    promises.push(res);
                }
            }
            return Promise.all(promises);
        };
        return Registrar;
    }();
    exports.default = Registrar;
});