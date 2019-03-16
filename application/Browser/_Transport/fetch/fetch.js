define('Browser/_Transport/fetch/fetch', [
    'require',
    'exports',
    'tslib',
    'Env/Env',
    'Browser/_Transport/fetch/Errors',
    'Browser/_Transport/_utils'
], function (require, exports, tslib_1, Env_1, Errors, _utils_1) {
    'use strict';
    Object.defineProperty(exports, '__esModule', { value: true });
    var DEFAULT = {
        method: 'GET',
        url: ''
    };
    var OFFLINE_DELAY = 2000;
    var FIREFOX_UNLOAD_TIMEOUT = 600;    /**
     * @cfg Происходит ли на данный момент перезагрузка/закрытие вкладки
     * @type {boolean}
     */
    /**
     * @cfg Происходит ли на данный момент перезагрузка/закрытие вкладки
     * @type {boolean}
     */
    var isUnloadProcess = false;    /**
     * Флаг отсуствия сетевого подключения
     * @type {boolean}
     */
    /**
     * Флаг отсуствия сетевого подключения
     * @type {boolean}
     */
    var offline = false;
    var initListeners = function () {
        if (typeof window === 'undefined') {
            return;
        }    /*
         * Детектирование закрытия/перезагрузки страницы
         */
        /*
         * Детектирование закрытия/перезагрузки страницы
         */
        if (Env_1.detection.firefox) {
            window.addEventListener('beforeunload', function () {
                isUnloadProcess = true;
                setTimeout(function () {
                    isUnloadProcess = false;
                }, FIREFOX_UNLOAD_TIMEOUT);
            });
        } else {
            window.addEventListener('unload', function () {
                isUnloadProcess = true;
            });
        }    /*
         *  Монитор статуса сети
         */
        /*
         *  Монитор статуса сети
         */
        window.addEventListener('online', function () {
            offline = false;
        });
        window.addEventListener('offline', function () {
            offline = true;
        });
    };    /**
     * @param {Number} status
     * @return {Boolean}
     */
    /**
     * @param {Number} status
     * @return {Boolean}
     */
    var isOffline = function (status) {
        return offline || status == 300 || status == 405;
    };    /**
     * @param {Number} status
     * @return {Boolean}
     */
    /**
     * @param {Number} status
     * @return {Boolean}
     */
    var isSuccess = function (status) {
        return status >= 200 && status < 300 || status === 304;
    };    /**
     * @param {Error} error
     * @return {Boolean}
     */
    /**
     * @param {Error} error
     * @return {Boolean}
     */
    var isAborted = function (error) {
        return error.name == 'AbortError';
    };    /**
     * @param {Number} status
     * @param {Headers} headers
     * @return {Boolean}
     */
    /**
     * @param {Number} status
     * @param {Headers} headers
     * @return {Boolean}
     */
    var isLostConnection = function (status, headers) {
        var isEmptyHeaders = true;
        headers.forEach(function (key, value) {
            isEmptyHeaders = false;
        });
        return status === 0 && isEmptyHeaders;
    };
    initListeners();    /**
     * Транспор-обёртка над Fetch Api, отвечающая за предобработку типовых ошибок
     * @param {Object} requestConfig
     * @param {String} [requestConfig.url] Адрес запроса.
     * @param {*} [requestConfig.body] Тело запроса.
     * @param {String} [requestConfig.method] Http-метод запроса.
     * @param {Object | Headers} [requestConfig.headers] Объект с заголовками запроса.
     * @param {"default" | "no-store" | "reload" | "no-cache" | "force-cache"} [requestConfig.cache] Как кешировать запрос
     * @param {"omit" | "same-origin" | "include"} [requestConfig.credentials] Пересылать ли куки и заголовки авторизации вместе с запросом.
     * @param {"navigate" | "same-origin" | "no-cors" | "cors"} [requestConfig.mode] Режим кросс-доменности.
     * @param {"follow" | "error" | "manual"} [requestConfig.redirect]
     * @return {Browser/_Transport/AbortPromise.<Response>}
     *
     * @function
     * @name Browser/_Transport/fetch
     * @author Заляев А.В.
     * @public
     * @see Browser/_Transport/Errors#Transport
     * @see Browser/_Transport/Errors#HTTP
     * @see Browser/_Transport/Errors#Connection
     * @see Browser/_Transport/Errors#Auth
     * @see Browser/_Transport/Errors#Abort
     */
    /**
     * Транспор-обёртка над Fetch Api, отвечающая за предобработку типовых ошибок
     * @param {Object} requestConfig
     * @param {String} [requestConfig.url] Адрес запроса.
     * @param {*} [requestConfig.body] Тело запроса.
     * @param {String} [requestConfig.method] Http-метод запроса.
     * @param {Object | Headers} [requestConfig.headers] Объект с заголовками запроса.
     * @param {"default" | "no-store" | "reload" | "no-cache" | "force-cache"} [requestConfig.cache] Как кешировать запрос
     * @param {"omit" | "same-origin" | "include"} [requestConfig.credentials] Пересылать ли куки и заголовки авторизации вместе с запросом.
     * @param {"navigate" | "same-origin" | "no-cors" | "cors"} [requestConfig.mode] Режим кросс-доменности.
     * @param {"follow" | "error" | "manual"} [requestConfig.redirect]
     * @return {Browser/_Transport/AbortPromise.<Response>}
     *
     * @function
     * @name Browser/_Transport/fetch
     * @author Заляев А.В.
     * @public
     * @see Browser/_Transport/Errors#Transport
     * @see Browser/_Transport/Errors#HTTP
     * @see Browser/_Transport/Errors#Connection
     * @see Browser/_Transport/Errors#Auth
     * @see Browser/_Transport/Errors#Abort
     */
    var fetchTransport = function (requestConfig) {
        var _a = tslib_1.__assign({}, DEFAULT, requestConfig), url = _a.url, method = _a.method, body = _a.body, headers = _a.headers, credentials = _a.credentials, cache = _a.cache, redirect = _a.redirect, mode = _a.mode;
        var abortController = new AbortController();
        var requestPromise = fetch(url, {
            method: method,
            headers: headers,
            redirect: redirect,
            mode: mode,
            body: body,
            credentials: credentials,
            cache: cache,
            signal: abortController.signal
        }).then(function (response) {
            var status = response.status, statusText = response.statusText, headers = response.headers;
            if (isSuccess(status)) {
                return response;
            }
            if (status == 401) {
                throw new Errors.Auth(url);
            }
            if (isOffline(status) || isLostConnection(status, headers)) {
                throw new Errors.Connection(url);
            }
            var message = Errors.ERROR_TEXT[status] || Errors.ERROR_TEXT[statusText] || Errors.ERROR_TEXT.unknown;
            return response.text().then(function (payload) {
                throw new Errors.HTTP({
                    url: url,
                    message: message,
                    payload: payload,
                    httpError: status
                });
            });
        }, function (error) {
            if (isAborted(error) || isUnloadProcess) {
                throw new Errors.Abort(url);
            }    /*
             * Если до этого момента так и не поняли какая перед нами ошибка
             *
             * При обрыве соединения:
             * 1) обрывается fetch
             * 2) стреляет событие offline
             * 3) меняется флаг navigator.onLine
             *
             * Поэту, чтобы правильно задетектить ошибку обрыва соединения,
             * надо дать отработать вперёд событиям online/offline
             */
            /*
             * Если до этого момента так и не поняли какая перед нами ошибка
             *
             * При обрыве соединения:
             * 1) обрывается fetch
             * 2) стреляет событие offline
             * 3) меняется флаг navigator.onLine
             *
             * Поэту, чтобы правильно задетектить ошибку обрыва соединения,
             * надо дать отработать вперёд событиям online/offline
             */
            return _utils_1.delay(OFFLINE_DELAY).then(function () {
                if (isOffline()) {
                    throw new Errors.Connection(url);
                }
                throw error;
            });
        });
        return _utils_1.getAbortedPromise(requestPromise, abortController);
    };
    exports.default = fetchTransport;
});