/// <amd-module name="Transport/URL/getQueryParam" />
//@ts-ignore
import { URL } from 'Browser/Transport';
//@ts-ignore
import { IoC } from 'Env/Env';
IoC.resolve('ILogger').log("Transport/URL/getQueryParam", 'module has been moved to "Browser/Transport:URL.getQueryParam" and will be removed');

export = URL.getQueryParam;
