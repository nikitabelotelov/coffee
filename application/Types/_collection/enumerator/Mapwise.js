/// <amd-module name="Types/_collection/enumerator/Mapwise" />
/**
 * Энумератор для Map
 * @class Types/_collection/MapEnumerator
 * @implements Types/_collection/IEnumerator
 * @public
 * @author Мальцев А.А.
 */
define('Types/_collection/enumerator/Mapwise', [
    'require',
    'exports',
    'Types/shim'
], function (require, exports, shim_1) {
    'use strict';
    Object.defineProperty(exports, '__esModule', { value: true });
    var Mapwise = /** @class */
    function () {
        /**
         * Конструктор
         * @param {Map} items Массив
         */
        function Mapwise(items) {
            this['[Types/_collection/IEnumerator]'] = true;
            if (items === undefined) {
                items = new shim_1.Map();
            }
            if (!(items instanceof shim_1.Map)) {
                throw new Error('Argument items should be an instance of Map');
            }
            this._items = items;
        }
        Object.defineProperty(Mapwise.prototype, '_keys', {
            /**
             * @property {Array} Ключи
             */
            get: function () {
                if (!this._cachedKeys) {
                    var keys_1 = [];
                    this._items.forEach(function (value, key) {
                        keys_1.push(key);
                    });
                    this._cachedKeys = keys_1;
                }
                return this._cachedKeys;
            },
            enumerable: true,
            configurable: true
        });    // region Types/_collection/IEnumerator
        // region Types/_collection/IEnumerator
        Mapwise.prototype.getCurrent = function () {
            return this._index === -1 ? undefined : this._items.get(this._keys[this._index]);
        };
        Mapwise.prototype.moveNext = function () {
            var keys = this._keys;
            if (this._index >= keys.length - 1) {
                return false;
            }
            this._index++;
            return true;
        };
        Mapwise.prototype.reset = function () {
            this._cachedKeys = undefined;
            this._index = -1;
        };    // endregion Types/_collection/IEnumerator
              // region Public methods
        // endregion Types/_collection/IEnumerator
        // region Public methods
        Mapwise.prototype.getCurrentIndex = function () {
            return this._keys[this._index];
        };
        return Mapwise;
    }();
    exports.default = Mapwise;
    Mapwise.prototype['[Types/_collection/enumerator/Mapwise]'] = true;    // @ts-ignore
    // @ts-ignore
    Mapwise.prototype._items = null;    // @ts-ignore
    // @ts-ignore
    Mapwise.prototype._index = -1;    // @ts-ignore
    // @ts-ignore
    Mapwise.prototype._cachedKeys = undefined;
});