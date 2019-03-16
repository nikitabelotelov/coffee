/// <amd-module name="Router/Reference" />
define('Router/Reference', [
    'require',
    'exports',
    'tslib',
    'Core/Control',
    'wml!Router/Reference',
    'Router/Controller',
    'Router/MaskResolver'
], function (require, exports, tslib_1, Control, template, Controller, MaskResolver) {
    'use strict';
    var Reference = /** @class */
    function (_super) {
        tslib_1.__extends(Reference, _super);
        function Reference() {
            var _this = _super !== null && _super.apply(this, arguments) || this;
            _this._template = template;
            return _this;
        }
        Reference.prototype._beforeMount = function (cfg) {
            this._recalcHref(cfg);
        };
        Reference.prototype._afterMount = function () {
            this._register();
        };
        Reference.prototype._beforeUpdate = function (cfg) {
            this._recalcHref(cfg);
        };
        Reference.prototype._beforeUnmount = function () {
            this._unregister();
        };
        Reference.prototype._register = function () {
            var _this = this;
            Controller.addReference(this, function () {
                _this._recalcHref(_this._options);
                _this._forceUpdate();
                return Promise.resolve(true);
            });
        };
        Reference.prototype._unregister = function () {
            Controller.removeReference(this);
        };
        Reference.prototype._recalcHref = function (cfg) {
            this._state = MaskResolver.calculateHref(cfg.state, cfg);
            if (cfg.href) {
                this._href = MaskResolver.calculateHref(cfg.href, cfg);
            } else {
                this._href = undefined;
            }
        };
        Reference.prototype._clickHandler = function (e) {
            e.preventDefault();
            this._changeUrlState({
                state: this._state,
                href: this._href
            });
        };
        Reference.prototype._changeUrlState = function (newState) {
            Controller.navigate(newState);
        };
        return Reference;
    }(Control);
    return Reference;
});