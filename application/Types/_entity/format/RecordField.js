/// <amd-module name="Types/_entity/format/RecordField" />
/**
 * Формат поля для записи.
 *
 * Создадим поле c типом "Запись":
 * <pre>
 *    var field = {
 *       name: 'foo',
 *       type: 'record'
 *    };
 * </pre>
 * @class Types/Format/RecordField
 * @extends Types/Format/Field
 * @public
 * @author Мальцев А.А.
 */
define('Types/_entity/format/RecordField', [
    'require',
    'exports',
    'tslib',
    'Types/_entity/format/Field'
], function (require, exports, tslib_1, Field_1) {
    'use strict';
    Object.defineProperty(exports, '__esModule', { value: true });
    var RecordField = /** @class */
    function (_super) {
        tslib_1.__extends(RecordField, _super);    /** @lends Types/Format/RecordField.prototype */
        /** @lends Types/Format/RecordField.prototype */
        function RecordField() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        return RecordField;
    }(Field_1.default    /** @lends Types/Format/RecordField.prototype */);
    /** @lends Types/Format/RecordField.prototype */
    exports.default = RecordField;
    RecordField.prototype['[Types/_entity/format/RecordField]'] = true;
    RecordField.prototype._moduleName = 'Types/entity:format.RecordField';
    RecordField.prototype._typeName = 'Record';
});