/// <amd-module name="Env/Transport/sbis" />
import fetch from 'Browser/_Transport/fetch/fetch';
import * as Errors from "Browser/_Transport/fetch/Errors";
import { constants }  from 'Env/Constants';
// @ts-ignore
import UserInfo = require('Core/UserInfo');
import { Bus as EventBus } from 'Env/Event';
import { getAbortedPromise } from 'Browser/_Transport/_utils';
import { SbisTransport } from 'Browser/_Transport/Sbis/interface';
import { AbortPromise, FetchConfig } from 'Browser/_Transport/fetch/interface';
import { parse, RESPONSE_TYPE } from "Browser/_Transport/fetch/responseParser";
import { FetchResponseType } from "Browser/_Transport/fetch/responseParser.d";

/**
 * Объект заголовков по уполчанию
 */
const DEFAULT_HEADERS = {
    'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
    'Accept': 'application/json, text/javascript, */*; q=0.01'
};

/**
 * Объект конфигураций запроса по уполчанию
 */
const DEFAULT: Partial<FetchConfig> = {
    method: 'GET'
};

const SAVE_HEADER_NAME = 'X-LastModification';
let cachedHeaders = {};

/**
 * Подготавливает объект параметров запроса, докидывая значения по умолчанию
 * @param {Partial.<Transport/SbisConfig>} receivedConfig
 * @return {Transport/SbisConfig}
 */
let getConfig = (receivedConfig: Partial<FetchConfig>): Partial<FetchConfig> => {
    let config = {
        ...DEFAULT,
        ...receivedConfig
    };
    let headers = {
        ...DEFAULT_HEADERS,
        ...receivedConfig.headers
    };

    /*
     * Если кто-то решил не проставлять заголовки, которые мы поддкидываем по умолчанию,
     * то надо эти ключи удалить из объекта вообще, чтобы в запросе не ушли заголовки типа "n:undefined"
     */
    for (let i in headers) {
        if (headers.hasOwnProperty(i) && !headers[i]) {
            delete headers[i];
        }
    }

    if (cachedHeaders[config.url]) {
        headers[SAVE_HEADER_NAME] = cachedHeaders[config.url];
    }
    config.headers = headers;
    return config;
};

/**
 * Проверка актуальности пользователя
 * для запуска механизмов чистки данных от старого пользователя и перезагрузки страницы
 * возможно откажемся от этого по проекту обработки ошибок
 */
let checkUser = (url) => {
    if (constants.checkSessionCookie && !UserInfo.isValid()) {
        return Promise.reject(new Errors.Auth(url));
    }
    return Promise.resolve();
};

/**
 * Оповещение об ошибке авторизации.
 * для запуска механизмов чистки данных от старого пользователя и перезагрузки страницы
 * возможно откажемся от этого по проекту обработки ошибок
 * @param {Error} error
 */
let notifyAuthError = (error: Error) => {
    if (error instanceof Errors.Auth) {
        EventBus.channel('errors').notify('onAuthError');
    }
    throw error;
};

/**
 * Кэширование заголовка из ответа от каждого сервиса
 * Необходимо чтобы принимать решение о чтении с реплик БД
 */
let cacheHeaders = (response: Response): Response => {
    cachedHeaders[response.url] = response.headers.get(SAVE_HEADER_NAME);
    return response;
};

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
let sbisTransport: SbisTransport = <T>(
    requestConfig: Partial<FetchConfig>,
    responseType: FetchResponseType = RESPONSE_TYPE.TEXT
) => {
    let _config = getConfig(requestConfig);
    let request: AbortPromise<Response>;
    let aborted: boolean;
    let processing = checkUser(_config.url).then(() => {
        request = fetch(_config);
        if (aborted) {
            request.abort();
        }
        return request;
    }).then(
        cacheHeaders,
        notifyAuthError
    ).then((response: Response) => {
        return parse(response, responseType)
    });
    
    // прокидывание метода abort
    return getAbortedPromise<T>(processing, {
        abort() {
            request && request.abort();
            aborted = true;
        }
    });
};

export { RESPONSE_TYPE, sbisTransport as fetch };
export default sbisTransport;
