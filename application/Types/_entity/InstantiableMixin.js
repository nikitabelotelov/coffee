/// <amd-module name="Types/_entity/InstantiableMixin" />
/**
 * Миксин, позволяющий генерировать уникальный (в рамках миксина) идентификатор для каждого экземпляра класса.
 * @mixin Types/_entity/InstantiableMixin
 * @public
 * @author Мальцев А.А.
 */
define('Types/_entity/InstantiableMixin', [
    'require',
    'exports'
], function (require, exports) {
    'use strict';
    Object.defineProperty(exports, '__esModule', { value: true });
    var MAX_VALUE = Number.MAX_SAFE_INTEGER || Math.pow(2, 53) - 1;
    var IS_SERVER_SIDE = typeof window === 'undefined';
    var counter = 0;
    var InstantiableMixin = /** @lends Types/_entity/InstantiableMixin.prototype */
    {
        '[Types/_entity/InstantiableMixin]': true,
        /**
         * @property {String} Префикс значений идентификатора
         */
        _instancePrefix: 'id-',
        /**
         * @property {String} Уникальный идентификатор
         */
        _instanceId: '',
        // region IInstantiable
        getInstanceId: function () {
            if (counter >= MAX_VALUE) {
                counter = 0;
            }
            return this._instanceId || (this._instanceId = (IS_SERVER_SIDE ? 'server-' : 'client-') + this._instancePrefix + counter++);
        }    // endregion
    };    // Deprecated methods
          // @ts-ignore
    // endregion
    // Deprecated methods
    // @ts-ignore
    InstantiableMixin.getHash = InstantiableMixin.getInstanceId;
    exports.default = InstantiableMixin;
});