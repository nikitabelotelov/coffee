/// <amd-module name="Types/_entity/format/UuidField" />
/**
 * Формат поля UUID.
 *
 * Создадим поле c типом "UUID":
 * <pre>
 *    var field = {
 *       name: 'foo',
 *       type: 'uuid'
 *    };
 * </pre>
 * @class Types/Format/UuidField
 * @extends Types/Format/Field
 * @public
 * @author Мальцев А.А.
 */
define('Types/_entity/format/UuidField', [
    'require',
    'exports',
    'tslib',
    'Types/_entity/format/Field'
], function (require, exports, tslib_1, Field_1) {
    'use strict';
    Object.defineProperty(exports, '__esModule', { value: true });
    var UuidField = /** @class */
    function (_super) {
        tslib_1.__extends(UuidField, _super);    /** @lends Types/Format/UuidField.prototype */
        /** @lends Types/Format/UuidField.prototype */
        function UuidField() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        return UuidField;
    }(Field_1.default    /** @lends Types/Format/UuidField.prototype */);
    /** @lends Types/Format/UuidField.prototype */
    exports.default = UuidField;
    UuidField.prototype['[Types/_entity/format/UuidField]'] = true;
    UuidField.prototype._moduleName = 'Types/entity:format.UuidField';
    UuidField.prototype._typeName = 'Uuid';
});