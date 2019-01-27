/// <amd-module name="Types/_entity/adapter/JsonRecord" />
/**
 * Адаптер для записи таблицы данных в формате JSON
 * Работает с данными, представленными в виде объекта (Object).
 *
 * Создадим адаптер для записи:
 * <pre>
 *    var adapter = new JsonRecord({
 *       id: 1,
 *       title: 'Test'
 *    });
 *    adapter.get('title');//'Test'
 * </pre>
 * @class Types/_entity/adapter/JsonRecord
 * @mixes Types/_entity/DestroyableMixin
 * @implements Types/_entity/adapter/IRecord
 * @mixes Types/_entity/adapter/GenericFormatMixin
 * @mixes Types/_entity/adapter/JsonFormatMixin
 * @public
 * @author Мальцев А.А.
 */
define('Types/_entity/adapter/JsonRecord', [
    'require',
    'exports',
    'tslib',
    'Types/_entity/DestroyableMixin',
    'Types/_entity/adapter/GenericFormatMixin',
    'Types/_entity/adapter/JsonFormatMixin',
    'Types/_entity/format',
    'Types/util'
], function (require, exports, tslib_1, DestroyableMixin_1, GenericFormatMixin_1, JsonFormatMixin_1, format_1, util_1) {
    'use strict';
    Object.defineProperty(exports, '__esModule', { value: true });
    var JsonRecord = /** @class */
    function (_super) {
        tslib_1.__extends(JsonRecord, _super);    /**
         * Конструктор
         * @param {*} data Сырые данные
         */
        /**
         * Конструктор
         * @param {*} data Сырые данные
         */
        function JsonRecord(data) {
            var _this = _super.call(this, data) || this;
            GenericFormatMixin_1.default.constructor.call(_this, data);
            JsonFormatMixin_1.default.constructor.call(_this, data);
            return _this;
        }    //endregion IRecord
             //region Types/_entity/adapter/JsonFormatMixin
        //endregion IRecord
        //region Types/_entity/adapter/JsonFormatMixin
        JsonRecord.prototype.addField = function (format, at) {
            if (!format || !(format instanceof format_1.Field)) {
                throw new TypeError(this._moduleName + '::addField(): argument "format" should be an instance of Types/entity:format.Field');
            }
            var name = format.getName();
            if (this.has(name)) {
                throw new Error(this._moduleName + '::addField(): field "' + name + '" already exists');
            }
            JsonFormatMixin_1.default.addField.call(this, format, at);
            this.set(name, format.getDefaultValue());
        };
        JsonRecord.prototype.removeField = function (name) {
            JsonFormatMixin_1.default.removeField.call(this, name);
            delete this._data[name];
        };    //endregion Types/_entity/adapter/JsonFormatMixin
              //region Public methods
        //endregion Types/_entity/adapter/JsonFormatMixin
        //region Public methods
        JsonRecord.prototype.has = function (name) {
            return this._isValidData() ? this._data.hasOwnProperty(name) : false;
        };
        JsonRecord.prototype.get = function (name) {
            return this._isValidData() ? this._data[name] : undefined;
        };
        JsonRecord.prototype.set = function (name, value) {
            if (!name) {
                throw new ReferenceError(this._moduleName + '::set(): field name is not defined');
            }
            this._touchData();
            this._data[name] = value;
        };
        JsonRecord.prototype.clear = function () {
            this._touchData();
            var keys = Object.keys(this._data);
            var count = keys.length;
            for (var i = 0; i < count; i++) {
                delete this._data[keys[i]];
            }
        };
        JsonRecord.prototype.getFields = function () {
            return this._isValidData() ? Object.keys(this._data) : [];
        };
        JsonRecord.prototype.getKeyField = function () {
            return undefined;
        };    //endregion Public methods
              //region Protected methods
        //endregion Public methods
        //region Protected methods
        JsonRecord.prototype._has = function (name) {
            return this.has(name);
        };
        return JsonRecord;
    }(util_1.mixin(DestroyableMixin_1.default, GenericFormatMixin_1.default, JsonFormatMixin_1.default));
    exports.default = JsonRecord;
    JsonRecord.prototype['[Types/_entity/adapter/JsonRecord]'] = true;    // @ts-ignore
    // @ts-ignore
    JsonRecord.prototype['[Types/_entity/adapter/IRecord]'] = true;
    JsonRecord.prototype._data = null;
});