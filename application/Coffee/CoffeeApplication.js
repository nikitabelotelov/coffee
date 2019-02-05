/// <amd-module name="Coffee/CoffeeApplication" />
define('Coffee/CoffeeApplication', [
    'require',
    'exports',
    'tslib',
    'UI/Base',
    'wml!Coffee/CoffeeApplication/CoffeeApplication',
    'Coffee/Data/DataStore',
    'Core/ConsoleLogger',
    'css!Coffee/CoffeeApplication/CoffeeApplication'
], function (require, exports, tslib_1, Base_1, template, DataStore_1) {
    'use strict';
    var CoffeeApplication = /** @class */
    function (_super) {
        tslib_1.__extends(CoffeeApplication, _super);
        function CoffeeApplication() {
            var _this = _super !== null && _super.apply(this, arguments) || this;
            _this._template = template;
            return _this;
        }
        CoffeeApplication.prototype.updateSettingsData = function (data) {
            this.settingsInfo = data;
            this._forceUpdate();
        };
        ;
        CoffeeApplication.prototype.updateInfoData = function (data) {
            this.currentInfo = data;
            this._forceUpdate();
        };
        ;
        CoffeeApplication.prototype._beforeMount = function () {
            var _this = this;
            return DataStore_1.DataStore.initDataStore().then(function () {
                DataStore_1.DataStore.onRawDataUpdated(_this.updateSettingsData.bind(_this));
                DataStore_1.DataStore.onRawInfoUpdated(_this.updateInfoData.bind(_this));
            });
        };
        return CoffeeApplication;
    }(Base_1.Control);
    return CoffeeApplication;
});