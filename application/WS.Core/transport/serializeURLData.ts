/// <amd-module name="Transport/serializeURLData" />
//@ts-ignore
import { URL } from 'Browser/Transport';
//@ts-ignore
import { IoC } from 'Env/Env';
IoC.resolve('ILogger').log("Transport/serializeURLData", 'module has been moved to "Browser/Transport:URL.serializeData" and will be removed');

export = URL.serializeData;
