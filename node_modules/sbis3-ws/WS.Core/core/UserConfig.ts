/// <amd-module name="Core/UserConfig" />
//@ts-ignore
import { UserConfig } from 'Env/Config';
//@ts-ignore
import { IoC } from 'Env/Env';
IoC.resolve('ILogger').log("Core/UserConfig", 'module has been moved to "Env/Config:UserConfig" and will be removed');

export = UserConfig;
