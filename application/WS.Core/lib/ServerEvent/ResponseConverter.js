define("Lib/ServerEvent/ResponseConverter", ["require", "exports", "optional!Types/entity", "optional!Types/collection"], function (require, exports, entity, collection) {
    /// <amd-module name="Lib/ServerEvent/ResponseConverter" />
    "use strict";
    var createRecord = unmodify;
    var createRecordSet = unmodify;
    if (!!entity) {
        createRecord = function (data) {
            if (data._type != 'record') {
                throw new TypeError('Raw data is not Record');
            }
            return new entity.Record({
                rawData: data,
                adapter: 'adapter.sbis'
            });
        };
    }
    if (!!collection) {
        createRecordSet = function (data) {
            if (data._type != 'recordset') {
                throw new TypeError('Raw data is not RecordSet');
            }
            return new collection.RecordSet({
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
        for (var name_1 in data) {
            if (!data.hasOwnProperty(name_1)) {
                continue;
            }
            data[name_1] = travers(data[name_1]);
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
        }
        /**
         * При большом количестве событий, события склеиваются массивы,
         * до отправления в кролика
         */
        if (data instanceof Array) {
            return traversArray(data);
        }
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