/// <amd-module name="Core/EventBusChannel" />
//@ts-ignore
import { Channel } from 'Env/Event';
//@ts-ignore
import { IoC } from 'Env/Env';
IoC.resolve('ILogger').log("Core/EventBusChannel", 'module has been moved to "Env/Event:Channel" and will be removed');

export = Channel;
