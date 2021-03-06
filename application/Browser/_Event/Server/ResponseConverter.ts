/// <amd-module name="Browser/_Event/Server/ResponseConverter" />
"use strict";
// @ts-ignore
import { Record, RecordSet } from "optional!Types/entity";

let createRecord = unmodify;
let createRecordSet = unmodify;
if (!!Record) {
    createRecord = (data: any) => {
        if (data._type != 'record') { throw new TypeError('Raw data is not Record'); }
        return new Record({
            rawData: data,
            adapter: 'adapter.sbis'
        });
    }
}
if (!!RecordSet) {
    createRecordSet = (data: any) => {
        if (data._type != 'recordset' ) { throw new TypeError('Raw data is not RecordSet'); }
        return new RecordSet({
            rawData: data,
            adapter: 'adapter.sbis'
        });
    }
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

function traversObject(data: Object) {
    for (let name in data) {
        if (!data.hasOwnProperty(name)) { continue; }
        data[name] = travers(data[name]);
    }
    return data;
}

function traversArray(data: Array<any>) {
    let result = [];
    for (var i of data) {
        result.push(travers(i));
    }
    return result;
}

function travers(data: any) {
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

function convert(raw: string): any {
    return travers(JSON.parse(raw));
}

export = convert;
