/// <amd-module name="Coffee/Info" />
define('Coffee/Info', [
    'require',
    'exports',
    'tslib',
    'UI/Base',
    'wml!Coffee/InfoPage/Info',
    'css!Coffee/InfoPage/Info'
], function (require, exports, tslib_1, Base_1, template) {
    'use strict';
    var Info = /** @class */
    function (_super) {
        tslib_1.__extends(Info, _super);
        function Info() {
            var _this = _super !== null && _super.apply(this, arguments) || this;
            _this._template = template;
            return _this;
        }
        return Info;
    }(Base_1.Control);
    return Info;
});