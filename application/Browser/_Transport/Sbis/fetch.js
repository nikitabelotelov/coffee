define('Browser/_Transport/Sbis/fetch', [
    'require',
    'exports',
    'tslib',
    'Browser/_Transport/fetch/fetch',
    'Browser/_Transport/fetch/Errors',
    'Env/Constants',
    'Core/UserInfo',
    'Env/Event',
    'Browser/_Transport/_utils',
    'Browser/_Transport/fetch/responseParser'
], function (require, exports, tslib_1, fetch_1, Errors, Constants_1, UserInfo, Event_1, _utils_1, responseParser_1) {
    'use strict';
    Object.defineProperty(exports, '__esModule', { value: true });
    exports.RESPONSE_TYPE = responseParser_1.RESPONSE_TYPE;    /**
     * Объект заголовков по уполчанию
     */
    /**
     * Объект заголовков по уполчанию
     */
    var DEFAULT_HEADERS = {
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
        'Accept': 'application/json, text/javascript, */*; q=0.01'
    };    /**
     * Объект конфигураций запроса по уполчанию
     */
    /**
     * Объект конфигураций запроса по уполчанию
     */
    var DEFAULT = { method: 'GET' };
    var SAVE_HEADER_NAME = 'X-LastModification';
    var cachedHeaders = {};    /**
     * Подготавливает объект параметров запроса, докидывая значения по умолчанию
     * @param {Partial.<Transport/SbisConfig>} receivedConfig
     * @return {Transport/SbisConfig}
     */
    /**
     * Подготавливает объект параметров запроса, докидывая значения по умолчанию
     * @param {Partial.<Transport/SbisConfig>} receivedConfig
     * @return {Transport/SbisConfig}
     */
    var getConfig = function (receivedConfig) {
        var config = tslib_1.__assign({}, DEFAULT, receivedConfig);
        var headers = tslib_1.__assign({}, DEFAULT_HEADERS, receivedConfig.headers);    /*
         * Если кто-то решил не проставлять заголовки, которые мы поддкидываем по умолчанию,
         * то надо эти ключи удалить из объекта вообще, чтобы в запросе не ушли заголовки типа "n:undefined"
         */
        /*
         * Если кто-то решил не проставлять заголовки, которые мы поддкидываем по умолчанию,
         * то надо эти ключи удалить из объекта вообще, чтобы в запросе не ушли заголовки типа "n:undefined"
         */
        for (var i in headers) {
            if (headers.hasOwnProperty(i) && !headers[i]) {
                delete headers[i];
            }
        }
        if (cachedHeaders[config.url]) {
            headers[SAVE_HEADER_NAME] = cachedHeaders[config.url];
        }
        config.headers = headers;
        return config;
    };    /**
     * Проверка актуальности пользователя
     * для запуска механизмов чистки данных от старого пользователя и перезагрузки страницы
     * возможно откажемся от этого по проекту обработки ошибок
     */
    /**
     * Проверка актуальности пользователя
     * для запуска механизмов чистки данных от старого пользователя и перезагрузки страницы
     * возможно откажемся от этого по проекту обработки ошибок
     */
    var checkUser = function (url) {
        if (Constants_1.constants.checkSessionCookie && !UserInfo.isValid()) {
            return Promise.reject(new Errors.Auth(url));
        }
        return Promise.resolve();
    };    /**
     * Оповещение об ошибке авторизации.
     * для запуска механизмов чистки данных от старого пользователя и перезагрузки страницы
     * возможно откажемся от этого по проекту обработки ошибок
     * @param {Error} error
     */
    /**
     * Оповещение об ошибке авторизации.
     * для запуска механизмов чистки данных от старого пользователя и перезагрузки страницы
     * возможно откажемся от этого по проекту обработки ошибок
     * @param {Error} error
     */
    var notifyAuthError = function (error) {
        if (error instanceof Errors.Auth) {
            Event_1.Bus.channel('errors').notify('onAuthError');
        }
        throw error;
    };    /**
     * Кэширование заголовка из ответа от каждого сервиса
     * Необходимо чтобы принимать решение о чтении с реплик БД
     */
    /**
     * Кэширование заголовка из ответа от каждого сервиса
     * Необходимо чтобы принимать решение о чтении с реплик БД
     */
    var cacheHeaders = function (response) {
        cachedHeaders[response.url] = response.headers.get(SAVE_HEADER_NAME);
        return response;
    };    /**
     * Транспорт-обёртка над fetch, отвечающая за разбор ответа от сервера.
     * Так же позволяющая предотвратить запрос
     * @param {Object} requestConfig
     * @param {String} [requestConfig.url] Адрес запроса.
     * @param {*} [requestConfig.body] Тело запроса.
     * @param {String} [requestConfig.method] Http-метод запроса.
     * @param {Object | Headers} [requestConfig.headers] Объект с заголовками запроса.
     * @param {"default" | "no-store" | "reload" | "no-cache" | "force-cache"} [requestConfig.cache] Как кешировать запрос
     * @param {"omit" | "same-origin" | "include"} [requestConfig.credentials] Пересылать ли куки и заголовки авторизации вместе с запросом.
     * @param {"navigate" | "same-origin" | "no-cors" | "cors"} [requestConfig.mode] Режим кросс-доменности.
     * @param {"follow" | "error" | "manual"} [requestConfig.redirect]
     * @param {'TEXT' | 'JSON' | 'BLOB' | 'XML'} responseType Тип данных, ожидаемый от сервера.
     * @return {Transport/AbortPromise}
     *
     * @see Transport/fetch
     * @see Transport/Errors#Parse
     * @function
     * @name Transport/sbis
     * @author Заляев А.В.
     * @public
     */
    /**
     * Транспорт-обёртка над fetch, отвечающая за разбор ответа от сервера.
     * Так же позволяющая предотвратить запрос
     * @param {Object} requestConfig
     * @param {String} [requestConfig.url] Адрес запроса.
     * @param {*} [requestConfig.body] Тело запроса.
     * @param {String} [requestConfig.method] Http-метод запроса.
     * @param {Object | Headers} [requestConfig.headers] Объект с заголовками запроса.
     * @param {"default" | "no-store" | "reload" | "no-cache" | "force-cache"} [requestConfig.cache] Как кешировать запрос
     * @param {"omit" | "same-origin" | "include"} [requestConfig.credentials] Пересылать ли куки и заголовки авторизации вместе с запросом.
     * @param {"navigate" | "same-origin" | "no-cors" | "cors"} [requestConfig.mode] Режим кросс-доменности.
     * @param {"follow" | "error" | "manual"} [requestConfig.redirect]
     * @param {'TEXT' | 'JSON' | 'BLOB' | 'XML'} responseType Тип данных, ожидаемый от сервера.
     * @return {Transport/AbortPromise}
     *
     * @see Transport/fetch
     * @see Transport/Errors#Parse
     * @function
     * @name Transport/sbis
     * @author Заляев А.В.
     * @public
     */
    var sbisTransport = function (requestConfig, responseType) {
        if (responseType === void 0) {
            responseType = responseParser_1.RESPONSE_TYPE.TEXT;
        }
        var _config = getConfig(requestConfig);
        var request;
        var aborted;
        var processing = checkUser(_config.url).then(function () {
            request = fetch_1.default(_config);
            if (aborted) {
                request.abort();
            }
            return request;
        }).then(cacheHeaders, notifyAuthError).then(function (response) {
            return responseParser_1.parse(response, responseType);
        });    // прокидывание метода abort
        // прокидывание метода abort
        return _utils_1.getAbortedPromise(processing, {
            abort: function () {
                request && request.abort();
                aborted = true;
            }
        });
    };
    exports.fetch = sbisTransport;
    exports.default = sbisTransport;
});