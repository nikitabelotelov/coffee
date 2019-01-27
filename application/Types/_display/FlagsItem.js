/// <amd-module name="Types/_display/FlagsItem" />
/**
 * Элемент коллекции флагов
 * @class Types/_display/FlagsItem
 * @extends Types/_display/CollectionItem
 * @public
 * @author Мальцев А.А.
 */
define('Types/_display/FlagsItem', [
    'require',
    'exports',
    'tslib',
    'Types/_display/CollectionItem',
    'Types/di'
], function (require, exports, tslib_1, CollectionItem_1, di_1) {
    'use strict';
    Object.defineProperty(exports, '__esModule', { value: true });
    var FlagsItem = /** @class */
    function (_super) {
        tslib_1.__extends(FlagsItem, _super);    /** @lends Types/_display/FlagsItem.prototype */
        /** @lends Types/_display/FlagsItem.prototype */
        function FlagsItem() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        FlagsItem.prototype.isSelected = function () {
            return this._$owner.getCollection().get(this._$contents, this._$owner.localize);
        };
        FlagsItem.prototype.setSelected = function (selected) {
            if (this.isSelected() === selected) {
                return;
            }
            this._$owner.getCollection().set(this._$contents, selected, this._$owner.localize);
        };
        return FlagsItem;
    }(CollectionItem_1.default    /** @lends Types/_display/FlagsItem.prototype */);
    /** @lends Types/_display/FlagsItem.prototype */
    exports.default = FlagsItem;
    FlagsItem.prototype._moduleName = 'Types/display:FlagsItem';
    FlagsItem.prototype['[Types/_display/FlagsItem]'] = true;
    di_1.register('Types/display:FlagsItem', FlagsItem);
});