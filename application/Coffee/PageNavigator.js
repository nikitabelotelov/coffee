/// <amd-module name="Coffee/PageNavigator" />
define('Coffee/PageNavigator', [
    'require',
    'exports',
    'tslib',
    'UI/Base',
    'wml!Coffee/PageNavigator/PageNavigator',
    'Core/ConsoleLogger',
    'css!Coffee/PageNavigator/PageNavigator'
], function (require, exports, tslib_1, Base_1, template) {
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
    }(Base_1.Control);
    return Main;
});