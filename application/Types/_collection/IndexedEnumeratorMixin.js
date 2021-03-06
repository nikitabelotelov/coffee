/// <amd-module name="Types/_collection/IndexedEnumeratorMixin" />
/**
 * Миксин, позволящий использовать индексацию элементов в экземплярах,
 * реализующих интерфейс Types/_collection/IEnumerator.
 * @mixin Types/_collection/IndexedEnumeratorMixin
 * @public
 * @author Мальцев А.А.
 */
define('Types/_collection/IndexedEnumeratorMixin', [
    'require',
    'exports',
    'Types/util',
    'Types/_collection/IObservable'
], function (require, exports, util_1, IObservable_1) {
    'use strict';
    Object.defineProperty(exports, '__esModule', { value: true });
    var IndexedEnumeratorMixin = /** @lends Types/_collection/IndexedEnumeratorMixin.prototype */
    {
        '[Types/_collection/IndexedEnumeratorMixin]': true,
        /**
         * @member {Object} Индексы, распределенные по полям
         */
        _enumeratorIndexes: null,
        constructor: function () {
            this._enumeratorIndexes = {};
            this._onCollectionChange = this._onCollectionChange.bind(this);
        },
        // region Public methods
        /**
         * Переиндексирует энумератор
         * @param {Types/_collection/IBind/ChangeAction.typedef[]} [action] Действие, приведшее к изменению.
         * @param {Number} [start=0] С какой позиции переиндексировать
         * @param {Number} [count=0] Число переиндексируемых элементов
         */
        reIndex: function (action, start, count) {
            switch (action) {
            case IObservable_1.default.ACTION_ADD:
                this._shiftIndex(start, count);
                this._addToIndex(start, count);
                break;
            case IObservable_1.default.ACTION_REMOVE:
                this._removeFromIndex(start, count);
                this._shiftIndex(start + count, -count);
                break;
            case IObservable_1.default.ACTION_REPLACE:
                this._replaceInIndex(start, count);
                break;
            default:
                this._resetIndex();
            }
        },
        /**
         * Возвращает индекс первого элемента с указанным значением свойства. Если такого элемента нет - вернет -1.
         * @param {String} property Название свойства элемента.
         * @param {*} value Значение свойства элемента.
         * @return {Number}
         */
        getIndexByValue: function (property, value) {
            var index = this._getIndexForPropertyValue(property, value);
            return index.length ? index[0] : -1;
        },
        /**
         * Возвращает индексы всех элементов с указанным значением свойства.
         * @param {String} property Название свойства элемента.
         * @param {*} value Значение свойства элемента.
         * @return {Array.<Number>}
         */
        getIndicesByValue: function (property, value) {
            return this._getIndexForPropertyValue(property, value);
        },
        /**
         * Устанавливает коллекцию при изменении которой поисходит переиндексация энумератора
         * @param {Types/_collection/IBind} collection
         */
        setObservableCollection: function (collection) {
            collection.subscribe('onCollectionChange', this._onCollectionChange);
        },
        /**
         * Сбрасывает коллекцию при изменении которой поисходит переиндексация энумератора
         * @param {Types/_collection/IBind} collection
         */
        unsetObservableCollection: function (collection) {
            collection.unsubscribe('onCollectionChange', this._onCollectionChange);
        },
        // endregion Public methods
        // region Protected methods
        /**
         * Возвращает индекс для указанного значения свойства.
         * @param {String} property Название свойства элемента.
         * @param {*} value Значение свойства элемента.
         * @return {Array.<Number>}
         * @protected
         */
        _getIndexForPropertyValue: function (property, value) {
            var index = this._getIndex(property);
            return index && index[value] || [];
        },
        /**
         * Проверяет наличие индекса для указанного свойства.
         * @param {String} [property] Название свойства.
         * @protected
         */
        _hasIndex: function (property) {
            if (property) {
                return Object.prototype.hasOwnProperty.call(this._enumeratorIndexes, property);
            }
            return Object.keys(this._enumeratorIndexes).length === 0;
        },
        /**
         * Возвращает индекс для указанного свойства.
         * @param {String} property Название свойства.
         * @return {Object}
         * @protected
         */
        _getIndex: function (property) {
            if (property && !this._hasIndex(property)) {
                this._createIndex(property);
            }
            return this._enumeratorIndexes[property];
        },
        /**
         * Сбрасывает индекс
         */
        _resetIndex: function () {
            this._enumeratorIndexes = {};
        },
        /**
         * Удаляет индекс для указанного свойства.
         * @param {String} property Название свойства.
         * @protected
         */
        _deleteIndex: function (property) {
            delete this._enumeratorIndexes[property];
        },
        /**
         * Создает индекс для указанного свойства.
         * @param {String} property Название свойства.
         * @protected
         */
        _createIndex: function (property) {
            var index = {};
            var position = 0;
            this._enumeratorIndexes[property] = index;
            this.reset();
            while (this.moveNext()) {
                this._setToIndex(index, property, this.getCurrent(), position);
                position++;
            }
        },
        /**
         * Добавляет элементы в индекс
         * @param {Number} start С какой позиции переиндексировать
         * @param {Number} count Число переиндексируемых элементов
         * @protected
         */
        _addToIndex: function (start, count) {
            var index;
            var finish = start + count;
            var position;
            for (var property in this._enumeratorIndexes) {
                if (this._enumeratorIndexes.hasOwnProperty(property)) {
                    index = this._enumeratorIndexes[property];
                    position = 0;
                    this.reset();
                    while (this.moveNext()) {
                        if (position >= start) {
                            this._setToIndex(index, property, this.getCurrent(), position);
                        }
                        position++;
                        if (position >= finish) {
                            break;
                        }
                    }
                }
            }
        },
        /**
         * Удаляет элементы из индекса
         * @param {Number} start С какой позиции переиндексировать
         * @param {Number} count Число переиндексируемых элементов
         * @protected
         */
        _removeFromIndex: function (start, count) {
            var index;
            var value;
            var elem;
            var at;
            for (var property in this._enumeratorIndexes) {
                if (this._enumeratorIndexes.hasOwnProperty(property)) {
                    index = this._enumeratorIndexes[property];
                    for (value in index) {
                        if (index.hasOwnProperty(value)) {
                            elem = index[value];
                            for (var i = 0; i < count; i++) {
                                at = elem.indexOf(start + i);
                                if (at > -1) {
                                    elem.splice(at, 1);
                                }
                            }
                        }
                    }
                }
            }
        },
        /**
         * Заменяет элементы в индексе
         * @param {Number} start С какой позиции заменять
         * @param {Number} count Число замененных элементов
         * @protected
         */
        _replaceInIndex: function (start, count) {
            this._removeFromIndex(start, count);
            this._addToIndex(start, count);
        },
        /**
         * Сдвигает позицию элементов индекса
         * @param {Number} start С какой позиции
         * @param {Number} offset Сдвиг
         * @protected
         */
        _shiftIndex: function (start, offset) {
            var index;
            var item;
            for (var property in this._enumeratorIndexes) {
                if (this._enumeratorIndexes.hasOwnProperty(property)) {
                    index = this._enumeratorIndexes[property];
                    for (var value in index) {
                        if (index.hasOwnProperty(value)) {
                            item = index[value];
                            for (var i = 0; i < item.length; i++) {
                                if (item[i] >= start) {
                                    item[i] += offset;
                                }
                            }
                        }
                    }
                }
            }
        },
        /**
         * Устанавливает элемент в индекс
         * @protected
         */
        _setToIndex: function (index, property, item, position) {
            var value = util_1.object.getPropertyValue(item, property);    // FIXME: should figure out when search can be either CollectionItem instance and their contents
            // FIXME: should figure out when search can be either CollectionItem instance and their contents
            if (value === undefined && item instanceof Object && typeof item.getContents === 'function') {
                // item is instance of Types/_display/CollectionItem
                value = util_1.object.getPropertyValue(item.getContents(), property);
            }
            if (!Object.prototype.hasOwnProperty.call(index, value)) {
                index[value] = [];
            }
            index[value].push(position);
        },
        /**
         * Удаляет индексы при изменении исходной коллекции
         * @param {Env/Event.Object} event Дескриптор события.
         * @param {String} action Действие, приведшее к изменению.
         * @param {Array.<*>} newItems Новые элементы коллекции.
         * @param {Number} newItemsIndex Индекс, в котором появились новые элементы.
         * @param {Array.<*>} oldItems Удаленные элементы коллекции.
         * @param {Number} oldItemsIndex Индекс, в котором удалены элементы.
         * @protected
         */
        _onCollectionChange: function (event, action, newItems, newItemsIndex, oldItems, oldItemsIndex) {
            switch (action) {
            case IObservable_1.default.ACTION_ADD:
            case IObservable_1.default.ACTION_REPLACE:
                this.reIndex(action, newItemsIndex, newItems.length);
                break;
            case IObservable_1.default.ACTION_REMOVE:
                this.reIndex(action, oldItemsIndex, oldItems.length);
                break;
            default:
                this.reIndex(action);
            }
        }    // endregion Protected methods
    };
    // endregion Protected methods
    exports.default = IndexedEnumeratorMixin;
});