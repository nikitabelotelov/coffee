/// <amd-module name="Env/Transport/RPC/RPC" />
import { fetch, RESPONSE_TYPE } from 'Browser/_Transport/Sbis/fetch';
import { getAbortedPromise } from 'Browser/_Transport/_utils';
import { getEmptyResponse } from 'Browser/_Transport/RPC/Body';
import * as ErrorCreator from 'Browser/_Transport/RPC/ErrorCreator';
import { Bus as EventBus } from 'Env/Event';
import { RPCConfig, RPCResponse, RPCTransport } from "Browser/_Transport/RPC/interface";
import getFetchConfig from "Browser/_Transport/RPC/getFetchConfig";
import { Transport, Connection } from "Browser/_Transport/fetch/Errors";

let getGlobalChannel = () => EventBus.globalChannel();
let getErrorChannel = () => EventBus.channel('errors');

/**
 * Транспорт для вызова методов бизнес-логики в формате json-rpc.
 * @param {Object} config
 * @param {String} config.method Метод бизнес-логики
 * @param {*} [config.body] Тело запроса
 * @param {Object} [config.headers] Дополнительные заголовки запроса
 * @param {String} [config.url] Адрес сервиса
 * @param {Boolean} [config.asyncInvoke] Устанавливать ли заголовок X-ASYNCINVOKE,
 * который отвечает за автоматическое закрытие соединение сервером,
 * не дожидаясь обработки выполнения метода бизнес логики
 * @param {Boolean} [config.recent] Признак, по которому чтение данных будет произведено из master-базы.
 * @return {Env/Transport/AbortPromise}
 *
 * @name Env/Transport/RPC
 * @author Заляев А.В.
 * @public
 * @function
 * @see Env/Transport/RPC/Error
 * @see Env/Transport/fetch
 * @see Env/Transport/sbis
 */
let RPC: RPCTransport = <T = any>(config: RPCConfig) => {
    let request = fetch<RPCResponse<T>>(
        getFetchConfig(config),
        RESPONSE_TYPE.JSON
    );
    let processing = request.then((response) => {
        let resp = response || getEmptyResponse();
        // 200, но пустой ответ или вложенная ошибка
        if ('error' in resp){
            throw ErrorCreator.fromRPC(resp.error, config.method, config.url);
        }
        return resp.result;
    }, (error: Transport) => {
        if (error instanceof Connection) {
            let [object, method] = config.method.split('.');
            getGlobalChannel().notify('onOfflineModeError', object, method, error);
        }
        throw ErrorCreator.fromHTTP(error, config.method);
    }).catch((error) => {
        if (error.canceled) {
            throw error;
        }
        if (!error.details){
            let code = error.httpError || 0;
            error.details = code > 500? rk('Попробуйте заглянуть сюда через 15 минут'): '';
        }
        getErrorChannel().notify('onRPCError', error);
        throw error;
    });
    return getAbortedPromise(processing, request);
};
export = RPC;
