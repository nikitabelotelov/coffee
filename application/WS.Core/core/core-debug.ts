/// <amd-module name="Core/core-debug" />
//@ts-ignore
import { coreDebug, IoC } from 'Env/Env';
IoC.resolve('ILogger').log("Core/core-debug", 'module has been moved to "Env/Env:coreDebug" and will be removed');

export = coreDebug;
