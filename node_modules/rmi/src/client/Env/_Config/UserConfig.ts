/// <amd-module name="Env/_Config/UserConfig" />
import userConfig from 'Env/_Config/UserConfigOld';
import ConfigMapper from 'Env/_Config/_ConfigMapper';
import { constants } from 'Env/Constants';
// @ts-ignore
import * as Scope from 'optional!ParametersWebAPI/Scope';

var Loader;
if (Scope && Scope.USER) {
    Loader = Scope.USER;
}

export default ConfigMapper(userConfig, Loader, !constants.userConfigSupport);
