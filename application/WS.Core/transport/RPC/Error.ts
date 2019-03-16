/// <amd-module name="Transport/RPC/Error" />
//@ts-ignore
import { RPC } from 'Browser/Transport';
//@ts-ignore
import { IoC } from 'Env/Env';
IoC.resolve('ILogger').log("Transport/RPC/Error", 'module has been moved to "Browser/Transport:RPC.Error" and will be removed');

export = RPC.Error;
