/// <amd-module name="Core/ConsoleLogger" />
//@ts-ignore
import { ConsoleLogger, IoC } from 'Env/Env';
IoC.resolve('ILogger').log("Core/ConsoleLogger", 'module has been moved to "Env/Env:ConsoleLogger" and will be removed');
export = ConsoleLogger;
