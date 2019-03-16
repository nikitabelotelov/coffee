define('Browser/_Event/Server/ResponseConverter', [
    'require',
    'exports',
    'optional!Types/entity'
], function (require, exports, entity_1) {
    /// <amd-module name="Browser/_Event/Server/ResponseConverter" />
    'use strict';
    var createRecord = unmodify;
    var createRecordSet = unmodify;
    if (!!entity_1.Record) {
        createRecord = function (data) {
            if (data._type != 'record') {
                throw new TypeError('Raw data is not Record');
            }
            return new entity_1.Record({
                rawData: data,
                adapter: 'adapter.sbis'
            });
        };
    }
    if (!!entity_1.RecordSet) {
        createRecordSet = function (data) {
            if (data._type != 'recordset') {
                throw new TypeError('Raw data is not RecordSet');
            }
            return new entity_1.RecordSet({
                rawData: data,
                adapter: 'adapter.sbis'
            });
        };
    }
    function unmodify(data) {
        return data;
    }
    function isRawRecord(val) {
        return val && val.s && val.d && val._type == 'record';
    }
    function isRawRecordSet(val) {
        return val && val.s && val.d && val._type == 'recordset';
    }
    function traversObject(data) {
        for (var name in data) {
            if (!data.hasOwnProperty(name)) {
                continue;
            }
            data[name] = travers(data[name]);
        }
        return data;
    }
    function traversArray(data) {
        var result = [];
        for (var _i = 0, data_1 = data; _i < data_1.length; _i++) {
            var i = data_1[_i];
            result.push(travers(i));
        }
        return result;
    }
    function travers(data) {
        if (isRawRecord(data)) {
            return createRecord(data);
        }
        if (isRawRecordSet(data)) {
            return createRecordSet(data);
        }    /**
         * При большом количестве событий, события склеиваются массивы,
         * до отправления в кролика
         */
        /**
         * При большом количестве событий, события склеиваются массивы,
         * до отправления в кролика
         */
        if (data instanceof Array) {
            return traversArray(data);
        }    /**
         * Решили, что не будем обходить объекты и искать внутри.
         * Проверяем, только верхний уровень
         *
        if (data instanceof Object) {
            return traversObject(data);
        }*/
        /**
         * Решили, что не будем обходить объекты и искать внутри.
         * Проверяем, только верхний уровень
         *
        if (data instanceof Object) {
            return traversObject(data);
        }*/
        return data;
    }
    function convert(raw) {
        return travers(JSON.parse(raw));
    }
    return convert;
});