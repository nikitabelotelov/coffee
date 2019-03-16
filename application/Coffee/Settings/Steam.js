/// <amd-module name="Coffee/Settings/Steam" />
define('Coffee/Settings/Steam', [
    'require',
    'exports',
    'tslib',
    'Core/Control',
    'wml!Coffee/Settings/Steam/Steam',
    'css!Coffee/Settings/Steam/Steam'
], function (require, exports, tslib_1, Control, template) {
    'use strict';
    var Steam = /** @class */
    function (_super) {
        tslib_1.__extends(Steam, _super);
        function Steam() {
            var _this = _super !== null && _super.apply(this, arguments) || this;
            _this._template = template;
            _this.pressureValue = '';
            return _this;
        }
        Steam.prototype._beforeMount = function (opts) {
            this.settingsModel = opts.settingsInfo;
            this.updatePressureValue();
        };
        ;
        Steam.prototype._beforeUpdate = function () {
            this.updatePressureValue();
        };
        ;
        Steam.prototype.updatePressureValue = function () {
            this.pressureValue = this.settingsModel.getSetting('Паровой бойлер', 'Давление');
        };
        ;
        Steam.prototype.pressureValueChanged = function (_, value) {
            this.settingsModel.setSetting(value, 'Паровой бойлер', 'Давление', value);
        };
        ;
        return Steam;
    }(Control);
    return Steam;
});