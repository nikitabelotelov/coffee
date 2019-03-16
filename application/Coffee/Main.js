/// <amd-module name="Coffee/Main" />
define('Coffee/Main', [
    'require',
    'exports',
    'tslib',
    'Core/Control',
    'wml!Coffee/Main/Main',
    'Core/ConsoleLogger',
    'css!Coffee/Main/Main'
], function (require, exports, tslib_1, Control, template) {
    'use strict';
    var Main = /** @class */
    function (_super) {
        tslib_1.__extends(Main, _super);
        function Main() {
            var _this = _super !== null && _super.apply(this, arguments) || this;
            _this._template = template;
            return _this;
        }
        return Main;
    }(Control);
    return Main;
});