/// <amd-module name="Coffee/Settings/SettingsDetail" />
define('Coffee/Settings/SettingsDetail', [
    'require',
    'exports',
    'tslib',
    'Core/Control',
    'wml!Coffee/Settings/SettingsDetail/SettingsDetail',
    'css!Coffee/Settings/SettingsDetail/SettingsDetail'
], function (require, exports, tslib_1, Control, template) {
    'use strict';
    var SettingsDetail = /** @class */
    function (_super) {
        tslib_1.__extends(SettingsDetail, _super);
        function SettingsDetail() {
            var _this = _super !== null && _super.apply(this, arguments) || this;
            _this._template = template;
            return _this;
        }
        SettingsDetail.prototype.settingChangedHandler = function (event, value) {
            this._notify('valueChanged', [value]);
        };
        ;
        return SettingsDetail;
    }(Control);
    return SettingsDetail;
});