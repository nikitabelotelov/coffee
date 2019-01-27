/// <amd-module name="UI/_base/HTML/Wait" />
define('UI/_base/HTML/Wait', [
    'require',
    'exports',
    'tslib',
    'UI/_base/Control',
    'wml!UI/_base/HTML/Wait',
    'View/Request'
], function (require, exports, tslib_1, Control_1, template, Request) {
    'use strict';
    Object.defineProperty(exports, '__esModule', { value: true });
    var asyncTemplate = function () {
        var _this = this;
        var res = template.apply(this, arguments);
        if (res.then) {
            res.then(function (result) {
                _this.resolvePromiseFn();
                return result;
            });
        } else {
            this.resolvePromiseFn();
        }
        return res;
    };    // Template functions should have true "stable" flag to send error on using, for example, some control instead it.
    // Template functions should have true "stable" flag to send error on using, for example, some control instead it.
    asyncTemplate.stable = template.stable;
    var Wait = /** @class */
    function (_super) {
        tslib_1.__extends(Wait, _super);
        function Wait() {
            var _this = _super !== null && _super.apply(this, arguments) || this;
            _this._template = asyncTemplate;
            _this.resolvePromise = null;
            return _this;
        }
        Wait.prototype.resolvePromiseFn = function () {
            if (this.resolvePromise) {
                this.resolvePromise();
                this.resolvePromise = null;
            }
        };
        Wait.prototype.createPromise = function () {
            var _this = this;
            this.waitDef = new Promise(function (resolve) {
                _this.resolvePromise = resolve;
            });
        };
        Wait.prototype._beforeMount = function () {
            this.createPromise();
            Request.getCurrent().getStorage('HeadData').pushWaiterDeferred(this.waitDef);
            if (typeof window !== 'undefined') {
                this.resolvePromiseFn();
                this.createPromise();
            }
        };
        return Wait;
    }(Control_1.default);
    exports.default = Wait;
});