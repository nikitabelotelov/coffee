/// <amd-module name="Transport/ajax-emulator" />
//@ts-ignore
import { ajax } from 'Browser/Transport';
//@ts-ignore
import { IoC } from 'Env/Env';
IoC.resolve('ILogger').log("Transport/ajax-emulator", 'module has been moved to "Browser/Transport:ajax" and will be removed');

export = ajax;
