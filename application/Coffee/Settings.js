/// <amd-module name="Coffee/Settings" />
define('Coffee/Settings', [
    'require',
    'exports',
    'tslib',
    'UI/Base',
    'wml!Coffee/Settings/Settings',
    'Coffee/Data/DataStore',
    'css!Coffee/Settings/Settings'
], function (require, exports, tslib_1, Base_1, template, DataStore_1) {
    'use strict';
    var Settings = /** @class */
    function (_super) {
        tslib_1.__extends(Settings, _super);
        function Settings() {
            var _this = _super !== null && _super.apply(this, arguments) || this;
            _this._template = template;
            return _this;
        }
        Settings.prototype.checkUpdate = function () {
            DataStore_1.DataStore.closeConnection();
            setTimeout(function () {
                fetch('/Update').then(function () {
                    console.log('Update started');
                }, function () {
                    console.error('Update failed');
                });
            }, 2000);
        };
        ;
        return Settings;
    }(Base_1.Control);
    return Settings;
});