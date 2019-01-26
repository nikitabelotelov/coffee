/// <amd-module name="Types/_entity/format/HierarchyField" />
/**
 * Формат поля иерархии
 *
 * @class Types/Format/HierarchyField
 * @extends Types/Format/Field
 * @author Мальцев А.А.
 */
define('Types/_entity/format/HierarchyField', [
    'require',
    'exports',
    'tslib',
    'Types/_entity/format/Field'
], function (require, exports, tslib_1, Field_1) {
    'use strict';
    Object.defineProperty(exports, '__esModule', { value: true });
    var HierarchyField = /** @class */
    function (_super) {
        tslib_1.__extends(HierarchyField, _super);    /** @lends Types/Format/HierarchyField.prototype */
        /** @lends Types/Format/HierarchyField.prototype */
        function HierarchyField() {
            return _super !== null && _super.apply(this, arguments) || this;
        }    //region Public methods
             /**
         * Возвращает тип элементов
         * @return {String}
         * @see dictionary
         */
        //region Public methods
        /**
         * Возвращает тип элементов
         * @return {String}
         * @see dictionary
         */
        HierarchyField.prototype.getKind = function () {
            return this._$kind;
        };
        HierarchyField.prototype.getDefaultValue = function () {
            if (this._$kind && this._$kind === 'Identity') {
                return [null];
            }
            return null;
        };
        return HierarchyField;
    }(Field_1.default    /** @lends Types/Format/HierarchyField.prototype */);
    /** @lends Types/Format/HierarchyField.prototype */
    exports.default = HierarchyField;
    HierarchyField.prototype['[Types/_entity/format/HierarchyField]'] = true;
    HierarchyField.prototype._moduleName = 'Types/entity:format.HierarchyField';
    HierarchyField.prototype._typeName = 'Hierarchy';
    HierarchyField.prototype._$kind = '';
});