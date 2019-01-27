/// <amd-module name="Types/_collection/enumerator/Objectwise" />
/**
 * Энумератор для собственных свойств объекта
 * @class Types/_collection/ObjectEnumerator
 * @implements Types/_collection/IEnumerator
 * @public
 * @author Мальцев А.А.
 */
define('Types/_collection/enumerator/Objectwise', [
    'require',
    'exports'
], function (require, exports) {
    'use strict';
    Object.defineProperty(exports, '__esModule', { value: true });
    var Objectwise = /** @class */
    function () {
        /**
         * Конструктор
         * @param {Object} items Массив
         */
        function Objectwise(items) {
            this['[Types/_collection/IEnumerator]'] = true;
            var checkedItems = items;
            if (checkedItems === undefined) {
                checkedItems = {};
            }
            if (!(checkedItems instanceof Object)) {
                throw new Error('Argument items should be an instance of Object');
            }
            this._items = checkedItems;
            this._keys = Object.keys(checkedItems);
        }    // region Types/_collection/IEnumerator
        // region Types/_collection/IEnumerator
        Objectwise.prototype.getCurrent = function () {
            if (this._index < 0) {
                return undefined;
            }
            return this._items[this._keys[this._index]];
        };
        Objectwise.prototype.moveNext = function () {
            if (1 + this._index >= this._keys.length) {
                return false;
            }
            this._index++;
            var current = this.getCurrent();
            if (this._filter && !this._filter(current, this.getCurrentIndex())) {
                return this.moveNext();
            }
            return true;
        };
        Objectwise.prototype.reset = function () {
            this._index = -1;
        };    // endregion Types/_collection/IEnumerator
              // region Public methods
        // endregion Types/_collection/IEnumerator
        // region Public methods
        Objectwise.prototype.getCurrentIndex = function () {
            return this._keys[this._index];
        };    /**
         * Устанавливает фильтр элементов
         * @param {function(): Boolean} filter Функция обратного вызова, которая должна для каждого элемента вернуть признак,
         * проходит ли он фильтр
         */
        /**
         * Устанавливает фильтр элементов
         * @param {function(): Boolean} filter Функция обратного вызова, которая должна для каждого элемента вернуть признак,
         * проходит ли он фильтр
         */
        Objectwise.prototype.setFilter = function (filter) {
            this._filter = filter;
        };
        return Objectwise;
    }();
    exports.default = Objectwise;
    Objectwise.prototype['[Types/_collection/enumerator/Objectwise]'] = true;    // @ts-ignore
    // @ts-ignore
    Objectwise.prototype._items = null;    // @ts-ignore
    // @ts-ignore
    Objectwise.prototype._keys = null;    // @ts-ignore
    // @ts-ignore
    Objectwise.prototype._index = -1;    // @ts-ignore
    // @ts-ignore
    Objectwise.prototype._filter = null;
});