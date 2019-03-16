/// <amd-module name="Transport/RecordTypes" />
//@ts-ignore
import { RecordTypes } from 'Browser/TransportOld';
//@ts-ignore
import { IoC } from 'Env/Env';
IoC.resolve('ILogger').log("Transport/getRpcInvocationUrl", 'module has been moved to "Browser/TransportOld:RecordTypes" and will be removed');

export = RecordTypes;
