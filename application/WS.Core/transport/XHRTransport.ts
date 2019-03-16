/// <amd-module name="Transport/XHRTransport" />
//@ts-ignore
import { XHR } from 'Browser/Transport';
//@ts-ignore
import { IoC } from 'Env/Env';
IoC.resolve('ILogger').log("Transport/XHRTransport", 'module has been moved to "Browser/Transport:XHR" and will be removed');

export = XHR;
