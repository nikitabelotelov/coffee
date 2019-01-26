/// <amd-module name="Types/_entity/format/DateField" />
/**
 * Формат поля для даты.
 *
 * Создадим поле c типом "Дата":
 * <pre>
 *    var field = {
 *       name: 'foo',
 *       type: 'date'
 *    };
 * </pre>
 * @class Types/Format/DateField
 * @extends Types/Format/Field
 * @public
 * @author Мальцев А.А.
 */
define('Types/_entity/format/DateField', [
    'require',
    'exports',
    'tslib',
    'Types/_entity/format/Field',
    'Types/_entity/date/toSql'
], function (require, exports, tslib_1, Field_1, toSql_1) {
    'use strict';
    Object.defineProperty(exports, '__esModule', { value: true });
    var DateField = /** @class */
    function (_super) {
        tslib_1.__extends(DateField, _super);    /** @lends Types/Format/DateField.prototype */
        /** @lends Types/Format/DateField.prototype */
        function DateField() {
            return _super !== null && _super.apply(this, arguments) || this;
        }    //region Public methods
        //region Public methods
        DateField.prototype.getDefaultValue = function () {
            if (this._$defaultValue instanceof Date) {
                return toSql_1.default(this._$defaultValue, toSql_1.MODE.DATE);
            }
            return this._$defaultValue;
        };
        return DateField;
    }(Field_1.default    /** @lends Types/Format/DateField.prototype */);
    /** @lends Types/Format/DateField.prototype */
    exports.default = DateField;
    DateField.prototype['[Types/_entity/format/DateField]'] = true;
    DateField.prototype._moduleName = 'Types/entity:format.DateField';
    DateField.prototype._typeName = 'Date';
});