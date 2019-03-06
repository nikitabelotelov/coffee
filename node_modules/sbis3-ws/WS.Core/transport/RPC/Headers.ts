/// <amd-module name="Transport/RPC/Headers" />
//@ts-ignore
import { RPC } from 'Browser/Transport';
//@ts-ignore
import { IoC } from 'Env/Env';
IoC.resolve('ILogger').log("Transport/RPC/Headers", 'module has been moved to "Browser/Transport:RPC.Headers" and will be removed');

export = RPC.Headers;
