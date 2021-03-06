/// <amd-module name="Types/_display/itemsStrategy/Direct" />
/**
 * Стратегия получения элементов проекции напрямую по коллекции
 * @class Types/_display/ItemsStrategy/Direct
 * @extends Types/_display/ItemsStrategy/Abstract
 * @author Мальцев А.А.
 */
define('Types/_display/itemsStrategy/Direct', [
    'require',
    'exports',
    'tslib',
    'Types/_display/itemsStrategy/AbstractStrategy',
    'Types/_display/CollectionItem',
    'Types/util',
    'Types/shim'
], function (require, exports, tslib_1, AbstractStrategy_1, CollectionItem_1, util_1, shim_1) {
    'use strict';
    Object.defineProperty(exports, '__esModule', { value: true });
    var Direct = /** @class */
    function (_super) {
        tslib_1.__extends(Direct, _super);    /** @lends Types/_display/ItemsStrategy/Direct.prototype */
                                              /**
         * @typedef {Object} Options
         * @property {Types/_display/Collection} display Проекция
         * @property {Boolean} unique Признак обеспечения униconstьности элементов
         * @property constring} idProperty Название свойства элемента коллекции, содержащего его уникальный идентификатор
         */
        /** @lends Types/_display/ItemsStrategy/Direct.prototype */
        /**
         * @typedef {Object} Options
         * @property {Types/_display/Collection} display Проекция
         * @property {Boolean} unique Признак обеспечения униconstьности элементов
         * @property constring} idProperty Название свойства элемента коллекции, содержащего его уникальный идентификатор
         */
        function Direct(options) {
            return _super.call(this, options) || this;
        }
        Object.defineProperty(Direct.prototype, 'unique', {
            /**
             * Устанавливает признак обеспечения уникальности элементов
             */
            set: function (value) {
                this._options.unique = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Direct.prototype, 'count', {
            //region IItemsStrategy
            get: function () {
                return this._getItemsOrder().length;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Direct.prototype, 'items', {
            get: function () {
                var items = this._getItems();
                var itemsOrder = this._getItemsOrder();
                return itemsOrder.map(function (position) {
                    return items[position];
                });
            },
            enumerable: true,
            configurable: true
        });
        Direct.prototype.at = function (index) {
            var items = this._getItems();
            var itemsOrder = this._getItemsOrder();
            var position = itemsOrder[index];
            if (position === undefined) {
                throw new ReferenceError('Display index ' + index + ' is out of bounds.');
            }
            return items[position];
        };
        Direct.prototype.splice = function (start, deleteCount, added) {
            var _this = this;
            var _a;
            added = added || [];
            var reallyAdded = added.map(function (contents) {
                return contents instanceof CollectionItem_1.default ? contents : _this._createItem(contents);
            });
            var result = (_a = this._getItems()).splice.apply(_a, [
                start,
                deleteCount
            ].concat(reallyAdded));
            this._itemsOrder = null;
            return result;
        };
        Direct.prototype.reset = function () {
            _super.prototype.reset.call(this);
            this._itemsOrder = null;
        };
        Direct.prototype.invalidate = function () {
            _super.prototype.invalidate.call(this);
            this._itemsOrder = null;
        };
        Direct.prototype.getDisplayIndex = function (index) {
            var itemsOrder = this._getItemsOrder();
            var itemIndex = itemsOrder.indexOf(index);
            return itemIndex === -1 ? itemsOrder.length : itemIndex;
        };
        Direct.prototype.getCollectionIndex = function (index) {
            var itemsOrder = this._getItemsOrder();
            var itemIndex = itemsOrder[index];
            return itemIndex === undefined ? -1 : itemIndex;
        };    //endregion
              //region SerializableMixin
        //endregion
        //region SerializableMixin
        Direct.prototype._getSerializableState = function (state) {
            state = _super.prototype._getSerializableState.call(this, state);
            state._itemsOrder = this._itemsOrder;
            return state;
        };
        Direct.prototype._setSerializableState = function (state) {
            var fromSuper = _super.prototype._setSerializableState.call(this, state);
            return function () {
                this._itemsOrder = state._itemsOrder;
                fromSuper.call(this);
            };
        };    //endregion
              //region Protected
        //endregion
        //region Protected
        Direct.prototype._initItems = function () {
            _super.prototype._initItems.call(this);
            var items = this._items;
            var sourceItems = this._getSourceItems();
            var count = items.length;
            for (var index = 0; index < count; index++) {
                items[index] = this._createItem(sourceItems[index]);
            }
        };    /**
         * Возвращает сооconstтствие индексов в стратегии оригинальным инconstсам
         * @protected
         * @return {Array.<Number>}
         */
        /**
         * Возвращает сооconstтствие индексов в стратегии оригинальным инconstсам
         * @protected
         * @return {Array.<Number>}
         */
        Direct.prototype._getItemsOrder = function () {
            if (!this._itemsOrder) {
                this._itemsOrder = this._createItemsOrder();
            }
            return this._itemsOrder;
        };
        Direct.prototype._createItemsOrder = function () {
            return Direct.sortItems(this._getItems(), {
                idProperty: this._options.idProperty,
                unique: this._options.unique
            });
        };    //endregion
              //region Statics
              /**
         * Создает индекс сортировки в том же порядке, что и коллекция
         * @param {Array.<Types/_display/CollectionItem>} items Элементы проекции.
         * @param {Array.<Number>} current Текущий индекс сортировки
         * @param {Object} options Опции
         * @return {Array.<Number>}
         */
        //endregion
        //region Statics
        /**
         * Создает индекс сортировки в том же порядке, что и коллекция
         * @param {Array.<Types/_display/CollectionItem>} items Элементы проекции.
         * @param {Array.<Number>} current Текущий индекс сортировки
         * @param {Object} options Опции
         * @return {Array.<Number>}
         */
        Direct.sortItems = function (items, options) {
            var idProperty = options.idProperty;
            if (!options.unique || !idProperty) {
                return items.map(function (item, index) {
                    return index;
                });
            }
            var processed = new shim_1.Set();
            var result = [];
            var itemId;
            items.forEach(function (item, index) {
                itemId = util_1.object.getPropertyValue(item.getContents(), idProperty);
                if (processed.has(itemId)) {
                    return;
                }
                processed.add(itemId);
                result.push(index);
            });
            return result;
        };
        return Direct;
    }(AbstractStrategy_1.default    /** @lends Types/_display/ItemsStrategy/Direct.prototype */);
    /** @lends Types/_display/ItemsStrategy/Direct.prototype */
    exports.default = Direct;
    Object.assign(Direct.prototype, {
        '[Types/_display/itemsStrategy/Direct]': true,
        _moduleName: 'Types/display:itemsStrategy.Direct',
        _itemsOrder: null
    });
});