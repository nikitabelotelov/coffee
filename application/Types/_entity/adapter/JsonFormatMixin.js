/// <amd-module name="Types/_entity/adapter/JsonFormatMixin" />
/**
 * Миксин для работы с JSON-форматом в адаптерах
 * @mixin Types/_entity/adapter/JsonFormatMixin
 * @public
 * @author Мальцев А.А.
 */
define('Types/_entity/adapter/JsonFormatMixin', [
    'require',
    'exports',
    'Types/_entity/format'
], function (require, exports, format_1) {
    'use strict';
    Object.defineProperty(exports, '__esModule', { value: true });
    var JsonFormatMixin = /** @lends Types/_entity/adapter/JsonFormatMixin.prototype */
    {
        '[Types/_entity/adapter/GenericFormatMixin]': true,
        /**
         * @property {Object.<Types/_entity/format/Field>} Форматы полей
         */
        _format: null,
        // region Public methods
        constructor: function () {
            this._format = {};
        },
        getFormat: function (name) {
            if (!this._has(name)) {
                throw new ReferenceError(this._moduleName + '::getFormat(): field "' + name + '" doesn\'t exist');
            }
            if (!this._format.hasOwnProperty(name)) {
                this._format[name] = this._buildFormat(name);
            }
            return this._format[name];
        },
        getSharedFormat: function (name) {
            if (this._sharedFieldFormat === null) {
                this._sharedFieldFormat = new format_1.UniversalField();
            }
            var format = this._sharedFieldFormat;
            format.name = name;
            if (this._format.hasOwnProperty(name)) {
                format.type = this.getFormat(name).getType();
                format.meta = this._getFieldMeta(name);
            } else {
                format.type = 'String';
            }
            return format;
        },
        addField: function (format) {
            if (!format || !(format instanceof format_1.Field)) {
                throw new TypeError(this._moduleName + '::addField(): format should be an instance of Types/entity:format.Field');
            }
            var name = format.getName();
            if (!name) {
                throw new Error(this._moduleName + '::addField(): field name is empty');
            }
            this._touchData();
            this._format[name] = format;
        },
        removeField: function (name) {
            if (!this._has(name)) {
                throw new ReferenceError(this._moduleName + '::removeField(): field "' + name + '" doesn\'t exist');
            }
            this._touchData();
            delete this._format[name];
        },
        removeFieldAt: function () {
            throw new Error('Method ' + this._moduleName + '::removeFieldAt() doesn\'t supported');
        },
        // endregion
        // region Protected methods
        _touchData: function () {
            if (!(this._data instanceof Object)) {
                this._data = {};
            }
        },
        _isValidData: function () {
            return this._data instanceof Object;
        },
        _has: function () {
            throw new Error('Method must be implemented');
        },
        _buildFormat: function (name) {
            return format_1.fieldsFactory({
                name: name,
                type: 'string'
            });
        }    // endregion
    };
    // endregion
    exports.default = JsonFormatMixin;
});