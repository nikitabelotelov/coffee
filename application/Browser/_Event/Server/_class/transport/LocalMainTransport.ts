/// <amd-module name="Browser/_Event/Server/_class/transport/LocalMainTransport" />
import { SEB } from "../../interfaces";
// @ts-ignore
import UserInfo = require('Core/UserInfo');
import { Broadcast as TabMessage } from 'Browser/Event';
import { LocalStorage, LocalStorageNative } from 'Browser/Storage';
import * as CONST from 'Browser/_Event/Server/_class/transport/Constants';
import { LocalPageTransport } from "Browser/_Event/Server/_class/transport/LocalPageTransport";
import { Subscribe } from "Browser/_Event/Server/_class/Subscribe";
import { EVENT_DISABLE_SEB, EVENT_LATER_MAIN_TRANSPORT } from "Browser/_Event/Server/_class/Events";
import { ITabMessage } from 'Browser/_Event/Broadcast/Message';

export class LocalMainTransport implements SEB.ITrackedTransport {
    private transport: LocalPageTransport;
    private ls: LocalStorage = new LocalStorage(CONST.LS_PREFIX);
    private taber: ITabMessage = new TabMessage();
    private mainChecker: number;

    private subFromTaber: (event, data: SEB.ISubscribeData) => void;
    private unsubFromTaber: (event, data: SEB.ISubscribeData) => void;
    private fnQuit: (event, data) => void;

    /**
     * Ключ, котоырй указывает, что он не единственный мастер
     * Стейт появляется лишь при закрытии, что бы оно пошло по другому.
     * @type {boolean}
     */
    private isAloneMain = true;
    /**
     * Необходима, что бы при обаружении смены мастера, вызвать пересоздание
     */
    private disconnectCallback: (event: Event) => void;

    constructor(private stomp: Stomp.Client, private hash: string,
                private persistent: boolean = true, private exchangeName: string) {
        /**
         * Нужно всем сообщить, что мастер готов.
         */
        this.fixMain();

        // region Разрешение гонок создания
        /**
         * Кто последний стал мастером, тот и главный.
         * Все асинхронное, поэтому проверяем по дате создания
         * @type {number}
         */
        let now = Date.now();
        this.taber.notify(CONST.KEY_MAINREADY, now);
        /**
         * Функция отключения транспорта, когда он обнаржил, что не актуален
         */
        this.fnQuit = (event, other) => {
            if (other < now) {
                return;
            }
            this.taber.unsubscribe(CONST.KEY_MAINREADY, this.fnQuit);
            this.isAloneMain = false;
            this.close(EVENT_LATER_MAIN_TRANSPORT);
        };
        this.taber.subscribe(CONST.KEY_MAINREADY, this.fnQuit);
        this.taber.subscribe(CONST.KEY_NEW_PAGE, (event) => {
            if (!UserInfo.isValid()) {
                this.fnQuit(event, new Date());
            }
        });
        // endregion

        this.ls.removeItem(CONST.KEY_TRY_CREATE_MAIN);
        // @ts-ignore
        this.mainChecker = setInterval(() => {
            this.fixMain();
        }, CONST.CHECK_MIN_INTERVAL);

        const isAck = 'true' === LocalStorageNative.getItem('shared-bus-ack');
        this.transport = new LocalPageTransport(
            stomp, hash, persistent, exchangeName, isAck
        );

        this.subFromTaber = (event, data: SEB.ISubscribeData) => {
            this.subscribe(Subscribe.create(data.channelName, data.channeled, false, data.target));
        };
        this.unsubFromTaber = (event, data: SEB.ISubscribeData) => {
            this.unsubscribe(Subscribe.create(data.channelName, data.channeled, false, data.target));
        };
        this.taber.subscribe(CONST.KEY_SUBSCRIBE, this.subFromTaber);
        this.taber.subscribe(CONST.KEY_UNSUBSCRIBE, this.unsubFromTaber);

        window && window.addEventListener('unload', () => {
            this.close(EVENT_DISABLE_SEB);
        });
    }

    private fixMain() {
        this.ls.setItem(CONST.KEY_ACTUAL_DATE, Date.now());
    }

    static getLocalName() {
        return 'LocalMainTransport';
    }

    getLocalName() {
        return LocalMainTransport.getLocalName();
    }

    subscribe(subscribe) {
        this.transport.subscribe(subscribe);
    }

    unsubscribe(subscribe: SEB.ISubscribe) {
        this.transport.unsubscribe(subscribe);
    }

    destructor(event?: Event) {
        /*
         * Может прилететь второй вызов при остановке транспорта черзе хендлер
         */
        if (this.taber) {
            this.taber.unsubscribe(CONST.KEY_SUBSCRIBE, this.subFromTaber);
            this.taber.unsubscribe(CONST.KEY_UNSUBSCRIBE, this.unsubFromTaber);
            this.taber.unsubscribe(CONST.KEY_MAINREADY, this.fnQuit);
            this.taber = undefined;
        }

        if (this.isAloneMain) {
            this.ls.removeItem(CONST.KEY_ACTUAL_DATE);
        }
        clearInterval(this.mainChecker);
        let callback = this.disconnectCallback;
        this.disconnectCallback = () => {
        };
        /* @link https://online.sbis.ru/opendoc.html?guid=6a5657b5-9316-4781-9a9d-b80f1688ce8e
           Firefox продолжает выполнять JS даже после перехода на новую страницу во вкладке.
           И объекты уже могут быть очищены, но он их пытается вызывать. */
        if (!callback) { return; }
        callback(event);
    }

    /**
     * Обработчик вызывается после деструктора
     * @param {(event) => any} fn
     */
    setDisconnectHandler(fn: (event: Event) => any) {
        this.disconnectCallback = fn;
        this.transport.setDisconnectHandler((event) => {
            this.destructor(event);
        });
    }

    /**
     * Закрыте транспорта.
     * При закрытии транспорта не вызывается DisconnectHandler
     */
    close(event?: Event) {
        this.transport.close();
        this.destructor(event);
    }

    setDelivery(delivery: SEB.IEventDeliver) {
        this.transport.setDelivery(delivery);
    }

    setWatchDog(watcher: SEB.IWatchDog) {
        this.transport.setWatchDog(watcher);
    }
}
