/// <amd-module name="Transport/Errors" />
//@ts-ignore
import { fetch } from 'Browser/Transport';
//@ts-ignore
import { IoC } from 'Env/Env';
IoC.resolve('ILogger').log("Transport/Errors", 'module has been moved to "Browser/Transport:fetch.Errors" and will be removed');

export = fetch.Errors;
