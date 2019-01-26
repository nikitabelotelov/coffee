/// <amd-module name="Coffee/Settings" />
define('Coffee/Settings', [
    'require',
    'exports',
    'tslib',
    'UI/Index',
    'wml!Coffee/Settings/Settings',
    'css!Coffee/Settings/Settings'
], function (require, exports, tslib_1, Index_1, template) {
    'use strict';
    var Settings = /** @class */
    function (_super) {
        tslib_1.__extends(Settings, _super);
        function Settings() {
            var _this = _super !== null && _super.apply(this, arguments) || this;
            _this._template = template;
            return _this;
        }
        return Settings;
    }(Index_1.Control);
    return Settings;
});