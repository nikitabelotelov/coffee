/// <amd-module name="Browser/_Event/Server/_class/RabbitEnv" />
import { SEB } from "../interfaces";
import { IoC } from 'Env/Env';
// @ts-ignore
import Deferred = require('Core/Deferred');
import { XHR } from 'Browser/Transport';
import * as CONST from "Browser/_Event/Server/_class/Constants";
import { ConnectOptions } from "Browser/_Event/Server/_class/ConnectOptions";

const REQUEST_LIMIT = 2 * 1000;

export class RabbitEnv {
    constructor(private watcher: SEB.IWatchDogSystem) {
    }

    /**
     * Пытаемся установить соединение с RabbitMQ.
     * При люббой ошибке связи кроме как от прямого ответа о неработоспособности кролика
     *  пытаемся переподключиться каждые 5 секунд.
     * Повторять процесс соединения нужно полностью, т.к. hash может устареть,
     *  при попытке создания обменника
     * @param {Browser/_Event/Server/_class/ConnectOptions} connectOptions
     * @return {Deferred<string>}
     */
    up(connectOptions: ConnectOptions): Deferred<string> {
        let def = new Deferred<string>();
        let timer = Date.now();
        this.tryCreateChannel(connectOptions).addCallback((hash) => {
            if (Date.now() - timer > REQUEST_LIMIT) {
                IoC.resolve("ILogger").warn(`[STOMP][timeout] /!info request to long: ${Date.now() - timer}ms`);
            }
            def.callback(hash);
        }).addErrback((err: Error) => {
            if (err.message == CONST.ERR_MSG_RABBIT_OFF) {
                def.errback(err);
                return;
            }
            setTimeout(() => {
                this.up(connectOptions).addCallback((hash) => {
                    def.callback(hash);
                })
            }, 5000);
        });

        return def;
    }

    /**
     * Запрос создания обменника на RabbitMQ
     * @param {Browser/_Event/Server/_class/ConnectOptions} connectOptions
     * @return {Deferred}
     */
    private tryCreateChannel(connectOptions: ConnectOptions): Deferred<string> {
        let url = connectOptions.getUrl();
        return new XHR({
            url: url,
            method: 'GET',
            dataType: 'json'
        }).execute().addCallback((response) => {
            if (!response.websocket) {
                return new Error(CONST.ERR_MSG_RABBIT_OFF);
            }
            return connectOptions.hash;
        }).addErrback((err) => {
            this.watcher.logConnect({message: 'error get info', url, err});
            return err;
        });
    }
}
