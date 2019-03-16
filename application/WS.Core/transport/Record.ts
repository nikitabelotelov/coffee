/// <amd-module name="Transport/Record" />
//@ts-ignore
import { Record } from 'Browser/TransportOld';
//@ts-ignore
import { IoC } from 'Env/Env';
IoC.resolve('ILogger').log("Transport/getRpcInvocationUrl", 'module has been moved to "Browser/TransportOld:Record" and will be removed');

export = Record;
