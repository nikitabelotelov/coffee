/// <amd-module name="Types/_entity/adapter" />
/**
 * Adapters library.
 * @library Types/_entity/adapter
 * @includes DestroyableMixin Types/_entity/adapter/DestroyableMixin
 * @includes Cow Types/_entity/adapter/Cow
 * @includes CowRecord Types/_entity/adapter/CowRecord
 * @includes CowTable Types/_entity/adapter/CowTable
 * @includes Json Types/_entity/adapter/Json
 * @includes JsonRecord Types/_entity/adapter/JsonRecord
 * @includes JsonTable Types/_entity/adapter/JsonTable
 * @includes IAdapter Types/_entity/adapter/IAdapter
 * @includes IDecorator Types/_entity/adapter/IDecorator
 * @includes IMetaData Types/_entity/adapter/IMetaData
 * @includes IRecord Types/_entity/adapter/IRecord
 * @includes ITable Types/_entity/adapter/ITable
 * @includes RecordSet Types/_entity/adapter/RecordSet
 * @includes RecordSetRecord Types/_entity/adapter/RecordSetRecord
 * @includes RecordSetTable Types/_entity/adapter/RecordSetTable
 * @includes Sbis Types/_entity/adapter/Sbis
 * @includes SbisFieldType Types/_entity/adapter/SbisFieldType
 * @includes SbisRecord Types/_entity/adapter/SbisRecord
 * @includes SbisTable Types/_entity/adapter/SbisTable
 * @author Мальцев А.А.
 */
define('Types/_entity/adapter', [
    'require',
    'exports',
    'Types/_entity/adapter/Abstract',
    'Types/_entity/adapter/Cow',
    'Types/_entity/adapter/GenericFormatMixin',
    'Types/_entity/adapter/Json',
    'Types/_entity/adapter/IAdapter',
    'Types/_entity/adapter/IMetaData',
    'Types/_entity/adapter/IRecord',
    'Types/_entity/adapter/ITable',
    'Types/_entity/adapter/RecordSet',
    'Types/_entity/adapter/RecordSetRecord',
    'Types/_entity/adapter/RecordSetTable',
    'Types/_entity/adapter/Sbis',
    'Types/_entity/adapter/SbisFieldType',
    'Types/_entity/adapter/SbisRecord',
    'Types/_entity/adapter/SbisTable'
], function (require, exports, Abstract_1, Cow_1, GenericFormatMixin_1, Json_1, IAdapter_1, IMetaData_1, IRecord_1, ITable_1, RecordSet_1, RecordSetRecord_1, RecordSetTable_1, Sbis_1, SbisFieldType_1, SbisRecord_1, SbisTable_1) {
    'use strict';
    Object.defineProperty(exports, '__esModule', { value: true });
    exports.Abstract = Abstract_1.default;
    exports.Cow = Cow_1.default;
    exports.GenericFormatMixin = GenericFormatMixin_1.default;
    exports.Json = Json_1.default;
    exports.IAdapter = IAdapter_1.default;
    exports.IMetaData = IMetaData_1.default;
    exports.IRecord = IRecord_1.default;
    exports.ITable = ITable_1.default;
    exports.RecordSet = RecordSet_1.default;
    exports.RecordSetRecord = RecordSetRecord_1.default;
    exports.RecordSetTable = RecordSetTable_1.default;
    exports.Sbis = Sbis_1.default;
    exports.SbisFieldType = SbisFieldType_1.default;
    exports.SbisRecord = SbisRecord_1.default;
    exports.SbisTable = SbisTable_1.default;
});