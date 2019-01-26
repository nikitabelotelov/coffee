/// <amd-module name="Types/_display/TreeChildren" />
/**
 * Список дочерних элементов узла дерева.
 * @class Types/Display/TreeChildren
 * @extends Types/Collection/List
 * @public
 * @author Мальцев А.А.
 */
define('Types/_display/TreeChildren', [
    'require',
    'exports',
    'tslib',
    'Types/_display/TreeItem',
    'Types/collection',
    'Types/di'
], function (require, exports, tslib_1, TreeItem_1, collection_1, di_1) {
    'use strict';
    Object.defineProperty(exports, '__esModule', { value: true });
    var TreeChildren = /** @class */
    function (_super) {
        tslib_1.__extends(TreeChildren, _super);    /** @lends Types/Display/TreeChildren.prototype */
        /** @lends Types/Display/TreeChildren.prototype */
        function TreeChildren(options) {
            var _this = _super.call(this, options) || this;
            if (!(_this._$owner instanceof Object)) {
                throw new TypeError('Tree children owner should be an object');
            }
            if (!(_this._$owner instanceof TreeItem_1.default)) {
                throw new TypeError('Tree children owner should be an instance of Types/display:TreeItem');
            }
            return _this;
        }    /**
         * Возвращает узел-владелец
         * @return {Types/Display/TreeItem}
         */
        /**
         * Возвращает узел-владелец
         * @return {Types/Display/TreeItem}
         */
        TreeChildren.prototype.getOwner = function () {
            return this._$owner;
        };
        return TreeChildren;
    }(collection_1.List);
    exports.default = TreeChildren;
    TreeChildren.prototype['[Types/_display/TreeChildren]'] = true;
    TreeChildren.prototype._$owner = null;
    di_1.register('Types/display:TreeChildren', TreeChildren);
});