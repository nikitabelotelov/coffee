/// <amd-module name="Types/_entity/format/EnumField" />
/**
 * Формат перечисляемого поля.
 *
 * Создадим поле c типом "Перечисляемое":
 * <pre>
 *    var field = {
 *       name: 'foo',
 *       type: 'enum',
 *       dictionary: ['one', 'two', 'three']
 *    };
 * </pre>
 * @class Types/_entity/format/EnumField
 * @extends Types/_entity/format/DictionaryField
 * @public
 * @author Мальцев А.А.
 */
define('Types/_entity/format/EnumField', [
    'require',
    'exports',
    'tslib',
    'Types/_entity/format/DictionaryField'
], function (require, exports, tslib_1, DictionaryField_1) {
    'use strict';
    Object.defineProperty(exports, '__esModule', { value: true });
    var EnumField = /** @class */
    function (_super) {
        tslib_1.__extends(EnumField, _super);    /** @lends Types/_entity/format/EnumField.prototype */
        /** @lends Types/_entity/format/EnumField.prototype */
        function EnumField() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        return EnumField;
    }(DictionaryField_1.default    /** @lends Types/_entity/format/EnumField.prototype */);
    /** @lends Types/_entity/format/EnumField.prototype */
    exports.default = EnumField;
    EnumField.prototype['[Types/_entity/format/EnumField]'] = true;
    EnumField.prototype._moduleName = 'Types/entity:format.EnumField';
    EnumField.prototype._typeName = 'Enum';
});