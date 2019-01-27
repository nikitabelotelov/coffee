/// <amd-module name="Types/_collection/enumerator/Arraywise" />
/**
 * Энумератор для массива
 * @class Types/_collection/ArrayEnumerator
 * @implements Types/_collection/IEnumerator
 * @mixes Types/_collection/IndexedEnumeratorMixin
 * @public
 * @author Мальцев А.А.
 */
define('Types/_collection/enumerator/Arraywise', [
    'require',
    'exports',
    'tslib',
    'Types/_collection/IndexedEnumeratorMixin',
    'Types/di',
    'Types/util'
], function (require, exports, tslib_1, IndexedEnumeratorMixin_1, di_1, util_1) {
    'use strict';
    Object.defineProperty(exports, '__esModule', { value: true });
    var Arraywise = /** @class */
    function (_super) {
        tslib_1.__extends(Arraywise, _super);    /**
         * Конструктор
         * @param {Array} items Массив
         */
        /**
         * Конструктор
         * @param {Array} items Массив
         */
        function Arraywise(items) {
            var _this = _super.call(this) || this;
            var checkedItems = items;
            if (checkedItems === undefined) {
                checkedItems = [];
            }
            if (!(checkedItems instanceof Array)) {
                throw new Error('Argument items should be an instance of Array');
            }
            _this._items = checkedItems;
            IndexedEnumeratorMixin_1.default.constructor.call(_this);
            return _this;
        }
        Arraywise.prototype.getCurrent = function () {
            if (this._index < 0) {
                return undefined;
            }
            return this._resolver ? this._resolver(this._index) : this._items[this._index];
        };
        Arraywise.prototype.getCurrentIndex = function () {
            return this._index;
        };
        Arraywise.prototype.moveNext = function () {
            if (1 + this._index >= this._items.length) {
                return false;
            }
            this._index++;
            var current = this.getCurrent();
            if (this._filter && !this._filter(current, this._index)) {
                return this.moveNext();
            }
            return true;
        };
        Arraywise.prototype.reset = function () {
            this._index = -1;
        };    // endregion Types/_collection/IEnumerator
              // region Public methods
              /**
         * Устанавливает резолвер элементов по позиции
         * @param {function(Number): *} resolver Функция обратного вызова, которая должна по позиции вернуть элемент
         */
        // endregion Types/_collection/IEnumerator
        // region Public methods
        /**
         * Устанавливает резолвер элементов по позиции
         * @param {function(Number): *} resolver Функция обратного вызова, которая должна по позиции вернуть элемент
         */
        Arraywise.prototype.setResolver = function (resolver) {
            this._resolver = resolver;
        };    /**
         * Устанавливает фильтр элементов
         * @param {function(*): Boolean} filter Функция обратного вызова, которая должна для каждого элемента вернуть
         * признак, проходит ли он фильтр
         */
        /**
         * Устанавливает фильтр элементов
         * @param {function(*): Boolean} filter Функция обратного вызова, которая должна для каждого элемента вернуть
         * признак, проходит ли он фильтр
         */
        Arraywise.prototype.setFilter = function (filter) {
            this._filter = filter;
        };
        return Arraywise;
    }(util_1.mixin(Object, IndexedEnumeratorMixin_1.default));
    exports.default = Arraywise;
    Arraywise.prototype['[Types/_collection/enumerator/Arraywise]'] = true;    /**
     * @property {Array} Массив
     */
    /**
     * @property {Array} Массив
     */
    Arraywise.prototype._items = null;    /**
     * @property {Number} Текущий индекс
     */
    /**
     * @property {Number} Текущий индекс
     */
    Arraywise.prototype._index = -1;    /**
     * @property {function(Number): *} Резолвер элементов
     */
    /**
     * @property {function(Number): *} Резолвер элементов
     */
    Arraywise.prototype._resolver = null;    /**
     * @property {function(*): Boolean} Фильтр элементов
     */
    /**
     * @property {function(*): Boolean} Фильтр элементов
     */
    Arraywise.prototype._filter = null;
    di_1.register('Types/collection:enumerator.Arraywise', Arraywise, { instantiate: false });
});