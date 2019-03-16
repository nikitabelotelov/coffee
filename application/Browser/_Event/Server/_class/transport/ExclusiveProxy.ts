/// <amd-module name="Browser/_Event/Server/_class/transport/ExclusiveProxy" />
import { SEB } from "../../interfaces";
// @ts-ignore
import Deferred = require('Core/Deferred');
import { LocalStorageNative } from 'Browser/Storage';
import * as CONST from "Browser/_Event/Server/_class/Constants";
import { DeviceEnv } from "Browser/_Event/Server/_class/DeviceEnv";
import { ConnectOptions } from "Browser/_Event/Server/_class/ConnectOptions";
import { TransportChooser } from "Browser/_Event/Server/_class/transport/TransportChooser";
import { Subscribe, RawChanneledSubscribe } from "Browser/_Event/Server/_class/Subscribe";
import * as DebugUtils from "Browser/_Event/Server/DebugUtils";

class SubscribeExclusiveError {
    public message: string;
    public cause: any;
    public name: string;
    public stack: any;
    constructor() {
        this.message = 'Need subscribe connect to subscribe';
        this.name = 'SubscribeExclusiveError';
    }
}

/**
 * @private
 * @class ExclusiveProxy
 * Класс, который оборачивает стандартные транспорты, для решения задач:
 *  <li>для идентификации смены эксклюзивности подписок</li>
 *  <li>для cоздания подписок с полным набором данных</li>
 */
export class ExclusiveProxy implements SEB.ITrackedTransport {
    static init(isExclusive: boolean=false,
                onCloseHandler: (event: Event) => any, watcher: SEB.IWatchDogSystem): Deferred<ExclusiveProxy> {
        let def = new Deferred<ExclusiveProxy>();
        let connectOptions: ConnectOptions;
        DeviceEnv.getOptions().addCallback<SEB.ITrackedTransport>((options: ConnectOptions) => {
            connectOptions = options;
            return new TransportChooser(
                    options,
                    onCloseHandler,
                    isExclusive,
                    watcher
                ).choose();
        }).addCallback((transport) => {
            try {
                DebugUtils.attachDebugFn();
                watcher.logConnect({
                    connectOptions,
                    transport: (transport.constructor as SEB.ITransportConstructor).getLocalName()
                });
                if (window && LocalStorageNative.getItem('shared-bus-debug') === 'true') {
                    window["sharedBusWatch"]();
                }
            } catch (e) {
                // игнорируем проблемы отладочных утилит
            }
            def.callback(new ExclusiveProxy(transport, isExclusive, connectOptions));
        }).addErrback((err) => {
            def.errback(err);
            return err;
        });

        return def;
    }

    protected constructor(
        private transport: SEB.ITrackedTransport,
        private isExclusive: boolean,
        private options: ConnectOptions) {
    }

    subscribe(subscribe: SEB.ISubscribe) {
        if (subscribe.getDeliveryType() !== CONST.DELIVERY_COMMON
            && !this.isExclusive) {
            throw new SubscribeExclusiveError();
        }

        if (subscribe instanceof RawChanneledSubscribe) {
            this.transport.subscribe(Subscribe.create(
                subscribe.getChannelName(),
                subscribe.isChanneled(),
                this.isExclusive,
                this.options.getUid(subscribe.getScope())
            ));
            return;
        }
        this.transport.subscribe(subscribe);
    }

    unsubscribe(subscribe: SEB.ISubscribe) {
        if (subscribe instanceof RawChanneledSubscribe) {
            this.transport.unsubscribe(Subscribe.create(
                subscribe.getChannelName(),
                subscribe.isChanneled(),
                this.isExclusive,
                this.options.getUid(subscribe.getScope())
            ));
            return;
        }
        this.transport.unsubscribe(subscribe);
    }

    setDelivery(delivery: SEB.IEventDeliver) {
        this.transport.setDelivery(delivery);
    }

    close() {
        this.transport.close();
        this.transport = undefined;
    }

    setWatchDog(watcher: SEB.IWatchDog) {
        this.transport.setWatchDog(watcher);
    }
}
