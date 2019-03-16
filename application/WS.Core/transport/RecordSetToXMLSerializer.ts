/// <amd-module name="Transport/RecordSetToXMLSerializer" />
//@ts-ignore
import { RecordSetToXMLSerializer } from 'Browser/TransportOld';
//@ts-ignore
import { IoC } from 'Env/Env';
IoC.resolve('ILogger').log("Transport/getRpcInvocationUrl", 'module has been moved to "Browser/TransportOld:RecordSetToXMLSerializer" and will be removed');

export = RecordSetToXMLSerializer;
