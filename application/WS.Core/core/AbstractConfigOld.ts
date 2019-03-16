/// <amd-module name="Core/AbstractConfigOld" />
//@ts-ignore
import { AbstractConfigOld } from 'Env/Config';
//@ts-ignore
import { IoC } from 'Env/Env';
IoC.resolve('ILogger').log("Core/AbstractConfigOld", 'module has been moved to "Env/Config:AbstractConfigOld" and will be removed');

export = AbstractConfigOld;
