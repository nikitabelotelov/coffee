/// <amd-module name="Transport/prepareGetRPCInvocationURL" />
//@ts-ignore
import { prepareGetRPCInvocationURL } from 'Browser/TransportOld';
//@ts-ignore
import { IoC } from 'Env/Env';
IoC.resolve('ILogger').log("Transport/getRpcInvocationUrl", 'module has been moved to "Browser/TransportOld:prepareGetRPCInvocationURL" and will be removed');

export = prepareGetRPCInvocationURL;
