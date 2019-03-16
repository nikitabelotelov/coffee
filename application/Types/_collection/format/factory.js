/// <amd-module name="Types/_collection/format/factory" />
/**
 * Фабрика форматов - конструирует формат по декларативному описанию
 * @author Мальцев А.А.
 */
define('Types/_collection/format/factory', [
    'require',
    'exports',
    'Types/_collection/format/Format',
    'Types/entity',
    'Types/di'
], function (require, exports, Format_1, entity_1, di_1) {
    'use strict';
    Object.defineProperty(exports, '__esModule', { value: true });    /**
     * Конструирует формат полей по декларативному описанию
     * @param {Array.<Types/_entity/format/FieldsFactory/FieldDeclaration.typedef>} declaration Декларативное описание
     * @return {Types/_entity/format/Format}
     */
    /**
     * Конструирует формат полей по декларативному описанию
     * @param {Array.<Types/_entity/format/FieldsFactory/FieldDeclaration.typedef>} declaration Декларативное описание
     * @return {Types/_entity/format/Format}
     */
    function factory(declaration) {
        if (!declaration || !(declaration instanceof Array)) {
            throw new TypeError('Types/_collection/format/factory: declaration should be an instance of Array');
        }
        var instance = new Format_1.default();
        for (var i = 0; i < declaration.length; i++) {
            instance.add(entity_1.format.fieldsFactory(declaration[i]));
        }
        return instance;
    }
    exports.default = factory;
    di_1.register('Types/collection:format.factory', factory, { instantiate: false });
});