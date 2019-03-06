/// <amd-module name="Core/compatibility" />
//@ts-ignore
import { compatibility, IoC } from 'Env/Env';
IoC.resolve('ILogger').log("Core/compatibility", 'module has been moved to "Env/Env:compatibility" and will be removed');
export = compatibility;
