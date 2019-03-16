/// <amd-module name="Coffee/Settings/NumberInput" />
define('Coffee/Settings/NumberInput', [
    'require',
    'exports',
    'tslib',
    'Core/Control',
    'wml!Coffee/Settings/NumberInput/NumberInput',
    'css!Coffee/Settings/NumberInput/NumberInput'
], function (require, exports, tslib_1, Control, template) {
    'use strict';
    var Info = /** @class */
    function (_super) {
        tslib_1.__extends(Info, _super);
        function Info() {
            var _this = _super !== null && _super.apply(this, arguments) || this;
            _this._template = template;
            return _this;
        }
        Info.prototype._beforeMount = function (opts) {
            this.inputValue = opts.value;
        };
        ;
        Info.prototype._beforeUpdate = function (opts) {
            this.inputValue = opts.value;
        };
        ;
        Info.prototype.increment = function () {
            this._notify('valueChanged', [this.inputValue + 1]);
        };
        ;
        Info.prototype.decrement = function () {
            this._notify('valueChanged', [this.inputValue - 1]);
        };
        return Info;
    }(Control);
    return Info;
});