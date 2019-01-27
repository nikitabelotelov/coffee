/// <amd-module name="Types/_entity/format/IntegerField" />
/**
 * Формат целочисленного поля.
 *
 * Создадим поле челочисленного типа:
 * <pre>
 *    var field = {
 *       name: 'foo',
 *       type: 'integer'
 *    };
 * </pre>
 * @class Types/_entity/format/IntegerField
 * @extends Types/_entity/format/Field
 * @public
 * @author Мальцев А.А.
 */
define('Types/_entity/format/IntegerField', [
    'require',
    'exports',
    'tslib',
    'Types/_entity/format/Field'
], function (require, exports, tslib_1, Field_1) {
    'use strict';
    Object.defineProperty(exports, '__esModule', { value: true });
    var IntegerField = /** @class */
    function (_super) {
        tslib_1.__extends(IntegerField, _super);    /** @lends Types/_entity/format/IntegerField.prototype */
        /** @lends Types/_entity/format/IntegerField.prototype */
        function IntegerField() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        return IntegerField;
    }(Field_1.default    /** @lends Types/_entity/format/IntegerField.prototype */);
    /** @lends Types/_entity/format/IntegerField.prototype */
    exports.default = IntegerField;
    IntegerField.prototype['[Types/_entity/format/IntegerField]'] = true;
    IntegerField.prototype._moduleName = 'Types/entity:format.IntegerField';
    IntegerField.prototype._typeName = 'Integer';
    IntegerField.prototype._$defaultValue = 0;
});