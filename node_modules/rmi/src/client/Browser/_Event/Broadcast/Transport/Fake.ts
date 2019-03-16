/// <amd-module name="Browser/_Event/BroadCast/Transport/Fake" />
import { Channel as EventBusChannel } from 'Env/Event';
import { Transport } from '../Transport';

export class FakeTransport implements Transport {
    // @ts-ignore
    constructor(channel: EventBusChannel) {
    
    }
    notify(message: string, data: any) {}
    destroy() {}
}
