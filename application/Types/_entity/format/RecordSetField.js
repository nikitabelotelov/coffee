/// <amd-module name="Types/_entity/format/RecordSetField" />
/**
 * Формат поля для рекордсета.
 *
 * Создадим поле c типом "Рекордсет":
 * <pre>
 *    var field = {
 *       name: 'foo',
 *       type: 'recordset'
 *    };
 * </pre>
 * @class Types/Format/RecordSetField
 * @extends Types/Format/Field
 * @public
 * @author Мальцев А.А.
 */
define('Types/_entity/format/RecordSetField', [
    'require',
    'exports',
    'tslib',
    'Types/_entity/format/Field'
], function (require, exports, tslib_1, Field_1) {
    'use strict';
    Object.defineProperty(exports, '__esModule', { value: true });
    var RecordSetField = /** @class */
    function (_super) {
        tslib_1.__extends(RecordSetField, _super);    /** @lends Types/Format/RecordSetField.prototype */
        /** @lends Types/Format/RecordSetField.prototype */
        function RecordSetField() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        return RecordSetField;
    }(Field_1.default    /** @lends Types/Format/RecordSetField.prototype */);
    /** @lends Types/Format/RecordSetField.prototype */
    exports.default = RecordSetField;
    RecordSetField.prototype['[Types/_entity/format/RecordSetField]'] = true;
    RecordSetField.prototype._moduleName = 'Types/entity:format.RecordSetField';
    RecordSetField.prototype._typeName = 'RecordSet';
});