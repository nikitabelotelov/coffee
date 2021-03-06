/// <amd-module name="Types/_entity/adapter/GenericFormatMixin" />
/**
 * Миксин для работы с форматом в адаптерах
 * @mixin Types/_entity/adapter/GenericFormatMixin
 * @public
 * @author Мальцев А.А.
 */
define('Types/_entity/adapter/GenericFormatMixin', [
    'require',
    'exports',
    'Types/_entity/format'
], function (require, exports, format_1) {
    'use strict';
    Object.defineProperty(exports, '__esModule', { value: true });
    var GenericFormatMixin = /** @lends Types/_entity/adapter/GenericFormatMixin.prototype */
    {
        '[Types/_entity/adapter/GenericFormatMixin]': true,
        /**
         * @property {Object} Сырые данные
         */
        _data: null,
        /**
         * @property {Object} Формат поля, отдаваемый через getSharedFormat()
         */
        _sharedFieldFormat: null,
        /**
         * @property {Object} Мета данные поля, отдаваемого через getSharedFormat()
         */
        _sharedFieldMeta: null,
        /**
         * Конструктор
         * @param {*} data Сырые данные
         */
        constructor: function (data) {
            this._data = data;
        },
        // region Public methods
        getData: function () {
            return this._data;
        },
        getFields: function () {
            throw new Error('Method must be implemented');
        },
        getFormat: function (name) {
            var fields = this._getFieldsFormat();
            var index = fields ? fields.getFieldIndex(name) : -1;
            if (index === -1) {
                throw new ReferenceError(this._moduleName + '::getFormat(): field "' + name + '" doesn\'t exist');
            }
            return fields.at(index);
        },
        getSharedFormat: function (name) {
            if (this._sharedFieldFormat === null) {
                this._sharedFieldFormat = new format_1.UniversalField();
            }
            var fieldFormat = this._sharedFieldFormat;
            var fields = this._getFieldsFormat();
            var index = fields ? fields.getFieldIndex(name) : -1;
            fieldFormat.name = name;
            fieldFormat.type = index === -1 ? 'String' : fields.at(index).getType();
            fieldFormat.meta = index === -1 ? {} : this._getFieldMeta(name);
            return fieldFormat;
        },
        addField: function (format, at) {
            if (!format || !(format instanceof format_1.Field)) {
                throw new TypeError(this._moduleName + '::addField(): format should be an instance of Types/entity:format.Field');
            }
            var name = format.getName();
            if (!name) {
                throw new Error('{$this._moduleName}::addField(): field name is empty');
            }
            var fields = this._getFieldsFormat();
            var index = fields ? fields.getFieldIndex(name) : -1;
            if (index > -1) {
                throw new Error(this._moduleName + '::addField(): field "' + name + '" already exists');
            }
            this._touchData();
            fields.add(format, at);
        },
        removeField: function (name) {
            var fields = this._getFieldsFormat();
            var index = fields ? fields.getFieldIndex(name) : -1;
            if (index === -1) {
                throw new ReferenceError(this._moduleName + '::removeField(): field "' + name + '" doesn\'t exist');
            }
            this._touchData();
            fields.removeAt(index);
        },
        removeFieldAt: function (index) {
            this._touchData();
            var fields = this._getFieldsFormat();
            if (fields) {
                fields.removeAt(index);
            }
        },
        // endregion Public methods
        // region Protected methods
        _touchData: function () {
        },
        _isValidData: function () {
            return true;
        },
        _getFieldsFormat: function () {
            throw new Error('Method must be implemented');
        },
        _getFieldMeta: function (name) {
            if (this._sharedFieldMeta === null) {
                this._sharedFieldMeta = {};
            }
            var format = this.getFormat(name);
            var meta = this._sharedFieldMeta;
            switch (format.getType()) {
            case 'Real':
            case 'Money':
                meta.precision = format.getPrecision();
                break;
            case 'Enum':
            case 'Flags':
                meta.dictionary = format.getDictionary();
                break;
            case 'Identity':
                meta.separator = format.getSeparator();
                break;
            case 'Array':
                meta.kind = format.getKind();
                break;
            }
            return meta;
        }    // endregion Protected methods
    };
    // endregion Protected methods
    exports.default = GenericFormatMixin;
});