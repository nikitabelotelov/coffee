/// <amd-module name="Browser/_Event/Server/_class/transport/TransportChooser" />
import { SEB } from "../../interfaces";
// @ts-ignore
import Deferred = require('Core/Deferred');
import { WatchDogAggregator as Watcher } from "Browser/_Event/Server/_class/logger/WatchDogAggregator";
import { RabbitEnv } from "Browser/_Event/Server/_class/RabbitEnv";
import { ConnectOptions } from 'Browser/_Event/Server/_class/ConnectOptions';
import { CreatorWebSocket } from "Browser/_Event/Server/_class/creator/CreatorWebSocket";
import { CreatorSockJs } from "Browser/_Event/Server/_class/creator/CreatorSockJs";
import { CreatorExclusive } from "Browser/_Event/Server/_class/creator/CreatorExclusive";
import { CreatorExclusiveSockJs } from "Browser/_Event/Server/_class/creator/CreatorExclusiveSockJs";
import { DeliveryChooser } from "Browser/_Event/Server/_class/deliver/DeliveryChooser";

/**
 * @class Browser/_Event/Server/_class/transport/TransportChooser
 * @memberOf module:ServerEvent.class.transport
 */
export class TransportChooser {
    private builders: Array<SEB.ITransportCreator> = [];
    private defStrategy: Deferred<SEB.ITrackedTransport>;
    private deliveryChooser: DeliveryChooser;

    /**
     * @param {Browser/_Event/Server/_class/ConnectOptions} connectOptions
     * @param {Function} onclose коллбэк закрытия соединения. Пробрасывается в транспорт
     * @param {boolean} isExclusive создавать ли выделенное соединение для вкладки
     * @param {SEB.IWatchDogSystem} watcher класс логирования
     */
    constructor(private connectOptions: ConnectOptions,
                private onclose: (v) => any = (v) => {
                    return v;
                },
                private isExclusive: boolean = false,
                private watcher: SEB.IWatchDogSystem = new Watcher()) {

        this.deliveryChooser = new DeliveryChooser(watcher);
        let strategies: SEB.ITransportCreatorConstructor[] = [
            CreatorWebSocket,
            CreatorSockJs,
            CreatorExclusive,
            CreatorExclusiveSockJs
        ];

        for (let strategy of strategies) {
            let builder = new strategy(this.connectOptions);
            if (!builder.isAvailableInEnv(this.isExclusive)) {
                continue;
            }
            this.builders.push(builder);
        }
    }

    destructor() {
        this.defStrategy && this.defStrategy.addCallback((transport: SEB.ITransport) => {
            this.watcher && this.watcher.logDisconnect('Manual disconnect');
            transport.close();
        });
    }

    /**
     * Выбор стратегии транспорта сообщений.
     * @return {Deferred<ITransport>}
     */
    choose(): Deferred<SEB.ITrackedTransport> {
        if (this.defStrategy) {
            return this.defStrategy.createDependent();
        }

        this.defStrategy = this.build();
        this.defStrategy.addCallback((transport: SEB.IFullTransport) => {
            transport.setDisconnectHandler((event) => {
                this.defStrategy = undefined;
                this.onclose(event);
            });

            transport.setWatchDog(this.watcher);
            return this.deliveryChooser.choose(transport)
                .addCallback((deliver: SEB.IEventDeliver) => {
                    transport.setDelivery(deliver);
                    return transport;
                });
        });

        return this.defStrategy.createDependent();
    }

    /**
     * Метод строит транспорт и возвращает deferred
     * @return {Deferred}
     */
    private build(): Deferred<SEB.ITrackedTransport> {
        let rbt = new RabbitEnv(this.watcher);

        return rbt.up(this.connectOptions).addCallback<SEB.ITrackedTransport>((hash) => {
            return this.createTransport(hash);
        });
    }

    private createTransport(hash: string): Deferred<SEB.ITrackedTransport> {
        let def = new Deferred<SEB.ITrackedTransport>();
        for (let builder of this.builders) {
            def.addErrback(() => {
                return Deferred.fromPromise(builder.build(hash));
            });
        }
        def.addErrback((err) => {
            return new Error("No one server event bus transport choice.");
        });
        /**
         * Запускаем цепочку выбора
         */
        def.errback();

        return def;
    }
}
