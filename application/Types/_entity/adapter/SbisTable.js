/// <amd-module name="Types/_entity/adapter/SbisTable" />
/**
 * Адаптер для таблицы данных в формате СБиС.
 * Работает с данными, представленными в виде объекта ({_entity: 'recordset', d: [], s: []}), где
 * <ul>
 *    <li>d - значения полей для каждой записи;</li>
 *    <li>s - описание полей записи.</li>
 * </ul>
 *
 * Создадим адаптер для таблицы:
 * <pre>
 *    var adapter = new SbisTable({
 *       _entity: 'recordset',
 *       d: [
 *          [1, 'Test 1'],
 *          [2, 'Test 2']
 *       ],
 *       s: [
 *          {n: 'id', t: 'Число целое'},
 *          {n: 'title', t: 'Строка'}
 *       ]
 *    });
 *    adapter.at(0);//{d: [1, 'Test 1'], s: [{n: 'id', t: 'Число целое'}, {n: 'title', t: 'Строка'}]}
 * </pre>
 * @class Types/_entity/adapter/SbisTable
 * @mixes Types/_entity/DestroyableMixin
 * @implements Types/_entity/adapter/ITable
 * @implements Types/_entity/adapter/IMetaData
 * @implements Types/_entity/ICloneable
 * @mixes Types/_entity/adapter/SbisFormatMixin
 * @public
 * @author Мальцев А.А.
 */
