/// <amd-module name="Types/_display/TreeItem" />
/**
 * Элемент дерева
 * @class Types/_display/TreeItem
 * @extends Types/_display/CollectionItem
 * @public
 * @author Мальцев А.А.
 */
define('Types/_display/TreeItem', [
    'require',
    'exports',
    'tslib',
    'Types/_display/CollectionItem',
    'Types/di'
], function (require, exports, tslib_1, CollectionItem_1, di_1) {
    'use strict';
    Object.defineProperty(exports, '__esModule', { value: true });
    var TreeItem = /** @class */
    function (_super) {
        tslib_1.__extends(TreeItem, _super);    /** @lends Types/_display/TreeItem.prototype */
        /** @lends Types/_display/TreeItem.prototype */
        function TreeItem(options) {
            var _this = _super.call(this, options) || this;
            if (options && !options.hasOwnProperty('hasChildren') && options.hasOwnProperty('loaded')) {
                _this._$hasChildren = !options.loaded;
            }
            _this._$node = !!_this._$node;
            _this._$expanded = !!_this._$expanded;
            _this._$hasChildren = !!_this._$hasChildren;
            return _this;
        }    // endregion Types/_entity/SerializableMixin
             // region Public methods
             /**
         * Возвращает родительский узел
         * @return {Types/_display/TreeItem}
         */
        // endregion Types/_entity/SerializableMixin
        // region Public methods
        /**
         * Возвращает родительский узел
         * @return {Types/_display/TreeItem}
         */
        TreeItem.prototype.getParent = function () {
            return this._$parent;
        };    /**
         * Устанавливает родительский узел
         * @param {Types/_display/TreeItem} parent Новый родительский узел
         */
        /**
         * Устанавливает родительский узел
         * @param {Types/_display/TreeItem} parent Новый родительский узел
         */
        TreeItem.prototype.setParent = function (parent) {
            this._$parent = parent;
        };    /**
         * Возвращает корневой элемент дерева
         * @return {Types/_display/TreeItem}
         */
        /**
         * Возвращает корневой элемент дерева
         * @return {Types/_display/TreeItem}
         */
        TreeItem.prototype.getRoot = function () {
            var parent = this.getParent();
            if (parent === this) {
                return;
            }
            return parent ? parent.getRoot() : this;
        };    /**
         * Является ли корнем дерева
         * @return {Boolean}
         */
        /**
         * Является ли корнем дерева
         * @return {Boolean}
         */
        TreeItem.prototype.isRoot = function () {
            return !this.getParent();
        };    /**
         * Возвращает уровень вложенности относительно корня
         * @return {Number}
         */
        /**
         * Возвращает уровень вложенности относительно корня
         * @return {Number}
         */
        TreeItem.prototype.getLevel = function () {
            var parent = this.getParent();
            if (parent) {
                return (parent instanceof TreeItem ? parent.getLevel() : 0) + 1;
            }
            var owner = this.getOwner();
            return owner && owner.isRootEnumerable() ? 1 : 0;
        };    /**
         * Возвращает признак, является ли элемент узлом
         * @return {Boolean}
         */
        /**
         * Возвращает признак, является ли элемент узлом
         * @return {Boolean}
         */
        TreeItem.prototype.isNode = function () {
            return this._$node;
        };    /**
         * Устанавливает признак, является ли элемент узлом
         * @param {Boolean} node Является ли элемент узлом
         */
        /**
         * Устанавливает признак, является ли элемент узлом
         * @param {Boolean} node Является ли элемент узлом
         */
        TreeItem.prototype.setNode = function (node) {
            this._$node = node;
        };    /**
         * Возвращает признак, что узел развернут
         * @return {Boolean}
         */
        /**
         * Возвращает признак, что узел развернут
         * @return {Boolean}
         */
        TreeItem.prototype.isExpanded = function () {
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
        TreeItem.prototype.setExpanded = function (expanded, silent) {
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
        TreeItem.prototype.toggleExpanded = function () {
            this.setExpanded(!this.isExpanded());
        };    /**
         * Возвращает признак наличия детей у узла
         * @return {Boolean}
         */
        /**
         * Возвращает признак наличия детей у узла
         * @return {Boolean}
         */
        TreeItem.prototype.isHasChildren = function () {
            return this._$hasChildren;
        };    /**
         * Устанавливает признак наличия детей у узла
         * @param {Boolean} value
         */
        /**
         * Устанавливает признак наличия детей у узла
         * @param {Boolean} value
         */
        TreeItem.prototype.setHasChildren = function (value) {
            this._$hasChildren = value;
        };
        TreeItem.prototype.isLoaded = function () {
            return !this._$hasChildren;
        };
        TreeItem.prototype.setLoaded = function (value) {
            this._$hasChildren = !value;
        };    /**
         * Возвращает название свойства, содержащего дочерние элементы узла
         * @return {String}
         */
        /**
         * Возвращает название свойства, содержащего дочерние элементы узла
         * @return {String}
         */
        TreeItem.prototype.getChildrenProperty = function () {
            return this._$childrenProperty;
        };    // region Types/_entity/SerializableMixin
        // region Types/_entity/SerializableMixin
        TreeItem.prototype._getSerializableState = function (state) {
            state = _super.prototype._getSerializableState.call(this, state);    // It's too hard to serialize context related method. It should be restored at class that injects this function.
            // It's too hard to serialize context related method. It should be restored at class that injects this function.
            if (typeof state.$options.parent === 'function') {
                delete state.$options.parent;
            }
            return state;
        };
        TreeItem.prototype._setSerializableState = function (state) {
            var fromSuper = _super.prototype._setSerializableState.call(this, state);
            return function () {
                fromSuper.call(this);
            };
        };    // endregion
              // region Protected methods
              /**
         * Генерирует событие у владельца об изменении свойства элемента.
         * Помимо родительской коллекции уведомляет также и корневой узел дерева.
         * @param {String} property Измененное свойство
         * @protected
         */
        // endregion
        // region Protected methods
        /**
         * Генерирует событие у владельца об изменении свойства элемента.
         * Помимо родительской коллекции уведомляет также и корневой узел дерева.
         * @param {String} property Измененное свойство
         * @protected
         */
        TreeItem.prototype._notifyItemChangeToOwner = function (property) {
            _super.prototype._notifyItemChangeToOwner.call(this, property);
            var root = this.getRoot();
            var rootOwner = root ? root.getOwner() : undefined;
            if (rootOwner && rootOwner !== this._$owner) {
                rootOwner.notifyItemChange(this, property);
            }
        };
        return TreeItem;
    }(CollectionItem_1.default    /** @lends Types/_display/TreeItem.prototype */);
    /** @lends Types/_display/TreeItem.prototype */
    exports.default = TreeItem;
    Object.assign(TreeItem.prototype, {
        '[Types/_display/TreeItem]': true,
        _moduleName: 'Types/display:TreeItem',
        _$parent: undefined,
        _$node: false,
        _$expanded: false,
        _$hasChildren: true,
        _$childrenProperty: '',
        _instancePrefix: 'tree-item-'
    });    // FIXME: deprecated
    // FIXME: deprecated
    TreeItem.prototype['[WS.Data/Display/TreeItem]'] = true;
    di_1.register('Types/display:TreeItem', TreeItem);
});