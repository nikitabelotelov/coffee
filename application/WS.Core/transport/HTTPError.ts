/// <amd-module name="Transport/HTTPError" />
//@ts-ignore
import { fetch } from 'Browser/Transport';
//@ts-ignore
import { IoC } from 'Env/Env';
IoC.resolve('ILogger').log("Transport/Errors", 'module has been moved to "Browser/Transport:fetch.Errors.HTTP" and will be removed');

export = fetch.Errors.HTTP;
