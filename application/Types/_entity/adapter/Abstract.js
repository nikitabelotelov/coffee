/// <amd-module name="Types/_entity/adapter/Abstract" />
/**
 * Абстрактный адаптер для данных.
 * Это абстрактный класс, не предназначенный для создания самостоятельных экземпляров.
 * @class Types/_entity/adapter/Abstract
 * @mixes Types/_entity/DestroyableMixin
 * @implements Types/_entity/adapter/IAdapter
 * @mixes Types/_entity/SerializableMixin
 * @public
 * @author Мальцев А.А.
 */
define('Types/_entity/adapter/Abstract', [
    'require',
    'exports',
    'tslib',
    'Types/_entity/DestroyableMixin',
    'Types/_entity/SerializableMixin',
    'Types/util',
    'Types/formatter'
], function (require, exports, tslib_1, DestroyableMixin_1, SerializableMixin_1, util_1, formatter_1) {
    'use strict';
    Object.defineProperty(exports, '__esModule', { value: true });
    var serialize = function () {
        function serializeAny(data) {
            if (data instanceof Array) {
                return serializeArray(data);
            } else if (data && typeof data === 'object') {
                return serializeObject(data);
            } else {
                return data;
            }
        }
        function serializeArray(arr) {
            return arr.map(function (item) {
                return serializeAny(item);
            });
        }
        function serializeObject(obj) {
            if (typeof obj.getRawData === 'function') {
                // Instance of Types/_entity/Record || Types/_collection/RecordSet || Types/_source/DataSet
                return obj.getRawData(true);
            } else if (obj instanceof Date) {
                var mode = formatter_1.TO_SQL_MODE.DATETIME;
                if (obj.getSQLSerializationMode) {
                    switch (obj.getSQLSerializationMode()) {
                    case Date.SQL_SERIALIZE_MODE_DATE:
                        mode = formatter_1.TO_SQL_MODE.DATE;
                        break;
                    case Date.SQL_SERIALIZE_MODE_TIME:
                        mode = formatter_1.TO_SQL_MODE.TIME;
                        break;
                    }
                }
                return formatter_1.dateToSql(obj, mode);
            } else {
                // Check if 'obj' is a scalar value wrapper
                if (obj.valueOf) {
                    obj = obj.valueOf();
                }
                if (obj && typeof obj === 'object') {
                    return serializePlainObject(obj);
                }
                return obj;
            }
        }
        function serializePlainObject(obj) {
            var result = {};
            var proto = Object.getPrototypeOf(obj);
            if (proto !== null && proto !== Object.prototype) {
                throw new TypeError('Unsupported object type. Only plain objects can be serialized.');
            }
            var keys = Object.keys(obj);
            var key;
            for (var i = 0; i < keys.length; i++) {
                key = keys[i];
                result[key] = serializeAny(obj[key]);
            }
            return result;
        }
        return serializeAny;
    }();
    var Abstract = /** @class */
    function (_super) {
        tslib_1.__extends(Abstract, _super);
        function Abstract() {
            var _this = _super.call(this) || this;
            SerializableMixin_1.default.constructor.call(_this);
            return _this;
        }
        Abstract.prototype.getProperty = function (data, property) {
            property = property || '';
            var parts = property.split(this._pathSeparator);
            var result;
            for (var i = 0; i < parts.length; i++) {
                result = i ? result ? result[parts[i]] : undefined : data ? data[parts[i]] : undefined;
            }
            return result;
        };
        Abstract.prototype.setProperty = function (data, property, value) {
            if (!data || !(data instanceof Object)) {
                return;
            }
            property = property || '';
            var parts = property.split(this._pathSeparator);
            var current = data;
            for (var i = 0, max = parts.length - 1; i <= max; i++) {
                if (i === max) {
                    current[parts[i]] = value;
                } else {
                    if (current[parts[i]] === undefined) {
                        current[parts[i]] = {};
                    }
                    current = current[parts[i]];
                }
            }
        };
        Abstract.prototype.serialize = function (data) {
            return serialize(data);
        };
        Abstract.prototype.forRecord = function (data, tableData) {
            throw new Error('Method must be implemented');
        };
        Abstract.prototype.forTable = function (data) {
            throw new Error('Method must be implemented');
        };
        Abstract.prototype.getKeyField = function (data) {
            throw new Error('Method must be implemented');
        };
        return Abstract;
    }(util_1.mixin(DestroyableMixin_1.default, SerializableMixin_1.default));
    exports.default = Abstract;
    Object.assign(Abstract.prototype, {
        '[Types/_entity/adapter/Abstract]': true,
        '[Types/_entity/adapter/IAdapter]': true,
        _pathSeparator: '.'
    });
});