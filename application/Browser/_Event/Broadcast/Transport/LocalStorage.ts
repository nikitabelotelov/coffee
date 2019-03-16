/// <amd-module name="Browser/_Event/BroadCast/Transport/LocalStorage" />
import { LocalStorage } from 'Browser/Storage';
import { Channel as EventBusChannel } from 'Env/Event';
import { detection } from 'Env/Env';
import {Transport} from '../Transport';

const NAME = 'TabMessage';
let removeTimers = {};

export class LocalStorageTransport implements Transport {
    private storage: LocalStorage;
    // @ts-ignore
    constructor(private channel: EventBusChannel) {
        this.storage = new LocalStorage(NAME, undefined, false);
        // @ts-ignore
        this.storage.subscribe('onChange', (event, message, data) => {
            this.channel.notify(message, data);
        });
    }
    notify(message: string, data: any) {
        this.storage.setItem(message, data);
        if (!detection.isIE) {
            return this.storage.removeItem(message);
        }
        /**
         * Необходимо почистить хранилище за собой, однако в IE событие onStorage на больших строках не вызывается
         * поэтому внутри он записывает вспомогательное значение. чтобы вызвать фейкоое событие на всех вкладках
         * тут получается проблема, что есть делать set + remove на одной вкладке, вспомогательное событие на другой
         * может отработать позже remove и когда полезет за данными через get их уже не будет там,
         * что в итоге приведёт к двум событиям onremove на вкладках получателях.
         */
        if (removeTimers[message]) {
            clearTimeout(removeTimers[message]);
        }
        removeTimers[message] = setTimeout(() => {
            this.storage.removeItem(message);
        }, 500);
    }
    destroy() {
        this.storage.destroy();
    }
}
