/// <amd-module name="Transport/RPCJSON" />
//@ts-ignore
import { RPCJSON } from 'Browser/Transport';
//@ts-ignore
import { IoC } from 'Env/Env';
IoC.resolve('ILogger').log("Transport/RPCJSON", 'module has been moved to "Browser/Transport:RPCJSON" and will be removed');

export = RPCJSON;
