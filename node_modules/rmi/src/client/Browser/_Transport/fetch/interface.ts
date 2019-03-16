/// <amd-module name="Browser/_Transport/fetch/interface" />

/**
 * Promise с возможностью отмены обработки через метод .abort()
 * @typedef {Promise}
 * @name Browser/_Transport/AbortPromise
 * @property {Function} abort
 * @public
 */
export type AbortPromise<T> = Promise<T> & {
    abort(): void;
}
export type HttpMethod = 'GET' | 'POST' | 'UPDATE' | 'DELETE' | 'PUT';

/**
 * @typedef {Object}
 * @name Browser/_Transport/FetchConfig
 * @property {String} [url] Адрес запроса.
 * @property {*} [body] Тело запроса.
 * @property {String} [method] Http-метод запроса.
 * @property {Object | Headers} [headers] Объект с заголовками запроса.
 * @property {"default" | "no-store" | "reload" | "no-cache" | "force-cache"} [cache] Как кешировать запрос
 * @property {"omit" | "same-origin" | "include"} [credentials] Пересылать ли куки и заголовки авторизации вместе с запросом.
 * @property {"navigate" | "same-origin" | "no-cors" | "cors"} [mode] Режим кросс-доменности.
 * @property {"follow" | "error" | "manual"} [redirect]
 * @public
 */
export type FetchConfig = {
    cache: RequestCache;
    credentials: RequestCredentials;
    headers: HeadersInit;
    method: HttpMethod;
    mode: RequestMode;
    redirect: RequestRedirect;
    // referrer: string;
    // referrerPolicy: ReferrerPolicy;
    // type: RequestType;
    url: string;
    body: any;
}

/**
 * Транспор-обёртка над Fetch Api, отвечающая за предобработку типовых ошибок
 * @param {Browser/_Transport/FetchConfig} requestConfig
 * @return {Browser/_Transport/AbortPromise.<Response>}
 * @function
 * @public
 * @name Browser/_Transport/FetchTransport
 */
export type FetchTransport = (requestConfig: Partial<FetchConfig>) => AbortPromise<Response>;
