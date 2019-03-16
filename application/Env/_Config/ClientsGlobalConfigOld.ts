/// <amd-module name="Env/_Config/ClientsGlobalConfigOld" />
import _const from 'Env/Constants';
import AbstractConfig from 'Env/_Config/AbstractConfigOld';

/**
 * Класс для взаимодействия с параметрами глобальной конфигурации Клиента
 * В качестве основного хранилища выступает бизнес-логика.
 * Все операции отражаются на глобальном контексте.
 * Для использования в VDOM необходимо переходить на {@link ParametersWebAPI/Scope} и/или {@link ParametersWebAPI/Loader}
 *
 * @deprecated
 * @author Бегунов А.В.
 * @class Core/ClientsGlobalConfig
 * @extends Core/AbstractConfig
 * @public
 * @singleton
 */
var ClientsGlobalConfig = new (AbstractConfig.extend(/** @lends Core/ClientsGlobalConfig.prototype */{
   _getObjectName: function() {
      return 'ГлобальныеПараметрыКлиента';
   },
   _isConfigSupport: function() {
      return _const.isNodePlatform || _const.globalConfigSupport;
   }
}))();

export default ClientsGlobalConfig;
