/// <amd-module name="Coffee/Settings/Group1" />
define('Coffee/Settings/Group1', [
    'require',
    'exports',
    'tslib',
    'Core/Control',
    'wml!Coffee/Settings/Group1/Group1',
    'css!Coffee/Settings/Group1/Group1'
], function (require, exports, tslib_1, Control, template) {
    'use strict';
    var Group1 = /** @class */
    function (_super) {
        tslib_1.__extends(Group1, _super);
        function Group1() {
            var _this = _super !== null && _super.apply(this, arguments) || this;
            _this._template = template;
            _this.currentSetting = '';
            _this.currentSettingValue = '';
            return _this;
        }
        Group1.prototype._beforeMount = function (opts) {
            this.settingsModel = opts.settingsInfo;
        };
        ;
        Group1.prototype._beforeUpdate = function () {
            if (this.currentSetting) {
                this.updateCurrentSettingValue(this.currentSetting);
            }
        };
        ;
        Group1.prototype.updateCurrentSettingValue = function (setting) {
            this.currentSettingValue = this.settingsModel.getSetting('Группа 1', this.currentSetting);
        };
        ;
        Group1.prototype.chooseSetting = function (_, setting) {
            this.currentSetting = setting;
        };
        ;
        Group1.prototype.settingValueChanged = function (_, value) {
            if (this.currentSetting) {
                this.settingsModel.setSetting(value, 'Группа 1', this.currentSetting, value);
            }
        };
        ;
        return Group1;
    }(Control);
    return Group1;
});