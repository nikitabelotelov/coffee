/// <amd-module name="Browser/_Transport/fetch/fetch" />
import { detection } from 'Env/Env';
import * as Errors from 'Browser/_Transport/fetch/Errors';
import { FetchConfig, FetchTransport } from 'Browser/_Transport/fetch/interface';
import { getAbortedPromise, delay } from 'Browser/_Transport/_utils';

const DEFAULT: Partial<FetchConfig> = {
    method: 'GET',
    url: ''
};
const OFFLINE_DELAY = 2000;
const FIREFOX_UNLOAD_TIMEOUT = 600;

/**
 * @cfg Происходит ли на данный момент перезагрузка/закрытие вкладки
 * @type {boolean}
 */
let isUnloadProcess: boolean = false;

/**
 * Флаг отсуствия сетевого подключения
 * @type {boolean}
 */
let offline: boolean = false;

let initListeners = () => {
    if (typeof window === 'undefined') {
        return;
    }

    /*
     * Детектирование закрытия/перезагрузки страницы
     */
    if (detection.firefox) {
        window.addEventListener('beforeunload', () => {
            isUnloadProcess = true;
            setTimeout(() => {
                isUnloadProcess = false;
            }, FIREFOX_UNLOAD_TIMEOUT);
        });
    } else {
        window.addEventListener('unload', () => {
            isUnloadProcess = true;
        });
    }

    /*
     *  Монитор статуса сети
     */
    window.addEventListener('online', () => {
        offline = false;
    });
    window.addEventListener('offline', () => {
        offline = true;
    })
};

/**
 * @param {Number} status
 * @return {Boolean}
 */
let isOffline = (status?: number) => {
    return offline || (status == 300) || (status == 405);
};

/**
 * @param {Number} status
 * @return {Boolean}
 */
let isSuccess = (status: number) => {
    return status >= 200 && status < 300 || status === 304
};

/**
 * @param {Error} error
 * @return {Boolean}
 */
let isAborted = (error: Error) => {
    return error.name == 'AbortError'
};

/**
 * @param {Number} status
 * @param {Headers} headers
 * @return {Boolean}
 */
let isLostConnection = (status: number, headers: Headers) => {
    let isEmptyHeaders: boolean = true;
    headers.forEach((key, value) => {
        isEmptyHeaders = false;
    });
    return (status === 0) && isEmptyHeaders;
};

initListeners();

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
let fetchTransport: FetchTransport = (requestConfig: Partial<FetchConfig>) => {
    let {url, method, body, headers, credentials, cache, redirect, mode } = {
        ...DEFAULT,
        ...requestConfig
    };
    let abortController = new AbortController();
    let requestPromise = fetch(url, {
        method, headers, redirect, mode,
        body, credentials, cache,
        signal: abortController.signal
    }).then<Response>((response: Response) => {
        let {status, statusText, headers} = response;
        if (isSuccess(status)) {
            return response;
        }
        if (status == 401) {
            throw new Errors.Auth(url);
        }
        if (isOffline(status) || isLostConnection(status, headers)) {
            throw new Errors.Connection(url);
        }
        let message = Errors.ERROR_TEXT[status] ||
            Errors.ERROR_TEXT[statusText] ||
            Errors.ERROR_TEXT.unknown;

        return response.text().then((payload) => {
            throw new Errors.HTTP({
                url,
                message,
                payload,
                httpError: status
            });
        });
    }, (error: DOMException | Error) => {
        if (isAborted(error) || isUnloadProcess) {
            throw new Errors.Abort(url);
        }

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
        return delay(OFFLINE_DELAY).then(() => {
            if (isOffline()) {
                throw new Errors.Connection(url);
            }
            throw error;
        });
    });

    return getAbortedPromise(requestPromise, abortController);
};

export default fetchTransport;
