/// <amd-module name="Types/_entity/format/MoneyField" />
/**
 * Формат денежного поля.
 *
 * Создадим поле c типом "Деньги":
 * <pre>
 *    var field = {
 *       name: 'foo',
 *       type: 'money'
 *    };
 * </pre>
 * @class Types/_entity/format/MoneyField
 * @extends Types/_entity/format/RealField
 * @public
 * @author Мальцев А.А.
 */
define('Types/_entity/format/MoneyField', [
    'require',
    'exports',
    'tslib',
    'Types/_entity/format/RealField'
], function (require, exports, tslib_1, RealField_1) {
    'use strict';
    Object.defineProperty(exports, '__esModule', { value: true });
    var MoneyField = /** @class */
    function (_super) {
        tslib_1.__extends(MoneyField, _super);    /** @lends Types/_entity/format/MoneyField.prototype */
        /** @lends Types/_entity/format/MoneyField.prototype */
        function MoneyField() {
            return _super !== null && _super.apply(this, arguments) || this;
        }    //region Public methods
             /**
         * Возвращает признак "Большие деньги"
         * @return {Boolean}
         * @see large
         */
        //region Public methods
        /**
         * Возвращает признак "Большие деньги"
         * @return {Boolean}
         * @see large
         */
        MoneyField.prototype.isLarge = function () {
            return this._$large;
        };
        return MoneyField;
    }(RealField_1.default    /** @lends Types/_entity/format/MoneyField.prototype */);
    /** @lends Types/_entity/format/MoneyField.prototype */
    exports.default = MoneyField;
    MoneyField.prototype['[Types/_entity/format/MoneyField]'] = true;
    MoneyField.prototype._moduleName = 'Types/entity:format.MoneyField';
    MoneyField.prototype._typeName = 'Money';
    MoneyField.prototype._$precision = 2;
    MoneyField.prototype._$large = false;
});