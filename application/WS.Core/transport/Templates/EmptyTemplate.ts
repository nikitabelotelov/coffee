/// <amd-module name="Transport/Templates/EmptyTemplate" />
//@ts-ignore
import { EmptyTemplate } from 'Browser/TransportOld';
//@ts-ignore
import { IoC } from 'Env/Env';
IoC.resolve('ILogger').log("Transport/Templates/EmptyTemplate", 'module has been moved to "Browser/TransportOld:EmptyTemplate" and will be removed');

export = EmptyTemplate;
