/// <amd-module name="Env/_Config/ClientsGlobalConfig" />
import clientsGlobalConfig from 'Env/_Config/ClientsGlobalConfigOld';
import ConfigMapper from 'Env/_Config/_ConfigMapper';
import constants from 'Env/Constants';
// @ts-ignore
import * as Scope from 'optional!ParametersWebAPI/Scope';

let Loader;
if (Scope && Scope.ACCOUNT) {
   Loader = Scope.ACCOUNT;
}

export default ConfigMapper(clientsGlobalConfig, Loader, !constants.globalConfigSupport);
