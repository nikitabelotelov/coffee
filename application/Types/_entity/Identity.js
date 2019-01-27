/// <amd-module name="Types/_entity/Identity" />
/**
 * Тип данных "Идентификатор".
 * @class Types/_entity/Identity
 * @public
 * @author Мальцев А.А.
 * @example
 * <pre>
 *    require(['Types/_entity/Identity'], function (Identity) {
 *       var id = new Identity([1, 'Employees']);
 *       console.log(id.getValue());//1
 *       console.log(id.getName());//'Employees'
 *       console.log(String(id));//'1,Employees'
 *    });
 * </pre>
 */
define('Types/_entity/Identity', [
    'require',
    'exports',
    'Types/di'
], function (require, exports, di_1) {
    'use strict';
    Object.defineProperty(exports, '__esModule', { value: true });
    var Identity    /** @lends Types/_entity/Identity.prototype */ = /** @lends Types/_entity/Identity.prototype */
    /** @class */
    function () {
        /**
         * Конструктор типа "Идентификатор".
         * @param {Array|String|Number} value Значение идентификатора
         */
        function Identity(value) {
            if (!(value instanceof Array)) {
                if (typeof value === 'string') {
                    value = value.split(this._separator);
                } else {
                    value = [value];
                }
            }
            this._value = value;
        }    //region Public methods
             /**
         * Возвращает значение поля таблицы.
         * @return {Number|Null}
         */
        //region Public methods
        /**
         * Возвращает значение поля таблицы.
         * @return {Number|Null}
         */
        Identity.prototype.getValue = function () {
            return this._value[0];
        };    /**
         * Возвращает название таблицы.
         * @return {String|undefined}
         */
        /**
         * Возвращает название таблицы.
         * @return {String|undefined}
         */
        Identity.prototype.getName = function () {
            return this._value[1];
        };
        Identity.prototype.valueOf = function () {
            return this._value;
        };
        Identity.prototype.toString = function () {
            return this._value[0] === null ? null : this._value.join(',');
        };
        return Identity;
    }();
    exports.default = Identity;
    Identity.prototype['[Types/_entity/Identity]'] = true;
    Identity.prototype._separator = ',';
    Identity.prototype._value = null;
    di_1.register('Types/entity:Identity', Identity, { instantiate: false });
});