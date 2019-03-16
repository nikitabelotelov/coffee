/// <amd-module name="Browser/_Transport/RPC/getFetchConfig" />
import { FetchConfig, HttpMethod } from "Browser/_Transport/fetch/interface";
import { getURL, getBody } from "Browser/_Transport/RPC/Body";
import Headers from "Browser/_Transport/RPC/Headers";
import { constants }  from 'Env/Constants';
import { RPCConfig } from 'Browser/_Transport/RPC/interface'

let isGetMethod = (method) => {
    if ((typeof window === 'undefined') ||
        // @ts-ignore
        !window.cachedMethods ||
        // @ts-ignore
        !window.cachedMethods.length
    ) {
        return false;
    }
    // @ts-ignore
    return  window.cachedMethods.indexOf(method) > -1;
};

let canUseGetMethod = (url) => {
    return url.length < 2 * 1024;
};

/**
 * Получение параметров вызова Fetch
 * @param {Browser/_Transport/RPC/Config} config
 * @param {String} config.method RPC метод запроса
 * @param {String} config.url Адрес сер
 * @param {Object} [config.body] Тело запросависа
 * @param {Object} [config.headers] Объект заголовков запроса
 * @param {Boolean} [config.asyncInvoke]
 * @param {Boolean} [config.recent]
 * @param {Boolean} [config.fallback]
 * @return {Partial<FetchConfig>}
 */
let getFetchConfig = ({method, body, url, asyncInvoke, recent,fallback, headers}: RPCConfig): Partial<FetchConfig> => {
    let dataUrl = "";
    let isGet = false;
    let httpMethod: HttpMethod = 'POST';
    url = url || constants.defaultServiceUrl;
    if (isGetMethod(method)) {
        dataUrl = getURL(method, body);
    }
    if (dataUrl && canUseGetMethod(dataUrl)) {
        httpMethod = 'GET';
        isGet = true;
        url += dataUrl;
    }
    return {
        method: httpMethod,
        headers: new Headers({
            method, url, httpMethod, headers,
            asyncInvoke, recent, fallback
        }),
        body: isGet? '': getBody(method, body),
        url
    };
    
};

export default getFetchConfig;
