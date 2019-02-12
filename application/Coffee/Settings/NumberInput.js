/// <amd-module name="Coffee/Settings/NumberInput" />
define('Coffee/Settings/NumberInput', [
    'require',
    'exports',
    'tslib',
    'UI/Base',
    'wml!Coffee/Settings/NumberInput/NumberInput',
    'css!Coffee/Settings/NumberInput/NumberInput'
], function (require, exports, tslib_1, Base_1, template) {
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
        Info.prototype.increment = function () {
            this.inputValue = this.inputValue + 1;
            this._notify('valueChanged', [this.inputValue]);
        };
        ;
        Info.prototype.decrement = function () {
            this.inputValue = this.inputValue - 1;
            this._notify('valueChanged', [this.inputValue]);
        };
        return Info;
    }(Base_1.Control);
    return Info;
});