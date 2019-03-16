/// <amd-module name="Transport/TransportError" />
//@ts-ignore
import { RPC } from 'Browser/Transport';
//@ts-ignore
import { IoC } from 'Env/Env';
IoC.resolve('ILogger').log("Transport/TransportError", 'module has been moved to "Browser/Transport:RPC.Error" and will be removed');

export = RPC.Error;
