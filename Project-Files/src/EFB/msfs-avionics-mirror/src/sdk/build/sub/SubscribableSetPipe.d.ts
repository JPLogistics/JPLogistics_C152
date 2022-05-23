import { HandlerSubscription } from './HandlerSubscription';
import { MutableSubscribableSet, SubscribableSet, SubscribableSetEventType } from './SubscribableSet';
/**
 * A pipe from an input subscribable set to an output mutable subscribable set. Each key added/removed notification
 * received by the pipe is used to add/remove keys to/from the output set.
 */
export declare class SubscribableSetPipe<I, O, HandlerType extends (set: ReadonlySet<I>, type: SubscribableSetEventType, key: I, ...args: any[]) => void> extends HandlerSubscription<HandlerType> {
    /**
     * Constructor.
     * @param from The input subscribable set.
     * @param to The output mutable subscribable set.
     * @param onDestroy A function which is called when this subscription is destroyed.
     */
    constructor(from: SubscribableSet<I>, to: MutableSubscribableSet<I>, onDestroy: (sub: SubscribableSetPipe<I, O, HandlerType>) => void);
    /**
     * Constructor.
     * @param from The input subscribable set.
     * @param to The output mutable subscribable set.
     * @param map A function which transforms this pipe's input keys.
     * @param onDestroy A function which is called when this subscription is destroyed.
     */
    constructor(from: SubscribableSet<I>, to: MutableSubscribableSet<O>, map: (from: I) => O, onDestroy: (sub: SubscribableSetPipe<I, O, HandlerType>) => void);
}
//# sourceMappingURL=SubscribableSetPipe.d.ts.map