/// <amd-module name="Types/_entity/adapter/JsonTable" />
/**
 * Адаптер для таблицы данных в формате JSON.
 * Работает с данными, представленными в виде массива (Array.<Object>).
 *
 * Создадим адаптер для таблицы:
 * <pre>
 *    var adapter = new JsonTable([{
 *       id: 1,
 *       title: 'Test 1'
 *    }, {
 *       id: 2,
 *       title: 'Test 2'
 *    }]);
 *    adapter.at(0);//{id: 1, title: 'Test 1'}
 * </pre>
 * @class Types/_entity/adapter/JsonTable
 * @mixes Types/_entity/DestroyableMixin
 * @implements Types/_entity/adapter/ITable
 * @mixes Types/_entity/adapter/GenericFormatMixin
 * @mixes Types/_entity/adapter/JsonFormatMixin
 * @public
 * @author Мальцев А.А.
 */
define('Types/_entity/adapter/JsonTable', [
    'require',
    'exports',
    'tslib',
    'Types/_entity/DestroyableMixin',
    'Types/_entity/adapter/GenericFormatMixin',
    'Types/_entity/adapter/JsonFormatMixin',
    'Types/_entity/adapter/JsonRecord',
    'Types/shim',
    'Types/util',
    'Types/object'
], function (require, exports, tslib_1, DestroyableMixin_1, GenericFormatMixin_1, JsonFormatMixin_1, JsonRecord_1, shim_1, util_1, object_1) {
    'use strict';
    Object.defineProperty(exports, '__esModule', { value: true });
    var JsonTable = /** @class */
    function (_super) {
        tslib_1.__extends(JsonTable, _super);    /**
         * Конструктор
         * @param {*} data Сырые данные
         */
        /**
         * Конструктор
         * @param {*} data Сырые данные
         */
        function JsonTable(data) {
            var _this = _super.call(this, data) || this;
            GenericFormatMixin_1.default.constructor.call(_this, data);
            JsonFormatMixin_1.default.constructor.call(_this, data);
            return _this;
        }    //region ITable
             //region Types/_entity/adapter/JsonFormatMixin
        //region ITable
        //region Types/_entity/adapter/JsonFormatMixin
        JsonTable.prototype.addField = function (format, at) {
            JsonFormatMixin_1.default.addField.call(this, format, at);
            var name = format.getName();
            var value = format.getDefaultValue();
            var item;
            for (var i = 0; i < this._data.length; i++) {
                item = this._data[i];
                if (!item.hasOwnProperty(name)) {
                    item[name] = value;
                }
            }
        };
        JsonTable.prototype.removeField = function (name) {
            JsonFormatMixin_1.default.removeField.call(this, name);
            for (var i = 0; i < this._data.length; i++) {
                delete this._data[i][name];
            }
        };    //endregion Types/_entity/adapter/JsonFormatMixin
              //region Public methods
        //endregion Types/_entity/adapter/JsonFormatMixin
        //region Public methods
        JsonTable.prototype.getFields = function () {
            var count = this.getCount();
            var fieldSet = new shim_1.Set();
            var fields = [];
            var item;
            var collector = function (field) {
                fieldSet.add(field);
            };
            for (var i = 0; i < count; i++) {
                item = this.at(i);
                if (item instanceof Object) {
                    Object.keys(item).forEach(collector);
                }
            }
            fieldSet.forEach(function (field) {
                fields.push(field);
            });
            return fields;
        };
        JsonTable.prototype.getCount = function () {
            return this._isValidData() ? this._data.length : 0;
        };
        JsonTable.prototype.add = function (record, at) {
            this._touchData();
            if (at === undefined) {
                this._data.push(record);
            } else {
                this._checkPosition(at);
                this._data.splice(at, 0, record);
            }
        };
        JsonTable.prototype.at = function (index) {
            return this._isValidData() ? this._data[index] : undefined;
        };
        JsonTable.prototype.remove = function (at) {
            this._touchData();
            this._checkPosition(at);
            this._data.splice(at, 1);
        };
        JsonTable.prototype.replace = function (record, at) {
            this._touchData();
            this._checkPosition(at);
            this._data[at] = record;
        };
        JsonTable.prototype.move = function (source, target) {
            this._touchData();
            if (target === source) {
                return;
            }
            var removed = this._data.splice(source, 1);
            if (target === -1) {
                this._data.unshift(removed.shift());
            } else {
                this._data.splice(target, 0, removed.shift());
            }
        };
        JsonTable.prototype.merge = function (acceptor, donor, idProperty) {
            this._touchData();
            var first = this.at(acceptor);
            var extention = this.at(donor);
            var adapter = new JsonRecord_1.default(first);
            var id = adapter.get(idProperty);
            object_1.merge(first, extention);
            adapter.set(idProperty, id);
            this.remove(donor);
        };
        JsonTable.prototype.copy = function (index) {
            this._touchData();
            var source = this.at(index);
            var clone = object_1.merge({}, source);
            this.add(clone, 1 + index);
            return clone;
        };
        JsonTable.prototype.clear = function () {
            this._touchData();
            this._data.length = 0;
        };    //endregion Public methods
              //region Protected methods
        //endregion Public methods
        //region Protected methods
        JsonTable.prototype._touchData = function () {
            GenericFormatMixin_1.default._touchData.call(this);
            if (!(this._data instanceof Array)) {
                this._data = [];
            }
        };
        JsonTable.prototype._isValidData = function () {
            return this._data instanceof Array;
        };
        JsonTable.prototype._has = function (name) {
            var count = this.getCount();
            var has = false;
            var item;
            for (var i = 0; i < count; i++) {
                item = this.at(i);
                if (item instanceof Object) {
                    has = item.hasOwnProperty(name);
                    if (has) {
                        break;
                    }
                }
            }
            return has;
        };
        JsonTable.prototype._checkPosition = function (at) {
            if (at < 0 || at > this._data.length) {
                throw new Error('Out of bounds');
            }
        };
        return JsonTable;
    }(util_1.mixin(DestroyableMixin_1.default, GenericFormatMixin_1.default, JsonFormatMixin_1.default));
    exports.default = JsonTable;
    JsonTable.prototype['[Types/_entity/adapter/JsonTable]'] = true;
    JsonTable.prototype._data = null;
});