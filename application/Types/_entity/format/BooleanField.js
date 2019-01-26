/// <amd-module name="Types/_entity/format/BooleanField" />
/**
 * Формат логического поля.
 *
 * Создадим поле логического типа:
 * <pre>
 *    var field = {
 *       name: 'foo',
 *       type: 'boolean'
 *    };
 * </pre>
 * @class Types/Format/BooleanField
 * @extends Types/Format/Field
 * @public
 * @author Мальцев А.А.
 */
define('Types/_entity/format/BooleanField', [
    'require',
    'exports',
    'tslib',
    'Types/_entity/format/Field'
], function (require, exports, tslib_1, Field_1) {
    'use strict';
    Object.defineProperty(exports, '__esModule', { value: true });
    var BooleanField = /** @class */
    function (_super) {
        tslib_1.__extends(BooleanField, _super);    /** @lends Types/Format/BooleanField.prototype */
        /** @lends Types/Format/BooleanField.prototype */
        function BooleanField() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        return BooleanField;
    }(Field_1.default    /** @lends Types/Format/BooleanField.prototype */);
    /** @lends Types/Format/BooleanField.prototype */
    exports.default = BooleanField;
    BooleanField.prototype['[Types/_entity/format/BooleanField]'] = true;
    BooleanField.prototype._moduleName = 'Types/entity:format.BooleanField';
    BooleanField.prototype._typeName = 'Boolean';
});