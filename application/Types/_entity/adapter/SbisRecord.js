/// <amd-module name="Types/_entity/adapter/SbisRecord" />
/**
 * Адаптер для записи таблицы данных в формате СБиС.
 * Работает с данными, представленными в виде объекта ({_entity: 'record', d: [], s: []}), где
 * <ul>
 *    <li>d - значения полей записи;</li>
 *    <li>s - описание полей записи.</li>
 * </ul>
 *
 * Создадим адаптер для записи:
 * <pre>
 *    var adapter = new SbisRecord({
 *       _entity: 'record',
 *       d: [1, 'Test'],
 *       s: [
 *          {n: 'id', t: 'Число целое'},
 *          {n: 'title', t: 'Строка'}
 *       ]
 *    });
 *    adapter.get('title');//'Test'
 * </pre>
 * @class Types/_entity/adapter/SbisRecord
 * @mixes Types/_entity/DestroyableMixin
 * @implements Types/_entity/adapter/IRecord
 * @implements Types/_entity/ICloneable
 * @mixes Types/_entity/adapter/SbisFormatMixin
 * @public
 * @author Мальцев А.А.
 */
define('Types/_entity/adapter/SbisRecord', [
    'require',
    'exports',
    'tslib',
    'Types/_entity/DestroyableMixin',
    'Types/_entity/adapter/SbisFormatMixin',
    'Types/util'
], function (require, exports, tslib_1, DestroyableMixin_1, SbisFormatMixin_1, util_1) {
    'use strict';
    Object.defineProperty(exports, '__esModule', { value: true });
    var SbisRecord = /** @class */
    function (_super) {
        tslib_1.__extends(SbisRecord, _super);    /**
         * Конструктор
         * @param {*} data Сырые данные
         */
        /**
         * Конструктор
         * @param {*} data Сырые данные
         */
        function SbisRecord(data) {
            var _this = _super.call(this, data) || this;
            SbisFormatMixin_1.default.constructor.call(_this, data);
            return _this;
        }
        SbisRecord.prototype.has = function (name) {
            return this._has(name);
        };
        SbisRecord.prototype.get = function (name) {
            var index = this._getFieldIndex(name);
            return index >= 0 ? this._cast(this._data.s[index], this._data.d[index]) : undefined;
        };
        SbisRecord.prototype.set = function (name, value) {
            var index = this._getFieldIndex(name);
            if (index < 0) {
                throw new ReferenceError(this._moduleName + '::set(): field "' + name + '" is not defined');
            }
            this._data.d[index] = this._uncast(this._data.s[index], value);
        };
        SbisRecord.prototype.clear = function () {
            this._touchData();
            SbisFormatMixin_1.default.clear.call(this);
            this._data.s.length = 0;
        };
        SbisRecord.prototype.clone = function (shallow) {
            // FIXME: shall share _data.s with recordset _data.s after clone to keep in touch. Probably no longer need this.
            return new SbisRecord(shallow ? this.getData() : this._cloneData(true));
        };    // endregion
              // region SbisFormatMixin
        // endregion
        // region SbisFormatMixin
        SbisRecord.prototype._buildD = function (at, value) {
            this._data.d.splice(at, 0, value);
        };
        SbisRecord.prototype._removeD = function (at) {
            this._data.d.splice(at, 1);
        };    // endregion
              // region Protected methods
        // endregion
        // region Protected methods
        SbisRecord.prototype._cast = function (format, value) {
            switch (format && format.t) {
            case 'Идентификатор':
                return value instanceof Array ? value[0] === null ? value[0] : value.join(this._castSeparator) : value;
            }
            return value;
        };
        SbisRecord.prototype._uncast = function (format, value) {
            switch (format && format.t) {
            case 'Идентификатор':
                if (value instanceof Array) {
                    return value;
                }
                return typeof value === 'string' ? value.split(this._castSeparator) : [value];
            }
            return value;
        };
        return SbisRecord;
    }(util_1.mixin(DestroyableMixin_1.default, SbisFormatMixin_1.default));
    exports.default = SbisRecord;
    Object.assign(SbisRecord.prototype, {
        '[Types/_entity/adapter/SbisRecord]': true,
        '[Types/_entity/adapter/IRecord]': true,
        '[Types/_entity/ICloneable]': true,
        _type: 'record',
        _castSeparator: ','
    });    // FIXME: backward compatibility for check via Core/core-instance::instanceOfMixin()
    // FIXME: backward compatibility for check via Core/core-instance::instanceOfMixin()
    SbisRecord.prototype['[WS.Data/Entity/ICloneable]'] = true;
});