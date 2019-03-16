/// <amd-module name="Types/_entity/format/ArrayField" />
/**
 * Формат поля для массива значений.
 *
 * Создадим поле с типом "Массив значений":
 * <pre>
 *    var field = {
 *       name: 'foo',
 *       type: 'array',
 *       kind: 'integer'
 *    };
 * </pre>
 * @class Types/_entity/format/ArrayField
 * @extends Types/_entity/format/Field
 * @public
 * @author Мальцев А.А.
 */
define('Types/_entity/format/ArrayField', [
    'require',
    'exports',
    'tslib',
    'Types/_entity/format/Field'
], function (require, exports, tslib_1, Field_1) {
    'use strict';
    Object.defineProperty(exports, '__esModule', { value: true });
    var ArrayField = /** @class */
    function (_super) {
        tslib_1.__extends(ArrayField, _super);    /** @lends Types/_entity/format/ArrayField.prototype */
        /** @lends Types/_entity/format/ArrayField.prototype */
        function ArrayField() {
            return _super !== null && _super.apply(this, arguments) || this;
        }    // region Public methods
             /**
         * Возвращает тип элементов
         * @return {String}
         * @see dictionary
         */
        // region Public methods
        /**
         * Возвращает тип элементов
         * @return {String}
         * @see dictionary
         */
        ArrayField.prototype.getKind = function () {
            return this._$kind;
        };
        return ArrayField;
    }(Field_1.default    /** @lends Types/_entity/format/ArrayField.prototype */);
    /** @lends Types/_entity/format/ArrayField.prototype */
    exports.default = ArrayField;
    ArrayField.prototype['[Types/_entity/format/ArrayField]'] = true;
    ArrayField.prototype._moduleName = 'Types/entity:format.ArrayField';
    ArrayField.prototype._typeName = 'Array';
    ArrayField.prototype._$kind = '';
});