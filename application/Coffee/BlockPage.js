/// <amd-module name="Coffee/BlockPage" />
define('Coffee/BlockPage', [
    'require',
    'exports',
    'tslib',
    'UI/Index',
    'wml!Coffee/BlockPage/BlockPage'
], function (require, exports, tslib_1, Index_1, template) {
    'use strict';
    var BlockPage = /** @class */
    function (_super) {
        tslib_1.__extends(BlockPage, _super);
        function BlockPage() {
            var _this = _super !== null && _super.apply(this, arguments) || this;
            _this._template = template;
            return _this;
        }
        return BlockPage;
    }(Index_1.Control);
    return BlockPage;
});