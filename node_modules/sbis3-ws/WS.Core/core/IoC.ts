/// <amd-module name="Core/IoC" />
//@ts-ignore
import { IoC } from 'Env/Env';
IoC.resolve('ILogger').log("Core/IoC", 'module has been moved to "Env/Env:IoC" and will be removed');

export = IoC;
