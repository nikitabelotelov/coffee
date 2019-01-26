/// <amd-module name="Types/_display/itemsStrategy/AbstractStrategy" />
/**
 * Абстрактная стратегия получения элементов проекции
 * @class Types/Display/ItemsStrategy/Abstract
 * @mixes Types/Entity/DestroyableMixin
 * @implements Types/Display/IItemsStrategy
 * @mixes Types/Entity/SerializableMixin
 * @author Мальцев А.А.
 */
define('Types/_display/itemsStrategy/AbstractStrategy', [
    'require',
    'exports',
    'tslib',
    'Types/entity',
    'Types/util'
], function (require, exports, tslib_1, entity_1, util_1) {
    'use strict';
    Object.defineProperty(exports, '__esModule', { value: true });
    var Abstract = /** @class */
    function (_super) {
        tslib_1.__extends(Abstract, _super);    /**
         * Конструктор
         * @param {Options} options Опции
         */
        /**
         * Конструктор
         * @param {Options} options Опции
         */
        function Abstract(options) {
            var _this = _super.call(this) || this;    //region IItemsStrategy
            //region IItemsStrategy
            _this['[Types/_display/IItemsStrategy]'] = true;
            _this._options = options;
            return _this;
        }
        Object.defineProperty(Abstract.prototype, 'options', {
            get: function () {
                return Object.assign({}, this._options);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Abstract.prototype, 'source', {
            get: function () {
                return null;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Abstract.prototype, 'count', {
            get: function () {
                throw new Error('Property must be implemented');
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Abstract.prototype, 'items', {
            get: function () {
                return this._getItems();
            },
            enumerable: true,
            configurable: true
        });
        Abstract.prototype.at = function (index) {
            throw new Error('Method must be implemented');
        };
        Abstract.prototype.splice = function (start, deleteCount, added) {
            throw new Error('Method must be implemented');
        };
        Abstract.prototype.reset = function () {
            this._items = null;
            this._sourceItems = null;
        };
        Abstract.prototype.invalidate = function () {
        };
        Abstract.prototype.getDisplayIndex = function (index) {
            return index;
        };
        Abstract.prototype.getCollectionIndex = function (index) {
            return index;
        };    //endregion
              //region SerializableMixin
        //endregion
        //region SerializableMixin
        Abstract.prototype._getSerializableState = function (state) {
            state = entity_1.SerializableMixin.prototype._getSerializableState.call(this, state);
            state.$options = this._options;
            state._items = this._items;
            return state;
        };
        Abstract.prototype._setSerializableState = function (state) {
            var fromSerializableMixin = entity_1.SerializableMixin.prototype._setSerializableState(state);
            return function () {
                fromSerializableMixin.call(this);
                this._items = state._items;
            };
        };    //endregion
              //region Protected members
              /**
         * Возвращает исходную коллекцию
         * @return {Types/Collection/IEnumerable}
         * @protected
         */
        //endregion
        //region Protected members
        /**
         * Возвращает исходную коллекцию
         * @return {Types/Collection/IEnumerable}
         * @protected
         */
        Abstract.prototype._getCollection = function () {
            return this._options.display.getCollection();
        };    /**
         * Возвращает энумератор коллекции
         * @return {Types/Collection/IEnumerator}
         * @protected
         */
        /**
         * Возвращает энумератор коллекции
         * @return {Types/Collection/IEnumerator}
         * @protected
         */
        Abstract.prototype._getCollectionEnumerator = function () {
            return this._getCollection().getEnumerator(this._options.localize);
        };    /**
         * Возвращает элементы проекции
         * @return Array.<Types/Display/CollectionItem>
         * @protected
         */
        /**
         * Возвращает элементы проекции
         * @return Array.<Types/Display/CollectionItem>
         * @protected
         */
        Abstract.prototype._getItems = function () {
            if (!this._items) {
                this._initItems();
            }
            return this._items;
        };    /**
         * Инициализирует элементы
         * @protected
         */
        /**
         * Инициализирует элементы
         * @protected
         */
        Abstract.prototype._initItems = function () {
            this._items = this._items || [];
            this._items.length = this._options.display.getCollectionCount();
        };    /**
         * Возвращает элементы исходной коллекции
         * @protected
         */
        /**
         * Возвращает элементы исходной коллекции
         * @protected
         */
        Abstract.prototype._getSourceItems = function () {
            if (this._sourceItems) {
                return this._sourceItems;
            }
            var enumerator = this._getCollectionEnumerator();
            var items = [];
            enumerator.reset();
            while (enumerator.moveNext()) {
                items.push(enumerator.getCurrent());
            }
            return this._sourceItems = items;
        };    /**
         * Создает элемент проекции
         * @return Types/Display/CollectionItem
         * @protected
         */
        /**
         * Создает элемент проекции
         * @return Types/Display/CollectionItem
         * @protected
         */
        Abstract.prototype._createItem = function (contents) {
            return this.options.display.createItem({ contents: contents });
        };
        return Abstract;
    }(util_1.mixin(entity_1.DestroyableMixin, entity_1.SerializableMixin));
    exports.default = Abstract;
    Abstract.prototype._moduleName = 'Types/display:itemsStrategy.DestroyableMixin';
    Abstract.prototype['[Types/_display/itemsStrategy/DestroyableMixin]'] = true;    // @ts-ignore
    // @ts-ignore
    Abstract.prototype._items = null;    // @ts-ignore
    // @ts-ignore
    Abstract.prototype._sourceItems = null;
});