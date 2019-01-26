/// <amd-module name="Types/_entity/format/IdentityField" />
/**
 * Формат поля для идентификатора.
 *
 * Создадим поле c типом "Идентификатор":
 * <pre>
 *    var field = {
 *       name: 'foo',
 *       type: 'identity'
 *    };
 * </pre>
 * @class Types/Format/IdentityField
 * @extends Types/Format/Field
 * @public
 * @author Мальцев А.А.
 */
define('Types/_entity/format/IdentityField', [
    'require',
    'exports',
    'tslib',
    'Types/_entity/format/Field'
], function (require, exports, tslib_1, Field_1) {
    'use strict';
    Object.defineProperty(exports, '__esModule', { value: true });
    var IdentityField = /** @class */
    function (_super) {
        tslib_1.__extends(IdentityField, _super);    /** @lends Types/Format/IdentityField.prototype */
        /** @lends Types/Format/IdentityField.prototype */
        function IdentityField() {
            return _super !== null && _super.apply(this, arguments) || this;
        }    //region Public methods
             /**
         * Возвращает разделитель
         * @return {String}
         */
        //region Public methods
        /**
         * Возвращает разделитель
         * @return {String}
         */
        IdentityField.prototype.getSeparator = function () {
            return this._separator;
        };
        return IdentityField;
    }(Field_1.default    /** @lends Types/Format/IdentityField.prototype */);
    /** @lends Types/Format/IdentityField.prototype */
    exports.default = IdentityField;
    IdentityField.prototype['[Types/_entity/format/IdentityField]'] = true;
    IdentityField.prototype._moduleName = 'Types/entity:format.IdentityField';
    IdentityField.prototype._typeName = 'Identity';
    IdentityField.prototype._separator = ',';
    IdentityField.prototype._$defaultValue = [null];
});