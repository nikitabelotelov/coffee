/// <amd-module name="Coffee/Settings/Group2" />
define('Coffee/Settings/Group2', [
    'require',
    'exports',
    'tslib',
    'Core/Control',
    'wml!Coffee/Settings/Group2/Group2',
    'css!Coffee/Settings/Group2/Group2'
], function (require, exports, tslib_1, Control, template) {
    'use strict';
    var Group2 = /** @class */
    function (_super) {
        tslib_1.__extends(Group2, _super);
        function Group2() {
            var _this = _super !== null && _super.apply(this, arguments) || this;
            _this._template = template;
            _this.currentSetting = '';
            _this.currentSettingValue = '';
            return _this;
        }
        Group2.prototype._beforeMount = function (opts) {
            this.settingsModel = opts.settingsInfo;
        };
        ;
        Group2.prototype._beforeUpdate = function () {
            if (this.currentSetting) {
                this.updateCurrentSettingValue(this.currentSetting);
            }
        };
        ;
        Group2.prototype.updateCurrentSettingValue = function (setting) {
            this.currentSettingValue = this.settingsModel.getSetting('Группа 2', this.currentSetting);
        };
        ;
        Group2.prototype.chooseSetting = function (_, setting) {
            this.currentSetting = setting;
        };
        ;
        Group2.prototype.settingValueChanged = function (_, value) {
            if (this.currentSetting) {
                this.settingsModel.setSetting(value, 'Группа 2', this.currentSetting, value);
            }
        };
        ;
        return Group2;
    }(Control);
    return Group2;
});