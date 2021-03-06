/// <amd-module name="Types/_display/Tree" />
/**
 * Проекция в виде дерева - предоставляет методы навигации, фильтрации и сортировки, не меняя при этом оригинальную коллекцию.
 * Дерево может строиться по алгоритму {@link https://en.wikipedia.org/wiki/Adjacency_list Adjacency List} или {@link https://docs.mongodb.com/v3.2/tutorial/model-tree-structures-with-materialized-paths/ Materialized Path}. Выбор алгоритма выполняется в зависимости от настроек.
 * @class Types/_display/Tree
 * @extends Types/_display/Collection
 * @public
 * @author Мальцев А.А.
 */
define('Types/_display/Tree', [
    'require',
    'exports',
    'tslib',
    'Types/_display/Collection',
    'Types/_display/CollectionItem',
    'Types/_display/GroupItem',
    'Types/_display/TreeItem',
    'Types/_display/TreeChildren',
    'Types/_display/itemsStrategy/Direct',
    'Types/_display/itemsStrategy/AdjacencyList',
    'Types/_display/itemsStrategy/MaterializedPath',
    'Types/_display/itemsStrategy/Root',
    'Types/di',
    'Types/util'
], function (require, exports, tslib_1, Collection_1, CollectionItem_1, GroupItem_1, TreeItem_1, TreeChildren_1, Direct_1, AdjacencyList_1, MaterializedPath_1, Root_1, di_1, util_1) {
    'use strict';
    Object.defineProperty(exports, '__esModule', { value: true });    /**
     * Обрабатывает событие об изменении коллекции
     * @param event Дескриптор события.
     * @param action Действие, приведшее к изменению.
     * @param newItems Новые элементы коллекции.
     * @param newItemsIndex Индекс, в котором появились новые элементы.
     * @param oldItems Удаленные элементы коллекции.
     * @param oldItemsIndex Индекс, в котором удалены элементы.
     */
    /**
     * Обрабатывает событие об изменении коллекции
     * @param event Дескриптор события.
     * @param action Действие, приведшее к изменению.
     * @param newItems Новые элементы коллекции.
     * @param newItemsIndex Индекс, в котором появились новые элементы.
     * @param oldItems Удаленные элементы коллекции.
     * @param oldItemsIndex Индекс, в котором удалены элементы.
     */
    function onCollectionChange(event, action, newItems, newItemsIndex, oldItems, oldItemsIndex) {
        // Fix state of all nodes
        var nodes = this.instance._getItems().filter(function (item) {
            return item.isNode && item.isNode();
        });
        var state = this.instance._getItemsState(nodes);
        var session = this.instance._startUpdateSession();
        this.instance._reIndex();
        this.prev(event, action, newItems, newItemsIndex, oldItems, oldItemsIndex);    // Check state of all nodes. They can change children count (include hidden by filter).
        // Check state of all nodes. They can change children count (include hidden by filter).
        this.instance._finishUpdateSession(session, false);
        this.instance._checkItemsDiff(session, nodes, state);
    }    /**
     * Обрабатывает событие об изменении элемента коллекции
     * @param event Дескриптор события.
     * @param item Измененный элемент коллекции.
     * @param index Индекс измененного элемента.
     * @param properties Объект содержащий измененные свойства элемента
     */
    /**
     * Обрабатывает событие об изменении элемента коллекции
     * @param event Дескриптор события.
     * @param item Измененный элемент коллекции.
     * @param index Индекс измененного элемента.
     * @param properties Объект содержащий измененные свойства элемента
     */
    function onCollectionItemChange(event, item, index, properties) {
        this.instance._reIndex();
        this.prev(event, item, index, properties);
    }    /**
     * Возвращает имя совйства с инвертированным смыслом
     * @param name Имя свойства.
     */
    /**
     * Возвращает имя совйства с инвертированным смыслом
     * @param name Имя свойства.
     */
    function invertPropertyLogic(name) {
        return name[0] === '!' ? name.slice(1) : '!' + name;
    }
    var Tree = /** @class */
    function (_super) {
        tslib_1.__extends(Tree, _super);    /** @lends Types/_display/Tree.prototype */
                                            // @ts-ignore
        /** @lends Types/_display/Tree.prototype */
        // @ts-ignore
        function Tree(options) {
            var _this = this;    /**
             * {Object.<Array.<Types/_display/TreeItem>>} Соответствие узлов и их потомков
             */
            /**
             * {Object.<Array.<Types/_display/TreeItem>>} Соответствие узлов и их потомков
             */
            _this._childrenMap = {};    // FIXME: must process options before superclass constructor because it's immediately used in _composer
            // FIXME: must process options before superclass constructor because it's immediately used in _composer
            if (options && !options.hasChildrenProperty && options.loadedProperty) {
                options.hasChildrenProperty = invertPropertyLogic(options.loadedProperty);
            }
            _this = _super.call(this, options) || this;
            if (_this._$parentProperty) {
                _this._setImportantProperty(_this._$parentProperty);
            }
            if (_this._$childrenProperty) {
                _this._setImportantProperty(_this._$childrenProperty);
            }
            return _this;
        }
        Tree.prototype.destroy = function () {
            this._childrenMap = {};
            _super.prototype.destroy.call(this);
        };    // region SerializableMixin
        // region SerializableMixin
        Tree.prototype._getSerializableState = function (state) {
            state = _super.prototype._getSerializableState.call(this, state);
            state._root = this._root;
            return state;
        };
        Tree.prototype._setSerializableState = function (state) {
            var fromSuper = _super.prototype._setSerializableState.call(this, state);
            return function () {
                this._root = state._root;
                fromSuper.call(this);
            };
        };    // region Collection
        // region Collection
        Tree.prototype.getIndexBySourceItem = function (item) {
            if (this._$rootEnumerable && this.getRoot().getContents() === item) {
                return 0;
            }
            return _super.prototype.getIndexBySourceItem.call(this, item);
        };    /**
         * Устанавливает текущим следующий элемент родительского узла.
         * @return {Boolean} Есть ли следующий элемент в родительском узле
         */
        /**
         * Устанавливает текущим следующий элемент родительского узла.
         * @return {Boolean} Есть ли следующий элемент в родительском узле
         */
        Tree.prototype.moveToNext = function () {
            return this._moveTo(true);
        };    /**
         * Устанавливает текущим предыдущий элемент родительского узла
         * @return {Boolean} Есть ли предыдущий элемент в родительском узле
         */
        /**
         * Устанавливает текущим предыдущий элемент родительского узла
         * @return {Boolean} Есть ли предыдущий элемент в родительском узле
         */
        Tree.prototype.moveToPrevious = function () {
            return this._moveTo(false);
        };
        Tree.prototype._exctractItemId = function (item) {
            var path = [_super.prototype._exctractItemId.call(this, item)];
            var parent;
            while ((parent = item.getParent()) && !parent.isRoot()) {
                path.push(_super.prototype._exctractItemId.call(this, parent));
                item = parent;
            }
            return path.join(':');
        };    // endregion
              // region Public methods
              /**
         * Возвращает название свойства, содержащего идентификатор родительского узла
         * @return {String}
         */
        // endregion
        // region Public methods
        /**
         * Возвращает название свойства, содержащего идентификатор родительского узла
         * @return {String}
         */
        Tree.prototype.getParentProperty = function () {
            return this._$parentProperty;
        };    /**
         * Устанавливает название свойства, содержащего идентификатор родительского узла
         * @param {String} name
         */
        /**
         * Устанавливает название свойства, содержащего идентификатор родительского узла
         * @param {String} name
         */
        Tree.prototype.setParentProperty = function (name) {
            this._unsetImportantProperty(this._$parentProperty);
            this._$parentProperty = name;
            this._resetItemsStrategy();
            this._setImportantProperty(name);
            this._reBuild(true);
        };    /**
         * Возвращает название свойства, содержащего признак узла
         * @return {String}
         */
        /**
         * Возвращает название свойства, содержащего признак узла
         * @return {String}
         */
        Tree.prototype.getNodeProperty = function () {
            return this._$nodeProperty;
        };    /**
         * Возвращает название свойства, содержащего дочерние элементы узла
         * @return {String}
         */
        /**
         * Возвращает название свойства, содержащего дочерние элементы узла
         * @return {String}
         */
        Tree.prototype.getChildrenProperty = function () {
            return this._$childrenProperty;
        };    /**
         * Возвращает название свойства, содержащего признак наличия детей у узла
         * @return {String}
         */
        /**
         * Возвращает название свойства, содержащего признак наличия детей у узла
         * @return {String}
         */
        Tree.prototype.getHasChildrenProperty = function () {
            return this._$hasChildrenProperty;
        };
        Tree.prototype.getLoadedProperty = function () {
            return invertPropertyLogic(this._$hasChildrenProperty);
        };    /**
         * Возвращает корневой узел дерева
         * @return {Types/_display/TreeItem}
         */
        /**
         * Возвращает корневой узел дерева
         * @return {Types/_display/TreeItem}
         */
        Tree.prototype.getRoot = function () {
            if (this._root === null) {
                this._root = this._$root;
                if (!(this._root instanceof TreeItem_1.default)) {
                    this._root = new TreeItem_1.default({
                        contents: this._root,
                        owner: this,
                        node: true,
                        expanded: true,
                        hasChildren: false
                    });
                }
            }
            return this._root;
        };    /**
         * Устанавливает корневой узел дерева
         * @param {Types/_display/TreeItem|*} root Корневой узел или его содержимое
         */
        /**
         * Устанавливает корневой узел дерева
         * @param {Types/_display/TreeItem|*} root Корневой узел или его содержимое
         */
        Tree.prototype.setRoot = function (root) {
            if (this._$root === root) {
                return;
            }
            this._$root = root;
            this._root = null;
            this._reIndex();
            this._reAnalize();
        };    /**
         * Возвращает признак, что корневой узел включен в список элементов
         * @return {Boolean}
         */
        /**
         * Возвращает признак, что корневой узел включен в список элементов
         * @return {Boolean}
         */
        Tree.prototype.isRootEnumerable = function () {
            return this._$rootEnumerable;
        };    /**
         * Устанавливает признак, что корневой узел включен в список элементов
         * @param {Boolean} enumerable Корневой узел включен в список элементов
         */
        /**
         * Устанавливает признак, что корневой узел включен в список элементов
         * @param {Boolean} enumerable Корневой узел включен в список элементов
         */
        Tree.prototype.setRootEnumerable = function (enumerable) {
            if (this._$rootEnumerable === enumerable) {
                return;
            }
            var session = this._startUpdateSession();
            this._$rootEnumerable = enumerable;
            if (enumerable) {
                this._wrapRootStrategy(this._composer);
            } else {
                this._unwrapRootStrategy(this._composer);
            }
            this._reSort();
            this._reFilter();
            this._finishUpdateSession(session);
        };    /**
         * Возвращает коллекцию потомков элемента коллекции
         * @param {Types/_display/TreeItem} parent Родительский узел
         * @param {Boolean} [withFilter=true] Учитывать {@link setFilter фильтр}
         * @return {Types/_display/TreeChildren}
         */
        /**
         * Возвращает коллекцию потомков элемента коллекции
         * @param {Types/_display/TreeItem} parent Родительский узел
         * @param {Boolean} [withFilter=true] Учитывать {@link setFilter фильтр}
         * @return {Types/_display/TreeChildren}
         */
        Tree.prototype.getChildren = function (parent, withFilter) {
            return new TreeChildren_1.default({
                owner: parent,
                items: this._getChildrenArray(parent, withFilter)
            });
        };    /**
         * Устанавливает текущим родителя текущего элемента
         * @return {Boolean} Есть ли родитель
         */
        /**
         * Устанавливает текущим родителя текущего элемента
         * @return {Boolean} Есть ли родитель
         */
        Tree.prototype.moveToAbove = function () {
            var current = this.getCurrent();
            if (!current) {
                return false;
            }
            var parent = current.getParent();
            if (!parent || parent.isRoot()) {
                return false;
            }
            this.setCurrent(parent);
            return true;
        };    /**
         * Устанавливает текущим первого непосредственного потомка текущего элемента
         * @return {Boolean} Есть ли первый потомок
         */
        /**
         * Устанавливает текущим первого непосредственного потомка текущего элемента
         * @return {Boolean} Есть ли первый потомок
         */
        Tree.prototype.moveToBelow = function () {
            var current = this.getCurrent();
            if (!current || !current.isNode()) {
                return false;
            }
            var children = this._getChildrenArray(current);
            if (children.length === 0) {
                return false;
            }
            this.setCurrent(children[0]);
            return true;
        };    // endregion
              // region Protected methods
        // endregion
        // region Protected methods
        Tree.prototype._getItemsFactory = function () {
            var parent = _super.prototype._getItemsFactory.call(this);
            return function TreeItemsFactory(options) {
                var hasChildrenProperty = this._$hasChildrenProperty;
                var invertLogic = false;
                if (typeof hasChildrenProperty === 'string' && hasChildrenProperty[0] === '!') {
                    hasChildrenProperty = hasChildrenProperty.substr(1);
                    invertLogic = !invertLogic;
                }
                var hasChildren = util_1.object.getPropertyValue(options.contents, hasChildrenProperty);
                options.hasChildren = invertLogic ? !hasChildren : hasChildren;
                if (!('node' in options)) {
                    options.node = util_1.object.getPropertyValue(options.contents, this._$nodeProperty);
                }
                return parent.call(this, options);
            };
        };
        Tree.prototype._createComposer = function () {
            var composer = _super.prototype._createComposer.call(this);
            if (this._$childrenProperty) {
                composer.remove(Direct_1.default);
                composer.prepend(MaterializedPath_1.default, {
                    display: this,
                    childrenProperty: this._$childrenProperty,
                    nodeProperty: this._$nodeProperty,
                    hasChildrenProperty: this._$hasChildrenProperty,
                    root: this.getRoot.bind(this)
                });
            } else {
                composer.append(AdjacencyList_1.default, {
                    idProperty: this._$idProperty,
                    parentProperty: this._$parentProperty,
                    nodeProperty: this._$nodeProperty,
                    hasChildrenProperty: this._$hasChildrenProperty
                });
            }
            this._wrapRootStrategy(composer);
            return composer;
        };
        Tree.prototype._wrapRootStrategy = function (composer) {
            if (this._$rootEnumerable && !composer.getInstance(Root_1.default)) {
                composer.append(Root_1.default, { root: this.getRoot.bind(this) });
            }
        };
        Tree.prototype._unwrapRootStrategy = function (composer) {
            if (!this._$rootEnumerable) {
                composer.remove(Root_1.default);
            }
        };
        Tree.prototype._reIndex = function () {
            _super.prototype._reIndex.call(this);
            this._childrenMap = {};
        };
        Tree.prototype._bindHandlers = function () {
            _super.prototype._bindHandlers.call(this);
            this._onCollectionChange = onCollectionChange.bind({
                instance: this,
                prev: this._onCollectionChange
            });
            this._onCollectionItemChange = onCollectionItemChange.bind({
                instance: this,
                prev: this._onCollectionItemChange
            });
        };
        Tree.prototype._replaceItems = function (start, newItems) {
            var replaced = _super.prototype._replaceItems.call(this, start, newItems);
            var strategy = this._getItemsStrategy();
            var count = strategy.count;
            replaced.forEach(function (item, index) {
                var strategyIndex = replaced.start + index;
                if (strategyIndex < count) {
                    strategy.at(strategyIndex).setExpanded(item.isExpanded(), true);
                }
            });
            return replaced;
        };
        Tree.prototype._getItemState = function (item) {
            var state = _super.prototype._getItemState.call(this, item);
            if (item instanceof TreeItem_1.default) {
                state.parent = item.getParent();
                state.childrenCount = item.getOwner()._getChildrenArray(item, false).length;
                state.level = item.getLevel();
                state.node = item.isNode();
                state.expanded = item.isExpanded();
            }
            return state;
        };    /**
         * Проверяет валидность элемента проекции
         * @param {*} item Элемент проекции
         * @protected
         */
        /**
         * Проверяет валидность элемента проекции
         * @param {*} item Элемент проекции
         * @protected
         */
        Tree.prototype._checkItem = function (item) {
            if (!item || !(item instanceof CollectionItem_1.default)) {
                throw new Error(this._moduleName + '::_checkItem(): item should be in instance of Types/_display/CollectionItem');
            }
        };    /**
         * Возвращает массив детей для указанного родителя
         * @param {Types/_display/TreeItem} parent Родительский узел
         * @param {Boolean} [withFilter=true] Учитывать {@link setFilter фильтр}
         * @return {Array.<Types/_display/TreeItem>}
         * @protected
         */
        /**
         * Возвращает массив детей для указанного родителя
         * @param {Types/_display/TreeItem} parent Родительский узел
         * @param {Boolean} [withFilter=true] Учитывать {@link setFilter фильтр}
         * @return {Array.<Types/_display/TreeItem>}
         * @protected
         */
        Tree.prototype._getChildrenArray = function (parent, withFilter) {
            this._checkItem(parent);
            withFilter = withFilter === undefined ? true : !!withFilter;
            var iid = parent.getInstanceId();
            var key = iid + '|' + withFilter;
            if (!(key in this._childrenMap)) {
                var children = [];
                var enumerator = void 0;
                if (withFilter) {
                    enumerator = this.getEnumerator();
                } else {
                    enumerator = this._buildEnumerator(this._getItems.bind(this), this._filterMap.map(function () {
                        return true;
                    }), this._sortMap);
                }
                enumerator.setCurrent(parent);
                if (enumerator.getCurrent() === parent || parent.isRoot()) {
                    var item = void 0;
                    while (enumerator.moveNext()) {
                        item = enumerator.getCurrent();
                        if (!(item instanceof TreeItem_1.default)) {
                            continue;
                        }
                        if (item.getParent() === parent) {
                            children.push(item);
                        } else if (item.getLevel() === parent.getLevel()) {
                            break;
                        }
                    }
                }
                this._childrenMap[key] = children;
            }
            return this._childrenMap[key];
        };
        Tree.prototype._getNearbyItem = function (enumerator, item, isNext, skipGroups) {
            var method = isNext ? 'moveNext' : 'movePrevious';
            var parent = item && item.getParent && item.getParent() || this.getRoot();
            var hasItem = true;
            var initial = enumerator.getCurrent();
            var sameParent = false;
            var current;
            var nearbyItem;
            enumerator.setCurrent(item);    // TODO: отлеживать по level, что вышли "выше"
            // TODO: отлеживать по level, что вышли "выше"
            while (hasItem && !sameParent) {
                hasItem = enumerator[method]();
                nearbyItem = enumerator.getCurrent();
                if (skipGroups && nearbyItem instanceof GroupItem_1.default) {
                    nearbyItem = undefined;
                    continue;
                }
                sameParent = nearbyItem ? nearbyItem.getParent() === parent : false;
                current = hasItem && sameParent ? nearbyItem : undefined;
            }
            enumerator.setCurrent(initial);
            return current;
        };
        Tree.prototype._moveTo = function (isNext) {
            var enumerator = this._getCursorEnumerator();
            var initial = this.getCurrent();
            var item = this._getNearbyItem(enumerator, initial, isNext, true);
            var hasMove = !!item;
            if (hasMove) {
                this.setCurrent(item);
            } else {
                enumerator.setCurrent(initial);
            }
            return hasMove;
        };
        Tree.prototype._notifyItemsParent = function (treeItem, oldParent, properties) {
            if (properties.hasOwnProperty(this.getParentProperty())) {
                this._notifyItemsParentByItem(treeItem.getParent());
                this._notifyItemsParentByItem(oldParent);
            }
        };
        Tree.prototype._notifyItemsParentByItem = function (treeItem) {
            while (treeItem !== this.getRoot()) {
                this.notifyItemChange(treeItem, { children: [] });
                treeItem = treeItem.getParent();
            }
        };
        return Tree;
    }(Collection_1.default    /** @lends Types/_display/Tree.prototype */);
    /** @lends Types/_display/Tree.prototype */
    exports.default = Tree;
    Object.assign(Tree.prototype, {
        '[Types/_display/Tree]': true,
        _moduleName: 'Types/display:Tree',
        _itemModule: 'Types/display:TreeItem',
        _$parentProperty: '',
        _$nodeProperty: '',
        _$childrenProperty: '',
        _$hasChildrenProperty: '',
        _$root: undefined,
        _$rootEnumerable: false,
        _root: null
    });    // DIXME: deprecated
    // DIXME: deprecated
    Tree.prototype['[WS.Data/Display/Tree]'] = true;
    di_1.register('Types/display:Tree', Tree);
});