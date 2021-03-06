/// <amd-module name="Browser/_Event/Server/_class/transport/LocalSlaveTransport" />
import { SEB } from "../../interfaces";
import { Broadcast as TabMessage } from 'Browser/Event';
import { LocalStorage } from 'Browser/Storage';
import * as CONST from 'Browser/_Event/Server/_class/transport/Constants';
import { Transport } from "./Transport";
import { create as createEvent } from "Browser/_Event/Server/_class/Events";
import { SubscribeContainer } from "Browser/_Event/Server/_class/SubscribeContainer";
import { ITabMessage } from 'Browser/_Event/Broadcast/Message';

export class LocalSlaveTransport extends Transport {
    private mainChecker: number;
    private minInterval: number;

    private ls: LocalStorage = new LocalStorage(CONST.LS_PREFIX);

    private taber: ITabMessage = new TabMessage();

    private subscribes = new SubscribeContainer();
    private subMainReady: (event, data: any) => void;
    /**
     * Необходима, что бы при обаружении смены мастера, вызвать пересоздание
     */
    private disconnectCallback: (event: Event) => void;

    constructor() {
        super();
        this.minInterval = CONST.CHECK_MIN_INTERVAL * 2 +
            Math.floor(Math.random() * CONST.RECONNECT_INTERVAL);
        this.setDisconnectHandler(() => {
        });

        this.subMainReady = () => {
            if (!this.subscribes.hasChanneled()) {
                return;
            }
            this.destructor('Reconnect to resubscribe');
        };
        this.taber.subscribe(CONST.KEY_MAINREADY, this.subMainReady);

        this.unloadWindow = this.unloadWindow.bind(this);
        window.addEventListener('unload', this.unloadWindow);
        this.taber.notify(CONST.KEY_NEW_PAGE, "");
    }

    getLocalName() {
        return LocalSlaveTransport.getLocalName();
    }

    static getLocalName() {
        return 'LocalSlaveTransport';
    }

    subscribe(subscribe: SEB.ISubscribe): void {
        this.subscribes.add(subscribe);
        this.taber.notify(CONST.KEY_SUBSCRIBE, subscribe);
    }

    unsubscribe(subscribe: SEB.ISubscribe): void {
        this.subscribes.remove(subscribe);
        this.taber.notify(CONST.KEY_UNSUBSCRIBE, subscribe);
    }

    /**
     * Функция, которая очищает ресурсы
     */
    protected destructor(message?: string, isFireCallback: boolean = true) {
        this.taber.unsubscribe(CONST.KEY_MAINREADY, this.subMainReady);
        if (this.mainChecker) {
            clearInterval(this.mainChecker);
            this.mainChecker = undefined;
        }
        this.taber = undefined;

        window.removeEventListener('unload', this.unloadWindow);
        let callback = this.disconnectCallback;
        this.disconnectCallback = () => {};
        super.destructor();
        if (isFireCallback) {
            const event = message ? createEvent(message) : undefined
            callback(event);
        }
    }

    /**
     * Начинаю проверять о закрытии лишь после того как обработчик установили.
     * Проверяем ключ о том что мастер жив.
     * Если обнаружили, что мертв, то проверяем ключ, не начал ли кто реконнект.
     * Если истекли все таймауты, то начинаю перезагружаться сам
     * @param fn
     */
    setDisconnectHandler(fn) {
        this.disconnectCallback = fn;
        if (this.mainChecker) {
            clearInterval(this.mainChecker);
        }
        // @ts-ignore
        this.mainChecker = setInterval(() => {
            let actualMainDate = this.ls.getItem(CONST.KEY_ACTUAL_DATE);
            if (actualMainDate + this.minInterval > Date.now()) {
                return;
            }
            let isAlreadyReconnect = this.ls.getItem(CONST.KEY_TRY_CREATE_MAIN) || 0;
            if (isAlreadyReconnect + CONST.RECONNECT_INTERVAL > Date.now()) {
                return;
            }
            this.ls.setItem(CONST.KEY_TRY_CREATE_MAIN, Date.now());
            this.destructor('Main is dead');
        }, this.minInterval);
    }

    private unloadWindow() {
        /* Не вызвываем колбэк переподключения,
        что бы не стать при закрытии окна мастером */
        this.close(false);
    }

    /**
     * Рассылаем уведомление об отписке и очищаем ресурсы
     */
    close(isFireCallback: boolean = true) {
        for (let subscribe of this.subscribes.all()) {
            this.taber.notify(CONST.KEY_UNSUBSCRIBE, subscribe);
        }
        this.destructor('closeWindow', isFireCallback);
    }
}
