/// <amd-module name="Core/constants" />
//@ts-ignore
import { constants, IoC } from 'Env/Env';
IoC.resolve('ILogger').log("Core/constants", 'module has been moved to "Env/Env:constants" and will be removed');
export = constants;
