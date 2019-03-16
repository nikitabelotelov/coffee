/// <amd-module name="Core/EventBus" />
//@ts-ignore
import { Bus } from 'Env/Event';
//@ts-ignore
import { IoC } from 'Env/Env';
IoC.resolve('ILogger').log("Core/EventBus", 'module has been moved to "Env/Event:Bus" and will be removed');

export = Bus;
