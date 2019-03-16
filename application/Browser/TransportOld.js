define('Browser/TransportOld', [
    'require',
    'exports',
    'Browser/_TransportOld/ReportPrinter',
    'Browser/_TransportOld/RecordTypes',
    'Browser/_TransportOld/RecordSetToXMLSerializer',
    'Browser/_TransportOld/RecordSet',
    'Browser/_TransportOld/Record',
    'Browser/_TransportOld/prepareGetRPCInvocationURL',
    'Browser/_TransportOld/nodeType',
    'Browser/_TransportOld/attachTemplate',
    'Browser/_TransportOld/CompoundControlTemplate',
    'Browser/_TransportOld/EmptyTemplate',
    'Browser/_TransportOld/Template',
    'Browser/_TransportOld/FastTemplate',
    'Browser/_TransportOld/XMLTemplate',
    'Browser/_TransportOld/BLObject'
], function (require, exports, ReportPrinter, RecordTypes, RecordSetToXMLSerializer, RecordSet, Record, prepareGetRPCInvocationURL, nodeType, attachTemplate, CompoundControlTemplate, EmptyTemplate, Template, FastTemplate, XMLTemplate, BLObject) {
    'use strict';
    Object.defineProperty(exports, '__esModule', { value: true });
    exports.ReportPrinter = ReportPrinter;
    exports.RecordTypes = RecordTypes;
    exports.RecordSetToXMLSerializer = RecordSetToXMLSerializer;
    exports.RecordSet = RecordSet;
    exports.Record = Record;
    exports.prepareGetRPCInvocationURL = prepareGetRPCInvocationURL;
    exports.nodeType = nodeType;
    exports.attachTemplate = attachTemplate;
    exports.CompoundControlTemplate = CompoundControlTemplate;
    exports.EmptyTemplate = EmptyTemplate;
    exports.Template = Template;
    exports.FastTemplate = FastTemplate;
    exports.XMLTemplate = XMLTemplate;
    exports.BLObject = BLObject;
});