/// <amd-module name="Coffee/Main" />
define('Coffee/Main', [
    'require',
    'exports',
    'tslib',
    'UI/Base',
    'wml!Coffee/Main/Main',
    'Coffee/Data/DataStore',
    'Core/ConsoleLogger',
    'css!Coffee/Main/Main'
], function (require, exports, tslib_1, Base_1, template, DataStore_1) {
    'use strict';
    var Main = /** @class */
    function (_super) {
        tslib_1.__extends(Main, _super);
        function Main() {
            var _this = _super !== null && _super.apply(this, arguments) || this;
            _this._template = template;
            return _this;
        }
        Main.prototype.updateSettingsData = function (data) {
            this.settingsData = data;
            this._forceUpdate();
        };
        ;
        Main.prototype._beforeMount = function () {
            var _this = this;
            return DataStore_1.DataStore.initDataStore().then(function () {
                DataStore_1.DataStore.onSettingsUpdated(_this.updateSettingsData.bind(_this));
            });
        };
        return Main;
    }(Base_1.Control);
    return Main;
});