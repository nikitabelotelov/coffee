/// <amd-module name="Types/_display/BreadcrumbsItem" />
/**
 * Хлебная крошка
 * @class Types/Display/BreadcrumbsItem
 * @extends Types/Display/CollectionItem
 * @public
 * @author Мальцев А.А.
 */
define('Types/_display/BreadcrumbsItem', [
    'require',
    'exports',
    'tslib',
    'Types/_display/CollectionItem',
    'Types/di'
], function (require, exports, tslib_1, CollectionItem_1, di_1) {
    'use strict';
    Object.defineProperty(exports, '__esModule', { value: true });
    var BreadcrumbsItem = /** @class */
    function (_super) {
        tslib_1.__extends(BreadcrumbsItem, _super);    /** @lends Types/Display/BreadcrumbsItem.prototype */
        /** @lends Types/Display/BreadcrumbsItem.prototype */
        function BreadcrumbsItem(options) {
            return _super.call(this, options) || this;
        }    // region Public methods
        // region Public methods
        BreadcrumbsItem.prototype.getContents = function () {
            var root = this._$owner ? this._$owner.getRoot() : {};
            var current = this._$last;
            var contents = [];    // Go up from last item until end
            // Go up from last item until end
            while (current) {
                contents.unshift(current.getContents());
                current = current.getParent();
                if (current === root) {
                    break;
                }
            }
            return contents;
        };
        BreadcrumbsItem.prototype.setContents = function () {
            throw new ReferenceError('BreadcrumbsItem contents is read only.');
        };
        return BreadcrumbsItem;
    }(CollectionItem_1.default    /** @lends Types/Display/BreadcrumbsItem.prototype */);
    /** @lends Types/Display/BreadcrumbsItem.prototype */
    exports.default = BreadcrumbsItem;
    BreadcrumbsItem.prototype._moduleName = 'Types/display:BreadcrumbsItem';
    BreadcrumbsItem.prototype['[Types/_display/BreadcrumbsItem]'] = true;    // @ts-ignore
    // @ts-ignore
    BreadcrumbsItem.prototype._$last = null;
    di_1.register('Types/display:BreadcrumbsItem', BreadcrumbsItem);
});