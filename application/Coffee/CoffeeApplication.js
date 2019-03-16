/// <amd-module name="Coffee/CoffeeApplication" />
define('Coffee/CoffeeApplication', [
    'require',
    'exports',
    'tslib',
    'Core/Control',
    'wml!Coffee/CoffeeApplication/CoffeeApplication',
    'Coffee/Data/DataStore',
    'Core/ConsoleLogger',
    'css!Coffee/CoffeeApplication/CoffeeApplication'
], function (require, exports, tslib_1, Control, template, DataStore_1) {
    'use strict';
    var CoffeeApplication = /** @class */
    function (_super) {
        tslib_1.__extends(CoffeeApplication, _super);
        function CoffeeApplication() {
            var _this = _super !== null && _super.apply(this, arguments) || this;
            _this._template = template;
            return _this;
        }
        CoffeeApplication.prototype._beforeMount = function () {
            if (typeof window !== 'undefined') {
                return DataStore_1.DataStore.initDataStore();
            }
        };
        return CoffeeApplication;
    }(Control);
    return CoffeeApplication;
});