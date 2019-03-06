/// <amd-module name="Lib/Tab/Message" />
//@ts-ignore
import { Broadcast } from 'Browser/Event';
//@ts-ignore
import { IoC } from 'Env/Env';

IoC.resolve('ILogger').log("Lib/Tab/Message", 'module has been moved to "Browser/Event:Broadcast" and will be removed');

export = Broadcast;
