/// <amd-module name="Types/_display/GroupItem" />
/**
 * Группа элементов
 * @class Types/_display/GroupItem
 * @extends Types/_display/CollectionItem
 * @public
 * @author Мальцев А.А.
 */
define('Types/_display/GroupItem', [
    'require',
    'exports',
    'tslib',
    'Types/_display/CollectionItem',
    'Types/di'
], function (require, exports, tslib_1, CollectionItem_1, di_1) {
    'use strict';
    Object.defineProperty(exports, '__esModule', { value: true });
    var GroupItem = /** @class */
    function (_super) {
        tslib_1.__extends(GroupItem, _super);    /** @lends Types/_display/GroupItem.prototype */
        /** @lends Types/_display/GroupItem.prototype */
        function GroupItem(options) {
            var _this = _super.call(this, options) || this;
            _this._$expanded = !!_this._$expanded;
            return _this;
        }    /**
         * Возвращает признак, что узел развернут
         * @return {Boolean}
         */
        /**
         * Возвращает признак, что узел развернут
         * @return {Boolean}
         */
        GroupItem.prototype.isExpanded = function () {
            return this._$expanded;
        };    /**
         * Устанавливает признак, что узел развернут или свернут
         * @param {Boolean} expanded Развернут или свернут узел
         * @param {Boolean} [silent=false] Не генерировать событие
         */
        /**
         * Устанавливает признак, что узел развернут или свернут
         * @param {Boolean} expanded Развернут или свернут узел
         * @param {Boolean} [silent=false] Не генерировать событие
         */
        GroupItem.prototype.setExpanded = function (expanded, silent) {
            if (this._$expanded === expanded) {
                return;
            }
            this._$expanded = expanded;
            if (!silent) {
                this._notifyItemChangeToOwner('expanded');
            }
        };    /**
         * Переключает признак, что узел развернут или свернут
         */
        /**
         * Переключает признак, что узел развернут или свернут
         */
        GroupItem.prototype.toggleExpanded = function () {
            this.setExpanded(!this.isExpanded());
        };
        return GroupItem;
    }(CollectionItem_1.default    /** @lends Types/_display/GroupItem.prototype */);
    /** @lends Types/_display/GroupItem.prototype */
    exports.default = GroupItem;
    GroupItem.prototype._moduleName = 'Types/display:GroupItem';
    GroupItem.prototype['[Types/_display/GroupItem]'] = true;    // @ts-ignore
    // @ts-ignore
    GroupItem.prototype._instancePrefix = 'group-item-';    // @ts-ignore
    // @ts-ignore
    GroupItem.prototype._$expanded = true;    // Deprecated
    // Deprecated
    GroupItem.prototype['[WS.Data/Display/GroupItem]'] = true;
    di_1.register('Types/display:GroupItem', GroupItem);
});