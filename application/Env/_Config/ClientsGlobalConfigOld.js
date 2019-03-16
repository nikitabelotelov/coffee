define('Env/_Config/ClientsGlobalConfigOld', [
    'require',
    'exports',
    'Env/Constants',
    'Env/_Config/AbstractConfigOld'
], function (require, exports, Constants_1, AbstractConfigOld_1) {
    'use strict';
    Object.defineProperty(exports, '__esModule', { value: true });    /**
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
    var ClientsGlobalConfig = new (AbstractConfigOld_1.default.extend(/** @lends Core/ClientsGlobalConfig.prototype */
    {
        _getObjectName: function () {
            return 'ГлобальныеПараметрыКлиента';
        },
        _isConfigSupport: function () {
            return Constants_1.default.isNodePlatform || Constants_1.default.globalConfigSupport;
        }
    }))();
    exports.default = ClientsGlobalConfig;
});