/// <amd-module name="Core/UserConfigOld" />
//@ts-ignore
import { UserConfigOld } from 'Env/Config';
//@ts-ignore
import { IoC } from 'Env/Env';
IoC.resolve('ILogger').log("Core/UserConfigOld", 'module has been moved to "Env/Config:UserConfigOld" and will be removed');

export = UserConfigOld;
