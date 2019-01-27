/// <amd-module name="Types/_entity/format/DateTimeField" />
/**
 * Формат поля для даты и времени.
 *
 * Создадим поле c типом "Дата и время":
 * <pre>
 *    var field = {
 *       name: 'foo',
 *       type: 'dateTime'
 *    };
 * </pre>
 * @class Types/_entity/format/DateTimeField
 * @extends Types/_entity/format/Field
 * @public
 * @author Мальцев А.А.
 */
define('Types/_entity/format/DateTimeField', [
    'require',
    'exports',
    'tslib',
    'Types/_entity/format/Field'
], function (require, exports, tslib_1, Field_1) {
    'use strict';
    Object.defineProperty(exports, '__esModule', { value: true });
    var DateTimeField = /** @class */
    function (_super) {
        tslib_1.__extends(DateTimeField, _super);    /** @lends Types/_entity/format/DateTimeField.prototype */
        /** @lends Types/_entity/format/DateTimeField.prototype */
        function DateTimeField() {
            return _super !== null && _super.apply(this, arguments) || this;
        }    //region Public methods
             /**
         * Возвращает признак указания временной зоны
         * @return {Boolean}
         */
        //region Public methods
        /**
         * Возвращает признак указания временной зоны
         * @return {Boolean}
         */
        DateTimeField.prototype.isWithoutTimeZone = function () {
            return this._$withoutTimeZone;
        };
        return DateTimeField;
    }(Field_1.default    /** @lends Types/_entity/format/DateTimeField.prototype */);
    /** @lends Types/_entity/format/DateTimeField.prototype */
    exports.default = DateTimeField;
    DateTimeField.prototype['[Types/_entity/format/DateTimeField]'] = true;
    DateTimeField.prototype._moduleName = 'Types/entity:format.DateTimeField';
    DateTimeField.prototype._typeName = 'DateTime';
    DateTimeField.prototype._$withoutTimeZone = false;
});