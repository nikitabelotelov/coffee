/// <amd-module name="Coffee/Info" />
define('Coffee/Info', [
    'require',
    'exports',
    'tslib',
    'Core/Control',
    'wml!Coffee/Info/Info',
    'Coffee/Data/DataStore',
    'css!Coffee/Info/Info'
], function (require, exports, tslib_1, Control, template, DataStore_1) {
    'use strict';
    var Info = /** @class */
    function (_super) {
        tslib_1.__extends(Info, _super);
        function Info() {
            var _this = _super !== null && _super.apply(this, arguments) || this;
            _this._template = template;
            _this.currentInfo = {};
            return _this;
        }
        Info.prototype.currentInfoUpdated = function (currentInfo) {
            this.currentInfo = currentInfo;
            this._forceUpdate();
        };
        ;
        Info.prototype._beforeMount = function (opts) {
            DataStore_1.DataStore.on('currentInfoUpdate', this.currentInfoUpdated.bind(this));
        };
        ;
        Info.prototype._beforeUnmount = function () {
            DataStore_1.DataStore.removeHandler('currentInfoUpdate');
        };
        return Info;
    }(Control);
    return Info;
});