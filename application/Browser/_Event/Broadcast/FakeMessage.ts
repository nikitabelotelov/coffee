/// <amd-module name="Browser/_Event/Broadcast/FakeMessage" />
import { ITabMessage } from './Message';
/** Заглушка Browser/_Event/Broadcast/Message для СП */
export default class FakeMessage implements ITabMessage {
    unsubscribe() { return this; }
    subscribe() { return this; }
    once() { return this; }
    destroy() { }
    notify() { }
}
