/**
 * Проекция коллекции - предоставляет методы навигации, фильтрации и сортировки,
 * не меняя при этом оригинальную коллекцию.
 * @class Types/_display/Collection
 * @extends Types/_display/Abstract
 * @implements Types/_collection/IEnumerable
 * @implements Types/_collection/IList
 * @implements Types/_display/IBindCollection
 * @mixes Types/_entity/SerializableMixin
 * @mixes Types/_collection/EventRaisingMixin
 * @ignoreMethods notifyItemChange
 * @public
 * @author Мальцев А.А.
 */
define('Types/_display/Collection', [
    'require',
    'exports',
    'tslib',
    'Types/_display/IBind',
    'Types/_display/Abstract',
    'Types/_display/CollectionEnumerator',
    'Types/_display/CollectionItem',
    'Types/_display/GroupItem',
    'Types/_display/itemsStrategy/Composer',
    'Types/_display/itemsStrategy/Direct',
    'Types/_display/itemsStrategy/User',
    'Types/_display/itemsStrategy/Group',
    'Types/entity',
    'Types/collection',
    'Types/di',
    'Types/util',
    'Types/shim'
], function (require, exports, tslib_1, IBind_1, Abstract_1, CollectionEnumerator_1, CollectionItem_1, GroupItem_1, Composer_1, Direct_1, User_1, Group_1, entity_1, collection_1, di_1, util_1, shim_1) {
    'use strict';
    Object.defineProperty(exports, '__esModule', { value: true });    // tslint:disable-next-line:ban-comma-operator
    // tslint:disable-next-line:ban-comma-operator
    var GLOBAL = (0, eval)('this');
    var LOGGER = GLOBAL.console;
    var MESSAGE_READ_ONLY = 'The Display is read only. You should modify the source collection instead.';    /**
     * Преобразует проекцию в массив из ее элементов
     * @param display Проекция.
     */
    /**
     * Преобразует проекцию в массив из ее элементов
     * @param display Проекция.
     */
    function toArray(display) {
        var result = [];
        display.each(function (item) {
            result.push(item);
        });
        return result;
    }    /**
     * Нормализует массив обработчиков
     * @param {Function|Array.<Function>} handlers Обработчики
     * @return {Array.<Function>}
     */
    /**
     * Нормализует массив обработчиков
     * @param {Function|Array.<Function>} handlers Обработчики
     * @return {Array.<Function>}
     */
    function normalizeHandlers(handlers) {
        if (typeof handlers === 'function') {
            handlers = [handlers];
        }
        return handlers instanceof Array ? handlers.filter(function (item) {
            return typeof item === 'function';
        }) : [];
    }    /**
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
        var session;
        switch (action) {
        case IBind_1.default.ACTION_RESET:
            var projectionOldItems = toArray(this);
            var projectionNewItems = void 0;
            this._reBuild(true);
            projectionNewItems = toArray(this);
            this._notifyBeforeCollectionChange();
            this._notifyCollectionChange(action, projectionNewItems, 0, projectionOldItems, 0);
            this._notifyAfterCollectionChange();
            return;
        case IBind_1.default.ACTION_CHANGE:
            session = this._startUpdateSession();    // FIXME: newItems.length - FIXME[OrderMatch]
            // FIXME: newItems.length - FIXME[OrderMatch]
            this._reGroup(newItemsIndex, newItems.length);
            this._reSort();
            this._reFilter();
            this._finishUpdateSession(session, false);
            this._notifyCollectionItemsChange(newItems, newItemsIndex, session);
            return;
        }
        session = this._startUpdateSession();
        switch (action) {
        case IBind_1.default.ACTION_ADD:
            this._addItems(newItemsIndex, newItems);    // FIXME: newItems.length - FIXME[OrderMatch]
            // FIXME: newItems.length - FIXME[OrderMatch]
            this._reGroup(newItemsIndex, newItems.length);
            this._reSort();
            this._reFilter();
            break;
        case IBind_1.default.ACTION_REMOVE:
            // FIXME: oldItems.length - FIXME[OrderMatch]
            this._removeItems(oldItemsIndex, oldItems.length);
            this._reSort();
            if (this._isFiltered() && this._isFilteredByIndex()) {
                this._reFilter();
            }
            break;
        case IBind_1.default.ACTION_REPLACE:
            // FIXME: newItems - FIXME[OrderMatch]
            this._replaceItems(newItemsIndex, newItems);    // FIXME: newItems.length - FIXME[OrderMatch]
            // FIXME: newItems.length - FIXME[OrderMatch]
            this._reGroup(newItemsIndex, newItems.length);
            this._reSort();
            this._reFilter();
            break;
        case IBind_1.default.ACTION_MOVE:
            // FIXME: newItems - FIXME[OrderMatch]
            this._moveItems(newItemsIndex, oldItemsIndex, newItems);
            this._reSort();
            this._reFilter();
            break;
        }
        this._finishUpdateSession(session);
    }    /**
     * Обрабатывает событие об изменении элемента коллекции
     * @param event Дескриптор события.
     * @param item Измененный элемент коллекции.
     * @param index Индекс измененного элемента.
     * @param [properties] Изменившиеся свойства
     */
    /**
     * Обрабатывает событие об изменении элемента коллекции
     * @param event Дескриптор события.
     * @param item Измененный элемент коллекции.
     * @param index Индекс измененного элемента.
     * @param [properties] Изменившиеся свойства
     */
    function onCollectionItemChange(event, item, index, properties) {
        if (!this.isEventRaising()) {
            return;
        }
        if (this._sourceCollectionSynchronized) {
            this._notifySourceCollectionItemChange(event, item, index, properties);
        } else {
            this._sourceCollectionDelayedCallbacks = this._sourceCollectionDelayedCallbacks || [];
            this._sourceCollectionDelayedCallbacks.push([
                this._notifySourceCollectionItemChange,
                arguments
            ]);
        }
    }    /**
     * Обрабатывает событие об изменении режима генерации событий
     * @param event Дескриптор события.
     * @param enabled Включена или выключена генерация событий
     * @param analyze Включен или выключен анализ изменений
     */
    /**
     * Обрабатывает событие об изменении режима генерации событий
     * @param event Дескриптор события.
     * @param enabled Включена или выключена генерация событий
     * @param analyze Включен или выключен анализ изменений
     */
    function onEventRaisingChange(event, enabled, analyze) {
        // Если без выключили без анализа изменений, то при следующем включении генерации надо актуализировать состояние
        if (!analyze && enabled) {
            this._reBuild(true);
        }
        this._sourceCollectionSynchronized = enabled;    // Call delayed handlers if get back to synchronize
        // Call delayed handlers if get back to synchronize
        var callbacks = this._sourceCollectionDelayedCallbacks;
        if (this._sourceCollectionSynchronized && callbacks) {
            var callback = void 0;
            while (callbacks.length > 0) {
                callback = callbacks[0];
                callback[0].apply(this, callback[1]);
                callbacks.shift();
            }
        }
    }
    var Collection = /** @class */
    function (_super) {
        tslib_1.__extends(Collection, _super);
        function Collection(options) {
            var _this = _super.call(this, options) || this;    // endregion
                                                               // region IEnumerable
            // endregion
            // region IEnumerable
            _this['[Types/_collection/IEnumerable]'] = true;    // endregion
                                                                // region IList
            // endregion
            // region IList
            _this['[Types/_collection/IList]'] = true;    /**
             * Элемент -> уникальный идентификатор
             */
            /**
             * Элемент -> уникальный идентификатор
             */
            _this._itemToUid = new shim_1.Map();    /**
             * Уникальные идентификаторы элементов
             */
            /**
             * Уникальные идентификаторы элементов
             */
            _this._itemsUid = new shim_1.Set();    /**
             * Результат применения фильтра: индекс элемента проекции -> прошел фильтр
             */
            /**
             * Результат применения фильтра: индекс элемента проекции -> прошел фильтр
             */
            _this._filterMap = [];    /**
             * Результат применения сортировки: индекс после сортировки -> индекс элемента проекции
             */
            /**
             * Результат применения сортировки: индекс после сортировки -> индекс элемента проекции
             */
            _this._sortMap = [];
            entity_1.SerializableMixin.constructor.call(_this);
            collection_1.EventRaisingMixin.constructor.call(_this, options);
            _this._$filter = _this._$filter || [];
            _this._$sort = _this._$sort || [];
            _this._$importantItemProperties = _this._$importantItemProperties || [];
            if (!_this._$collection) {
                throw new Error(_this._moduleName + ': source collection is empty');
            }
            if (_this._$collection instanceof Array) {
                _this._$collection = di_1.create('Types/collection:List', { items: _this._$collection });
            }
            if (!_this._$collection['[Types/_collection/IEnumerable]']) {
                throw new TypeError(_this._moduleName + ': source collection should implement Types/collection:IEnumerable');
            }
            _this._$sort = normalizeHandlers(_this._$sort);
            _this._$filter = normalizeHandlers(_this._$filter);
            if (_this._$idProperty) {
                _this._setImportantProperty(_this._$idProperty);
            }
            _this._publish('onCurrentChange', 'onCollectionChange', 'onBeforeCollectionChange', 'onAfterCollectionChange');
            _this._switchImportantPropertiesByUserSort(true);
            _this._switchImportantPropertiesByGroup(true);
            _this._reBuild();
            _this._bindHandlers();
            if (_this._$collection['[Types/_collection/IObservable]']) {
                _this._$collection.subscribe('onCollectionChange', _this._onCollectionChange);
                _this._$collection.subscribe('onCollectionItemChange', _this._onCollectionItemChange);
            }
            if (_this._$collection['[Types/_entity/EventRaisingMixin]']) {
                _this._$collection.subscribe('onEventRaisingChange', _this._oEventRaisingChange);
            }
            return _this;
        }
        Object.defineProperty(Collection.prototype, 'localize', {
            /**
             * Возвращать локализованные значения
             */
            get: function () {
                return this._localize;
            },
            enumerable: true,
            configurable: true
        });    /**
         * Добавляет/удаляет свойства функтора в в/из список важных свойств.
         * @param func Функтор
         * @param instance Проекция
         * @param add Добавить или удалить свойства
         */
        /**
         * Добавляет/удаляет свойства функтора в в/из список важных свойств.
         * @param func Функтор
         * @param instance Проекция
         * @param add Добавить или удалить свойства
         */
        Collection._functorToImportantProperties = function (func, instance, add) {
            if (entity_1.functor.Compute.isFunctor(func)) {
                var properties = func.properties;
                for (var i = 0; i < properties.length; i++) {
                    if (add) {
                        instance._setImportantProperty(properties[i]);
                    } else {
                        instance._unsetImportantProperty(properties[i]);
                    }
                }
            }
        };
        Collection.prototype.destroy = function () {
            if (!this._$collection.destroyed) {
                if (this._$collection['[Types/_collection/IObservable]']) {
                    this._$collection.unsubscribe('onCollectionChange', this._onCollectionChange);
                    this._$collection.unsubscribe('onCollectionItemChange', this._onCollectionItemChange);
                }
                if (this._$collection['[Types/_entity/EventRaisingMixin]']) {
                    this._$collection.unsubscribe('onEventRaisingChange', this._oEventRaisingChange);
                }
            }
            this._unbindHandlers();
            this._composer = null;
            this._filterMap = [];
            this._sortMap = [];
            this._itemToUid = null;
            this._itemsUid = null;
            this._cursorEnumerator = null;
            this._utilityEnumerator = null;
            _super.prototype.destroy.call(this);
        };    // region mutable
              /**
         * Возвращает элемент проекции с указанным идентификатором экземпляра.
         * @param {String} instanceId Идентификатор экземпляра.
         * @return {Types/_display/CollectionItem}
         * @state mutable
         */
        // region mutable
        /**
         * Возвращает элемент проекции с указанным идентификатором экземпляра.
         * @param {String} instanceId Идентификатор экземпляра.
         * @return {Types/_display/CollectionItem}
         * @state mutable
         */
        Collection.prototype.getByInstanceId = function (instanceId) {
            return this.at(this._getUtilityEnumerator().getIndexByValue('instanceId', instanceId));
        };    /**
         * Возвращает индекс элемента проекции с указанным идентификатором экземпляра.
         * @param {String} instanceId Идентификатор экземпляра.
         * @return {Number}
         * @state mutable
         */
        /**
         * Возвращает индекс элемента проекции с указанным идентификатором экземпляра.
         * @param {String} instanceId Идентификатор экземпляра.
         * @return {Number}
         * @state mutable
         */
        Collection.prototype.getIndexByInstanceId = function (instanceId) {
            return this._getUtilityEnumerator().getIndexByValue('instanceId', instanceId);
        };    /**
         * Возвращает энумератор для перебора элементов проекции
         * @return {Types/_display/CollectionEnumerator}
         */
        /**
         * Возвращает энумератор для перебора элементов проекции
         * @return {Types/_display/CollectionEnumerator}
         */
        Collection.prototype.getEnumerator = function (localize) {
            return this._getEnumerator();
        };    /**
         * Перебирает все элементы проекции, начиная с первого.
         * @param {Function(Types/_display/CollectionItem, Number)} callback Ф-я обратного вызова для каждого элемента
         * коллекции (аргументами придут элемент коллекции и его порядковый номер)
         * @param {Object} [context] Контекст вызова callback
         * @example
         * Сгруппируем персонажей по полу:
         * <pre>
         *    require([
         *       'Types/collection',
         *       'Types/display'
         *    ], function(collection, display) {
         *       var list = new collection.List({
         *          items: [
         *             {name: 'Philip J. Fry', gender: 'M'},
         *             {name: 'Turanga Leela', gender: 'F'},
         *             {name: 'Professor Farnsworth', gender: 'M'},
         *             {name: 'Amy Wong', gender: 'F'},
         *             {name: 'Bender Bending Rodriguez', gender: 'R'}
         *          ]
         *       });
         *       var display = new display.Collection({
         *          collection: list
         *       });
         *
         *       display.setGroup(function(collectionItem, index, item) {
         *          return collectionItem.gender;
         *       });
         *
         *       display.each(function(item, index) {
         *          if (item instanceof GroupItem) {
         *             console.log('[' + item.getContents() + ']');
         *          } else {
         *             console.log(item.getContents().name);
         *          }
         *       });
         *       //output:
         *       // '[M]', 'Philip J. Fry', 'Professor Farnsworth',
         *       // '[F]', 'Turanga Leela', 'Amy Wong',
         *       // '[R]', 'Bender Bending Rodriguez'
         *    });
         * </pre>
         */
        /**
         * Перебирает все элементы проекции, начиная с первого.
         * @param {Function(Types/_display/CollectionItem, Number)} callback Ф-я обратного вызова для каждого элемента
         * коллекции (аргументами придут элемент коллекции и его порядковый номер)
         * @param {Object} [context] Контекст вызова callback
         * @example
         * Сгруппируем персонажей по полу:
         * <pre>
         *    require([
         *       'Types/collection',
         *       'Types/display'
         *    ], function(collection, display) {
         *       var list = new collection.List({
         *          items: [
         *             {name: 'Philip J. Fry', gender: 'M'},
         *             {name: 'Turanga Leela', gender: 'F'},
         *             {name: 'Professor Farnsworth', gender: 'M'},
         *             {name: 'Amy Wong', gender: 'F'},
         *             {name: 'Bender Bending Rodriguez', gender: 'R'}
         *          ]
         *       });
         *       var display = new display.Collection({
         *          collection: list
         *       });
         *
         *       display.setGroup(function(collectionItem, index, item) {
         *          return collectionItem.gender;
         *       });
         *
         *       display.each(function(item, index) {
         *          if (item instanceof GroupItem) {
         *             console.log('[' + item.getContents() + ']');
         *          } else {
         *             console.log(item.getContents().name);
         *          }
         *       });
         *       //output:
         *       // '[M]', 'Philip J. Fry', 'Professor Farnsworth',
         *       // '[F]', 'Turanga Leela', 'Amy Wong',
         *       // '[R]', 'Bender Bending Rodriguez'
         *    });
         * </pre>
         */
        Collection.prototype.each = function (callback, context) {
            var enumerator = this.getEnumerator();
            var index;
            while (enumerator.moveNext()) {
                index = enumerator.getCurrentIndex();
                callback.call(context, enumerator.getCurrent(), index);
            }
        };
        Collection.prototype.assign = function () {
            throw new Error(MESSAGE_READ_ONLY);
        };
        Collection.prototype.append = function () {
            throw new Error(MESSAGE_READ_ONLY);
        };
        Collection.prototype.prepend = function () {
            throw new Error(MESSAGE_READ_ONLY);
        };
        Collection.prototype.clear = function () {
            throw new Error(MESSAGE_READ_ONLY);
        };
        Collection.prototype.add = function () {
            throw new Error(MESSAGE_READ_ONLY);
        };
        Collection.prototype.at = function (index) {
            return this._getUtilityEnumerator().at(index);
        };
        Collection.prototype.remove = function () {
            throw new Error(MESSAGE_READ_ONLY);
        };
        Collection.prototype.removeAt = function () {
            throw new Error(MESSAGE_READ_ONLY);
        };
        Collection.prototype.replace = function () {
            throw new Error(MESSAGE_READ_ONLY);
        };
        Collection.prototype.move = function () {
            throw new Error(MESSAGE_READ_ONLY);
        };
        Collection.prototype.getIndex = function (item) {
            if (!(item instanceof CollectionItem_1.default)) {
                return -1;
            }
            return this.getIndexByInstanceId(item.getInstanceId());
        };    /**
         * Возвращает количество элементов проекции.
         * @param {Boolean} [skipGroups=false] Не считать группы
         * @return {Number}
         */
        /**
         * Возвращает количество элементов проекции.
         * @param {Boolean} [skipGroups=false] Не считать группы
         * @return {Number}
         */
        Collection.prototype.getCount = function (skipGroups) {
            var count = 0;
            if (skipGroups && this._isGrouped()) {
                this.each(function (item) {
                    if (!(item instanceof GroupItem_1.default)) {
                        count++;
                    }
                });
            } else {
                count = this._getUtilityEnumerator().getCount();
            }
            return count;
        };    // endregion
              // region Public
              // region Access
              /**
         * Возвращает оригинальную коллекцию
         * @return {Types/_collection/IEnumerable}
         * @see collection
         */
        // endregion
        // region Public
        // region Access
        /**
         * Возвращает оригинальную коллекцию
         * @return {Types/_collection/IEnumerable}
         * @see collection
         */
        Collection.prototype.getCollection = function () {
            return this._$collection;
        };    /**
         * Возвращает число элементов оригинальной коллекции
         * @return {Number}
         * @see collection
         */
        /**
         * Возвращает число элементов оригинальной коллекции
         * @return {Number}
         * @see collection
         */
        Collection.prototype.getCollectionCount = function () {
            var collection = this.getCollection();
            if (collection['[Types/_collection/IList]']) {
                return collection.getCount();
            }
            var enumerator = collection.getEnumerator();
            var count = 0;
            enumerator.reset();
            while (enumerator.moveNext()) {
                count++;
            }
            return count;
        };    /**
         * Возвращает элементы проекции (без учета сортировки, фильтрации и группировки).
         * @return {Array.<Types/_display/CollectionItem>}
         */
        /**
         * Возвращает элементы проекции (без учета сортировки, фильтрации и группировки).
         * @return {Array.<Types/_display/CollectionItem>}
         */
        Collection.prototype.getItems = function () {
            return this._getItems().slice();
        };    /**
         * Создает элемент проекции
         * @param {Object} options Значения опций
         * @return {Types/_display/CollectionItem}
         */
        /**
         * Создает элемент проекции
         * @param {Object} options Значения опций
         * @return {Types/_display/CollectionItem}
         */
        Collection.prototype.createItem = function (options) {
            if (!this._itemsFactory) {
                this._itemsFactory = this._getItemsFactory().bind(this);
            }
            return this._itemsFactory(options);
        };    /**
         * Возвращает псевдоуникальный идентификатор элемента коллекции, основанный на значении опции
         * {@link Types/_display/CollectionItem#contents}.
         * @param {Types/_display/CollectionItem} item Элемент коллекции
         * @return {String|undefined}
         */
        /**
         * Возвращает псевдоуникальный идентификатор элемента коллекции, основанный на значении опции
         * {@link Types/_display/CollectionItem#contents}.
         * @param {Types/_display/CollectionItem} item Элемент коллекции
         * @return {String|undefined}
         */
        Collection.prototype.getItemUid = function (item) {
            var itemToUid = this._itemToUid;
            if (itemToUid.has(item)) {
                return itemToUid.get(item);
            }
            var uid = this._exctractItemId(item);
            uid = this._searchItemUid(item, uid);
            itemToUid.set(item, uid);
            return uid;
        };    // endregion Access
              // region Navigation
              /**
         * Возвращает текущий элемент
         * @return {Types/_display/CollectionItem}
         */
        // endregion Access
        // region Navigation
        /**
         * Возвращает текущий элемент
         * @return {Types/_display/CollectionItem}
         */
        Collection.prototype.getCurrent = function () {
            return this._getCursorEnumerator().getCurrent();
        };    /**
         * Устанавливает текущий элемент
         * @param {Types/_display/CollectionItem} item Новый текущий элемент
         * @param {Boolean} [silent=false] Не генерировать событие onCurrentChange
         */
        /**
         * Устанавливает текущий элемент
         * @param {Types/_display/CollectionItem} item Новый текущий элемент
         * @param {Boolean} [silent=false] Не генерировать событие onCurrentChange
         */
        Collection.prototype.setCurrent = function (item, silent) {
            var oldCurrent = this.getCurrent();
            if (oldCurrent !== item) {
                var enumerator = this._getCursorEnumerator();
                var oldPosition = this.getCurrentPosition();
                enumerator.setCurrent(item);
                if (!silent) {
                    this._notifyCurrentChange(this.getCurrent(), oldCurrent, enumerator.getPosition(), oldPosition);
                }
            }
        };    /**
         * Возвращает позицию текущего элемента
         * @return {Number}
         */
        /**
         * Возвращает позицию текущего элемента
         * @return {Number}
         */
        Collection.prototype.getCurrentPosition = function () {
            return this._getCursorEnumerator().getPosition();
        };    /**
         * Устанавливает позицию текущего элемента
         * @param {Number} position Позиция текущего элемента. Значение -1 указывает, что текущий элемент не выбран.
         * @param {Boolean} [silent=false] Не генерировать событие onCurrentChange
         */
        /**
         * Устанавливает позицию текущего элемента
         * @param {Number} position Позиция текущего элемента. Значение -1 указывает, что текущий элемент не выбран.
         * @param {Boolean} [silent=false] Не генерировать событие onCurrentChange
         */
        Collection.prototype.setCurrentPosition = function (position, silent) {
            var oldPosition = this.getCurrentPosition();
            if (position !== oldPosition) {
                var oldCurrent = this.getCurrent();
                this._getCursorEnumerator().setPosition(position);
                if (!silent) {
                    this._notifyCurrentChange(this.getCurrent(), oldCurrent, position, oldPosition);
                }
            }
        };    /**
         * Возвращает первый элемент
         * @return {Types/_display/CollectionItem}
         */
        /**
         * Возвращает первый элемент
         * @return {Types/_display/CollectionItem}
         */
        Collection.prototype.getFirst = function () {
            var enumerator = this._getUtilityEnumerator();
            enumerator.setPosition(0);
            var item = enumerator.getCurrent();
            if (item instanceof GroupItem_1.default) {
                return this._getNearbyItem(enumerator, item, true, true);
            }
            return item;
        };    /**
         * Возвращает последний элемент
         * @return {Types/_display/CollectionItem}
         */
        /**
         * Возвращает последний элемент
         * @return {Types/_display/CollectionItem}
         */
        Collection.prototype.getLast = function () {
            var enumerator = this._getUtilityEnumerator();
            var lastIndex = enumerator.getCount() - 1;
            enumerator.setPosition(lastIndex);
            var item = enumerator.getCurrent();
            if (item instanceof GroupItem_1.default) {
                return this._getNearbyItem(enumerator, undefined, false, true);
            }
            return item;
        };    /**
         * Возвращает следующий элемент относительно item
         * @param {Types/_display/CollectionItem} item элемент проекции
         * @return {Types/_display/CollectionItem}
         */
        /**
         * Возвращает следующий элемент относительно item
         * @param {Types/_display/CollectionItem} item элемент проекции
         * @return {Types/_display/CollectionItem}
         */
        Collection.prototype.getNext = function (item) {
            return this._getNearbyItem(this._getUtilityEnumerator(), item, true, true);
        };    /**
         * Возвращает предыдущий элемент относительно item
         * @param {Types/_display/CollectionItem} index элемент проекции
         * @return {Types/_display/CollectionItem}
         */
        /**
         * Возвращает предыдущий элемент относительно item
         * @param {Types/_display/CollectionItem} index элемент проекции
         * @return {Types/_display/CollectionItem}
         */
        Collection.prototype.getPrevious = function (item) {
            return this._getNearbyItem(this._getUtilityEnumerator(), item, false, true);
        };    /**
         * Устанавливает текущим следующий элемент
         * @return {Boolean} Есть ли следующий элемент
         */
        /**
         * Устанавливает текущим следующий элемент
         * @return {Boolean} Есть ли следующий элемент
         */
        Collection.prototype.moveToNext = function () {
            var oldCurrent = this.getCurrent();
            var oldCurrentPosition = this.getCurrentPosition();
            var hasNext = this._getCursorEnumerator().moveNext();
            if (hasNext) {
                this._notifyCurrentChange(this.getCurrent(), oldCurrent, this.getCurrentPosition(), oldCurrentPosition);
            }
            return hasNext;
        };    /**
         * Устанавливает текущим предыдущий элемент
         * @return {Boolean} Есть ли предыдущий элемент
         */
        /**
         * Устанавливает текущим предыдущий элемент
         * @return {Boolean} Есть ли предыдущий элемент
         */
        Collection.prototype.moveToPrevious = function () {
            var oldCurrent = this.getCurrent();
            var oldCurrentPosition = this.getCurrentPosition();
            var hasPrevious = this._getCursorEnumerator().movePrevious();
            if (hasPrevious) {
                this._notifyCurrentChange(this.getCurrent(), oldCurrent, this.getCurrentPosition(), oldCurrentPosition);
            }
            return hasPrevious;
        };    /**
         * Устанавливает текущим первый элемент
         * @return {Boolean} Есть ли первый элемент
         */
        /**
         * Устанавливает текущим первый элемент
         * @return {Boolean} Есть ли первый элемент
         */
        Collection.prototype.moveToFirst = function () {
            if (this.getCurrentPosition() === 0) {
                return false;
            }
            this.setCurrentPosition(0);
            return this._getCursorEnumerator().getPosition() === 0;
        };    /**
         * Устанавливает текущим последний элемент
         * @return {Boolean} Есть ли последний элемент
         */
        /**
         * Устанавливает текущим последний элемент
         * @return {Boolean} Есть ли последний элемент
         */
        Collection.prototype.moveToLast = function () {
            var position = this.getCount() - 1;
            if (this.getCurrentPosition() === position) {
                return false;
            }
            this.setCurrentPosition(position);
            return this.getCurrentPosition() === position;
        };    /**
         * Возвращает индекс элемента в коллекции по его индексу в проекции
         * @param {Number} index Индекс элемента в проекции
         * @return {Number} Индекс элемента в коллекции
         */
        /**
         * Возвращает индекс элемента в коллекции по его индексу в проекции
         * @param {Number} index Индекс элемента в проекции
         * @return {Number} Индекс элемента в коллекции
         */
        Collection.prototype.getSourceIndexByIndex = function (index) {
            var sourceIndex = this._getUtilityEnumerator().getSourceByInternal(index);
            sourceIndex = sourceIndex === undefined || sourceIndex === null ? -1 : sourceIndex;
            return this._getSourceIndex(sourceIndex);
        };    /**
         * Возвращает индекс элемента проекции в коллекции
         * @param {Types/_display/CollectionItem} item Элемент проекции
         * @return {Number} Индекс элемента проекции в коллекции
         */
        /**
         * Возвращает индекс элемента проекции в коллекции
         * @param {Types/_display/CollectionItem} item Элемент проекции
         * @return {Number} Индекс элемента проекции в коллекции
         */
        Collection.prototype.getSourceIndexByItem = function (item) {
            var index = this.getIndex(item);
            return index === -1 ? -1 : this.getSourceIndexByIndex(index);
        };    /**
         * Возвращает индекс элемента в проекции по индексу в коллекции
         * @param {Number} index Индекс элемента в коллекции
         * @return {Number} Индекс элемента в проекции
         */
        /**
         * Возвращает индекс элемента в проекции по индексу в коллекции
         * @param {Number} index Индекс элемента в коллекции
         * @return {Number} Индекс элемента в проекции
         */
        Collection.prototype.getIndexBySourceIndex = function (index) {
            index = this._getItemIndex(index);
            var itemIndex = this._getUtilityEnumerator().getInternalBySource(index);
            return itemIndex === undefined || itemIndex === null ? -1 : itemIndex;
        };    /**
         * Возвращает позицию элемента коллекции в проекции.
         * @param {*} item Элемент коллекции
         * @return {Number} Позиция элемента в проекции или -1, если не входит в проекцию
         */
        /**
         * Возвращает позицию элемента коллекции в проекции.
         * @param {*} item Элемент коллекции
         * @return {Number} Позиция элемента в проекции или -1, если не входит в проекцию
         */
        Collection.prototype.getIndexBySourceItem = function (item) {
            var collection = this.getCollection();
            var sourceIndex = -1;
            if (collection && collection['[Types/_collection/IList]']) {
                sourceIndex = collection.getIndex(item);
            } else {
                var index_1 = 0;
                collection.each(function (value) {
                    if (sourceIndex === -1 && value === item) {
                        sourceIndex = index_1;
                    }
                    index_1++;
                }, this, this._localize);
            }
            return sourceIndex === -1 ? -1 : this.getIndexBySourceIndex(sourceIndex);
        };    /**
         * Возвращает элемент проекции по индексу коллекции.
         * @param {Number} index Индекс элемента в коллекции
         * @return {Types/_display/CollectionItem} Элемент проекции или undefined, если index не входит в проекцию
         */
        /**
         * Возвращает элемент проекции по индексу коллекции.
         * @param {Number} index Индекс элемента в коллекции
         * @return {Types/_display/CollectionItem} Элемент проекции или undefined, если index не входит в проекцию
         */
        Collection.prototype.getItemBySourceIndex = function (index) {
            index = this.getIndexBySourceIndex(index);
            return index === -1 ? undefined : this.at(index);
        };    /**
         * Возвращает элемент проекции для элемента коллекции.
         * @param {*} item Элемент коллекции
         * @return {Types/_display/CollectionItem} Элемент проекции или undefined, если item не входит в проекцию
         */
        /**
         * Возвращает элемент проекции для элемента коллекции.
         * @param {*} item Элемент коллекции
         * @return {Types/_display/CollectionItem} Элемент проекции или undefined, если item не входит в проекцию
         */
        Collection.prototype.getItemBySourceItem = function (item) {
            var index = this.getIndexBySourceItem(item);
            return index === -1 ? undefined : this.at(index);
        };    // endregion Navigation
              // region Changing
              /**
         * Возвращает пользовательские методы фильтрации элементов проекции
         * @return {Array.<Function(*, Number, Types/_display/CollectionItem, Number): Boolean>}
         * @see filter
         * @see setFilter
         * @see addFilter
         * @see removeFilter
         */
        // endregion Navigation
        // region Changing
        /**
         * Возвращает пользовательские методы фильтрации элементов проекции
         * @return {Array.<Function(*, Number, Types/_display/CollectionItem, Number): Boolean>}
         * @see filter
         * @see setFilter
         * @see addFilter
         * @see removeFilter
         */
        Collection.prototype.getFilter = function () {
            return this._$filter.slice();
        };    /**
         * Устанавливает пользовательские методы фильтрации элементов проекции. Вызов метода без аргументов приведет к
         * удалению всех пользовательских фильтров.
         * @param {...Function(*, Number, Types/_display/CollectionItem, Number): Boolean} [filter] Методы фильтрации
         * элементов: аргументами приходят элемент коллекции, позиция в коллекции, элемент проекции, позиция в проекции.
         * Должен вернуть Boolean - признак, что элемент удовлетворяет условиям фильтрации.
         * @see filter
         * @see getFilter
         * @see addFilter
         * @see removeFilter
         * @example
         * Отберем персонажей женского пола:
         * <pre>
         *    require([
         *       'Types/collection'
         *       'Types/display'
         *    ], function(collection, display) {
         *       var list = new collection.List({
         *             items: [
         *                {name: 'Philip J. Fry', gender: 'M'},
         *                {name: 'Turanga Leela', gender: 'F'},
         *                {name: 'Professor Farnsworth', gender: 'M'},
         *                {name: 'Amy Wong', gender: 'F'},
         *                {name: 'Bender Bending Rodriguez', gender: 'R'}
         *             ]
         *          }),
         *          display = new display.Collection({
         *             collection: list
         *          });
         *
         *       display.setFilter(function(collectionItem, index, item) {
         *          return collectionItem.gender === 'F';
         *       });
         *
         *       display.each(function(item) {
         *          console.log(item.getContents().name);
         *       });
         *       //output: 'Turanga Leela', 'Amy Wong'
         *    });
         * </pre>
         */
        /**
         * Устанавливает пользовательские методы фильтрации элементов проекции. Вызов метода без аргументов приведет к
         * удалению всех пользовательских фильтров.
         * @param {...Function(*, Number, Types/_display/CollectionItem, Number): Boolean} [filter] Методы фильтрации
         * элементов: аргументами приходят элемент коллекции, позиция в коллекции, элемент проекции, позиция в проекции.
         * Должен вернуть Boolean - признак, что элемент удовлетворяет условиям фильтрации.
         * @see filter
         * @see getFilter
         * @see addFilter
         * @see removeFilter
         * @example
         * Отберем персонажей женского пола:
         * <pre>
         *    require([
         *       'Types/collection'
         *       'Types/display'
         *    ], function(collection, display) {
         *       var list = new collection.List({
         *             items: [
         *                {name: 'Philip J. Fry', gender: 'M'},
         *                {name: 'Turanga Leela', gender: 'F'},
         *                {name: 'Professor Farnsworth', gender: 'M'},
         *                {name: 'Amy Wong', gender: 'F'},
         *                {name: 'Bender Bending Rodriguez', gender: 'R'}
         *             ]
         *          }),
         *          display = new display.Collection({
         *             collection: list
         *          });
         *
         *       display.setFilter(function(collectionItem, index, item) {
         *          return collectionItem.gender === 'F';
         *       });
         *
         *       display.each(function(item) {
         *          console.log(item.getContents().name);
         *       });
         *       //output: 'Turanga Leela', 'Amy Wong'
         *    });
         * </pre>
         */
        Collection.prototype.setFilter = function () {
            var args = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args[_i] = arguments[_i];
            }
            var filters;
            if (args[0] instanceof Array) {
                filters = args[0];
            } else {
                filters = args;
            }
            if (this._$filter.length === filters.length) {
                var changed = false;
                for (var i = 0; i < filters.length; i++) {
                    if (this._$filter[i] !== filters[i]) {
                        changed = true;
                        break;
                    }
                }
                if (!changed) {
                    return;
                }
            }
            this._$filter = filters.filter(function (item) {
                return typeof item === 'function';
            });
            var session = this._startUpdateSession();
            this._reFilter();
            this._finishUpdateSession(session);
        };    /**
         * Добавляет пользовательский метод фильтрации элементов проекции, если такой еще не был задан.
         * @param {Function(*, Number, Types/_display/CollectionItem, Number): Boolean} filter Метод фильтрации элементов:
         * аргументами приходят элемент коллекции, позиция в коллекции, элемент проекции, позиция в проекции. Должен вернуть
         * Boolean - признак, что элемент удовлетворяет условиям фильтрации.
         * @param {Number} [at] Порядковый номер метода (если не передан, добавляется в конец)
         * @see filter
         * @see getFilter
         * @see setFilter
         * @see removeFilter
         * @example
         * Отберем персонажей женского пола:
         * <pre>
         *    require([
         *       'Types/collection',
         *       'Types/display'
         *    ], function(collection, display) {
         *       var list = new collection.List({
         *             items: [
         *                {name: 'Philip J. Fry', gender: 'M'},
         *                {name: 'Turanga Leela', gender: 'F'},
         *                {name: 'Professor Farnsworth', gender: 'M'},
         *                {name: 'Amy Wong', gender: 'F'},
         *                {name: 'Bender Bending Rodriguez', gender: 'R'}
         *             ]
         *          }),
         *          display = new display.Collection({
         *             collection: list
         *          });
         *
         *       display.addFilter(function(collectionItem, index, item) {
         *          return collectionItem.gender === 'F';
         *       });
         *
         *       display.each(function(item) {
         *          console.log(item.getContents().name);
         *       });
         *       //output: 'Turanga Leela', 'Amy Wong'
         *    });
         * </pre>
         */
        /**
         * Добавляет пользовательский метод фильтрации элементов проекции, если такой еще не был задан.
         * @param {Function(*, Number, Types/_display/CollectionItem, Number): Boolean} filter Метод фильтрации элементов:
         * аргументами приходят элемент коллекции, позиция в коллекции, элемент проекции, позиция в проекции. Должен вернуть
         * Boolean - признак, что элемент удовлетворяет условиям фильтрации.
         * @param {Number} [at] Порядковый номер метода (если не передан, добавляется в конец)
         * @see filter
         * @see getFilter
         * @see setFilter
         * @see removeFilter
         * @example
         * Отберем персонажей женского пола:
         * <pre>
         *    require([
         *       'Types/collection',
         *       'Types/display'
         *    ], function(collection, display) {
         *       var list = new collection.List({
         *             items: [
         *                {name: 'Philip J. Fry', gender: 'M'},
         *                {name: 'Turanga Leela', gender: 'F'},
         *                {name: 'Professor Farnsworth', gender: 'M'},
         *                {name: 'Amy Wong', gender: 'F'},
         *                {name: 'Bender Bending Rodriguez', gender: 'R'}
         *             ]
         *          }),
         *          display = new display.Collection({
         *             collection: list
         *          });
         *
         *       display.addFilter(function(collectionItem, index, item) {
         *          return collectionItem.gender === 'F';
         *       });
         *
         *       display.each(function(item) {
         *          console.log(item.getContents().name);
         *       });
         *       //output: 'Turanga Leela', 'Amy Wong'
         *    });
         * </pre>
         */
        Collection.prototype.addFilter = function (filter, at) {
            if (this._$filter.indexOf(filter) > -1) {
                return;
            }
            if (at === undefined) {
                this._$filter.push(filter);
            } else {
                this._$filter.splice(at, 0, filter);
            }
            var session = this._startUpdateSession();
            this._reFilter();
            this._finishUpdateSession(session);
        };    /**
         * Удаляет пользовательский метод фильтрации элементов проекции.
         * @param {Function(*, Number, Types/_display/CollectionItem, Number): Boolean} filter Метод фильтрации элементов:
         * аргументами приходят элемент коллекции, позиция в коллекции, элемент проекции, позиция в проекции. Должен вернуть
         * Boolean - признак, что элемент удовлетворяет условиям фильтрации.
         * @return {Boolean} Был ли установлен такой метод фильтрации
         * @see filter
         * @see getFilter
         * @see setFilter
         * @see addFilter
         * @example
         * Уберем фильтрацию персонажей по полу:
         * <pre>
         *    require([
         *       'Types/collection'
         *       'Types/display'
         *    ], function(collection, display) {
         *       var filter = function(collectionItem, index, item) {
         *             return collectionItem.gender === 'F';
         *          }),
         *          list = new collection.List({
         *             items: [
         *                {name: 'Philip J. Fry', gender: 'M'},
         *                {name: 'Turanga Leela', gender: 'F'},
         *                {name: 'Professor Farnsworth', gender: 'M'},
         *                {name: 'Amy Wong', gender: 'F'},
         *                {name: 'Bender Bending Rodriguez', gender: 'R'}
         *             ]
         *          }),
         *          display = new display.Collection({
         *             collection: list,
         *             filter: filter
         *          });
         *
         *       display.each(function(item) {
         *          console.log(item.getContents().name);
         *       });
         *       //output: 'Turanga Leela', 'Amy Wong'
         *
         *       display.removeFilter(filter);
         *
         *       display.each(function(item) {
         *          console.log(item.getContents().name);
         *       });
         *       //output: 'Philip J. Fry', 'Turanga Leela', 'Professor Farnsworth', 'Amy Wong', 'Bender Bending Rodriguez'
         *    });
         * </pre>
         */
        /**
         * Удаляет пользовательский метод фильтрации элементов проекции.
         * @param {Function(*, Number, Types/_display/CollectionItem, Number): Boolean} filter Метод фильтрации элементов:
         * аргументами приходят элемент коллекции, позиция в коллекции, элемент проекции, позиция в проекции. Должен вернуть
         * Boolean - признак, что элемент удовлетворяет условиям фильтрации.
         * @return {Boolean} Был ли установлен такой метод фильтрации
         * @see filter
         * @see getFilter
         * @see setFilter
         * @see addFilter
         * @example
         * Уберем фильтрацию персонажей по полу:
         * <pre>
         *    require([
         *       'Types/collection'
         *       'Types/display'
         *    ], function(collection, display) {
         *       var filter = function(collectionItem, index, item) {
         *             return collectionItem.gender === 'F';
         *          }),
         *          list = new collection.List({
         *             items: [
         *                {name: 'Philip J. Fry', gender: 'M'},
         *                {name: 'Turanga Leela', gender: 'F'},
         *                {name: 'Professor Farnsworth', gender: 'M'},
         *                {name: 'Amy Wong', gender: 'F'},
         *                {name: 'Bender Bending Rodriguez', gender: 'R'}
         *             ]
         *          }),
         *          display = new display.Collection({
         *             collection: list,
         *             filter: filter
         *          });
         *
         *       display.each(function(item) {
         *          console.log(item.getContents().name);
         *       });
         *       //output: 'Turanga Leela', 'Amy Wong'
         *
         *       display.removeFilter(filter);
         *
         *       display.each(function(item) {
         *          console.log(item.getContents().name);
         *       });
         *       //output: 'Philip J. Fry', 'Turanga Leela', 'Professor Farnsworth', 'Amy Wong', 'Bender Bending Rodriguez'
         *    });
         * </pre>
         */
        Collection.prototype.removeFilter = function (filter) {
            var at = this._$filter.indexOf(filter);
            if (at === -1) {
                return false;
            }
            this._$filter.splice(at, 1);
            var session = this._startUpdateSession();
            this._reFilter();
            this._finishUpdateSession(session);
            return true;
        };    /**
         * Возвращает метод группировки элементов проекции
         * @return {Function}
         * @see group
         * @see setGroup
         */
        /**
         * Возвращает метод группировки элементов проекции
         * @return {Function}
         * @see group
         * @see setGroup
         */
        Collection.prototype.getGroup = function () {
            return this._$group;
        };    /**
         * Устанавливает метод группировки элементов проекции. Для сброса ранее установленной группировки следует вызвать
         * этот метод без параметров.
         * @param {Function(*, Number, Types/_display/CollectionItem): String|null} group Метод группировки элементов:
         * аргументами приходят элемент коллекции, его позиция, элемент проекции. Должен вернуть String|Number - группу,
         * в которую входит элемент.
         * @see group
         * @see getGroup
         */
        /**
         * Устанавливает метод группировки элементов проекции. Для сброса ранее установленной группировки следует вызвать
         * этот метод без параметров.
         * @param {Function(*, Number, Types/_display/CollectionItem): String|null} group Метод группировки элементов:
         * аргументами приходят элемент коллекции, его позиция, элемент проекции. Должен вернуть String|Number - группу,
         * в которую входит элемент.
         * @see group
         * @see getGroup
         */
        Collection.prototype.setGroup = function (group) {
            if (this._$group === group) {
                return;
            }
            this._switchImportantPropertiesByGroup(false);
            if (!this._composer) {
                this._$group = group;
                this._switchImportantPropertiesByGroup(true);
                return;
            }
            var session = this._startUpdateSession();
            var groupStrategy = this._composer.getInstance(Group_1.default);
            this._$group = groupStrategy.handler = group;
            this._switchImportantPropertiesByGroup(true);
            this._getItemsStrategy().invalidate();
            this._reSort();
            this._reFilter();
            this._finishUpdateSession(session);
        };    /**
         * Возвращает элементы группы. Учитывается сортировка и фильтрация.
         * @param {String} groupId Идентификатор группы, элементы которой требуется получить
         * @return {Array.<Types/_display/CollectionItem>}
         * @example
         * Получим персонажей мужского пола:
         * <pre>
         *    require([
         *       'Types/collection',
         *       'Types/display'
         *    ], function(collection, display) {
         *       var list = new collection.List({
         *             items: [
         *                {name: 'Philip J. Fry', gender: 'M'},
         *                {name: 'Turanga Leela', gender: 'F'},
         *                {name: 'Professor Farnsworth', gender: 'M'},
         *                {name: 'Amy Wong', gender: 'F'},
         *                {name: 'Bender Bending Rodriguez', gender: 'R'}
         *             ]
         *          }),
         *          display = new display.Collection({
         *             collection: list
         *          });
         *
         *       display.setGroup(function(collectionItem, index, item) {
         *          return collectionItem.gender;
         *       });
         *
         *       var males = display.getGroupItems('M'),
         *          male,
         *          i;
         *       for (i = 0; i < males.length; i++) {
         *          male = males[i].getContents();
         *          console.log(male.name);
         *       }
         *       //output: 'Philip J. Fry', 'Professor Farnsworth'
         *    });
         * </pre>
         */
        /**
         * Возвращает элементы группы. Учитывается сортировка и фильтрация.
         * @param {String} groupId Идентификатор группы, элементы которой требуется получить
         * @return {Array.<Types/_display/CollectionItem>}
         * @example
         * Получим персонажей мужского пола:
         * <pre>
         *    require([
         *       'Types/collection',
         *       'Types/display'
         *    ], function(collection, display) {
         *       var list = new collection.List({
         *             items: [
         *                {name: 'Philip J. Fry', gender: 'M'},
         *                {name: 'Turanga Leela', gender: 'F'},
         *                {name: 'Professor Farnsworth', gender: 'M'},
         *                {name: 'Amy Wong', gender: 'F'},
         *                {name: 'Bender Bending Rodriguez', gender: 'R'}
         *             ]
         *          }),
         *          display = new display.Collection({
         *             collection: list
         *          });
         *
         *       display.setGroup(function(collectionItem, index, item) {
         *          return collectionItem.gender;
         *       });
         *
         *       var males = display.getGroupItems('M'),
         *          male,
         *          i;
         *       for (i = 0; i < males.length; i++) {
         *          male = males[i].getContents();
         *          console.log(male.name);
         *       }
         *       //output: 'Philip J. Fry', 'Professor Farnsworth'
         *    });
         * </pre>
         */
        Collection.prototype.getGroupItems = function (groupId) {
            var items = [];
            var currentGroupId;
            this.each(function (item) {
                if (item instanceof GroupItem_1.default) {
                    currentGroupId = item.getContents();
                    return;
                }
                if (currentGroupId === groupId) {
                    items.push(item);
                }
            });
            return items;
        };    /**
         * Возвращает идентификтор группы по индексу элемента в проекции
         * @param {Number} index Индекс элемента в проекции
         * @return {String|Number}
         * @example
         * Сгруппируем персонажей по полу:
         * <pre>
         *    require([
         *       'Types/collection'
         *       'Types/display'
         *    ], function(collection, display) {
         *       var list = new collection.List({
         *             items: [
         *                {name: 'Philip J. Fry', gender: 'M'},
         *                {name: 'Turanga Leela', gender: 'F'},
         *                {name: 'Professor Farnsworth', gender: 'M'},
         *                {name: 'Amy Wong', gender: 'F'},
         *                {name: 'Bender Bending Rodriguez', gender: 'R'}
         *             ]
         *          }),
         *          display = new display.Collection({
         *             collection: list
         *          });
         *
         *       display.setGroup(function(collectionItem, index, item) {
         *          return collectionItem.gender;
         *       });
         *
         *       var enumerator = display.getEnumerator(),
         *          index = 0,
         *          item,
         *          group,
         *          contents;
         *       while (enumerator.moveNext()) {
         *          item = enumerator.getCurrent();
         *          group = display.getGroupByIndex(index);
         *          contents = item.getContents();
         *          console.log(group + ': ' + contents.name);
         *          index++;
         *       }
         *       // output:
         *       // 'M: Philip J. Fry',
         *       // 'M: Professor Farnsworth',
         *       // 'F: Turanga Leela',
         *       // 'F: Amy Wong',
         *       // 'R: Bender Bending Rodriguez'
         *    });
         * </pre>
         */
        /**
         * Возвращает идентификтор группы по индексу элемента в проекции
         * @param {Number} index Индекс элемента в проекции
         * @return {String|Number}
         * @example
         * Сгруппируем персонажей по полу:
         * <pre>
         *    require([
         *       'Types/collection'
         *       'Types/display'
         *    ], function(collection, display) {
         *       var list = new collection.List({
         *             items: [
         *                {name: 'Philip J. Fry', gender: 'M'},
         *                {name: 'Turanga Leela', gender: 'F'},
         *                {name: 'Professor Farnsworth', gender: 'M'},
         *                {name: 'Amy Wong', gender: 'F'},
         *                {name: 'Bender Bending Rodriguez', gender: 'R'}
         *             ]
         *          }),
         *          display = new display.Collection({
         *             collection: list
         *          });
         *
         *       display.setGroup(function(collectionItem, index, item) {
         *          return collectionItem.gender;
         *       });
         *
         *       var enumerator = display.getEnumerator(),
         *          index = 0,
         *          item,
         *          group,
         *          contents;
         *       while (enumerator.moveNext()) {
         *          item = enumerator.getCurrent();
         *          group = display.getGroupByIndex(index);
         *          contents = item.getContents();
         *          console.log(group + ': ' + contents.name);
         *          index++;
         *       }
         *       // output:
         *       // 'M: Philip J. Fry',
         *       // 'M: Professor Farnsworth',
         *       // 'F: Turanga Leela',
         *       // 'F: Amy Wong',
         *       // 'R: Bender Bending Rodriguez'
         *    });
         * </pre>
         */
        Collection.prototype.getGroupByIndex = function (index) {
            var currentGroupId;
            var enumerator = this.getEnumerator();
            var item;
            var itemIndex = 0;
            while (enumerator.moveNext()) {
                item = enumerator.getCurrent();
                if (item instanceof GroupItem_1.default) {
                    currentGroupId = item.getContents();
                }
                if (itemIndex === index) {
                    break;
                }
                itemIndex++;
            }
            return currentGroupId;
        };    /**
         * Возвращает пользовательские методы сортировки элементов проекции
         * @return {Array.<Function>}
         * @see sort
         * @see setSort
         * @see addSort
         */
        /**
         * Возвращает пользовательские методы сортировки элементов проекции
         * @return {Array.<Function>}
         * @see sort
         * @see setSort
         * @see addSort
         */
        Collection.prototype.getSort = function () {
            return this._$sort.slice();
        };    /**
         * Устанавливает пользовательские методы сортировки элементов проекции. Вызов метода без аргументов приведет к
         * удалению всех пользовательских сортировок.
         * @param {...Function(UserSortItem, UserSortItem): Number} [sort] Методы сортировки элементов: аргументами
         * приходят 2 объекта типа {@link UserSortItem}, должен вернуть -1|0|1 (см. Array.prototype.sort())
         * @see sort
         * @see getSort
         * @see addSort
         * @see removeSort
         * @example
         * Отсортируем коллекцию по возрастанию значения поля title:
         * <pre>
         *    require([
         *       'Types/collection',
         *       'Types/display'
         *    ], function(collection, display) {
         *       var display = new display.Collection({
         *          collection: new collection.List({
         *             items: [
         *                {id: 1, title: 'foo'},
         *                {id: 2, title: 'bar'}
         *             ]
         *          })
         *       });
         *
         *       display.setSort(function(a, b) {
         *          return a.collectionItem.title > b.collectionItem.title;
         *       });
         *
         *       display.each(function(item) {
         *          console.log(item.getContents().title;
         *       });
         *       //output: 'bar', 'foo'
         *    });
         * </pre>
         * Отсортируем коллекцию сначала по title, а потом - по id:
         * <pre>
         *    require([
         *       'Types/collection',
         *       'Types/display'
         *    ], function(collection, display) {
         *       var display = new display.Collection({
         *          collection: new collection.List({
         *             items: [
         *                {id: 4, title: 'foo'},
         *                {id: 3, title: 'bar'},
         *                {id: 2, title: 'foo'}
         *             ]
         *          })
         *       });
         *
         *       display.setSort(function(a, b) {
         *          return a.collectionItem.title -> b.collectionItem.title;
         *       }, function(a, b) {
         *          return a.collectionItem.id - b.collectionItem.id;
         *       });
         *
         *       display.each(function(item) {
         *          console.log(item.getContents().id;
         *       });
         *       //output: 3, 2, 4
         *    });
         * </pre>
         */
        /**
         * Устанавливает пользовательские методы сортировки элементов проекции. Вызов метода без аргументов приведет к
         * удалению всех пользовательских сортировок.
         * @param {...Function(UserSortItem, UserSortItem): Number} [sort] Методы сортировки элементов: аргументами
         * приходят 2 объекта типа {@link UserSortItem}, должен вернуть -1|0|1 (см. Array.prototype.sort())
         * @see sort
         * @see getSort
         * @see addSort
         * @see removeSort
         * @example
         * Отсортируем коллекцию по возрастанию значения поля title:
         * <pre>
         *    require([
         *       'Types/collection',
         *       'Types/display'
         *    ], function(collection, display) {
         *       var display = new display.Collection({
         *          collection: new collection.List({
         *             items: [
         *                {id: 1, title: 'foo'},
         *                {id: 2, title: 'bar'}
         *             ]
         *          })
         *       });
         *
         *       display.setSort(function(a, b) {
         *          return a.collectionItem.title > b.collectionItem.title;
         *       });
         *
         *       display.each(function(item) {
         *          console.log(item.getContents().title;
         *       });
         *       //output: 'bar', 'foo'
         *    });
         * </pre>
         * Отсортируем коллекцию сначала по title, а потом - по id:
         * <pre>
         *    require([
         *       'Types/collection',
         *       'Types/display'
         *    ], function(collection, display) {
         *       var display = new display.Collection({
         *          collection: new collection.List({
         *             items: [
         *                {id: 4, title: 'foo'},
         *                {id: 3, title: 'bar'},
         *                {id: 2, title: 'foo'}
         *             ]
         *          })
         *       });
         *
         *       display.setSort(function(a, b) {
         *          return a.collectionItem.title -> b.collectionItem.title;
         *       }, function(a, b) {
         *          return a.collectionItem.id - b.collectionItem.id;
         *       });
         *
         *       display.each(function(item) {
         *          console.log(item.getContents().id;
         *       });
         *       //output: 3, 2, 4
         *    });
         * </pre>
         */
        Collection.prototype.setSort = function () {
            var args = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args[_i] = arguments[_i];
            }
            var session = this._startUpdateSession();
            var sorts = args[0] instanceof Array ? args[0] : args;
            if (this._$sort.length === sorts.length) {
                var changed = false;
                for (var i = 0; i < sorts.length; i++) {
                    if (this._$sort[i] !== sorts[i]) {
                        changed = true;
                        break;
                    }
                }
                if (!changed) {
                    return;
                }
            }
            this._switchImportantPropertiesByUserSort(false);
            this._$sort.length = 0;
            this._$sort.push.apply(this._$sort, normalizeHandlers(sorts));
            this._switchImportantPropertiesByUserSort(true);
            this._getItemsStrategy().invalidate();
            this._reSort();
            if (this._isFiltered()) {
                this._reFilter();
            }
            this._finishUpdateSession(session);
        };    /**
         * Добавляет пользовательский метод сортировки элементов проекции, если такой еще не был задан.
         * @param {Function(UserSortItem, UserSortItem): Number} [sort] Метод сортировки элементов:
         * аргументами приходят 2 объекта типа {@link UserSortItem}, должен вернуть -1|0|1 (см. Array.prototype.sort())
         * @param {Number} [at] Порядковый номер метода (если не передан, добавляется в конец)
         * @see sort
         * @see getSort
         * @see setSort
         * @see removeSort
         * @example
         * Отсортируем коллекцию по возрастанию значения поля id
         * <pre>
         *    require([
         *       'Types/collection',
         *       'Types/display'
         *    ], function(collection, display) {
         *       var display = new display.Collection({
         *          collection: new collection.List({
         *             items: [
         *                {id: 1, title: 'foo'},
         *                {id: 2, title: 'bar'}
         *             ]
         *          })
         *       });
         *
         *       display.addSort(function(a, b) {
         *          return a.collectionItem.id - b.collectionItem.id
         *       });
         *    });
         * </pre>
         */
        /**
         * Добавляет пользовательский метод сортировки элементов проекции, если такой еще не был задан.
         * @param {Function(UserSortItem, UserSortItem): Number} [sort] Метод сортировки элементов:
         * аргументами приходят 2 объекта типа {@link UserSortItem}, должен вернуть -1|0|1 (см. Array.prototype.sort())
         * @param {Number} [at] Порядковый номер метода (если не передан, добавляется в конец)
         * @see sort
         * @see getSort
         * @see setSort
         * @see removeSort
         * @example
         * Отсортируем коллекцию по возрастанию значения поля id
         * <pre>
         *    require([
         *       'Types/collection',
         *       'Types/display'
         *    ], function(collection, display) {
         *       var display = new display.Collection({
         *          collection: new collection.List({
         *             items: [
         *                {id: 1, title: 'foo'},
         *                {id: 2, title: 'bar'}
         *             ]
         *          })
         *       });
         *
         *       display.addSort(function(a, b) {
         *          return a.collectionItem.id - b.collectionItem.id
         *       });
         *    });
         * </pre>
         */
        Collection.prototype.addSort = function (sort, at) {
            if (this._$sort.indexOf(sort) > -1) {
                return;
            }
            var session = this._startUpdateSession();
            this._switchImportantPropertiesByUserSort(false);
            if (at === undefined) {
                this._$sort.push(sort);
            } else {
                this._$sort.splice(at, 0, sort);
            }
            this._switchImportantPropertiesByUserSort(true);
            this._getItemsStrategy().invalidate();
            this._reSort();
            if (this._isFiltered()) {
                this._reFilter();
            }
            this._finishUpdateSession(session);
        };    /**
         * Удаляет пользовательский метод сортировки элементов проекции.
         * @param {Function(UserSortItem, UserSortItem): Number} [sort] Метод сортировки элементов:
         * аргументами приходят 2 объекта типа {@link UserSortItem}, должен вернуть -1|0|1 (см. Array.prototype.sort())
         * @return {Boolean} Был ли установлен такой метод сортировки
         * @see sort
         * @see getSort
         * @see setSort
         * @see addSort
         * @example
         * Отсортируем коллекцию по возрастанию значения поля id
         * <pre>
         *    require([
         *       'Types/collection',
         *       'Types/display'
         *    ], function(collection, display) {
         *       var handler = function(a, b) {
         *          return a.item.id - b.item.id
         *       };
         *       var display = new display.Collection({
         *          collection: new collection.List({
         *             items: [
         *                {id: 1, title: 'foo'},
         *                {id: 2, title: 'bar'}
         *             ]
         *          }),
         *          sort: handler
         *       });
         *
         *       //...
         *       display.removeSort(handler);
         *    });
         * </pre>
         */
        /**
         * Удаляет пользовательский метод сортировки элементов проекции.
         * @param {Function(UserSortItem, UserSortItem): Number} [sort] Метод сортировки элементов:
         * аргументами приходят 2 объекта типа {@link UserSortItem}, должен вернуть -1|0|1 (см. Array.prototype.sort())
         * @return {Boolean} Был ли установлен такой метод сортировки
         * @see sort
         * @see getSort
         * @see setSort
         * @see addSort
         * @example
         * Отсортируем коллекцию по возрастанию значения поля id
         * <pre>
         *    require([
         *       'Types/collection',
         *       'Types/display'
         *    ], function(collection, display) {
         *       var handler = function(a, b) {
         *          return a.item.id - b.item.id
         *       };
         *       var display = new display.Collection({
         *          collection: new collection.List({
         *             items: [
         *                {id: 1, title: 'foo'},
         *                {id: 2, title: 'bar'}
         *             ]
         *          }),
         *          sort: handler
         *       });
         *
         *       //...
         *       display.removeSort(handler);
         *    });
         * </pre>
         */
        Collection.prototype.removeSort = function (sort) {
            var at = this._$sort.indexOf(sort);
            if (at === -1) {
                return false;
            }
            var session = this._startUpdateSession();
            this._switchImportantPropertiesByUserSort(false);
            this._$sort.splice(at, 1);
            this._switchImportantPropertiesByUserSort(true);
            this._getItemsStrategy().invalidate();
            this._reSort();
            if (this._isFiltered()) {
                this._reFilter();
            }
            this._finishUpdateSession(session);
            return true;
        };    /**
         * Возвращает Название свойства элемента коллекции, содержащего его уникальный идентификатор.
         * @return {String}
         */
        /**
         * Возвращает Название свойства элемента коллекции, содержащего его уникальный идентификатор.
         * @return {String}
         */
        Collection.prototype.getIdProperty = function () {
            return this._$idProperty;
        };    /**
         * Возвращает признак обеспечивания уникальности элементов
         * @return {Boolean}
         */
        /**
         * Возвращает признак обеспечивания уникальности элементов
         * @return {Boolean}
         */
        Collection.prototype.isUnique = function () {
            return this._$unique;
        };    /**
         * Возвращает признак обеспечивания уникальности элементов
         * @param {Boolean} unique Обеспечивать уникальность элементов
         */
        /**
         * Возвращает признак обеспечивания уникальности элементов
         * @param {Boolean} unique Обеспечивать уникальность элементов
         */
        Collection.prototype.setUnique = function (unique) {
            if (this._$unique === unique) {
                return;
            }
            var session = this._startUpdateSession();
            this._$unique = unique;
            this._composer.getInstance(Direct_1.default).unique = unique;
            this._getItemsStrategy().invalidate();
            this._reSort();
            this._finishUpdateSession(session);
        };    /**
         * Уведомляет подписчиков об изменении элемента коллекции
         * @param {Types/_display/CollectionItem} item Элемент проекции
         * @param {Object} [properties] Изменившиеся свойства
         */
        /**
         * Уведомляет подписчиков об изменении элемента коллекции
         * @param {Types/_display/CollectionItem} item Элемент проекции
         * @param {Object} [properties] Изменившиеся свойства
         */
        Collection.prototype.notifyItemChange = function (item, properties) {
            var isFiltered = this._isFiltered();
            var isGrouped = this._isGrouped();
            if (isFiltered || isGrouped) {
                var session = this._startUpdateSession();
                if (isGrouped) {
                    this._reGroup();
                    this._reSort();
                }
                if (isFiltered) {
                    this._reFilter();
                }
                this._finishUpdateSession(session);
            }
            if (!this.isEventRaising()) {
                return;
            }
            var index = this.getIndex(item);
            var items = [item];
            items.properties = properties;
            this._notifyBeforeCollectionChange();
            this._notifyCollectionChange(IBind_1.default.ACTION_CHANGE, items, index, items, index);
            this._notifyAfterCollectionChange();
        };    // endregion
              // region Multiselectable
              /**
         * Возвращает массив выбранных элементов (без учета сортировки, фильтрации и группировки).
         * @return {Array.<Types/_display/CollectionItem>}
         */
        // endregion
        // region Multiselectable
        /**
         * Возвращает массив выбранных элементов (без учета сортировки, фильтрации и группировки).
         * @return {Array.<Types/_display/CollectionItem>}
         */
        Collection.prototype.getSelectedItems = function () {
            var items = this._getItems();
            var result = [];
            for (var i = items.length - 1; i >= 0; i--) {
                if (items[i].isSelected()) {
                    result.push(items[i]);
                }
            }
            return result;
        };    /**
         * Устанавливает признак, что элемент выбран, переданным элементам.
         * @remark Метод зависит от фильтра проекции.
         * @param {Array} items Массив элементов коллекции
         * @param {Boolean} selected Элемент выбран.
         * @example
         * <pre>
         *     var list = new List({...}),
         *        display = new CollectionDisplay({
         *           collection: list
         *        });
         *    display.setSelectedItems([list.at(0), list.at(1)], true) //установит признак двум элементам;
         * </pre>
         */
        /**
         * Устанавливает признак, что элемент выбран, переданным элементам.
         * @remark Метод зависит от фильтра проекции.
         * @param {Array} items Массив элементов коллекции
         * @param {Boolean} selected Элемент выбран.
         * @example
         * <pre>
         *     var list = new List({...}),
         *        display = new CollectionDisplay({
         *           collection: list
         *        });
         *    display.setSelectedItems([list.at(0), list.at(1)], true) //установит признак двум элементам;
         * </pre>
         */
        Collection.prototype.setSelectedItems = function (items, selected) {
            var sourceItems = [];
            for (var i = 0, count = items.length; i < count; i++) {
                sourceItems.push(this.getItemBySourceItem(items[i]));
            }
            this._setSelectedItems(sourceItems, selected);
        };    /**
         * Устанавливает признак, что элемент выбран, всем элементам проекции (без учета сортировки, фильтрации и
         * группировки).
         * @param {Boolean} selected Элемент выбран.
         * @return {Array}
         */
        /**
         * Устанавливает признак, что элемент выбран, всем элементам проекции (без учета сортировки, фильтрации и
         * группировки).
         * @param {Boolean} selected Элемент выбран.
         * @return {Array}
         */
        Collection.prototype.setSelectedItemsAll = function (selected) {
            this._setSelectedItems(this._getItems(), selected);
        };    /**
         * Инвертирует признак, что элемент выбран, у всех элементов проекции (без учета сортировки, фильтрации и
         * группировки).
         */
        /**
         * Инвертирует признак, что элемент выбран, у всех элементов проекции (без учета сортировки, фильтрации и
         * группировки).
         */
        Collection.prototype.invertSelectedItemsAll = function () {
            var items = this._getItems();
            for (var i = items.length - 1; i >= 0; i--) {
                items[i].setSelected(!items[i].isSelected(), true);
            }
            this._notifyBeforeCollectionChange();
            this._notifyCollectionChange(IBind_1.default.ACTION_RESET, items, 0, items, 0);
            this._notifyAfterCollectionChange();
        };    // endregion
              // region SerializableMixin
        // endregion
        // region SerializableMixin
        Collection.prototype._getSerializableState = function (state) {
            state = entity_1.SerializableMixin.prototype._getSerializableState.call(this, state);
            state._composer = this._composer;
            return state;
        };
        Collection.prototype._setSerializableState = function (state) {
            var fromSerializableMixin = entity_1.SerializableMixin.prototype._setSerializableState(state);
            return function () {
                fromSerializableMixin.call(this);
                this._composer = state._composer;
                if (this._composer) {
                    // Restore link to _$sort in UserItemsStrategy instance
                    var userStrategy = this._composer.getInstance(User_1.default);
                    if (userStrategy) {
                        userStrategy.handlers = this._$sort;
                    }    // Restore link to _$group in GroupItemsStrategy instance
                    // Restore link to _$group in GroupItemsStrategy instance
                    var groupStrategy = this._composer.getInstance(Group_1.default);
                    if (groupStrategy) {
                        groupStrategy.handler = this._$group;
                    }    // Restore items contents before the _$collection will be affected
                    // Restore items contents before the _$collection will be affected
                    if (this._composer) {
                        var restoreItemsContents = function (items, owner) {
                            items.forEach(function (item) {
                                if (item._contentsIndex !== undefined) {
                                    item._$owner = owner;    // Link to _$owner is not restored yet, force it
                                    // Link to _$owner is not restored yet, force it
                                    item.getContents();    // Force resolving item contents
                                }
                            });
                        };
                        // Force resolving item contents
                        try {
                            var itemsHolder = this._composer.getResult();
                            do {
                                if (itemsHolder._items) {
                                    restoreItemsContents(itemsHolder._items, this);
                                }
                                itemsHolder = itemsHolder.source;
                            } while (itemsHolder);
                        } catch (err) {
                            if (typeof LOGGER !== undefined) {
                                LOGGER.error(err);    // eslint-disable-line no-console
                            }
                        }
                    }
                }
            };
        };    /**
         * Рассчитывает идентификатор элемента коллекции.
         * @param {Types/_display/CollectionItem} item Элемент коллекции
         * @return {String}
         */
        // eslint-disable-line no-console
        /**
         * Рассчитывает идентификатор элемента коллекции.
         * @param {Types/_display/CollectionItem} item Элемент коллекции
         * @return {String}
         */
        Collection.prototype._exctractItemId = function (item) {
            var contents = item.getContents();
            var uid;
            if (contents['[Types/_entity/Model]']) {
                uid = contents.getId();
            } else if (this._$idProperty) {
                uid = util_1.object.getPropertyValue(contents, this._$idProperty);
            } else {
                throw new Error('Option "idProperty" must be defined to extract item unique id.');
            }
            return String(uid);
        };    /**
         * Рассчитывает уникальный идентификатор элемента коллекции.
         * @param {Types/_display/CollectionItem} item Элемент коллекции
         * @param {String} baseId Базовое значение
         * @return {String}
         */
        /**
         * Рассчитывает уникальный идентификатор элемента коллекции.
         * @param {Types/_display/CollectionItem} item Элемент коллекции
         * @param {String} baseId Базовое значение
         * @return {String}
         */
        Collection.prototype._searchItemUid = function (item, baseId) {
            var uid = baseId;
            var itemsUid = this._itemsUid;
            var count = 0;
            while (itemsUid.has(uid)) {
                uid = baseId.concat('-', String(++count));
            }
            itemsUid.add(uid);
            return uid;
        };    // endregion
              // endregion
              // region EventRaisingMixin
        // endregion
        // endregion
        // region EventRaisingMixin
        Collection.prototype._analizeUpdateSession = function (session) {
            if (session) {
                this._notifyBeforeCollectionChange();
            }
            collection_1.EventRaisingMixin._analizeUpdateSession.call(this, session);
            if (session) {
                this._notifyAfterCollectionChange();
            }
        };
        Collection.prototype._notifyCollectionChange = function (action, newItems, newItemsIndex, oldItems, oldItemsIndex, session) {
            var _this = this;
            if (!this._isNeedNotifyCollectionChange()) {
                return;
            }
            if (!session || action === IBind_1.default.ACTION_RESET || !this._isGrouped()) {
                this._notifyLater('onCollectionChange', action, newItems, newItemsIndex, oldItems, oldItemsIndex);
                return;
            }    // Split by groups and notify
            // Split by groups and notify
            var notify = function (start, finish) {
                if (start < finish) {
                    _this._notifyLater('onCollectionChange', action, newItems.slice(start, finish), newItems.length ? newItemsIndex + start : 0, oldItems.slice(start, finish), oldItems.length ? oldItemsIndex + start : 0);
                }
            };
            var isRemove = action === IBind_1.default.ACTION_REMOVE;
            var max = isRemove ? oldItems.length : newItems.length;
            var notifyIndex = 0;
            var item;
            for (var i = 0; i < max; i++) {
                item = isRemove ? oldItems[i] : newItems[i];
                if (item instanceof GroupItem_1.default) {
                    notify(notifyIndex, i);
                    notifyIndex = i;
                }
                if (i === max - 1) {
                    notify(notifyIndex, i + 1);
                }
            }
        };    /**
         * Устанавливает признак, переданным, элементам проекции.
         * @param {Array} selecItems массив элементов проекции
         * @param {Boolean} selected Элемент выбран.
         */
        /**
         * Устанавливает признак, переданным, элементам проекции.
         * @param {Array} selecItems массив элементов проекции
         * @param {Boolean} selected Элемент выбран.
         */
        Collection.prototype._setSelectedItems = function (selecItems, selected) {
            var items = [];
            selected = !!selected;
            for (var i = selecItems.length - 1; i >= 0; i--) {
                if (selecItems[i].isSelected() !== selected) {
                    selecItems[i].setSelected(selected, true);
                    items.push(selecItems[i]);
                }
            }
            if (items.length > 0) {
                var index = this.getIndex(items[0]);
                this._notifyBeforeCollectionChange();
                this._notifyCollectionChange(IBind_1.default.ACTION_REPLACE, items, index, items, index);
                this._notifyAfterCollectionChange();
            }
        };    // endregion
              // region Protected methods
              // region Access
              /**
         * Добавляет свойство в importantItemProperties, если его еще там нет
         * @param {String} name Название свойства
         * @protected
         */
        // endregion
        // region Protected methods
        // region Access
        /**
         * Добавляет свойство в importantItemProperties, если его еще там нет
         * @param {String} name Название свойства
         * @protected
         */
        Collection.prototype._setImportantProperty = function (name) {
            var index = this._$importantItemProperties.indexOf(name);
            if (index === -1) {
                this._$importantItemProperties.push(name);
            }
        };    /**
         * Удаляет свойство из importantItemProperties, если оно там есть
         * @param {String} name Название свойства
         * @protected
         */
        /**
         * Удаляет свойство из importantItemProperties, если оно там есть
         * @param {String} name Название свойства
         * @protected
         */
        Collection.prototype._unsetImportantProperty = function (name) {
            var index = this._$importantItemProperties.indexOf(name);
            if (index !== -1) {
                this._$importantItemProperties.splice(index, 1);
            }
        };    /**
         * Модифицирует список важных свойств по наличию функторов среди пользовательских сортировок
         * @param {Boolean} add Добавить или удалить свойства
         * @protected
         */
        /**
         * Модифицирует список важных свойств по наличию функторов среди пользовательских сортировок
         * @param {Boolean} add Добавить или удалить свойства
         * @protected
         */
        Collection.prototype._switchImportantPropertiesByUserSort = function (add) {
            for (var i = 0; i < this._$sort.length; i++) {
                Collection._functorToImportantProperties(this._$sort[i], this, add);
            }
        };    /**
         * Модифицирует список важных свойств по функтору группировки
         * @param {Boolean} add Добавить или удалить свойства
         * @protected
         */
        /**
         * Модифицирует список важных свойств по функтору группировки
         * @param {Boolean} add Добавить или удалить свойства
         * @protected
         */
        Collection.prototype._switchImportantPropertiesByGroup = function (add) {
            Collection._functorToImportantProperties(this._$group, this, add);
        };    /**
         * Настраивает контекст обработчиков
         * @protected
         */
        /**
         * Настраивает контекст обработчиков
         * @protected
         */
        Collection.prototype._bindHandlers = function () {
            this._onCollectionChange = onCollectionChange.bind(this);
            this._onCollectionItemChange = onCollectionItemChange.bind(this);
            this._oEventRaisingChange = onEventRaisingChange.bind(this);
        };
        Collection.prototype._unbindHandlers = function () {
            this._onCollectionChange = null;
            this._onCollectionItemChange = null;
            this._oEventRaisingChange = null;
        };    // endregion
              // region Navigation
              /**
         * Возвращает элементы проекции (без учета сортировки, фильтрации и группировки)
         * @return {Array.<Types/_display/CollectionItem>}
         * @protected
         */
        // endregion
        // region Navigation
        /**
         * Возвращает элементы проекции (без учета сортировки, фильтрации и группировки)
         * @return {Array.<Types/_display/CollectionItem>}
         * @protected
         */
        Collection.prototype._getItems = function () {
            return this._getItemsStrategy().items;
        };    /**
         * Возвращает функцию, создающую элементы проекции
         * @return {Function(Object):Types/_display/CollectionItem}
         * @protected
         */
        /**
         * Возвращает функцию, создающую элементы проекции
         * @return {Function(Object):Types/_display/CollectionItem}
         * @protected
         */
        Collection.prototype._getItemsFactory = function () {
            return function CollectionItemsFactory(options) {
                options.owner = this;
                return di_1.resolve(this._itemModule, options);
            };
        };    /**
         * Возвращает cтратегию получения элементов проекции
         * @return {Types/_display/ItemsStrategy/Abstract}
         * @protected
         */
        /**
         * Возвращает cтратегию получения элементов проекции
         * @return {Types/_display/ItemsStrategy/Abstract}
         * @protected
         */
        Collection.prototype._getItemsStrategy = function () {
            if (!this._composer) {
                this._composer = this._createComposer();
            }
            return this._composer.getResult();
        };    /**
         * Сбрасывает построенную cтратегию получения элементов проекции
         * @protected
         */
        /**
         * Сбрасывает построенную cтратегию получения элементов проекции
         * @protected
         */
        Collection.prototype._resetItemsStrategy = function () {
            this._composer = null;
        };    /**
         * Создает компоновщик стратегий
         * @return {Types/_display/ItemsStrategy/Composer}
         * @protected
         */
        /**
         * Создает компоновщик стратегий
         * @return {Types/_display/ItemsStrategy/Composer}
         * @protected
         */
        Collection.prototype._createComposer = function () {
            var composer = new Composer_1.default();
            composer.append(Direct_1.default, {
                display: this,
                localize: this._localize,
                idProperty: this._$idProperty,
                unique: this._$unique
            }).append(User_1.default, { handlers: this._$sort }).append(Group_1.default, { handler: this._$group });
            return composer;
        };    /**
         * Возвращает энумератор
         * @param {Boolean} unlink Отвязать от состояния проекции
         * @return {Types/_display/CollectionEnumerator}
         * @protected
         */
        /**
         * Возвращает энумератор
         * @param {Boolean} unlink Отвязать от состояния проекции
         * @return {Types/_display/CollectionEnumerator}
         * @protected
         */
        Collection.prototype._getEnumerator = function (unlink) {
            return this._buildEnumerator(unlink ? this._getItems().slice() : this._getItems.bind(this), unlink ? this._filterMap.slice() : this._filterMap, unlink ? this._sortMap.slice() : this._sortMap);
        };    /**
         * Конструирует энумератор по входным данным
         * @param {Array.<Types/_display/CollectionItem>} items Элементы проекции
         * @param {Array.<Boolean>} filterMap Фильтр: индекс в коллекции -> прошел фильтр
         * @param {Array.<Number>} sortMap Сортировка: индекс в проекции -> индекс в коллекции
         * @return {Types/_display/CollectionEnumerator}
         * @protected
         */
        /**
         * Конструирует энумератор по входным данным
         * @param {Array.<Types/_display/CollectionItem>} items Элементы проекции
         * @param {Array.<Boolean>} filterMap Фильтр: индекс в коллекции -> прошел фильтр
         * @param {Array.<Number>} sortMap Сортировка: индекс в проекции -> индекс в коллекции
         * @return {Types/_display/CollectionEnumerator}
         * @protected
         */
        Collection.prototype._buildEnumerator = function (items, filterMap, sortMap) {
            return new CollectionEnumerator_1.default({
                items: items,
                filterMap: filterMap,
                sortMap: sortMap
            });
        };    /**
         * Возвращает служебный энумератор для организации курсора
         * @return {Types/_display/CollectionEnumerator}
         * @protected
         */
        /**
         * Возвращает служебный энумератор для организации курсора
         * @return {Types/_display/CollectionEnumerator}
         * @protected
         */
        Collection.prototype._getCursorEnumerator = function () {
            return this._cursorEnumerator || (this._cursorEnumerator = this._getEnumerator());
        };    /**
         * Возвращает служебный энумератор для для поиска по свойствам и поиска следующего или предыдущего элемента
         * относительно заданного
         * @return {Types/_display/CollectionEnumerator}
         * @protected
         */
        /**
         * Возвращает служебный энумератор для для поиска по свойствам и поиска следующего или предыдущего элемента
         * относительно заданного
         * @return {Types/_display/CollectionEnumerator}
         * @protected
         */
        Collection.prototype._getUtilityEnumerator = function () {
            return this._utilityEnumerator || (this._utilityEnumerator = this._getEnumerator());
        };    /**
         * Возвращает соседний элемент проекции
         * @param {Types/_collection/IEnumerator} enumerator Энумератор элементов
         * @param {Types/_display/CollectionItem} item Элемент проекции относительно которого искать
         * @param {Boolean} isNext Следующий или предыдущий элемент
         * @param {Boolean} [skipGroups=false] Пропускать группы
         * @return {Types/_display/CollectionItem}
         * @protected
         */
        /**
         * Возвращает соседний элемент проекции
         * @param {Types/_collection/IEnumerator} enumerator Энумератор элементов
         * @param {Types/_display/CollectionItem} item Элемент проекции относительно которого искать
         * @param {Boolean} isNext Следующий или предыдущий элемент
         * @param {Boolean} [skipGroups=false] Пропускать группы
         * @return {Types/_display/CollectionItem}
         * @protected
         */
        Collection.prototype._getNearbyItem = function (enumerator, item, isNext, skipGroups) {
            var method = isNext ? 'moveNext' : 'movePrevious';
            var nearbyItem;
            enumerator.setCurrent(item);
            while (enumerator[method]()) {
                nearbyItem = enumerator.getCurrent();
                if (skipGroups && nearbyItem instanceof GroupItem_1.default) {
                    nearbyItem = undefined;
                    continue;
                }
                break;
            }
            return nearbyItem;
        };    /**
         * Возвращает индекс элемента проекции по индексу в коллекции
         * @param {Number} index Индекс в коллекции
         * @return {Number}
         * @protected
         */
        /**
         * Возвращает индекс элемента проекции по индексу в коллекции
         * @param {Number} index Индекс в коллекции
         * @return {Number}
         * @protected
         */
        Collection.prototype._getItemIndex = function (index) {
            return this._getItemsStrategy().getDisplayIndex(index);
        };    /**
         * Возвращает индекс в коллекци по индексу в проекции
         * @param {Number} index Индекс в проекции
         * @return {Number}
         * @protected
         */
        /**
         * Возвращает индекс в коллекци по индексу в проекции
         * @param {Number} index Индекс в проекции
         * @return {Number}
         * @protected
         */
        Collection.prototype._getSourceIndex = function (index) {
            return this._getItemsStrategy().getCollectionIndex(index);
        };    // endregion
              // region Calculation
              /**
         * Перерасчитывает все данные заново
         * @param {Boolean} [reset=false] Сбросить все созданные элементы
         * @protected
         */
        // endregion
        // region Calculation
        /**
         * Перерасчитывает все данные заново
         * @param {Boolean} [reset=false] Сбросить все созданные элементы
         * @protected
         */
        Collection.prototype._reBuild = function (reset) {
            var itemsStrategy = this._getItemsStrategy();
            this._reIndex();
            if (reset) {
                itemsStrategy.reset();
            }
            this._reGroup();
            this._reSort();
            this._resetFilter(itemsStrategy.count);
            if (this._isFiltered()) {
                this._reFilter();
            }
        };    /**
         * Производит фильтрацию и сортировку и анализ изменений для набора элементов проекции
         * @param {Number} [start=0] Начальный индекс (в коллекции)
         * @param {Number} [count] Кол-во элементов (по умолчанию - все)
         * @protected
         */
        /**
         * Производит фильтрацию и сортировку и анализ изменений для набора элементов проекции
         * @param {Number} [start=0] Начальный индекс (в коллекции)
         * @param {Number} [count] Кол-во элементов (по умолчанию - все)
         * @protected
         */
        Collection.prototype._reAnalize = function (start, count) {
            start = start || 0;
            var itemsStrategy = this._getItemsStrategy();
            var session = this._startUpdateSession();
            var indexBefore = itemsStrategy.getDisplayIndex(start);
            itemsStrategy.invalidate();
            var indexAfter = itemsStrategy.getDisplayIndex(start);
            if (count === undefined) {
                count = itemsStrategy.count - indexAfter;
            }
            this._reGroup(start, count);
            this._reSort();    // If element is moved or user filter uses element indices then re-filter whole collection
            // If element is moved or user filter uses element indices then re-filter whole collection
            if (indexBefore !== indexAfter || this._isFilteredByIndex()) {
                this._reFilter();
            } else {
                this._reFilter(indexAfter, count);
            }
            this._finishUpdateSession(session);
        };    /**
         * Вызывает переиндексацию
         * @protected
         */
        /**
         * Вызывает переиндексацию
         * @protected
         */
        Collection.prototype._reIndex = function () {
            this._getCursorEnumerator().reIndex();
            this._getUtilityEnumerator().reIndex();
        };    // endregion
              // region Changing
              /**
         * Сбрасывает фильтр: помечает все элементы как прошедшие фильтрацию
         * @protected
         */
        // endregion
        // region Changing
        /**
         * Сбрасывает фильтр: помечает все элементы как прошедшие фильтрацию
         * @protected
         */
        Collection.prototype._resetFilter = function (count) {
            this._filterMap.length = 0;
            for (var index = 0; index < count; index++) {
                this._filterMap.push(true);
            }
            this._reIndex();
        };    /**
         * Производит фильтрацию для набора элементов проекции
         * @param {Number} [start=0] Начальный индекс
         * @param {Number} [count] Кол-во элементов (по умолчанию - все)
         * @protected
         */
        /**
         * Производит фильтрацию для набора элементов проекции
         * @param {Number} [start=0] Начальный индекс
         * @param {Number} [count] Кол-во элементов (по умолчанию - все)
         * @protected
         */
        Collection.prototype._reFilter = function (start, count) {
            start = start || 0;
            count = count || this._getItemsStrategy().count - start;
            var filters = this._$filter;
            var filtersLength = filters.length;
            var items = this._getItems();
            var sortMap = this._sortMap;
            var sortMapLength = sortMap.length;
            var filterMap = this._filterMap;
            var processedIndices = new shim_1.Set();
            var finish = start + count;
            var changed = false;
            var item;
            var position;
            var index;
            var prevGroup;
            var prevGroupIndex = -1;
            var prevGroupPosition = -1;
            var prevGroupHasMembers = false;
            var match;
            var isMatch = function (item, index, position, hasMembers) {
                var result = true;
                var filter;
                for (var filterIndex = 0; filterIndex < filtersLength; filterIndex++) {
                    filter = filters[filterIndex];
                    result = filter(item.getContents(), index, item, position, hasMembers);
                    if (!result) {
                        break;
                    }
                }
                return result;
            };
            var applyMatch = function (match, index) {
                var oldMatch = filterMap[index];
                if (match === oldMatch) {
                    return false;
                }
                if (match) {
                    filterMap[index] = match;
                    return true;
                } else if (oldMatch !== undefined) {
                    filterMap[index] = match;
                    return true;
                }
                return false;
            };    // Lookup every item in _sortMap order
            // Lookup every item in _sortMap order
            for (position = 0; position < sortMapLength; position++) {
                index = sortMap[position];    // Check item index in range
                // Check item index in range
                if (index === undefined || index < start || index >= finish) {
                    continue;
                }
                processedIndices.add(index);
                item = items[index];
                match = true;
                if (item instanceof GroupItem_1.default) {
                    // A new group begin, check match for previous
                    if (prevGroup) {
                        match = isMatch(prevGroup, prevGroupIndex, prevGroupPosition, prevGroupHasMembers);
                        changed = applyMatch(match, prevGroupIndex) || changed;
                    }    // Remember current group as previous
                    // Remember current group as previous
                    prevGroup = item;
                    prevGroupIndex = index;
                    prevGroupPosition = position;
                    prevGroupHasMembers = false;
                } else {
                    // Check item match
                    match = isMatch(item, index, position);
                    changed = applyMatch(match, index) || changed;
                    if (match) {
                        prevGroupHasMembers = true;
                    }
                }
            }
            for (index = start; index < finish; index++) {
                if (!processedIndices.has(index)) {
                    filterMap[index] = undefined;
                }
            }    // Check last group match
            // Check last group match
            if (prevGroup) {
                match = isMatch(prevGroup, prevGroupIndex, prevGroupPosition, prevGroupHasMembers);
                changed = applyMatch(match, prevGroupIndex) || changed;
            }
            if (changed) {
                this._reIndex();
            }
        };    /**
         * Производит сортировку элементов
         * @protected
         */
        /**
         * Производит сортировку элементов
         * @protected
         */
        Collection.prototype._reSort = function () {
            var _a;
            this._sortMap.length = 0;
            var items = this._buildSortMap();
            (_a = this._sortMap).push.apply(_a, items);
            this._reIndex();
        };    /**
         * Производит построение sortMap
         * @return {Array.<Number>}
         * @protected
         */
        /**
         * Производит построение sortMap
         * @return {Array.<Number>}
         * @protected
         */
        Collection.prototype._buildSortMap = function () {
            return this._getItems().map(function (item, index) {
                return index;
            });
        };    /**
         * Производит группировку для набора элементов проекции
         * @param {Number} [start=0] Начальный индекс (в коллекции)
         * @param {Number} [count] Кол-во элементов (по умолчанию - все)
         * @protected
         */
        /**
         * Производит группировку для набора элементов проекции
         * @param {Number} [start=0] Начальный индекс (в коллекции)
         * @param {Number} [count] Кол-во элементов (по умолчанию - все)
         * @protected
         */
        Collection.prototype._reGroup = function (start, count) {
            if (!this._composer) {
                return;
            }
            var groupStrategy = this._composer.getInstance(Group_1.default);
            groupStrategy.invalidate();
        };    /**
         * Проверяет, что используется фильтрация
         * @return {Boolean}
         * @protected
         */
        /**
         * Проверяет, что используется фильтрация
         * @return {Boolean}
         * @protected
         */
        Collection.prototype._isFiltered = function () {
            return this._$filter.length > 0;
        };    /**
         * Проверяет, что хотя бы в один из методов фильтрации использует аргумент index
         * @return {Boolean}
         * @protected
         */
        /**
         * Проверяет, что хотя бы в один из методов фильтрации использует аргумент index
         * @return {Boolean}
         * @protected
         */
        Collection.prototype._isFilteredByIndex = function () {
            var _this = this;
            return this._$filter.some(function (filter) {
                return _this._isFilterUseIndex(filter);
            });
        };    /**
         * Проверяет, что метод фильтрации использует аргумент index
         * @param {Function} filter
         * @return {Boolean}
         * @protected
         */
        /**
         * Проверяет, что метод фильтрации использует аргумент index
         * @param {Function} filter
         * @return {Boolean}
         * @protected
         */
        Collection.prototype._isFilterUseIndex = function (filter) {
            return filter.length > 3;
        };    /**
         * Проверяет, что используется группировка
         * @return {Boolean}
         * @protected
         */
        /**
         * Проверяет, что используется группировка
         * @return {Boolean}
         * @protected
         */
        Collection.prototype._isGrouped = function () {
            return !!this._$group;
        };    /**
         * Дробавляет набор элементов коллекции в проекцию
         * @param {Number} start Начальный индекс (в коллекции)
         * @param {Array} items Элементы
         * @return {Number} Начальный индекс (в проекциии)
         * @protected
         */
        /**
         * Дробавляет набор элементов коллекции в проекцию
         * @param {Number} start Начальный индекс (в коллекции)
         * @param {Array} items Элементы
         * @return {Number} Начальный индекс (в проекциии)
         * @protected
         */
        Collection.prototype._addItems = function (start, items) {
            var _a, _b;
            var isFiltered = this._isFiltered();
            var strategy = this._getItemsStrategy();
            var innerIndex;
            var filterMap = [];
            var sortMap = [];
            var groupMap = [];
            strategy.splice(start, 0, items);
            innerIndex = strategy.getDisplayIndex(start);
            items.forEach(function (item, index) {
                filterMap.push(!isFiltered);
                sortMap.push(innerIndex + index);
                groupMap.push(undefined);
            });
            (_a = this._filterMap).splice.apply(_a, [
                innerIndex,
                0
            ].concat(filterMap));
            (_b = this._sortMap).splice.apply(_b, [
                innerIndex,
                0
            ].concat(sortMap));
            return innerIndex;
        };    /**
         * Удаляет набор элементов проекции
         * @param {Number} start Начальный индекс (в коллекции)
         * @param {Number} [count] Кол-во элементов (по умолчанию - все)
         * @return {Array.<Types/_display/CollectionItem>} Удаленные элементы
         * @protected
         */
        /**
         * Удаляет набор элементов проекции
         * @param {Number} start Начальный индекс (в коллекции)
         * @param {Number} [count] Кол-во элементов (по умолчанию - все)
         * @return {Array.<Types/_display/CollectionItem>} Удаленные элементы
         * @protected
         */
        Collection.prototype._removeItems = function (start, count) {
            start = start || 0;
            var strategy = this._getItemsStrategy();
            var innerIndex;
            var result;
            count = count === undefined ? strategy.count - start : count;
            result = strategy.splice(start, count);
            innerIndex = result.start = strategy.getDisplayIndex(start);
            this._filterMap.splice(innerIndex, count);
            this._removeFromSortMap(innerIndex, count);
            return result;
        };    /**
         * Заменяет набор элементов проекции
         * @param {Number} start Начальный индекс (в коллекции)
         * @param {Array} newItems Замененные элементы
         * @return {Array.<Types/_display/CollectionItem>} Замененные элементы
         * @protected
         */
        /**
         * Заменяет набор элементов проекции
         * @param {Number} start Начальный индекс (в коллекции)
         * @param {Array} newItems Замененные элементы
         * @return {Array.<Types/_display/CollectionItem>} Замененные элементы
         * @protected
         */
        Collection.prototype._replaceItems = function (start, newItems) {
            var strategy = this._getItemsStrategy();
            var result = strategy.splice(start, newItems.length, newItems);
            result.start = strategy.getDisplayIndex(start);
            return result;
        };    /**
         * Перемещает набор элементов проекции
         * @param {Number} newIndex Старый индекс (в коллекции)
         * @param {Number} oldIndex Новый индекс (в коллекции)
         * @param {Array} items Перемещаемые элементы
         * @return {Array.<Types/_display/CollectionItem>} Перемещенные элементы
         * @protected
         */
        /**
         * Перемещает набор элементов проекции
         * @param {Number} newIndex Старый индекс (в коллекции)
         * @param {Number} oldIndex Новый индекс (в коллекции)
         * @param {Array} items Перемещаемые элементы
         * @return {Array.<Types/_display/CollectionItem>} Перемещенные элементы
         * @protected
         */
        Collection.prototype._moveItems = function (newIndex, oldIndex, items) {
            var length = items.length;
            var strategy = this._getItemsStrategy();
            var movedItems;
            movedItems = strategy.splice(oldIndex, length);
            strategy.splice(newIndex, 0, movedItems);
            movedItems.oldIndex = strategy.getDisplayIndex(oldIndex);
            return movedItems;
        };    /**
         * Удаляет из индекса сортировки срез элементов
         * @param {Number} start Начальный индекс (в коллекци)
         * @param {Number} count Кол-во элементов
         * @return {Array.<Number>}
         * @protected
         */
        /**
         * Удаляет из индекса сортировки срез элементов
         * @param {Number} start Начальный индекс (в коллекци)
         * @param {Number} count Кол-во элементов
         * @return {Array.<Number>}
         * @protected
         */
        Collection.prototype._removeFromSortMap = function (start, count) {
            start = start || 0;
            count = count || 0;
            var finish = start + count;
            var index;
            var sortIndex;
            var toRemove = [];
            var removed = {};    // Collect indices to remove
            // Collect indices to remove
            for (index = start; index < finish; index++) {
                sortIndex = this._sortMap.indexOf(index);
                if (sortIndex > -1) {
                    toRemove.push(sortIndex);
                    removed[sortIndex] = this._sortMap[sortIndex];
                }
            }    // Remove collected indices from _sortMap
            // Remove collected indices from _sortMap
            toRemove.sort(function (a, b) {
                return a - b;
            });
            for (index = toRemove.length - 1; index >= 0; index--) {
                this._sortMap.splice(toRemove[index], 1);
            }    // Shift _sortMap values by count from start index
            // Shift _sortMap values by count from start index
            for (index = 0; index < this._sortMap.length; index++) {
                if (this._sortMap[index] >= start) {
                    this._sortMap[index] -= count;
                }
            }
            this._reIndex();
            return removed;
        };    /**
         * Возвращает набор контрольных свойств элемента проекции для анализа его состояния
         * @param {Types/_display/CollectionItem} item Элемент проекции
         * @return {Object}
         * @protected
         */
        /**
         * Возвращает набор контрольных свойств элемента проекции для анализа его состояния
         * @param {Types/_display/CollectionItem} item Элемент проекции
         * @return {Object}
         * @protected
         */
        Collection.prototype._getItemState = function (item) {
            return {
                item: item,
                selected: item.isSelected()
            };
        };    /**
         * Возвращает состояния элементов
         * @param {Array.<Types/_display/CollectionItem>} items Элементы проекции
         * @return {Array.<Object>}
         * @protected
         */
        /**
         * Возвращает состояния элементов
         * @param {Array.<Types/_display/CollectionItem>} items Элементы проекции
         * @return {Array.<Object>}
         * @protected
         */
        Collection.prototype._getItemsState = function (items) {
            return items.map(this._getItemState);
        };    /**
         * Возвращает разницу между двумя состояниями элементов (результатами работы метода _getItemsState)
         * @param {Array.<Object>} before Состояния до изменений
         * @param {Array.<Object>} after Состояния после изменений
         * @return {Array.<CollectionItem>} Отличающиеся состояния
         * @protected
         */
        /**
         * Возвращает разницу между двумя состояниями элементов (результатами работы метода _getItemsState)
         * @param {Array.<Object>} before Состояния до изменений
         * @param {Array.<Object>} after Состояния после изменений
         * @return {Array.<CollectionItem>} Отличающиеся состояния
         * @protected
         */
        Collection.prototype._getItemsDiff = function (before, after) {
            return after.filter(function (itemNow, index) {
                var itemThen = before[index];
                return Object.keys(itemNow).some(function (prop) {
                    return itemNow[prop] !== itemThen[prop];
                });
            }).map(function (element) {
                return element.item;
            });
        };    /**
         * Генерирует события об изменении элементов проекции при изменении их состояния
         * @param {Object} session Сессия изменений
         * @param {Array.<Types/_display/CollectionItem>} items Измененные элементы
         * @param {Array} state Состояние элементов до изменений
         * @param {Function} beforeCheck Функция обратного вызова перед проверкой изменений состояния
         * @protected
         */
        /**
         * Генерирует события об изменении элементов проекции при изменении их состояния
         * @param {Object} session Сессия изменений
         * @param {Array.<Types/_display/CollectionItem>} items Измененные элементы
         * @param {Array} state Состояние элементов до изменений
         * @param {Function} beforeCheck Функция обратного вызова перед проверкой изменений состояния
         * @protected
         */
        Collection.prototype._checkItemsDiff = function (session, items, state, beforeCheck) {
            var _this = this;
            var diff = state ? this._getItemsDiff(state, this._getItemsState(items)) : [];
            if (beforeCheck) {
                beforeCheck(diff, items);
            }    // Notify changes by the diff
            // Notify changes by the diff
            if (diff.length) {
                this._notifyBeforeCollectionChange();
                collection_1.EventRaisingMixin._extractPacksByList(this, diff, function (items, index) {
                    _this._notifyCollectionChange(IBind_1.default.ACTION_CHANGE, items, index, items, index, session);
                });
                this._notifyAfterCollectionChange();
            }
        };    /**
         * Генерирует событие об изменении текущего элемента проекции коллекции
         * @param {Types/_display/CollectionItem} newCurrent Новый текущий элемент
         * @param {Types/_display/CollectionItem} oldCurrent Старый текущий элемент
         * @param {Number} newPosition Новая позиция
         * @param {Number} oldPosition Старая позиция
         * @protected
         */
        /**
         * Генерирует событие об изменении текущего элемента проекции коллекции
         * @param {Types/_display/CollectionItem} newCurrent Новый текущий элемент
         * @param {Types/_display/CollectionItem} oldCurrent Старый текущий элемент
         * @param {Number} newPosition Новая позиция
         * @param {Number} oldPosition Старая позиция
         * @protected
         */
        Collection.prototype._notifyCurrentChange = function (newCurrent, oldCurrent, newPosition, oldPosition) {
            if (!this.isEventRaising()) {
                return;
            }
            this._removeFromQueue('onCurrentChange');
            this._notify('onCurrentChange', newCurrent, oldCurrent, newPosition, oldPosition);
        };    /**
         * Нотифицирует событие change для измененных элементов
         * @param {Array} changed Измененные элементы исходной коллекции.
         * @param {Number} index Индекс исходной коллекции, в котором находятся элементы.
         * @protected
         */
        /**
         * Нотифицирует событие change для измененных элементов
         * @param {Array} changed Измененные элементы исходной коллекции.
         * @param {Number} index Индекс исходной коллекции, в котором находятся элементы.
         * @protected
         */
        Collection.prototype._notifyCollectionItemsChange = function (changed, index, session) {
            var _this = this;
            var items = this._getItems();
            var last = index + changed.length;
            var changedItems = [];    // Extract display items contains changed
            // Extract display items contains changed
            for (var i = index; i < last; i++) {
                changedItems.push(items[this._getItemIndex(i)]);
            }
            this._notifyBeforeCollectionChange();
            collection_1.EventRaisingMixin._extractPacksByList(this, changedItems, function (pack, index) {
                _this._notifyCollectionChange(IBind_1.default.ACTION_CHANGE, pack, index, pack, index, session);
            });
            this._notifyAfterCollectionChange();
        };    /**
         * Генерирует событие об изменении элемента проекции
         * @param {Env/Event.Object} event Дескриптор события.
         * @param {*} item Измененный элемент коллекции.
         * @param {Number} index Индекс измененного элемента.
         * @param {Object} [properties] Изменившиеся свойства
         * @protected
         */
        /**
         * Генерирует событие об изменении элемента проекции
         * @param {Env/Event.Object} event Дескриптор события.
         * @param {*} item Измененный элемент коллекции.
         * @param {Number} index Индекс измененного элемента.
         * @param {Object} [properties] Изменившиеся свойства
         * @protected
         */
        Collection.prototype._notifySourceCollectionItemChange = function (event, item, index, properties) {
            var enumerator = this._getUtilityEnumerator();
            var internalItems = this._getItems();
            var internalIndexBefore = this._getItemIndex(index);
            var internalIndexAfter;
            var internalItem = internalItems[internalIndexBefore];
            var indexBefore = enumerator.getInternalBySource(internalIndexBefore);
            var indexAfter;
            var isEventRaising = this.isEventRaising();
            var session = this._startUpdateSession();
            var isMoved;
            var state;    // Only changes of important properties can run analysis
            // Only changes of important properties can run analysis
            for (var key in properties) {
                if (properties.hasOwnProperty(key)) {
                    if (this._$importantItemProperties.indexOf(key) > -1) {
                        if (isEventRaising) {
                            // Fix the state before analysis
                            state = this._getItemsState(internalItems);
                        }
                        this._reAnalize(index, 1);
                        break;
                    }
                }
            }    // Return here if events are disabled
            // Return here if events are disabled
            if (!isEventRaising) {
                return;
            }
            this._finishUpdateSession(session, false);    // Check changes by state
            // Check changes by state
            internalIndexAfter = this._getItemIndex(index);
            indexAfter = enumerator.getInternalBySource(internalIndexAfter);
            isMoved = indexBefore !== indexAfter;
            this._checkItemsDiff(session, internalItems, state, function (diff) {
                // Some hard logic related with the character of item change.
                var internalItemIndex = diff.indexOf(internalItem);
                if (isMoved) {
                    // Item change the position
                    if (internalItemIndex > -1 && indexBefore > indexAfter) {
                        // Changed item is presented in the diff and moved up.
                        // It will be presented as a move event with that item in _finishUpdateSession.
                        // We should not notify about item change with the diff.
                        diff.splice(internalItemIndex, 1);
                    } else if (internalItemIndex === -1 && indexBefore < indexAfter) {
                        // Changed item isn't presented in the diff and moved down.
                        // It won't be presented as a move event with that item in _finishUpdateSession (items after will
                        // move up). We should notify about item change with the diff.
                        diff.push(internalItem);
                    }
                } else if (!isMoved && internalItemIndex === -1) {
                    // Changed item don't change the position and not presented in the diff.
                    // We should notify about item change with the diff.
                    diff.push(internalItem);
                }
            });
        };    /**
         * Генерирует событие о начале изменений коллекции
         * @protected
         */
        /**
         * Генерирует событие о начале изменений коллекции
         * @protected
         */
        Collection.prototype._notifyBeforeCollectionChange = function () {
            if (!this.isEventRaising()) {
                return;
            }
            this._notifyLater('onBeforeCollectionChange');
        };    /**
         * Генерирует событие об окончании изменений коллекции
         * @protected
         */
        /**
         * Генерирует событие об окончании изменений коллекции
         * @protected
         */
        Collection.prototype._notifyAfterCollectionChange = function () {
            if (!this.isEventRaising()) {
                return;
            }
            this._notify('onAfterCollectionChange');
        };
        return Collection;
    }(util_1.mixin(Abstract_1.default, entity_1.SerializableMixin, collection_1.EventRaisingMixin));
    exports.default = Collection;
    Object.assign(Collection.prototype, {
        '[Types/_display/Collection]': true,
        _moduleName: 'Types/display:Collection',
        _$collection: null,
        _$filter: null,
        _$group: null,
        _$sort: null,
        _$idProperty: '',
        _$unique: false,
        _$importantItemProperties: null,
        _localize: false,
        _itemModule: 'Types/display:CollectionItem',
        _itemsFactory: null,
        _composer: null,
        _sourceCollectionSynchronized: true,
        _sourceCollectionDelayedCallbacks: null,
        _cursorEnumerator: null,
        _utilityEnumerator: null,
        _onCollectionChange: null,
        _onCollectionItemChange: null,
        _oEventRaisingChange: null
    });    // FIXME: deprecated
    // FIXME: deprecated
    Collection.prototype['[WS.Data/Display/Collection]'] = true;
    di_1.register('Types/display:Collection', Collection);
});