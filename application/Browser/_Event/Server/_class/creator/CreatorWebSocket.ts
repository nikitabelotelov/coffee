/// <amd-module name="Browser/_Event/Server/_class/creator/CreatorWebSocket" />
import { SEB } from "../../interfaces";
import { detection } from 'Env/Env';
// @ts-ignore
import UserInfo = require('Core/UserInfo');
import { LocalStorage } from 'Browser/Storage';
import { ConnectOptions } from "Browser/_Event/Server/_class/ConnectOptions";
import { TransportConnect } from "Browser/_Event/Server/_class/creator/TransportConnect";
import * as CONST from "Browser/_Event/Server/_class/transport/Constants";

export class CreatorWebSocket implements SEB.ITransportCreator {
    private isGuestAccess: boolean;
    private ls: LocalStorage = new LocalStorage('SEB');

    constructor(
        private connectOptions: ConnectOptions,
        private transportConnect = new TransportConnect()) {
            let userName = UserInfo.get('ЛогинПользователя') || '';
            this.isGuestAccess = userName.indexOf('__сбис__гость__') > -1;
    }

    isAvailableInEnv(isExclusive: boolean) {
        if (isExclusive) {
            return false;
        }
        return !this.connectOptions.isDesktop() && !detection.isMobileIOS;
    }

    build(hash) {
        return this.chooseTransportConstructor()
            .then<SEB.ITrackedTransport>((ctor) => {
                return this.createTransport(ctor, hash);
            });
    }

    private createTransport(ctor: SEB.ITransportConstructor, hash): Promise<SEB.ITrackedTransport> {
        if (ctor.getLocalName() === 'LocalSlaveTransport') {
            return Promise.resolve(new ctor());
        }
        return this.transportConnect.connect(this.connectOptions, true).then((connect: Stomp.Client) => {
            return new ctor(
                connect, hash,
                !this.isGuestAccess,
                this.connectOptions.exchange
            );
        });
    }

    private chooseTransportConstructor(): Promise<SEB.ITransportConstructor> {
        let timestamp = this.ls.getItem(CONST.KEY_ACTUAL_DATE);

        return new Promise((resolve, reject) => {
            if (!timestamp) {
                return resolve(this.loadMainTransport());
            }

            let last = new Date(timestamp + CONST.CHECK_MIN_INTERVAL * 2);
            if (last < new Date() || isNaN(last.valueOf())) {
                return resolve(this.loadMainTransport());
            }
    
            // @ts-ignore
            require(['Browser/_Event/Server/_class/transport/LocalSlaveTransport'], (module) => {
                if (!module.LocalSlaveTransport) {
                    return reject(new Error('Browser/_Event/Server/_class/transport/LocalSlaveTransport not found'));
                }
                resolve(module.LocalSlaveTransport);
            });
        });
    }

    private loadMainTransport(): Promise<SEB.ITransportConstructor> {
        return new Promise((resolve, reject) => {
            // @ts-ignore
            require(['Browser/_Event/Server/_class/transport/LocalMainTransport'], (module) => {
                if (!module.LocalMainTransport) {
                    return reject(new Error('Browser/_Event/Server/_class/transport/LocalMainTransport not found'));
                }
                resolve(module.LocalMainTransport);
            });
        });
    }
}
