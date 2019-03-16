/// <amd-module name="Browser/_Transport/RPC/Headers" />
import { Bus as EventBus, Object as EventObject } from 'Env/Event';
// @ts-ignore
import userInfo = require('Core/UserInfo');
// @ts-ignore
import i18n = require('Core/i18n');
// @ts-ignore
import transliterate = require('Core/helpers/i18n/transliterate');
// @ts-ignore
import base64 = require('Core/base64');
// @ts-ignore
import createGUID = require('Core/helpers/createGUID');
import { HttpMethod } from 'Browser/_Transport/fetch/interface';
import { HeadersParam } from 'Browser/_Transport/RPC/interface';

const SAVE_HEADER_NAME = 'X-LastModification';

/*
 * Кэширование заголовка из ответа от каждого сервиса
 * Необходимо чтобы принимать решение о чтении с реплик БД
 */
let _cacheHeaders = {};
// @ts-ignore
EventBus.channel('Transport').subscribe('onResponseSuccess', function(event: EventObject, xhr, def, url) {
    _cacheHeaders[url] = xhr.getResponseHeader(SAVE_HEADER_NAME) || _cacheHeaders[url];
});

let getForHttpMethod = (httpMethod: HttpMethod, url: string) => {
    switch (httpMethod) {
        case 'GET': {
            /*
             * Необходимо для кэширования на уровне http
             * для заполнения заголовка ответа VARY
             */
            let headers = {};
            let s3su = userInfo.getCurrent();
            if (s3su) {
                let [client, user] = s3su.split('-');
                headers['X-SbisSessionsID'] = s3su;
                headers['X-CID'] = client;
                headers['X-UID'] = user;
            }
            return headers;
        }
        case 'POST': {
            let headers = {};
            if (_cacheHeaders[url]) {
                headers[SAVE_HEADER_NAME] = _cacheHeaders[url];
            }
            return headers;
        }
        default: {
            return {};
        }
    }
};

let getForMethod = (method) => {
    if (!method){
        return {};
    }
    return {
        'X-CalledMethod': transliterate("" + method),
        'X-OriginalMethodName': base64.encode("" + method),
        'Accept-Language': (i18n.getLang() || 'ru-RU') + ';q=0.8,en-US;q=0.5,en;q=0.3'
    }
};

/**
 * @cfg {'POST' | 'GET'} [httpMethod] Метод запроса
 */
/**
 * @cfg {String} method Имя вызываемого метода БЛ. Значение устанавливается в формате "ИмяОбъекта.ИмяМетода".
 */
/**
 * @cfg {Boolean} [recent] Признак, по которому чтение данных будет произведено из master-базы.
 */
/**
 * @cfg {String} url Адрес сервиса
 */
/**
 * @cfg {Boolean} [asyncInvoke] Устанавливать ли заголовок X-ASYNCINVOKE,
 * который отвечает за автоматическое закрытие соединение сервером,
 * не дожидаясь обработки выполнения метода бизнес логики
 */
/**
 * @cfg {Boolean} [fallback] Устанавливает признак асинхронного вызова метода без гарантии доставки.
 */
/**
 * Получение объекта заголовков для вызова метода бизнес-логики
 * @class
 * @name Browser/_Transport/RPC/Headers
 * @public
 * @author Заляев А.В
 */
class RPCHeaders {
    [propName: string]: any;
    constructor({fallback, asyncInvoke, url, recent, method, httpMethod, headers}: HeadersParam) {
        if (fallback) {
            this['X-PublishAsyncResponse'] = true;
            this['X-UNIQ-ID'] = createGUID();
        }
        
        if (asyncInvoke || fallback) {
            this['X-ASYNCINVOKE'] = true;
        }
        
        if (recent) {
            this['X-RequireRecent'] = true;
        }
        Object.assign(
            this,
            getForMethod(method),
            getForHttpMethod(httpMethod, url),
            headers
        );
    }
    /*
     * Необходимо чтобы покрыть функционал Browser/_Transport/RPCJSON#jsonRpcPreparePacket
     * Если не найдём кто использует можно выпилить и не торчать наружу
     */
    /**
     *
     * @param {String} method
     * @return {Object} headers
     * @method
     * @static
     */
    static getForMethod = getForMethod;
}
export default RPCHeaders;
