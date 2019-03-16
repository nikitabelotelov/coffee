/// <amd-module name="Types/_entity/format/ObjectField" />
/**
 * Формат поля для JSON-объекта.
 *
 * Создадим поле c типом "JSON-объект":
 * <pre>
 *    var field = {
 *       name: 'foo',
 *       type: 'object'
 *    };
 * </pre>
 * @class Types/_entity/format/ObjectField
 * @extends Types/_entity/format/Field
 * @public
 * @author Мальцев А.А.
 */
define('Types/_entity/format/ObjectField', [
    'require',
    'exports',
    'tslib',
    'Types/_entity/format/Field'
], function (require, exports, tslib_1, Field_1) {
    'use strict';
    Object.defineProperty(exports, '__esModule', { value: true });
    var ObjectField = /** @class */
    function (_super) {
        tslib_1.__extends(ObjectField, _super);    /** @lends Types/_entity/format/ObjectField.prototype */
        /** @lends Types/_entity/format/ObjectField.prototype */
        function ObjectField() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        return ObjectField;
    }(Field_1.default    /** @lends Types/_entity/format/ObjectField.prototype */);
    /** @lends Types/_entity/format/ObjectField.prototype */
    exports.default = ObjectField;
    ObjectField.prototype['[Types/_entity/format/ObjectField]'] = true;
    ObjectField.prototype._moduleName = 'Types/entity:format.ObjectField';
    ObjectField.prototype._typeName = 'Object';
});