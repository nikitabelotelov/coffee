/// <amd-module name="Transport/RPC/Body" />
//@ts-ignore
import { RPC } from 'Browser/Transport';
//@ts-ignore
import { IoC } from 'Env/Env';
IoC.resolve('ILogger').log("Transport/RPC/Body", 'module has been moved to "Browser/Transport:RPC.Body" and will be removed');

export = RPC.Body;