define('Types/_entity/adapter/SbisTable', [
    'require',
    'exports',
    'tslib',
    'Types/_entity/DestroyableMixin',
    'Types/_entity/adapter/SbisFormatMixin',
    'Types/_entity/adapter/SbisRecord',
    'Types/_entity/format',
    'Types/util',
    'Types/object'
], function (require, exports, tslib_1, DestroyableMixin_1, SbisFormatMixin_1, SbisRecord_1, format_1, util_1, object_1) {
    'use strict';
    Object.defineProperty(exports, '__esModule', { value: true });
    var SbisTable = /** @class */
    function (_super) {
        tslib_1.__extends(SbisTable, _super);    /**
         * Конструктор
         * @param {*} data Сырые данные
         */
        /**
         * Конструктор
         * @param {*} data Сырые данные
         */
        function SbisTable(data) {
            var _this = _super.call(this, data) || this;
            SbisFormatMixin_1.default.constructor.call(_this, data);
            return _this;
        }
        SbisTable.prototype.getCount = function () {
            return this._isValidData() ? this._data.d.length : 0;
        };
        SbisTable.prototype.add = function (record, at) {
            this._touchData();
            record = this._normalizeData(record, SbisRecord_1.default.prototype._type);
            if (this._data.d.length === 0 && record.s) {
                this._data.s = record.s;
            }
            this._checkFormat(record, '::add()');
            record.s = this._data.s;
            if (at === undefined) {
                this._data.d.push(record.d);
            } else {
                this._checkRowIndex(at, true);
                this._data.d.splice(at, 0, record.d);
            }
        };
        SbisTable.prototype.at = function (index) {
            return this._isValidData() && this._data.d[index] ? {
                d: this._data.d[index],
                s: this._data.s
            } : undefined;
        };
        SbisTable.prototype.remove = function (at) {
            this._touchData();
            this._checkRowIndex(at);
            this._data.d.splice(at, 1);
        };
        SbisTable.prototype.replace = function (record, at) {
            this._touchData();
            this._checkRowIndex(at);
            if (!this._data.s.length && record.s.length) {
                this._data.s = record.s;
            }
            record.s = this._data.s;
            this._checkFormat(record, '::replace()');
            this._data.d[at] = record.d;
        };
        SbisTable.prototype.move = function (source, target) {
            this._touchData();
            if (target === source) {
                return;
            }
            var removed = this._data.d.splice(source, 1);
            target === -1 ? this._data.d.unshift(removed.shift()) : this._data.d.splice(target, 0, removed.shift());
        };
        SbisTable.prototype.merge = function (acceptor, donor) {
            this._touchData();
            this._checkRowIndex(acceptor);
            this._checkRowIndex(donor);
            object_1.merge(this._data.d[acceptor], this._data.d[donor]);
            this.remove(donor);
        };
        SbisTable.prototype.copy = function (index) {
            this._touchData();
            this._checkRowIndex(index);
            var source = this._data.d[index];
            var clone = object_1.merge([], source);
            this._data.d.splice(1 + index, 0, clone);
            return clone;
        };
        SbisTable.prototype.getMetaDataDescriptor = function () {
            var result = [];
            var data = this.getData();
            if (!(data instanceof Object)) {
                return result;
            }
            if (data.hasOwnProperty('r')) {
                result.push(format_1.fieldsFactory({
                    name: 'results',
                    type: 'record'
                }));
            }
            if (data.hasOwnProperty('p')) {
                result.push(format_1.fieldsFactory({
                    name: 'path',
                    type: 'recordset'
                }));
            }
            if (data.hasOwnProperty('n')) {
                var type = 'integer';
                switch (typeof data.n) {
                case 'boolean':
                    type = 'boolean';
                    break;
                case 'object':
                    if (data.n) {
                        type = 'object';
                    }
                    break;
                }
                result.push(format_1.fieldsFactory({
                    name: 'total',
                    type: type
                }));
                result.push(format_1.fieldsFactory({
                    name: 'more',
                    type: type
                }));
            }
            if (data.hasOwnProperty('m')) {
                var meta_1 = new SbisRecord_1.default(data.m);
                meta_1.getFields().forEach(function (name) {
                    result.push(meta_1.getFormat(name));
                });
            }
            return result;
        };
        SbisTable.prototype.getMetaData = function (name) {
            var alias = this._getMetaDataAlias(name);
            var data = this.getData();
            if (alias) {
                return data && data instanceof Object ? data[alias] : undefined;
            }
            var meta = new SbisRecord_1.default(data.m);
            return meta.get(name);
        };
        SbisTable.prototype.setMetaData = function (name, value) {
            var alias = this._getMetaDataAlias(name);
            var data = this.getData();
            if (alias) {
                if (data && data instanceof Object) {
                    data[alias] = value;
                }
                return;
            }
            var meta = new SbisRecord_1.default(data.m);
            meta.set(name, value);
        };
        SbisTable.prototype._getMetaDataAlias = function (name) {
            switch (name) {
            case 'results':
                return 'r';
            case 'path':
                return 'p';
            case 'more':
            case 'total':
                return 'n';
            }
        };
        SbisTable.prototype.clone = function (shallow) {
            return new SbisTable(shallow ? this.getData() : this._cloneData());
        };    //endregion ICloneable
              //region SbisFormatMixin
        //endregion ICloneable
        //region SbisFormatMixin
        SbisTable.prototype._buildD = function (at, value) {
            this._data.d.forEach(function (item) {
                item.splice(at, 0, value);
            });
        };
        SbisTable.prototype._removeD = function (at) {
            this._data.d.forEach(function (item) {
                item.splice(at, 1);
            });
        };    //endregion SbisFormatMixin
              //region Protected methods
        //endregion SbisFormatMixin
        //region Protected methods
        SbisTable.prototype._checkRowIndex = function (index, addMode) {
            var max = this._data.d.length + (addMode ? 0 : -1);
            if (!(index >= 0 && index <= max)) {
                throw new RangeError(this._moduleName + ': row index ' + index + ' is out of bounds.');
            }
        };
        return SbisTable;
    }(util_1.mixin(DestroyableMixin_1.default, SbisFormatMixin_1.default));
    exports.default = SbisTable;
    SbisTable.prototype['[Types/_entity/adapter/SbisTable]'] = true;    // @ts-ignore
    // @ts-ignore
    SbisTable.prototype['[Types/_entity/adapter/ITable]'] = true;    // @ts-ignore
    // @ts-ignore
    SbisTable.prototype['[Types/_entity/adapter/IMetaData]'] = true;    // @ts-ignore
    // @ts-ignore
    SbisTable.prototype['[Types/_entity/ICloneable]'] = true;
    SbisTable.prototype._type = 'recordset';    //FIXME: backward compatibility for check via Core/core-instance::instanceOfMixin()
    //FIXME: backward compatibility for check via Core/core-instance::instanceOfMixin()
    SbisTable.prototype['[WS.Data/Entity/ICloneable]'] = true;
});