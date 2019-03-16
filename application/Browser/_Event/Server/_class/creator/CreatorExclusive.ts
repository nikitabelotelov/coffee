/// <amd-module name="Browser/_Event/Server/_class/creator/CreatorExclusive" />
import {SEB} from "../../interfaces";
import { detection } from 'Env/Env';
import { ConnectOptions } from "Browser/_Event/Server/_class/ConnectOptions";
import { TransportConnect } from "Browser/_Event/Server/_class/creator/TransportConnect";

export class CreatorExclusive implements SEB.ITransportCreator {

    constructor(
        private connectOptions: ConnectOptions,
        private transportConnect = new TransportConnect()) {
    }

    isAvailableInEnv(isExclusive: boolean) {
        return isExclusive || this.connectOptions.isDesktop() || detection.isMobileIOS;
    }

    build(hash) {
        return new Promise<SEB.ITransportConstructor>((resolve, reject) => {
            // @ts-ignore
            require(['Browser/_Event/Server/_class/transport/LocalPageTransport'], ({ LocalPageTransport }) => {
                resolve(LocalPageTransport);
            });
        }).then((LocalPageTransport) => {
            return this.createTransport(LocalPageTransport, hash);
        });
    }

    private createTransport(ctor: SEB.ITransportConstructor, hash): Promise<SEB.ITrackedTransport> {
        return this.transportConnect.connect(this.connectOptions, false).then((connect: Stomp.Client) => {
            return new ctor(
                connect, hash,
                false,
                this.connectOptions.exchange
            );
        });
    }
}
