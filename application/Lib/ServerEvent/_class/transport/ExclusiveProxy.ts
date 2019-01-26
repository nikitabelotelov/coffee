/// <amd-module name="Lib/ServerEvent/_class/transport/ExclusiveProxy" />
import { SEB } from "../../interfaces";
import Deferred = require('Core/Deferred');
import LocalStorageNative = require('Core/LocalStorageNative');
import * as CONST from "Lib/ServerEvent/_class/Constants";
import { DeviceEnv } from "Lib/ServerEvent/_class/DeviceEnv";
import { ConnectOptions } from "Lib/ServerEvent/_class/ConnectOptions";
import { TransportChooser } from "Lib/ServerEvent/_class/transport/TransportChooser";
import { Subscribe, RawChanneledSubscribe } from "Lib/ServerEvent/_class/Subscribe";
import * as DebugUtils from "Lib/ServerEvent/DebugUtils";

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
