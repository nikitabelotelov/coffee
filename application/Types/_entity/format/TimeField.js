/// <amd-module name="Types/_entity/format/TimeField" />
/**
 * Формат поля для времени.
 *
 * Создадим поле c типом "Время":
 * <pre>
 *    var field = {
 *       name: 'foo',
 *       type: 'time'
 *    };
 * </pre>
 * @class Types/_entity/format/TimeField
 * @extends Types/_entity/format/Field
 * @public
 * @author Мальцев А.А.
 */
define('Types/_entity/format/TimeField', [
    'require',
    'exports',
    'tslib',
    'Types/_entity/format/Field',
    'Types/formatter'
], function (require, exports, tslib_1, Field_1, formatter_1) {
    'use strict';
    Object.defineProperty(exports, '__esModule', { value: true });
    var TimeField = /** @class */
    function (_super) {
        tslib_1.__extends(TimeField, _super);    /** @lends Types/_entity/format/TimeField.prototype */
        /** @lends Types/_entity/format/TimeField.prototype */
        function TimeField() {
            return _super !== null && _super.apply(this, arguments) || this;
        }    // region Public methods
        // region Public methods
        TimeField.prototype.getDefaultValue = function () {
            if (this._$defaultValue instanceof Date) {
                return formatter_1.dateToSql(this._$defaultValue, formatter_1.TO_SQL_MODE.TIME);
            }
            return this._$defaultValue;
        };
        return TimeField;
    }(Field_1.default    /** @lends Types/_entity/format/TimeField.prototype */);
    /** @lends Types/_entity/format/TimeField.prototype */
    exports.default = TimeField;
    TimeField.prototype['[Types/_entity/format/TimeField]'] = true;
    TimeField.prototype._moduleName = 'Types/entity:format.TimeField';
    TimeField.prototype._typeName = 'Time';
});