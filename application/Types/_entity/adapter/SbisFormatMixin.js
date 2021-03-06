/// <amd-module name="Types/_entity/adapter/SbisFormatMixin" />
/**
 * Миксин для работы с СБИС-форматом в адаптерах
 * @mixin Types/_entity/adapter/SbisFormatMixin
 * @public
 * @author Мальцев А.А.
 */
define('Types/_entity/adapter/SbisFormatMixin', [
    'require',
    'exports',
    'Types/_entity/adapter/SbisFieldType',
    'Types/_entity/factory',
    'Types/_entity/format',
    'Types/shim',
    'Types/util'
], function (require, exports, SbisFieldType_1, factory_1, format_1, shim_1, util_1) {
    'use strict';
    Object.defineProperty(exports, '__esModule', { value: true });    /**
     * @const {Object} Инвертированный FIELD_TYPE
     */
    /**
     * @const {Object} Инвертированный FIELD_TYPE
     */
    var FIELD_TYPE_INVERTED = Object.keys(SbisFieldType_1.default).reduce(function (memo, key) {
        memo[SbisFieldType_1.default[key]] = key;
        return memo;
    }, {});    /**
     * {Symbol} Символ для кэширования индексов полей
     */
    /**
     * {Symbol} Символ для кэширования индексов полей
     */
    var fieldIndicesSymbol = typeof Symbol === 'undefined' ? undefined : Symbol('fieldIndices');
    function getFieldTypeNameByInner(innerName) {
        return FIELD_TYPE_INVERTED[innerName] || 'string';
    }
    function getFieldInnerTypeNameByOuter(outerName) {
        return SbisFieldType_1.default[(outerName + '').toLowerCase()];
    }
    var SbisFormatMixin = /** @lends Types/_entity/adapter/SbisFormatMixin.prototype */
    {
        '[Types/_entity/adapter/SbisFormatMixin]': true,
        /**
         * @member {Object} Сырые данные
         */
        _data: null,
        /**
         * @member {String} Сигнатура типа
         */
        _type: '',
        /**
         * @member {Map.<String, Number>} Название поля -> индекс в d
         */
        _fieldIndices: null,
        /**
         * @member {Object.<Types/_entity/format/Field>} Форматы полей
         */
        _format: null,
        /**
         * @member {Object} Формат поля, отдаваемый через getSharedFormat()
         */
        _sharedFieldFormat: null,
        /**
         * @member {Object} Мета данные поля, отдаваемого через getSharedFormat()
         */
        _sharedFieldMeta: null,
        constructor: function (data) {
            if (data && data._type && data._type !== this._type) {
                throw new TypeError('Argument "data" has "' + data._type + '" type signature but "' + this._type + '" expected.');
            }
            if (fieldIndicesSymbol && data && data.s) {
                data.s[fieldIndicesSymbol] = null;
            }
            this._data = data;
            this._format = {};
        },
        // region Public methods
        getData: function () {
            return this._data;
        },
        getFields: function () {
            var fields = [];
            if (this._isValidData()) {
                for (var i = 0, count = this._data.s.length; i < count; i++) {
                    fields.push(this._data.s[i].n);
                }
            }
            return fields;
        },
        clear: function () {
            this._touchData();
            this._data.d.length = 0;
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
            var format = this._sharedFieldFormat || (this._sharedFieldFormat = new format_1.UniversalField());
            var index = this._getFieldIndex(name);
            if (index === -1) {
                throw new ReferenceError(this._moduleName + '::getSharedFormat(): field "' + name + '" doesn\'t exist');
            }
            format.name = name;
            format.type = this._getFieldType(index);
            format.meta = this._getFieldMeta(index, format.type, true);
            return format;
        },
        addField: function (format, at) {
            if (!format || !(format instanceof format_1.Field)) {
                throw new TypeError(this._moduleName + '::addField(): format should be an instance of Types/entity:format.Field');
            }
            var name = format.getName();
            if (this._has(name)) {
                throw new ReferenceError(this._moduleName + '::addField(): field "' + name + '" already exists');
            }
            this._touchData();
            if (at === undefined) {
                at = this._data.s.length;
            }
            this._checkFieldIndex(at, true);
            this._format[name] = format;
            this._resetFieldIndices();
            this._data.s.splice(at, 0, this._buildS(format));
            this._buildD(at, factory_1.default.serialize(format.getDefaultValue(), { format: format }));
        },
        removeField: function (name) {
            this._touchData();
            var index = this._getFieldIndex(name);
            if (index === -1) {
                throw new ReferenceError(this._moduleName + '::removeField(): field "' + name + '" doesn\'t exist');
            }
            delete this._format[name];
            this._resetFieldIndices();
            this._data.s.splice(index, 1);
            this._removeD(index);
        },
        removeFieldAt: function (index) {
            this._touchData();
            this._checkFieldIndex(index);
            var name = this._data.s[index].n;
            delete this._format[name];
            this._resetFieldIndices();
            this._data.s.splice(index, 1);
            this._removeD(index);
        },
        // endregion
        // region Protected methods
        _touchData: function () {
            this._data = this._normalizeData(this._data, this._type);
        },
        _normalizeData: function (data, dataType) {
            if (!(data instanceof Object)) {
                data = {};
            }
            if (!(data.d instanceof Array)) {
                data.d = [];
            }
            if (!(data.s instanceof Array)) {
                data.s = [];
            }
            data._type = dataType;
            return data;
        },
        _cloneData: function (shareFormat) {
            var data = util_1.object.clone(this._data);
            if (shareFormat && data && data.s) {
                data.s = this._data.s;    // Keep sharing fields format
            }
            // Keep sharing fields format
            return data;
        },
        _isValidData: function () {
            return this._data && this._data.s instanceof Array;
        },
        _has: function (name) {
            return this._getFieldIndex(name) >= 0;
        },
        _getFieldIndex: function (name) {
            if (!this._isValidData()) {
                return -1;
            }
            var s = this._data.s;
            var fieldIndices = fieldIndicesSymbol ? s[fieldIndicesSymbol] : this._fieldIndices;
            if (!fieldIndicesSymbol && fieldIndices && this._fieldIndices['[{s}]'] !== s) {
                fieldIndices = null;
            }
            if (!fieldIndices) {
                fieldIndices = new shim_1.Map();
                if (fieldIndicesSymbol) {
                    s[fieldIndicesSymbol] = fieldIndices;
                } else {
                    this._fieldIndices = fieldIndices;
                    this._fieldIndices['[{s}]'] = s;
                }
                for (var i = 0, count = s.length; i < count; i++) {
                    fieldIndices.set(s[i].n, i);
                }
            }
            return fieldIndices.has(name) ? fieldIndices.get(name) : -1;
        },
        _resetFieldIndices: function () {
            if (this._isValidData()) {
                if (fieldIndicesSymbol) {
                    this._data.s[fieldIndicesSymbol] = null;
                } else {
                    this._fieldIndices = null;
                }
            }
        },
        _checkFieldIndex: function (index, appendMode) {
            var max = this._data.s.length - 1;
            if (appendMode) {
                max++;
            }
            if (!(index >= 0 && index <= max)) {
                throw new RangeError(this._moduleName + ': field index "' + index + '" is out of bounds.');
            }
        },
        _getFieldType: function (index) {
            var field = this._data.s[index];
            var typeName = field.t;
            if (typeName && typeName instanceof Object) {
                typeName = typeName.n;
            }
            return getFieldTypeNameByInner(typeName);
        },
        _getFieldMeta: function (index, type, singleton) {
            if (singleton && this._sharedFieldMeta === null) {
                this._sharedFieldMeta = {};
            }
            var info = this._data.s[index];
            var meta = singleton ? this._sharedFieldMeta : {};
            switch (type) {
            case 'real':
                meta.precision = info.t.p;
                break;
            case 'money':
                meta.precision = undefined;
                if (typeof info.t === 'object' && 'p' in info.t) {
                    meta.precision = info.t.p;
                }
                meta.large = !!info.t.l;
                break;
            case 'enum':
            case 'flags':
                meta.dictionary = info.t.s;
                meta.localeDictionary = info.t.sl;
                break;
            case 'datetime':
                meta.withoutTimeZone = info.t && info.t.n && 'tz' in info.t ? !info.t.tz : false;
                break;
            case 'identity':
                meta.separator = ',';
                break;
            case 'array':
                meta.kind = getFieldTypeNameByInner(info.t.t);
                Object.assign(meta, this._getFieldMeta(index, meta.kind));
                break;
            }
            return meta;
        },
        _checkFormat: function (record, prefix) {
            var self = this._isValidData() ? this._data.s : [];
            var outer = record ? record.s || [] : [];
            var count = self.length;
            var error;
            if (self === outer) {
                return;
            }
            prefix = prefix || '';
            if (count !== outer.length) {
                error = count + ' columns expected instead of ' + outer.length;
            } else {
                for (var i = 0; i < count; i++) {
                    error = this._checkFormatColumns(self[i], outer[i] || {}, i);
                    if (error) {
                        break;
                    }
                }
            }
            if (error) {
                util_1.logger.info(this._moduleName + prefix + ': the formats are not equal (' + error + ')');
            }
        },
        _checkFormatColumns: function (self, outer, index) {
            if (self.n !== outer.n) {
                return 'field with name "' + self.n + '" at position ' + index + ' expected instead of "' + outer.n + '"';
            }
            var selfType = self.t;
            var outerType;
            if (selfType && selfType.n) {
                selfType = selfType.n;
            }
            outerType = outer.t;
            if (outerType && outerType.n) {
                outerType = outerType.n;
            }
            if (selfType !== outerType) {
                return 'expected field type for "' + self.n + '" at position \'' + index + ' is "' + selfType + '" instead of "' + outerType + '"';
            }
        },
        _buildFormatDeclaration: function (name) {
            var index = this._getFieldIndex(name);
            var type = this._getFieldType(index);
            var declaration = this._getFieldMeta(index, type);
            declaration.name = name;
            declaration.type = type;
            return declaration;
        },
        _buildFormat: function (name) {
            return format_1.fieldsFactory(this._buildFormatDeclaration(name));
        },
        _buildS: function (format) {
            var data = {
                t: '',
                n: format.getName()
            };
            this._buildSType(data, format);
            return data;
        },
        _buildSType: function (data, format) {
            var type = (format.getTypeName() + '').toLowerCase();
            switch (type) {
            case 'money':
                if (format.isLarge()) {
                    data.t = {
                        n: SbisFieldType_1.default[type],
                        l: true
                    };
                } else {
                    data.t = SbisFieldType_1.default[type];
                }
                break;
            case 'enum':
            case 'flags':
                var dict = format.getDictionary();
                if (dict instanceof Array) {
                    dict = dict.reduce(function (prev, curr, index) {
                        prev[index] = curr;
                        return prev;
                    }, {});
                }
                data.t = {
                    n: SbisFieldType_1.default[type],
                    s: dict
                };
                break;
            case 'datetime':
                var withoutTimeZone = format.isWithoutTimeZone();
                if (withoutTimeZone) {
                    data.t = {
                        n: SbisFieldType_1.default[type],
                        tz: !withoutTimeZone
                    };
                } else {
                    data.t = SbisFieldType_1.default[type];
                }
                break;
            case 'array':
                data.t = {
                    n: SbisFieldType_1.default[type],
                    t: getFieldInnerTypeNameByOuter(format.getKind())
                };
                break;
            default:
                data.t = SbisFieldType_1.default[type];
            }
        },
        _buildD: function () {
            throw new Error('Method must be implemented');
        },
        _removeD: function () {
            throw new Error('Method must be implemented');
        }    // endregion Protected methods
    };
    // endregion Protected methods
    exports.default = SbisFormatMixin;
});