/// <amd-module name="Lib/Tab/Transport/BroadCast" />
import EventBusChannel = require("Core/EventBusChannel");
import itemUtil = require("Lib/Storage/utils/item");
import createGUID = require("Core/helpers/createGUID");
import {LocalStorageTransport} from "Lib/Tab/Transport/LocalStorage";
import {Transport} from '../Transport';

const NAME = 'TabMessage';

/*
 * Т.к. имя у BroadcastChannel должно совпадать на всех вкладках, то оно должно быть константно,
 * но, если на одной вкладке будет несколько BroadcastChannel, они будут получать события друг от друга.
 * Поэтому BroadcastChannel на страницу делаем в виде синглтона.
 *
 * Навершиваем один глобальный обрабочик события и разриливаем передачу в инстансы BroadCastTransport,
 * Для того чтобы не десериализовать одни и те же данные по несколько раз
 */
/**
 * Обёкет с обработчиками
 * @type {Object}
 */

let handlers: {
    [propName: string]: (message: string, data: any) => void
} = Object.create(null);

/**
 * Глобальный обработчик событий от BroadcastChannel
 * @param {MessageEvent} event
 */
let messageHandler = ({data}: MessageEvent) => {
    let message = data.message;
    let messageData = itemUtil.deserialize(data.data);

    for (let uid in handlers) {
        handlers[uid](message, messageData);
    }
};

let broadcast: BroadcastChannel;
let getBroadCast = () => {
    if (!broadcast) {
        broadcast = new BroadcastChannel(NAME);
        broadcast.addEventListener('message', messageHandler);
    }
    return broadcast;
};

export class BroadCastTransport implements Transport {
    private readonly uid: string;
    private readonly __ls: LocalStorageTransport;
    constructor(channel: EventBusChannel) {
        this.uid = createGUID();
        handlers[this.uid] = (message: string, data) => {
            channel.notify(message, data);
        };
        /*
         * Т.к. изначально был только один транспорт - через LocalStorage
         * возможна ситуация, когда мастер-вкладкой оказалась страница с документом,
         * которую пользователь не хочет обновлять неделями, и нет механизма принудительного отключения мастера
         * Поэтому, чтобы на новых вкладках не потерять события,
         * создаём LocalStorageTransport чтобы только слушать события от мастера.
         *
         * При этом не мастер-вкладки, которые пользователь не захотел обновлять по уведомлению,
         * не получат события от мастер-вкладки на BroadCas.
         * Это можно нормально решить только дублированием событий в оба канала, с последующей фильтрацией дублей
         * Что является слишком затратным по ресурсам. Поэтому так делать не будем
         *
         * TODO удалить после 3.18.400
         */
        this.__ls = new LocalStorageTransport(channel);
    }
    notify(message: string, data: any) {
        /*
         * BroadCast позволяет пересылать простые объекты без лишних танцев
         * Но мы должны поддерживать пересылку Types.entity/* и Types/collection.*
         * Поэтому сериализуем сами данные, а внешний-служебный объект оставляем как есть,
         * дабы не создавать себе лишнюю работу
         */
        getBroadCast().postMessage({
            message,
            data: itemUtil.serialize(data)
        })
    }
    destroy() {
        delete handlers[this.uid];
        this.__ls.destroy();
    }
}