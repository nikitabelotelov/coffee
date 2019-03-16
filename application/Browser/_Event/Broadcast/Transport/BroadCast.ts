/// <amd-module name="Browser/_Event/BroadCast/Transport/BroadCast" />
import { Channel as EventBusChannel } from 'Env/Event';
import { utils } from 'Browser/Storage';
// @ts-ignore
import createGUID = require("Core/helpers/createGUID");
import { Transport } from '../Transport';

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
    let messageData = utils.item.deserialize(data.data);

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
    // @ts-ignore
    constructor(channel: EventBusChannel) {
        this.uid = createGUID();
        handlers[this.uid] = (message: string, data) => {
            channel.notify(message, data);
        };
    }
    notify(message: string, data: any) {
        /*
         * BroadCast позволяет пересылать простые объекты без лишних танцев
         * Но мы должны поддерживать пересылку Types/entity.* и Types/collection.*
         * Поэтому сериализуем сами данные, а внешний-служебный объект оставляем как есть,
         * дабы не создавать себе лишнюю работу
         */
        getBroadCast().postMessage({
            message,
            data: utils.item.serialize(data)
        })
    }
    destroy() {
        delete handlers[this.uid];
    }
}
