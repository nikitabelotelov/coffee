/// <amd-module name="Types/_entity/format/FlagsField" />
/**
 * Формат поля флагов.
 *
 * Создадим поле c типом "Флаги":
 * <pre>
 *    var field = {
 *       name: 'foo',
 *       type: 'flags',
 *       dictionary: ['one', 'two', 'three']
 *    };
 * </pre>
 * @class Types/_entity/format/FlagsField
 * @extends Types/_entity/format/DictionaryField
 * @public
 * @author Мальцев А.А.
 */
define('Types/_entity/format/FlagsField', [
    'require',
    'exports',
    'tslib',
    'Types/_entity/format/DictionaryField'
], function (require, exports, tslib_1, DictionaryField_1) {
    'use strict';
    Object.defineProperty(exports, '__esModule', { value: true });
    var FlagsField = /** @class */
    function (_super) {
        tslib_1.__extends(FlagsField, _super);    /** @lends Types/_entity/format/FlagsField.prototype */
        /** @lends Types/_entity/format/FlagsField.prototype */
        function FlagsField() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        return FlagsField;
    }(DictionaryField_1.default    /** @lends Types/_entity/format/FlagsField.prototype */);
    /** @lends Types/_entity/format/FlagsField.prototype */
    exports.default = FlagsField;
    FlagsField.prototype['[Types/_entity/format/FlagsField]'] = true;
    FlagsField.prototype._moduleName = 'Types/entity:format.FlagsField';
    FlagsField.prototype._typeName = 'Flags';
});