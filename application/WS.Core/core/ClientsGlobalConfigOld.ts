/// <amd-module name="Core/ClientsGlobalConfigOld" />
//@ts-ignore
import { ClientsGlobalConfigOld } from 'Env/Config';
//@ts-ignore
import { IoC } from 'Env/Env';
IoC.resolve('ILogger').log("Core/ClientsGlobalConfigOld", 'module has been moved to "Env/Config:ClientsGlobalConfigOld" and will be removed');

export = ClientsGlobalConfigOld;
