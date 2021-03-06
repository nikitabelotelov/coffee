/// <amd-module name="Types/_display/itemsStrategy/Group" />
/**
 * Стратегия-декоратор для формирования групп элементов
 * @class Types/_display/ItemsStrategy/Group
 * @mixes Types/_entity/DestroyableMixin
 * @implements Types/_display/IItemsStrategy
 * @mixes Types/_entity/SerializableMixin
 * @author Мальцев А.А.
 */
define('Types/_display/itemsStrategy/Group', [
    'require',
    'exports',
    'tslib',
    'Types/_display/GroupItem',
    'Types/entity',
    'Types/util'
], function (require, exports, tslib_1, GroupItem_1, entity_1, util_1) {
    'use strict';
    Object.defineProperty(exports, '__esModule', { value: true });
    var Group = /** @class */
    function (_super) {
        tslib_1.__extends(Group, _super);    /**
         * Конструктор
         * @param {Options} options Опции
         */
        /**
         * Конструктор
         * @param {Options} options Опции
         */
        function Group(options) {
            var _this = _super.call(this) || this;    /**
             * Группы
             */
            /**
             * Группы
             */
            _this._groups = [];    //region IItemsStrategy
            //region IItemsStrategy
            _this['[Types/_display/IItemsStrategy]'] = true;
            _this._options = options;
            return _this;
        }
        Object.defineProperty(Group.prototype, 'handler', {
            /**
             * Метод, возвращающий группу элемента
             */
            set: function (value) {
                this._options.handler = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Group.prototype, 'options', {
            get: function () {
                return this.source.options;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Group.prototype, 'source', {
            get: function () {
                return this._options.source;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Group.prototype, 'count', {
            get: function () {
                return this._getItemsOrder().length;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Group.prototype, 'items', {
            get: function () {
                var itemsOrder = this._getItemsOrder();
                var items = this._getItems();
                return itemsOrder.map(function (index) {
                    return items[index];
                });
            },
            enumerable: true,
            configurable: true
        });
        Group.prototype.at = function (index) {
            var itemsOrder = this._getItemsOrder();
            var itemIndex = itemsOrder[index];
            if (itemIndex === undefined) {
                throw new ReferenceError('Index ' + index + ' is out of bounds.');
            }
            return this._getItems()[itemIndex];
        };
        Group.prototype.splice = function (start, deleteCount, added) {
            this._itemsOrder = null;
            return this.source.splice(start, deleteCount, added);
        };
        Group.prototype.reset = function () {
            this._groups = [];
            this._itemsOrder = null;
            return this.source.reset();
        };
        Group.prototype.invalidate = function () {
            this._itemsOrder = null;
            return this.source.invalidate();
        };
        Group.prototype.getDisplayIndex = function (index) {
            var itemsOrder = this._getItemsOrder();
            var sourceIndex = this.source.getDisplayIndex(index);
            var overallIndex = sourceIndex + this._groups.length;
            var itemIndex = itemsOrder.indexOf(overallIndex);
            return itemIndex === -1 ? itemsOrder.length : itemIndex;
        };
        Group.prototype.getCollectionIndex = function (index) {
            var itemsOrder = this._getItemsOrder();
            var overallIndex = itemsOrder[index];
            var sourceIndex = overallIndex - this._groups.length;
            sourceIndex = sourceIndex >= 0 ? this.source.getCollectionIndex(sourceIndex) : -1;
            return sourceIndex;
        };    //endregion
              //region SerializableMixin
        //endregion
        //region SerializableMixin
        Group.prototype._getSerializableState = function (state) {
            state = entity_1.SerializableMixin.prototype._getSerializableState.call(this, state);
            state.$options = this._options;
            state._groups = this._groups;
            state._itemsOrder = this._itemsOrder;    //If handler is defined force calc order because handler can be lost during serialization
            //If handler is defined force calc order because handler can be lost during serialization
            if (!state._itemsOrder && this._options.handler) {
                state._itemsOrder = this._getItemsOrder();
            }
            return state;
        };
        Group.prototype._setSerializableState = function (state) {
            var fromSerializableMixin = entity_1.SerializableMixin.prototype._setSerializableState(state);
            return function () {
                this._groups = state._groups;
                this._itemsOrder = state._itemsOrder;
                fromSerializableMixin.call(this);
            };
        };    //endregion
              //region Protected
              /**
         * Возвращает группы + элементы оригинальной стратегии
         * @protected
         * @return {Array.<CollectionItem>}
         */
        //endregion
        //region Protected
        /**
         * Возвращает группы + элементы оригинальной стратегии
         * @protected
         * @return {Array.<CollectionItem>}
         */
        Group.prototype._getItems = function () {
            return this._groups.concat(this.source.items);
        };    /**
         * Возвращает соответствие индексов в стратегии оригинальным индексам
         * @protected
         * @return {Array.<Number>}
         */
        /**
         * Возвращает соответствие индексов в стратегии оригинальным индексам
         * @protected
         * @return {Array.<Number>}
         */
        Group.prototype._getItemsOrder = function () {
            if (!this._itemsOrder) {
                this._itemsOrder = this._createItemsOrder();
            }
            return this._itemsOrder;
        };    /**
         * Создает соответствие индексов в стратегии оригинальным оригинальный индексам
         * @protected
         * @return {Array.<Number>}
         */
        /**
         * Создает соответствие индексов в стратегии оригинальным оригинальный индексам
         * @protected
         * @return {Array.<Number>}
         */
        Group.prototype._createItemsOrder = function () {
            return Group.sortItems(this.source.items, {
                display: this.options.display,
                handler: this._options.handler,
                groups: this._groups
            });
        };    /**
         * Возвращает число групп, в которых есть элементы
         * @protected
         * @return {Number}
         */
        /**
         * Возвращает число групп, в которых есть элементы
         * @protected
         * @return {Number}
         */
        Group.prototype._getActiveGroupsCount = function (itemsOrder) {
            return itemsOrder.length - this.source.items.length;
        };    //endregion
              //region Statics
              /**
         * Создает индекс сортировки в порядке группировки
         * @param {Array.<Types/_display/CollectionItem>} items Элементы проекции.
         * @param {Object} options Опции
         * @param {Array.<Types/_display/GroupItem>} options.groups Группы
         * @param {Types/_display/Display} options.display Проекция
         * @param {Function(Types/_display/CollectionItem):*>} options.handler Метод, возвращающий идентификатор группы
         * @return {Array.<Number>}
         */
        //endregion
        //region Statics
        /**
         * Создает индекс сортировки в порядке группировки
         * @param {Array.<Types/_display/CollectionItem>} items Элементы проекции.
         * @param {Object} options Опции
         * @param {Array.<Types/_display/GroupItem>} options.groups Группы
         * @param {Types/_display/Display} options.display Проекция
         * @param {Function(Types/_display/CollectionItem):*>} options.handler Метод, возвращающий идентификатор группы
         * @return {Array.<Number>}
         */
        Group.sortItems = function (items, options) {
            var groups = options.groups;
            var display = options.display;
            var handler = options.handler;    //No grouping - reset groups and return current order
            //No grouping - reset groups and return current order
            if (!handler) {
                groups.length = 0;
                return items.map(function (item, index) {
                    return index;
                });
            }
            var groupsId;    //{Array}: Group index -> group ID
                             //Fill groupsId by groups
            //{Array}: Group index -> group ID
            //Fill groupsId by groups
            groupsId = groups.map(function (item) {
                return item.getContents();
            });
            var groupsOrder = [];    //{Array.<Number>}: Group position -> Group index
            //{Array.<Number>}: Group position -> Group index
            var groupsItems = [];    //{Array.<Number>}: Group index -> Item index
                                     //Check group ID and group instance for every item and join them all together
            //{Array.<Number>}: Group index -> Item index
            //Check group ID and group instance for every item and join them all together
            for (var position = 0; position < items.length; position++) {
                var item = items[position];
                var groupId = handler ? handler(item.getContents(), position, item) : undefined;
                var groupIndex = groupsId.indexOf(groupId);    //Create group with this groupId if necessary
                //Create group with this groupId if necessary
                if (groupsId.indexOf(groupId) === -1) {
                    var group = new GroupItem_1.default({
                        owner: display,
                        contents: groupId
                    });
                    groupIndex = groups.length;    //Insert data into groups and groupsId
                    //Insert data into groups and groupsId
                    groups.push(group);
                    groupsId.push(groupId);
                }    //Remember group order
                //Remember group order
                if (groupsOrder.indexOf(groupIndex) === -1) {
                    groupsOrder.push(groupIndex);
                }    //Items of each group
                //Items of each group
                if (!groupsItems[groupIndex]) {
                    groupsItems[groupIndex] = [];
                }
                groupsItems[groupIndex].push(position);
            }    //Fill result by groups
            //Fill result by groups
            var result = [];
            var groupsCount = groups.length;
            groupsOrder.forEach(function (groupIndex) {
                result.push(groupIndex);
                groupsItems[groupIndex].forEach(function (item) {
                    result.push(item + groupsCount);
                });
            });
            return result;
        };
        return Group;
    }(util_1.mixin(entity_1.DestroyableMixin, entity_1.SerializableMixin));
    exports.default = Group;
    Object.assign(Group.prototype, {
        '[Types/_display/itemsStrategy/Group]': true,
        _moduleName: 'Types/display:itemsStrategy.Group',
        _groups: null,
        _itemsOrder: null
    });
});