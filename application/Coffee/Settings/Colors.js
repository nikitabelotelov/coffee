/// <amd-module name="Coffee/Settings/Colors" />
define('Coffee/Settings/Colors', [
    'require',
    'exports',
    'tslib',
    'Core/Control',
    'wml!Coffee/Settings/Colors/Colors',
    'css!Coffee/Settings/Colors/Colors'
], function (require, exports, tslib_1, Control, template) {
    'use strict';
    var Colors = /** @class */
    function (_super) {
        tslib_1.__extends(Colors, _super);
        function Colors() {
            var _this = _super !== null && _super.apply(this, arguments) || this;
            _this._template = template;
            _this.pressureValue = '';
            return _this;
        }
        Colors.prototype._beforeMount = function (opts) {
            this.settingsModel = opts.settingsInfo;
        };
        ;
        Colors.prototype._beforeUpdate = function () {
            this.updatePressureValue();
        };
        ;
        return Colors;
    }(Control);
    return Colors;
});