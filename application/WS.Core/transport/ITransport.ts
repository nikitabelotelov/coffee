/// <amd-module name="Transport/ITransport" />
//@ts-ignore
import { ITransport } from 'Browser/Transport';
//@ts-ignore
import { IoC } from 'Env/Env';
IoC.resolve('ILogger').log("Transport/ITransport", 'module has been moved to "Browser/Transport:ITransport" and will be removed');

export = ITransport;
