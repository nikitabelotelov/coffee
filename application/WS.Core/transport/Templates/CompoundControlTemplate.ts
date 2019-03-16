/// <amd-module name="Transport/Templates/CompoundControlTemplate" />
//@ts-ignore
import { CompoundControlTemplate } from 'Browser/TransportOld';
//@ts-ignore
import { IoC } from 'Env/Env';
IoC.resolve('ILogger').log("Transport/Templates/CompoundControlTemplate", 'module has been moved to "Browser/TransportOld:CompoundControlTemplate" and will be removed');

export = CompoundControlTemplate;
