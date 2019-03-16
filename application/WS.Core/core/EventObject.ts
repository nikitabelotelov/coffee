/// <amd-module name="Core/EventObject" />
//@ts-ignore
import { Object } from 'Env/Event';
//@ts-ignore
import { IoC } from 'Env/Env';
IoC.resolve('ILogger').log("Core/EventObject", 'module has been moved to "Env/Event:Object" and will be removed');

export = Object;
