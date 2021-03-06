/// <amd-module name="Types/_display/itemsStrategy/User" />
/**
 * Стратегия-декоратор для пользовательского порядка элементов
 * @class Types/_display/ItemsStrategy/User
 * @mixes Types/_entity/DestroyableMixin
 * @implements Types/_display/IItemsStrategy
 * @mixes Types/_entity/SerializableMixin
 * @author Мальцев А.А.
 */
define('Types/_display/itemsStrategy/User', [
    'require',
    'exports',
    'tslib',
    'Types/_display/GroupItem',
    'Types/entity',
    'Types/util'
], function (require, exports, tslib_1, GroupItem_1, entity_1, util_1) {
    'use strict';
    Object.defineProperty(exports, '__esModule', { value: true });
    var User = /** @class */
    function (_super) {
        tslib_1.__extends(User, _super);    //region Public members
                                            /**
         * Конструктор
         * @param {Options} options Опции
         */
        //region Public members
        /**
         * Конструктор
         * @param {Options} options Опции
         */
        function User(options) {
            var _this = _super.call(this) || this;    //endregion
                                                      //region IItemsStrategy
            //endregion
            //region IItemsStrategy
            _this['[Types/_display/IItemsStrategy]'] = true;
            if (!options || !(options.handlers instanceof Array)) {
                throw new TypeError('Option "handlers" should be an instance of Array');
            }
            _this._options = Object.assign({}, options);
            return _this;
        }
        Object.defineProperty(User.prototype, 'source', {
            /**
             * Декорирумая стратегия
             */
            get: function () {
                return this._options.source;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(User.prototype, 'handlers', {
            /**
             * Пользовательские методы сортировки
             */
            set: function (value) {
                if (!(value instanceof Array)) {
                    throw new TypeError('Option "handlers" should be an instance of Array');
                }
                this._options.handlers = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(User.prototype, 'options', {
            get: function () {
                return this.source.options;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(User.prototype, 'count', {
            get: function () {
                return this.source.count;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(User.prototype, 'items', {
            get: function () {
                var items = this.source.items;
                var itemsOrder = this._getItemsOrder();
                return itemsOrder.map(function (index) {
                    return items[index];
                });
            },
            enumerable: true,
            configurable: true
        });
        User.prototype.at = function (index) {
            var itemsOrder = this._getItemsOrder();
            var sourceIndex = itemsOrder[index];
            return this.source.at(sourceIndex);
        };
        User.prototype.splice = function (start, deleteCount, added) {
            this._itemsOrder = null;
            return this.source.splice(start, deleteCount, added);
        };
        User.prototype.reset = function () {
            this._itemsOrder = null;
            return this.source.reset();
        };
        User.prototype.invalidate = function () {
            this._itemsOrder = null;
            return this.source.invalidate();
        };
        User.prototype.getDisplayIndex = function (index) {
            var sourceIndex = this.source.getDisplayIndex(index);
            var itemsOrder = this._getItemsOrder();
            var itemIndex = itemsOrder.indexOf(sourceIndex);
            return itemIndex === -1 ? itemsOrder.length : itemIndex;
        };
        User.prototype.getCollectionIndex = function (index) {
            var sourceIndex = this.source.getCollectionIndex(index);
            var itemsOrder = this._getItemsOrder();
            return sourceIndex === -1 ? sourceIndex : itemsOrder[sourceIndex];
        };    //endregion
              //region SerializableMixin
        //endregion
        //region SerializableMixin
        User.prototype._getSerializableState = function (state) {
            state = entity_1.SerializableMixin.prototype._getSerializableState.call(this, state);
            state.$options = this._options;
            state._itemsOrder = this._itemsOrder;    //If some handlers are defined force calc order because handlers can be lost during serialization
            //If some handlers are defined force calc order because handlers can be lost during serialization
            if (!state._itemsOrder && this._options.handlers.length) {
                state._itemsOrder = this._getItemsOrder();
            }
            return state;
        };
        User.prototype._setSerializableState = function (state) {
            var fromSerializableMixin = entity_1.SerializableMixin.prototype._setSerializableState(state);
            return function () {
                this._itemsOrder = state._itemsOrder;
                fromSerializableMixin.call(this);
            };
        };    //endregion
              //region Protected
              /**
         * Возвращает соответствие индексов в стратегии оригинальным индексам
         * @protected
         * @return {Array.<Number>}
         */
        //endregion
        //region Protected
        /**
         * Возвращает соответствие индексов в стратегии оригинальным индексам
         * @protected
         * @return {Array.<Number>}
         */
        User.prototype._getItemsOrder = function () {
            if (!this._itemsOrder) {
                this._itemsOrder = this._createItemsOrder();
            }
            return this._itemsOrder;
        };    /**
         * Создает соответствие индексов в стратегии оригинальным индексам
         * @protected
         * @return {Array.<Number>}
         */
        /**
         * Создает соответствие индексов в стратегии оригинальным индексам
         * @protected
         * @return {Array.<Number>}
         */
        User.prototype._createItemsOrder = function () {
            var items = this.source.items;
            var current = items.map(function (item, index) {
                return index;
            });
            return User.sortItems(items, current, this._options && this._options.handlers || []);
        };    //endregion
              //region Statics
              /**
         * Создает индекс сортировки в порядке, определенном набором пользовательских обработчиков
         * @param {Array.<Types/_display/CollectionItem>} items Элементы проекции.
         * @param {Array.<Number>} current Текущий индекс сортировки
         * @param {Array.<Function>} handlers Пользовательские обработчики для Array.prototype.sort
         * @return {Array.<Number>}
         */
        //endregion
        //region Statics
        /**
         * Создает индекс сортировки в порядке, определенном набором пользовательских обработчиков
         * @param {Array.<Types/_display/CollectionItem>} items Элементы проекции.
         * @param {Array.<Number>} current Текущий индекс сортировки
         * @param {Array.<Function>} handlers Пользовательские обработчики для Array.prototype.sort
         * @return {Array.<Number>}
         */
        User.sortItems = function (items, current, handlers) {
            if (!handlers || handlers.length === 0) {
                return current;
            }
            var map = [];
            var sorted = [];
            var index;
            var item;    //Make utilitary array
            //Make utilitary array
            for (var i = 0, count = current.length; i < count; i++) {
                index = current[i];
                item = items[index];
                if (item instanceof GroupItem_1.default) {
                    //Don't sort groups
                    map.push(index);
                } else {
                    sorted.push({
                        item: item,
                        collectionItem: item.getContents(),
                        index: index,
                        collectionIndex: index
                    });
                }
            }    //Sort utilitary array
            //Sort utilitary array
            for (var i = handlers.length - 1; i >= 0; i--) {
                sorted.sort(handlers[i]);
            }    //Create map from utilitary array
            //Create map from utilitary array
            for (var index_1 = 0, count = sorted.length; index_1 < count; index_1++) {
                map.push(sorted[index_1].collectionIndex);
            }
            return map;
        };
        return User;
    }(util_1.mixin(entity_1.DestroyableMixin, entity_1.SerializableMixin));
    exports.default = User;
    Object.assign(User.prototype, {
        '[Types/_display/itemsStrategy/User]': true,
        _moduleName: 'Types/display:itemsStrategy.User',
        _itemsOrder: null
    });
});