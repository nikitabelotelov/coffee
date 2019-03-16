/// <amd-module name="Transport/RecordSet" />
//@ts-ignore
import { RecordSet } from 'Browser/TransportOld';
//@ts-ignore
import { IoC } from 'Env/Env';
IoC.resolve('ILogger').log("Transport/getRpcInvocationUrl", 'module has been moved to "Browser/TransportOld:RecordSet" and will be removed');

export = RecordSet;
