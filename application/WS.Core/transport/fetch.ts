/// <amd-module name="Transport/fetch" />
//@ts-ignore
import { fetch } from 'Browser/Transport';
//@ts-ignore
import { IoC } from 'Env/Env';
IoC.resolve('ILogger').log("Transport/fetch", 'module has been moved to "Browser/Transport:fetch.fetch" and will be removed');

export = fetch.fetch;
