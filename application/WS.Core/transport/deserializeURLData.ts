/// <amd-module name="Transport/deserializeURLData" />
//@ts-ignore
import { URL } from 'Browser/Transport';
//@ts-ignore
import { IoC } from 'Env/Env';
IoC.resolve('ILogger').log("Transport/deserializeURLData", 'module has been moved to "Browser/Transport:URL.deserializeData" and will be removed');

export = URL.deserializeData;
