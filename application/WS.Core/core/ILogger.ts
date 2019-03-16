/// <amd-module name="Core/ILogger" />
//@ts-ignore
import { ILogger, IoC } from 'Env/Env';
IoC.resolve('ILogger').log("Core/ILogger", 'module has been moved to "Env/Env:ILogger" and will be removed');

export = ILogger;
