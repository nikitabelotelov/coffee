/// <amd-module name="Browser/_Event/Server/_class/transport/LocalPageTransport" />
import { SEB } from "../../interfaces";
// @ts-ignore
import Deferred = require('Core/Deferred');
import { detection as _detect } from 'Env/Env';
import { LocalStorageNative } from 'Browser/Storage';
import { Transport } from "./Transport";
import { SubscribeContainer } from "Browser/_Event/Server/_class/SubscribeContainer";
import { IAckSender, AckSender } from 'Browser/_Event/Server/native/AckSender';
import { Connector } from 'Browser/_Event/Server/native/_IndexedDB/Connector';
import { AdapterStomp } from 'Browser/_Event/Server/native/_IndexedDB/AdapterStomp';
import { Writer } from 'Browser/_Event/Server/native/_IndexedDB/Writer';

function subscribeIdHeaderCreator(channelName, guid, receipt, person: string|null) {
    let personPostfix = person ? `-${person}` : '';
    return `${guid}-${receipt}-${channelName}${personPostfix}`;
}

export class LocalPageTransport extends Transport {
    /** Идентификатор браузера */
    private guid: string;
    private subscribes = new SubscribeContainer();
    private onclose: Function = () => {
    };
    private ackSender: IAckSender;
    private eventStore: Deferred<Writer>;

    private hasCommon: boolean = false;
    private closeWsHandler: EventListener;

    constructor(private stomp: Stomp.Client, private hash: string,
                private persistent: boolean = true, private exchangeName: string,
                private isAck: boolean = false) {
        super();
        // TODO временный костыль хранения GUID устройства
        this.guid = LocalStorageNative.getItem('SEB.GUID');
        if (!this.guid) {
            this.guid = LocalPageTransport.generateGUID();
            LocalStorageNative.setItem('SEB.GUID', this.guid);
        }
        if (!persistent) {
            this.guid = this.guid + Math.floor(Math.random()*10000);
        }

        this.ackSender = AckSender.createAckSender(isAck);
        this.ackSender.start();
        this.closeWsHandler = (evt) => { this.onclose(evt); };
        stomp.ws.addEventListener('close', this.closeWsHandler);
        this.eventStore = Deferred.fail<Writer>();
        if (!_detect.isMobilePlatform && !_detect.safari) {
            this.eventStore = Connector.connect(
                Connector.DB_DEBUG,
                Connector.DEBUG_STORE_NAME,
                new AdapterStomp()
            ).addCallback<Writer>((connect: Connector) => {
                return connect.createWriter();
            });
        }
    }

    static getLocalName() {
        return 'LocalPageTransport';
    }

    getLocalName() {
        return LocalPageTransport.getLocalName();
    }

    protected messageHandler(message: Stomp.Message) {
        super.messageHandler(message);
        this.ackSender.push(message);
        this.eventStore.addCallback((writer: Writer) => {
            writer.write(message);
            return writer;
        });
    }

    subscribe(subscribe: SEB.ISubscribe): void {
        if (subscribe.isChanneled()) {
            return this.subscribeChanneled(subscribe as SEB.IChanneledSubscribe);
        }
        if (!this.hasCommon) {
            this.hasCommon = true;
            this.stomp.subscribe(
                `/exchange/${this.exchangeName}:${this.hash}`,
                this.messageHandler,
                this.createHeader()
            );
        }
        this.subscribes.add(subscribe);
        this.delivery.deliver(subscribe.getChannelName(), 'onready');
    }

    private subscribeChanneled(subscribe: SEB.IChanneledSubscribe) {
        if (this.subscribes.has(subscribe)) {
            this.subscribes.add(subscribe);
            this.delivery.deliver(subscribe.getChannelName(), 'onready');
            return;
        }
        this.subscribes.add(subscribe);
        let endpoint = subscribe.getChannelName();
        let person;
        if (subscribe.getTarget() !== null) {
            person = subscribe.getTarget();
            endpoint = `${person}$${subscribe.getChannelName()}`;
        }

        this.stomp.subscribe(
            `/exchange/${this.exchangeName}.channel/${endpoint}`,
            this.messageHandler,
            this.createChanneledHeader(subscribe, person)
        );

        this.delivery.deliver(subscribe.getChannelName(), 'onready');
    }

    unsubscribe(subscribe: SEB.ISubscribe): void {
        this.subscribes.remove(subscribe);
        if (!subscribe.isChanneled()) {
            return;
        }
        // TODO закладываюсь, что нет канализированных и не канализированных с одним именем
        if (this.subscribes.has(subscribe)) {
            return;
        }

        let person = (subscribe as SEB.IChanneledSubscribe).getTarget();
        this.stomp.unsubscribe(
            subscribeIdHeaderCreator(
                subscribe.getChannelName(),
                this.guid,
                this.hash,
                person
            )
        );
        this.delivery.deliver(subscribe.getChannelName(), 'ondisconnect');
    }

    protected destructor() {
        this.callDisconnect();
        super.destructor();
        this.ackSender.stop();
        this.eventStore.addCallback((writer: Writer) => {
            writer.destructor();
            return writer;
        });
        this.stomp.ws.removeEventListener('close', this.closeWsHandler);
        if (this.stomp.ws.readyState == 3 || this.stomp.ws.readyState == 2) {
            return;
        }
        this.stomp.ws.close(1000);
    }

    setDisconnectHandler(fn) {
        this.onclose = (event) => {
            this.destructor();
            fn(event);
        };
    }

    close() {
        this.destructor();
    }

    private callDisconnect() {
        let deliver = (subscribe: SEB.ISubscribe) => {
            this.delivery.deliver(subscribe.getChannelName(), 'ondisconnect');
        };
        this.subscribes.all().forEach(deliver);
    }

    private createHeader() {
        let header = {
            receipt: this.hash,
            id: `${this.guid}-${this.hash}`,
            persistent: this.persistent,
            "auto-delete": !this.persistent
        };

        if (this.isAck) {
            header['prefetch-count'] = 10;
            header['ack'] = 'client';
        }
        return header;
    }

    private createChanneledHeader(subscribe: SEB.ISubscribe, person?: string) {
        let id = subscribeIdHeaderCreator(subscribe.getChannelName(), this.guid, this.hash, person);

        let header = {
            receipt: this.hash,
            id,
            persistent: this.persistent,
            "auto-delete": !this.persistent
        };

        if (this.isAck) {
            header['prefetch-count'] = 10;
            header['ack'] = 'client';
        }
        return header;
    }

    private static generateGUID() {
        function s4() {
            return Math.floor((1 + Math.random()) * 0x10000)
                .toString(16)
                .substring(1);
        }

        return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
            s4() + '-' + s4() + s4() + s4();
    }
}
