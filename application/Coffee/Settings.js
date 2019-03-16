/// <amd-module name="Coffee/Settings" />
define('Coffee/Settings', [
    'require',
    'exports',
    'tslib',
    'Core/Control',
    'wml!Coffee/Settings/Settings',
    'Coffee/Data/DataStore',
    'Coffee/Settings/SettingsModel/SettingsModel',
    'css!Coffee/Settings/Settings'
], function (require, exports, tslib_1, Control, template, DataStore_1, SettingsModel_1) {
    'use strict';
    var Settings = /** @class */
    function (_super) {
        tslib_1.__extends(Settings, _super);
        function Settings() {
            var _this = _super !== null && _super.apply(this, arguments) || this;
            _this._template = template;
            return _this;
        }
        Settings.prototype._beforeMount = function (opts) {
            var _this = this;
            var promiseResult = new Promise(function (resolve, reject) {
                var initialSettings = DataStore_1.DataStore.getInitialSettings();
                if (initialSettings) {
                    _this.saveSettings(initialSettings);
                    resolve();
                } else {
                    DataStore_1.DataStore.on('initialSettings', function () {
                        _this.saveSettings(DataStore_1.DataStore.getInitialSettings());
                        _this._forceUpdate();
                        DataStore_1.DataStore.removeHandler('initialSettings');
                        resolve();
                    });
                }
            });
            return promiseResult;
        };
        ;
        Settings.prototype.settingChangedHandler = function (event, value) {
            DataStore_1.DataStore.sendSettings(this.settingsInfo);
        };
        ;
        Settings.prototype.saveSettings = function (settings) {
            var parsedSettings = SettingsModel_1.SettingsModel.parseSettings(settings);
            this.settingsInfo = { settingsInfo: new SettingsModel_1.SettingsModel(parsedSettings) };
        };
        ;
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
    }(Control);
    return Settings;
});