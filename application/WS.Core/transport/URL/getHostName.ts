/// <amd-module name="Transport/URL/getHostName" />
//@ts-ignore
import { URL } from 'Browser/Transport';
//@ts-ignore
import { IoC } from 'Env/Env';
IoC.resolve('ILogger').log("Transport/URL/getHostName", 'module has been moved to "Browser/Transport:URL.getHostName" and will be removed');

export = URL.getHostName;
