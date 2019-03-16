define('Env/_Config/_ConfigMapper', [
    'require',
    'exports',
    'Env/Constants',
    'Env/_Config/_ConfigMock'
], function (require, exports, Constants_1, _ConfigMock_1) {
    'use strict';
    Object.defineProperty(exports, '__esModule', { value: true });    /**
     * На сервисе представлений хост не постоянен.
     */
    /**
     * На сервисе представлений хост не постоянен.
     */
    function getHost() {
        var hostname;
        if (window && window.location) {
            hostname = window.location.hostname;
        }    // @ts-ignore
        // @ts-ignore
        if (!hostname && process && process.domain && process.domain.req) {
            // @ts-ignore
            hostname = process.domain.req.hostname;
        }
        return hostname;
    }    /**
     * Функция, которая создаёт обёртки для объектов конфигурации.
     * @param {Core/AbstractConfig}oldConfig старый объект для работы с параметрами
     * @param {ParametersWebAPI/Loader | undefined} Loader Лоадер для работы с сервисом параметров
     * @param {Boolean} useEmptyMock Использовать ли пустую заглушку
     */
    /**
     * Функция, которая создаёт обёртки для объектов конфигурации.
     * @param {Core/AbstractConfig}oldConfig старый объект для работы с параметрами
     * @param {ParametersWebAPI/Loader | undefined} Loader Лоадер для работы с сервисом параметров
     * @param {Boolean} useEmptyMock Использовать ли пустую заглушку
     */
    function ConfgiMapper(oldConfig, Loader, useEmptyMock) {
        // Предполагаем, что на сервисе представлений всегда доступен сервис парамтров
        if (Constants_1.default.isBrowserPlatform && useEmptyMock) {
            return new _ConfigMock_1.default.EmptyMock();
        }
        var ucDomainList = [];
        if (void 0 !== Loader) {
            ucDomainList = [/online\.sbis\.ru$/];
        }
        var hostname = getHost();    /**
        * Можем ли мы использовать ParametersWebAPI/Loader * @type {boolean} */
        /**
        * Можем ли мы использовать ParametersWebAPI/Loader * @type {boolean} */
        var canConfigLoader = false;
        for (var i = 0; i < ucDomainList.length && !canConfigLoader; i++) {
            if (ucDomainList[i].test(hostname)) {
                canConfigLoader = true;
            }
        }
        if (!canConfigLoader) {
            return oldConfig;
        }
        return new _ConfigMock_1.default.Mock(Loader);
    }    /**
     * Есть сервисы где не нужно получать список параметров, потому что там их точно нет
     * @link https://online.sbis.ru/opendoc.html?guid=72fa4dbd-20d9-48df-87fb-a4d6df173820
     */
    /**
     * Есть сервисы где не нужно получать список параметров, потому что там их точно нет
     * @link https://online.sbis.ru/opendoc.html?guid=72fa4dbd-20d9-48df-87fb-a4d6df173820
     */
    ConfgiMapper.isPreloadParams = function () {
        if (!Constants_1.default.userConfigSupport && !Constants_1.default.globalConfigSupport) {
            return false;
        }
        var serviceBlackList = [
            '/reg/',
            '/person/'
        ];
        var service;
        if (window && window.location) {
            service = window.location.pathname;
        }    // @ts-ignore
        // @ts-ignore
        if (!service && process && process.domain && process.domain.req) {
            // @ts-ignore
            service = process.domain.req.pathname;
        }
        if (!service) {
            return true;
        }
        service = service.match('/.+?/');
        if (service === null) {
            return true;
        }
        service = service[0];
        return serviceBlackList.indexOf(service) === -1;
    };    /**
     * Нельзя возвращать константные объекты.
     * Сервис представления может отправлять запросы от разных пользователей.
     */
    /**
     * Нельзя возвращать константные объекты.
     * Сервис представления может отправлять запросы от разных пользователей.
     */
    exports.default = ConfgiMapper;
});