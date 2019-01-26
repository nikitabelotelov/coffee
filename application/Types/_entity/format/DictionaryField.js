/// <amd-module name="Types/_entity/format/DictionaryField" />
/**
 * Формат поля со словарём (абстрактный класс)
 * @class Types/Format/DictionaryField
 * @extends Types/Format/Field
 * @public
 * @author Мальцев А.А.
 */
define('Types/_entity/format/DictionaryField', [
    'require',
    'exports',
    'tslib',
    'Types/_entity/format/Field'
], function (require, exports, tslib_1, Field_1) {
    'use strict';
    Object.defineProperty(exports, '__esModule', { value: true });
    var DictionaryField = /** @class */
    function (_super) {
        tslib_1.__extends(DictionaryField, _super);    /** @lends Types/Format/DictionaryField.prototype */
        /** @lends Types/Format/DictionaryField.prototype */
        function DictionaryField() {
            return _super !== null && _super.apply(this, arguments) || this;
        }    //region Public methods
             /**
         * Возвращает словарь возможных значений
         * @return {Array.<String>}
         * @see dictionary
         */
        //region Public methods
        /**
         * Возвращает словарь возможных значений
         * @return {Array.<String>}
         * @see dictionary
         */
        DictionaryField.prototype.getDictionary = function () {
            return this._$dictionary;
        };    /**
         * Возвращает словарь возможных значений
         * @return {Array.<String>}
         * @see dictionary
         */
        /**
         * Возвращает словарь возможных значений
         * @return {Array.<String>}
         * @see dictionary
         */
        DictionaryField.prototype.getLocaleDictionary = function () {
            return this._$localeDictionary;
        };
        return DictionaryField;
    }(Field_1.default    /** @lends Types/Format/DictionaryField.prototype */);
    /** @lends Types/Format/DictionaryField.prototype */
    exports.default = DictionaryField;
    DictionaryField.prototype['[Types/_entity/format/DictionaryField]'] = true;
    DictionaryField.prototype._moduleName = 'Types/entity:format.DictionaryField';
    DictionaryField.prototype._typeName = 'Dictionary';
    DictionaryField.prototype._$dictionary = null;
    DictionaryField.prototype._$localeDictionary = null;
});