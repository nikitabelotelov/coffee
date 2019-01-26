/// <amd-module name="Types/_entity/format/StringField" />
/**
 * Формат поля для строк.
 *
 * Создадим поле c типом "Строка":
 * <pre>
 *    var field = {
 *       name: 'foo',
 *       type: 'string'
 *    };
 * </pre>
 * @class Types/Format/StringField
 * @extends Types/Format/Field
 * @public
 * @author Мальцев А.А.
 */
define('Types/_entity/format/StringField', [
    'require',
    'exports',
    'tslib',
    'Types/_entity/format/Field'
], function (require, exports, tslib_1, Field_1) {
    'use strict';
    Object.defineProperty(exports, '__esModule', { value: true });
    var StringField = /** @class */
    function (_super) {
        tslib_1.__extends(StringField, _super);    /** @lends Types/Format/StringField.prototype */
        /** @lends Types/Format/StringField.prototype */
        function StringField() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        return StringField;
    }(Field_1.default    /** @lends Types/Format/StringField.prototype */);
    /** @lends Types/Format/StringField.prototype */
    exports.default = StringField;
    StringField.prototype['[Types/_entity/format/StringField]'] = true;
    StringField.prototype._moduleName = 'Types/entity:format.StringField';
    StringField.prototype._typeName = 'String';
});