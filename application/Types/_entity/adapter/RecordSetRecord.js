/// <amd-module name="Types/_entity/adapter/RecordSetRecord" />
/**
 * Адаптер для записи таблицы данных в формате записи.
 * Работает с данными, представленными в виде экземлпяра {@link Types/_entity/Record}.
 *
 * Создадим адаптер для записи:
 * <pre>
 *    var record = new Record({
 *          rawData: {
 *             id: 1,
 *             title: 'Test'
 *          }
 *       }),
 *       adapter = new RecordSetRecord(record);
 *    adapter.get('title');//'Test'
 * </pre>
 * @class Types/_entity/adapter/RecordSetRecord
 * @mixes Types/_entity/DestroyableMixin
 * @implements Types/_entity/adapter/IRecord
 * @mixes Types/_entity/adapter/GenericFormatMixin
 * @public
 * @author Мальцев А.А.
 */
define('Types/_entity/adapter/RecordSetRecord', [
    'require',
    'exports',
    'tslib',
    'Types/_entity/DestroyableMixin',
    'Types/_entity/adapter/GenericFormatMixin',
    'Types/di',
    'Types/util'
], function (require, exports, tslib_1, DestroyableMixin_1, GenericFormatMixin_1, di_1, util_1) {
    'use strict';
    Object.defineProperty(exports, '__esModule', { value: true });
    var RecordSetRecord = /** @class */
    function (_super) {
        tslib_1.__extends(RecordSetRecord, _super);    /**
         * Конструктор
         * @param {Types/_entity/Record} data Сырые данные
         * @param {Types/_collection/RecordSet} [tableData] Таблица
         */
        /**
         * Конструктор
         * @param {Types/_entity/Record} data Сырые данные
         * @param {Types/_collection/RecordSet} [tableData] Таблица
         */
        function RecordSetRecord(data, tableData) {
            var _this = this;
            if (data && !data['[Types/_entity/Record]']) {
                throw new TypeError('Argument "data" should be an instance of Types/entity:Record');
            }
            _this = _super.call(this, data) || this;
            GenericFormatMixin_1.default.constructor.call(_this, data);
            _this._tableData = tableData;
            return _this;
        }
        RecordSetRecord.prototype.has = function (name) {
            return this._isValidData() ? this._data.has(name) : false;
        };
        RecordSetRecord.prototype.get = function (name) {
            return this._isValidData() ? this._data.get(name) : undefined;
        };
        RecordSetRecord.prototype.set = function (name, value) {
            if (!name) {
                throw new ReferenceError(this._moduleName + '::set(): argument "name" is not defined');
            }
            this._touchData();
            if (!this._isValidData()) {
                throw new TypeError('Passed data has invalid format');
            }
            return this._data.set(name, value);
        };
        RecordSetRecord.prototype.clear = function () {
            this._touchData();
            if (!this._isValidData()) {
                throw new TypeError('Passed data has invalid format');
            }
            var fields = this.getFields();
            var format = this._data.getFormat();
            if (format) {
                var field = void 0;
                var index = void 0;
                for (var i = 0; i < fields.length; i++) {
                    field = fields[i];
                    index = format.getFieldIndex(field);
                    if (index > -1) {
                        this._data.removeField(field);
                    }
                }
            }
        };
        RecordSetRecord.prototype.getFields = function () {
            var fields = [];
            if (this._isValidData()) {
                this._data.getFormat().each(function (field) {
                    fields.push(field.getName());
                });
            }
            return fields;
        };
        RecordSetRecord.prototype.addField = function (format, at) {
            this._touchData();
            if (!this._isValidData()) {
                throw new TypeError('Passed data has invalid format');
            }
            this._data.addField(format, at);
        };
        RecordSetRecord.prototype.removeField = function (name) {
            this._touchData();
            if (!this._isValidData()) {
                throw new TypeError('Passed data has invalid format');
            }
            this._data.removeField(name);
        };
        RecordSetRecord.prototype.removeFieldAt = function (index) {
            this._touchData();
            if (!this._isValidData()) {
                throw new TypeError('Passed data has invalid format');
            }
            this._data.removeFieldAt(index);
        };    // endregion
              // region Protected methods
        // endregion
        // region Protected methods
        RecordSetRecord.prototype._touchData = function () {
            if (!this._data && this._tableData && this._tableData['[Types/_entity/FormattableMixin]']) {
                var model = this._tableData.getModel();
                var adapter = this._tableData.getAdapter();
                this._data = di_1.create(model, { adapter: adapter });
            }
        };
        RecordSetRecord.prototype._isValidData = function () {
            return this._data && this._data['[Types/_entity/Record]'];
        };
        RecordSetRecord.prototype._getFieldsFormat = function () {
            return this._isValidData() ? this._data.getFormat() : di_1.create('Types/collection:format.Format');
        };
        return RecordSetRecord;
    }(util_1.mixin(DestroyableMixin_1.default, GenericFormatMixin_1.default));
    exports.default = RecordSetRecord;
    Object.assign(RecordSetRecord.prototype, {
        '[Types/_entity/adapter/RecordSetRecord]': true,
        '[Types/_entity/adapter/IRecord]': true,
        _data: null,
        _tableData: null
    });
});