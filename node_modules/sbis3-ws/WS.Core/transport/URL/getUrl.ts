/// <amd-module name="Transport/URL/getUrl" />
//@ts-ignore
import { URL } from 'Browser/Transport';
//@ts-ignore
import { IoC } from 'Env/Env';
IoC.resolve('ILogger').log("Transport/URL/getUrl", 'module has been moved to "Browser/Transport:URL.getUrl" and will be removed');

export = URL.getUrl;
