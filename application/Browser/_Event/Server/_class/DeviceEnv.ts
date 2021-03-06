/// <amd-module name="Browser/_Event/Server/_class/DeviceEnv" />
// @ts-ignore
import Deferred = require('Core/Deferred');
import { IoC } from 'Env/Env';
import { XHR } from 'Browser/Transport';
import { SEB } from "../interfaces";
import * as CONST from 'Browser/_Event/Server/_class/Constants';
import { ConnectOptions } from './ConnectOptions';

function sidFromCookie() {
    let sid = document.cookie.split("; ").filter((i) => {
        return i.substr(0, 4) == "sid=";
    }).map((i) => {
        return i.substr(4);
    }).pop();
    return sid;
}

const REQUEST_LIMIT = 2 * 1000;
const MINUTE = 60000;
const SECONDS_10 = 10000;

export class DeviceEnv {
    /**
     * Проверяем окружение и получем данные для соединения
     * Вызываться должно перед /info потому что на некоторых страницах из-за отсутствия
     *  авторизации получали код 401 на запрос из RabbitEnv::tryCreateChannel и уходили
     *  в бесконечную перезагрузку страницы
     *  https://online.sbis.ru/opendoc.html?guid=4fd283fb-e699-451a-be23-72778f2dff2e&des=
     * @return {Deferred} Возвращает url хоста или undefined
     */
    private static getConnectData(lastTimeout?: number): Deferred<SEB.IHashData> {
        if (!lastTimeout) {
            lastTimeout = Math.round(Math.random() * SECONDS_10);
        }

        if (lastTimeout > MINUTE) {
            lastTimeout = MINUTE;
        }

        let def = new Deferred<SEB.IHashData>();
        let timer = Date.now();
        new XHR({
            url: '/!hash/',
            method: 'GET',
            dataType: 'json'
        }).execute().addCallback((response: {result: SEB.IHashData}) => {
            if (Date.now() - timer > REQUEST_LIMIT) {
                IoC.resolve("ILogger").warn(`[STOMP][timeout] /!hash/ request to long: ${Date.now() - timer}ms`);
            }
            def.callback(response.result);
        }).addErrback((err: any) => {
            if (err.httpError === 404) {
                def.errback(err);
                return;
            }

            // httpError === 0 — нет соединения с интернетом
            if (err.httpError === 0) {
                lastTimeout = SECONDS_10;
            }

            setTimeout(() => {
                DeviceEnv.getConnectData(lastTimeout + Math.round(Math.random()*10000)).addCallback((data) => {
                    def.callback(data);
                });
            }, lastTimeout);
        });

        return def;
    }

    static getOptions(): Deferred<ConnectOptions> {
        let result = new Deferred<ConnectOptions>();
        DeviceEnv.getConnectData().addCallbacks((data) => {
            let sid = data.sid;
            if (!sid) {
                sid = sidFromCookie();
            }
            if (!sid) {
                throw new Error(CONST.ERR_MSG_EMPTY_SID);
            }

            if (!data.user) {
                return new Error(CONST.ERR_MSG_HASH_401);
            }

            let cid = data.cid;
            if (!cid) {
                cid = sid.substr(0, 8)
            }

            let uid = data.uid;
            if (!uid) {
                uid = sid.substr(9, 8)
            }

            let connectOptions;
            if (!!data.url) {
                connectOptions = ConnectOptions.createForDesktop(
                    sid, data.user, data.url, cid, uid
                );
            }

            let stompPath = '/stomp/';
            if(!!data.path) {
                stompPath = data.path;
            }

            if (data.domain) {
                connectOptions = new ConnectOptions(sid, data.user,
                    location.protocol, data.domain, stompPath, data.exchange,
                    cid, uid);
            }
            if (!connectOptions) {
                connectOptions = ConnectOptions.createByLocation(sid, data.user,
                    stompPath, cid, uid);
            }
            result.callback(connectOptions);
        }, (err) => {
            result.errback(err);
        });

        return result;
    }
}
