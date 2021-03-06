/// <amd-module name="Browser/_Event/Server/_class/transport/Transport" />
import { SEB } from "../../interfaces";
import { WatchDogAggregator as Watcher } from "Browser/_Event/Server/_class/logger/WatchDogAggregator";

/**
 * Класс транспорта, который работает с доставщиком.
 * TODO нужно что-то придумать с protected методами. Не удачное решение.
 */
export abstract class Transport implements SEB.ITrackedTransport, SEB.ILazyTransport {
    protected delivery: SEB.IEventDeliver;
    private watcher: SEB.IWatchDog = new Watcher();

    constructor() {
        this.messageHandler = this.messageHandler.bind(this);
    }

    abstract getLocalName();

    abstract subscribe(subscribe: SEB.ISubscribe);

    abstract unsubscribe(subscribe: SEB.ISubscribe);

    /**
     * Устанавливает обработчик,
     * который срабатывает при внутреннем отсоединении
     * @param {(event) => any} fn
     */
    abstract setDisconnectHandler(fn: (event: Event) => any);

    /**
     * Метод принудитиельного отключения транспорта
     * DisconnectHandler не срабатывает
     */
    abstract close();

    protected messageHandler(message: Stomp.Message) {
        if (!('event-type' in message.headers)) {
            return;
        }
        let channelName = (message.headers["event-type"] as string).toLocaleLowerCase();
        this.watcher.logStomp(message);
        this.delivery && this.delivery.deliver(channelName, 'onmessage', message.body);
    }

    protected destructor() {
        this.delivery && this.delivery.destroy();
    }

    setDelivery(delivery: SEB.IEventDeliver) {
        this.delivery = delivery;
    }

    setWatchDog(watcher: SEB.IWatchDog) {
        this.watcher = watcher;
    }
}
