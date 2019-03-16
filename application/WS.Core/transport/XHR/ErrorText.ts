/// <amd-module name="Transport/XHR/ErrorText" />
//@ts-ignore
import { XHR } from 'Browser/Transport';
//@ts-ignore
import { IoC } from 'Env/Env';
IoC.resolve('ILogger').log("Transport/RPC/Error", 'module has been moved to "Browser/Transport:XHR.ERRORS_TEXT" and will be removed');

export = XHR.ERRORS_TEXT;
