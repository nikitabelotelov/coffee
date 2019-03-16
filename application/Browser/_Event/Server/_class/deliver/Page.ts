/// <amd-module name="Browser/_Event/Server/_class/deliver/Page" />
import { SEB } from "../../interfaces";
import { Notifier } from 'Browser/_Event/Server/_class//Notifier';

/**
 * Доставщик событий только по текущей странице
 */
export class Page implements SEB.IEventDeliver {
    constructor(private notifier: Notifier) {
    }

    deliver(channelName: string, eventName: string, rawData?: string) {
        this.notifier.fire(channelName, eventName, rawData);
    }

    destroy() {
    }
}
