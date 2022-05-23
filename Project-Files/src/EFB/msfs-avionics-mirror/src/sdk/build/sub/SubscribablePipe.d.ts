import { HandlerSubscription } from './HandlerSubscription';
import { MutableSubscribable, Subscribable } from './Subscribable';
/**
 * A pipe from an input subscribable to an output mutable subscribable. Each notification received by the pipe is used
 * to change the state of the output subscribable.
 */
export declare class SubscribablePipe<I, O, HandlerType extends (...args: any[]) => void> extends HandlerSubscription<HandlerType> {
    /**
     * Constructor.
     * @param from The input subscribable.
     * @param to The output mutable subscribable.
     * @param onDestroy A function which is called when this subscription is destroyed.
     */
    constructor(from: Subscribable<I>, to: MutableSubscribable<any, I>, onDestroy: (sub: SubscribablePipe<I, O, HandlerType>) => void);
    /**
     * Constructor.
     * @param from The input subscribable.
     * @param to The output mutable subscribable.
     * @param map A function which transforms this pipe's inputs.
     * @param onDestroy A function which is called when this subscription is destroyed.
     */
    constructor(from: Subscribable<I>, to: MutableSubscribable<any, O>, map: (from: I) => O, onDestroy: (sub: SubscribablePipe<I, O, HandlerType>) => void);
}
//# sourceMappingURL=SubscribablePipe.d.ts.map