/// <amd-module name="Transport/nodeType" />
//@ts-ignore
import { nodeType } from 'Browser/TransportOld';
//@ts-ignore
import { IoC } from 'Env/Env';
IoC.resolve('ILogger').log("Transport/getRpcInvocationUrl", 'module has been moved to "Browser/TransportOld:nodeType" and will be removed');

export = nodeType;
