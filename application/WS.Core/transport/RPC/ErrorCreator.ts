/// <amd-module name="Transport/RPC/ErrorCreator" />
//@ts-ignore
import { RPC } from 'Browser/Transport';
//@ts-ignore
import { IoC } from 'Env/Env';
IoC.resolve('ILogger').log("Transport/RPC/ErrorCreator", 'module has been moved to "Browser/Transport:RPC.ErrorCreator" and will be removed');

export = RPC.ErrorCreator;
