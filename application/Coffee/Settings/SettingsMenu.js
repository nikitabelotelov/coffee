/// <amd-module name="Coffee/Settings/SettingsMenu" />
define('Coffee/Settings/SettingsMenu', [
    'require',
    'exports',
    'tslib',
    'Core/Control',
    'wml!Coffee/Settings/SettingsMenu/SettingsMenu',
    'css!Coffee/Settings/SettingsMenu/SettingsMenu'
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
        return Info;
    }(Control);
    return Info;
});