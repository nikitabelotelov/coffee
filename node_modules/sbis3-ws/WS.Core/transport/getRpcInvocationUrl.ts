/// <amd-module name="Transport/getRpcInvocationUrl" />
//@ts-ignore
import { RPC } from 'Browser/Transport';
//@ts-ignore
import { IoC } from 'Env/Env';
IoC.resolve('ILogger').log("Transport/getRpcInvocationUrl", 'module has been moved to "Browser/Transport:RPC.getInvocationUrl" and will be removed');

export = RPC.getInvocationUrl;
