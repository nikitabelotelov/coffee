/// <amd-module name="Lib/ServerEvent/_class/Events" />

const STR_DISABLE = 'disableservereventbus';
const STR_LATE_MAIN = 'detectlatermain';

class FakeEvent implements Event {
    constructor(type) {
        this.type = type;
    }
    /**
     * Returns true or false depending on how event was initialized. True if event goes through its target's ancestors in reverse tree order, and false otherwise.
     */
    readonly bubbles: boolean = false;
    cancelBubble: boolean = false;
    readonly cancelable: boolean = false;
    /**
     * Returns true or false depending on how event was initialized. True if event invokes listeners past a ShadowRoot node that is the root of its target, and false otherwise.
     */
    readonly composed: boolean;
    /**
     * Returns the object whose event listener's callback is currently being
     * invoked.
     */
    readonly currentTarget: EventTarget | null;
    readonly defaultPrevented: boolean;
    readonly eventPhase: number;
    /**
     * Returns true if event was dispatched by the user agent, and
     * false otherwise.
     */
    readonly isTrusted: boolean;
    returnValue: boolean;
    /** @deprecated */
    readonly srcElement: Element | null;
    /**
     * Returns the object to which event is dispatched (its target).
     */
    readonly target: EventTarget | null;
    /**
     * Returns the event's timestamp as the number of milliseconds measured relative to
     * the time origin.
     */
    readonly timeStamp: number;
    /**
     * Returns the type of event, e.g.
     * "click", "hashchange", or
     * "submit".
     */
    readonly type: string;
    composedPath(): EventTarget[] { return []; }
    initEvent(type: string, bubbles ?: boolean, cancelable ?: boolean): void {}
    preventDefault(): void {}
    /**
     * Invoking this method prevents event from reaching
     * any registered event listeners after the current one finishes running and, when dispatched in a tree, also prevents event from reaching any
     * other objects.
     */
    stopImmediatePropagation(): void {}
    /**
     * When dispatched in a tree, invoking this method prevents event from reaching any objects other than the current object.
     */
    stopPropagation(): void {}
    readonly AT_TARGET: number;
    readonly BUBBLING_PHASE: number;
    readonly CAPTURING_PHASE: number;
    readonly NONE: number;
}

export function create(type): Event {
    try {
        return new Event(type);
    } catch (e) {
        if (typeof document === 'undefined') {
            return new FakeEvent(type);
        }
        // For Internet Explorer 11:
        let event = document.createEvent('Event');
        event.initEvent(type, false, false);
        return event;
    }
}

export const EVENT_DISABLE_SEB = create(STR_DISABLE);
export const EVENT_LATER_MAIN_TRANSPORT = create(STR_LATE_MAIN);
