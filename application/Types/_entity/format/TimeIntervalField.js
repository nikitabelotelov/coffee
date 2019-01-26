/// <amd-module name="Types/_entity/format/TimeIntervalField" />
/**
 * Формат поля временной интервал.
 *
 * Создадим поле c типом "Временной интервал":
 * <pre>
 *    var field = {
 *       name: 'foo',
 *       type: 'timeinterval'
 *    };
 * </pre>
 * @class Types/Format/TimeIntervalField
 * @extends Types/Format/Field
 * @public
 * @author Мальцев А.А.
 */
define('Types/_entity/format/TimeIntervalField', [
    'require',
    'exports',
    'tslib',
    'Types/_entity/format/Field'
], function (require, exports, tslib_1, Field_1) {
    'use strict';
    Object.defineProperty(exports, '__esModule', { value: true });
    var TimeIntervalField = /** @class */
    function (_super) {
        tslib_1.__extends(TimeIntervalField, _super);    /** @lends Types/Format/TimeIntervalField.prototype */
        /** @lends Types/Format/TimeIntervalField.prototype */
        function TimeIntervalField() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        return TimeIntervalField;
    }(Field_1.default    /** @lends Types/Format/TimeIntervalField.prototype */);
    /** @lends Types/Format/TimeIntervalField.prototype */
    exports.default = TimeIntervalField;
    TimeIntervalField.prototype['[Types/_entity/format/TimeIntervalField]'] = true;
    TimeIntervalField.prototype._moduleName = 'Types/entity:format.TimeIntervalField';
    TimeIntervalField.prototype._typeName = 'TimeInterval';
    TimeIntervalField.prototype._$defaultValue = 0;
});