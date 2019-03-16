/// <amd-module name="Core/ClientsGlobalConfig" />
//@ts-ignore
import { ClientsGlobalConfig } from 'Env/Config';
//@ts-ignore
import { IoC } from 'Env/Env';
IoC.resolve('ILogger').log("Core/ClientsGlobalConfig", 'module has been moved to "Env/Config:ClientsGlobalConfig" and will be removed');

export = ClientsGlobalConfig;
