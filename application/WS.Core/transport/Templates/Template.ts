/// <amd-module name="Transport/Templates/Template" />
//@ts-ignore
import { Template } from 'Browser/TransportOld';
//@ts-ignore
import { IoC } from 'Env/Env';
IoC.resolve('ILogger').log("Transport/Templates/Template", 'module has been moved to "Browser/TransportOld:Template" and will be removed');

export = Template;
