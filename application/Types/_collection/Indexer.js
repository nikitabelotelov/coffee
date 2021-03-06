/// <amd-module name="Types/_collection/Indexer" />
/**
 * Индексатор коллекции
 * @class Types/_collection/Indexer
 * @public
 * @author Мальцев А.А.
 */
define('Types/_collection/Indexer', [
    'require',
    'exports'
], function (require, exports) {
    'use strict';
    Object.defineProperty(exports, '__esModule', { value: true });    /**
     * Ищет позицию вставки значения в массив методом деления пополам.
     * @param {Array} items Массив, значения котрого отсортированы по возрастанию.
     * @param {Number} value Вставляемое значение
     * @return {Number}
     */
    /**
     * Ищет позицию вставки значения в массив методом деления пополам.
     * @param {Array} items Массив, значения котрого отсортированы по возрастанию.
     * @param {Number} value Вставляемое значение
     * @return {Number}
     */
    function getPosition(items, value) {
        var count = items.length;
        var distance = count;
        var position = Math.floor(distance / 2);
        var having;
        while (distance > 0 && position < count) {
            having = items[position];
            distance = Math.floor(distance / 2);
            if (having > value) {
                position -= distance;
            } else {
                position += Math.max(distance, 1);
            }
        }
        return position;
    }
    var Indexer    /** @lends Types/_collection/Indexer.prototype */ = /** @lends Types/_collection/Indexer.prototype */
    /** @class */
    function () {
        /**
         * Конструктор
         * @param {Object} collection Коллекция
         * @param {Function: Number} count Метод, возвращающий кол-во элементов коллекции
         * @param {Function: Object} at Метод, возвращающий элемент коллекции по индексу
         * @param {Function} prop Метод, возвращающий значение свойства элемента коллекции
         */
        function Indexer(collection, count, at, prop) {
            this._collection = collection;
            this._count = count;
            this._at = at;
            this._prop = prop;
            this.resetIndex();
        }    // region Public methods
             /**
         * Возвращает индекс первого элемента с указанным значением свойства. Если такого элемента нет - вернет -1.
         * @param {String} property Название свойства элемента.
         * @param {*} value Значение свойства элемента.
         * @return {Number}
         */
        // region Public methods
        /**
         * Возвращает индекс первого элемента с указанным значением свойства. Если такого элемента нет - вернет -1.
         * @param {String} property Название свойства элемента.
         * @param {*} value Значение свойства элемента.
         * @return {Number}
         */
        Indexer.prototype.getIndexByValue = function (property, value) {
            var indices = this.getIndicesByValue(property, value);
            return indices.length ? indices[0] : -1;
        };    /**
         * Возвращает индексы всех элементов с указанным значением свойства.
         * @param {String} property Название свойства элемента.
         * @param {*} value Значение свойства элемента.
         * @return {Array.<Number>}
         */
        /**
         * Возвращает индексы всех элементов с указанным значением свойства.
         * @param {String} property Название свойства элемента.
         * @param {*} value Значение свойства элемента.
         * @return {Array.<Number>}
         */
        Indexer.prototype.getIndicesByValue = function (property, value) {
            var index = this._getIndex(property);
            if (index) {
                if (index[value]) {
                    return index[value].slice();
                }
                value = '[' + (Array.isArray(value) ? value.join(',') : value) + ']';
                if (index[value]) {
                    return index[value].slice();
                }
            }
            return [];
        };    /**
         * Сбрасывает индекс
         */
        /**
         * Сбрасывает индекс
         */
        Indexer.prototype.resetIndex = function () {
            this._indices = null;
        };    /**
         * Обновляет индекс элементов
         * @param {Number} start С какой позиции
         * @param {Number} count Число обновляемых элементов
         */
        /**
         * Обновляет индекс элементов
         * @param {Number} start С какой позиции
         * @param {Number} count Число обновляемых элементов
         */
        Indexer.prototype.updateIndex = function (start, count) {
            var indices = this._indices;
            if (!indices) {
                return;
            }    /* eslint-disable guard-for-in */
            /* eslint-disable guard-for-in */
            for (var property in indices) {
                this._updateIndex(property, start, count);
            }    /* eslint-enable guard-for-in */
        };    /**
         * Сдвигает индекс элементов
         * @param {Number} start С какой позиции
         * @param {Number} count Число сдвигаемых элементов
         * @param {Number} offset На сколько сдвинуть индексы
         */
        /* eslint-enable guard-for-in */
        /**
         * Сдвигает индекс элементов
         * @param {Number} start С какой позиции
         * @param {Number} count Число сдвигаемых элементов
         * @param {Number} offset На сколько сдвинуть индексы
         */
        Indexer.prototype.shiftIndex = function (start, count, offset) {
            var finish = start + count;
            this._eachIndexItem(function (data) {
                for (var i = 0; i < data.length; i++) {
                    if (data[i] >= start && data[i] < finish) {
                        data[i] += offset;
                    }
                }
            });
        };    /**
         * Удаляет элементы из индекса
         * @param {Number} start С какой позиции
         * @param {Number} count Число удаляемых элементов
         */
        /**
         * Удаляет элементы из индекса
         * @param {Number} start С какой позиции
         * @param {Number} count Число удаляемых элементов
         */
        Indexer.prototype.removeFromIndex = function (start, count) {
            this._eachIndexItem(function (data) {
                var at;
                for (var i = 0; i < count; i++) {
                    at = data.indexOf(start + i);
                    if (at > -1) {
                        data.splice(at, 1);
                    }
                }
            });
        };    // endregion Public methods
              // region Protected methods
              /**
         * Перебирает проиндексированные значения для всех свойств
         * @param {Function} callback Метод обратного вызова
         * @protected
         */
        // endregion Public methods
        // region Protected methods
        /**
         * Перебирает проиндексированные значения для всех свойств
         * @param {Function} callback Метод обратного вызова
         * @protected
         */
        Indexer.prototype._eachIndexItem = function (callback) {
            var indices = this._indices;
            if (!indices) {
                return;
            }
            var values;    /* eslint-disable guard-for-in */
            /* eslint-disable guard-for-in */
            for (var property in indices) {
                values = indices[property];
                for (var value in values) {
                    callback(values[value], value, property);
                }
            }    /* eslint-enable guard-for-in */
        };    /**
         * Возвращает индекс для указанного свойства.
         * @param {String} property Название свойства.
         * @return {Array}
         * @protected
         */
        /* eslint-enable guard-for-in */
        /**
         * Возвращает индекс для указанного свойства.
         * @param {String} property Название свойства.
         * @return {Array}
         * @protected
         */
        Indexer.prototype._getIndex = function (property) {
            if (!property) {
                return undefined;
            }
            if (!this._hasIndex(property)) {
                this._createIndex(property);
            }
            return this._indices[property];
        };    /**
         * Проверяет наличие индекса для указанного свойства.
         * @param {String} [property] Название свойства.
         * @protected
         */
        /**
         * Проверяет наличие индекса для указанного свойства.
         * @param {String} [property] Название свойства.
         * @protected
         */
        Indexer.prototype._hasIndex = function (property) {
            return property && this._indices ? property in this._indices : false;
        };    /**
         * Удаляет индекс для указанного свойства.
         * @param {String} property Название свойства.
         * @protected
         */
        /**
         * Удаляет индекс для указанного свойства.
         * @param {String} property Название свойства.
         * @protected
         */
        Indexer.prototype._deleteIndex = function (property) {
            delete this._indices[property];
        };    /**
         * Создает индекс для указанного свойства.
         * @param {String} property Название свойства.
         * @protected
         */
        /**
         * Создает индекс для указанного свойства.
         * @param {String} property Название свойства.
         * @protected
         */
        Indexer.prototype._createIndex = function (property) {
            if (!property) {
                return;
            }
            if (!this._indices) {
                this._indices = Object.create(null);
            }
            this._indices[property] = Object.create(null);
            this._updateIndex(property, 0, this._count(this._collection));
        };    /**
         * Обновляет индекс указанного свойства
         * @param {String} property Название свойства.
         * @param {Number} start С какой позиции
         * @param {Number} count Число элементов
         * @protected
         */
        /**
         * Обновляет индекс указанного свойства
         * @param {String} property Название свойства.
         * @param {Number} start С какой позиции
         * @param {Number} count Число элементов
         * @protected
         */
        Indexer.prototype._updateIndex = function (property, start, count) {
            var index = this._indices[property];
            if (!index) {
                return;
            }
            var item;
            var value;
            var positions;
            for (var i = start; i < start + count; i++) {
                item = this._at(this._collection, i);
                value = this._prop(item, property);
                if (value instanceof Array) {
                    value = '[' + value.join(',') + ']';
                }
                if (!(value in index)) {
                    index[value] = [];
                }
                positions = index[value];
                positions.splice(getPosition(positions, i), 0, i);
            }
        };
        return Indexer;
    }();
    exports.default = Indexer;
    Indexer.prototype['[Types/_collection/Indexer]'] = true;
    Indexer.prototype._collection = null;
    Indexer.prototype._count = null;
    Indexer.prototype._at = null;
    Indexer.prototype._prop = null;
    Indexer.prototype._indices = null;
});