/// <amd-module name="Types/_entity/format/BinaryField" />
/**
 * Формат двоичного поля.
 *
 * Создадим поле двоичного типа:
 * <pre>
 *    var field = {
 *       name: 'foo',
 *       type: 'binary'
 *    };
 * </pre>
 * @class Types/Format/BinaryField
 * @extends Types/Format/Field
 * @public
 * @author Мальцев А.А.
 */
define('Types/_entity/format/BinaryField', [
    'require',
    'exports',
    'tslib',
    'Types/_entity/format/Field'
], function (require, exports, tslib_1, Field_1) {
    'use strict';
    Object.defineProperty(exports, '__esModule', { value: true });
    var BinaryField = /** @class */
    function (_super) {
        tslib_1.__extends(BinaryField, _super);    /** @lends Types/Format/BinaryField.prototype */
        /** @lends Types/Format/BinaryField.prototype */
        function BinaryField() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        return BinaryField;
    }(Field_1.default    /** @lends Types/Format/BinaryField.prototype */);
    /** @lends Types/Format/BinaryField.prototype */
    exports.default = BinaryField;
    BinaryField.prototype['[Types/_entity/format/BinaryField]'] = true;
    BinaryField.prototype._moduleName = 'Types/entity:format.BinaryField';
    BinaryField.prototype._typeName = 'Binary';
});