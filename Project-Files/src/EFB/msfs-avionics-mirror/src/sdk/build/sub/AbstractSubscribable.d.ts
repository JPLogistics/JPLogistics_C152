import { MappedSubject } from './MappedSubject';
import { MutableSubscribable, Subscribable } from './Subscribable';
import { HandlerSubscription } from './HandlerSubscription';
import { Subscription } from './Subscription';
/**
 * An abstract implementation of a subscribable which allows adding, removing, and notifying subscribers.
 */
export declare abstract class AbstractSubscribable<T> implements Subscribable<T> {
    readonly isSubscribable = true;
    /**
     * Checks if two values are equal using the strict equality operator.
     * @param a The first value.
     * @param b The second value.
     * @returns whether a and b are equal.
     */
    static readonly DEFAULT_EQUALITY_FUNC: (a: any, b: any) => boolean;
    protected subs: HandlerSubscription<(v: T) => void>[];
    protected notifyDepth: number;
    /** A function which sends initial notifications to subscriptions. */
    protected readonly initialNotifyFunc: (sub: HandlerSubscription<(v: T) => void>) => void;
    /** A function which responds to when a subscription to this subscribable is destroyed. */
    protected readonly onSubDestroyedFunc: (sub: HandlerSubscription<(v: T) => void>) => void;
    /** @inheritdoc */
    abstract get(): T;
    /** @inheritdoc */
    sub(handler: (v: T) => void, initialNotify?: boolean, paused?: boolean): Subscription;
    /** @inheritdoc */
    unsub(handler: (v: T) => void): void;
    /**
     * Notifies subscriptions that this subscribable's value has changed.
     */
    protected notify(): void;
    /**
     * Notifies a subscription of this subscribable's current state.
     * @param sub The subscription to notify.
     */
    protected notifySubscription(sub: HandlerSubscription<(v: T) => void>): void;
    /**
     * Responds to when a subscription to this subscribable is destroyed.
     * @param sub The destroyed subscription.
     */
    protected onSubDestroyed(sub: HandlerSubscription<(v: T) => void>): void;
    /**
     * Maps this subscribable to a new subscribable.
     * @param fn The function to use to map to the new subscribable.
     * @param equalityFunc The function to use to check for equality between mapped values. Defaults to the strict
     * equality comparison (`===`).
     * @returns The mapped subscribable.
     */
    map<M>(fn: (input: T, previousVal?: M) => M, equalityFunc?: ((a: M, b: M) => boolean)): MappedSubject<[T], M>;
    /**
     * Maps this subscribable to a new subscribable with a persistent, cached value which is mutated when it changes.
     * @param fn The function to use to map to the new subscribable.
     * @param equalityFunc The function to use to check for equality between mapped values.
     * @param mutateFunc The function to use to change the value of the mapped subscribable.
     * @param initialVal The initial value of the mapped subscribable.
     * @returns The mapped subscribable.
     */
    map<M>(fn: (input: T, previousVal?: M) => M, equalityFunc: ((a: M, b: M) => boolean), mutateFunc: ((oldVal: M, newVal: M) => void), initialVal: M): MappedSubject<[T], M>;
    /**
     * Subscribes to and pipes this subscribable's state to a mutable subscribable. Whenever an update of this
     * subscribable's state is received through the subscription, it will be used as an input to change the other
     * subscribable's state.
     * @param to The mutable subscribable to which to pipe this subscribable's state.
     * @param paused Whether the new subscription should be initialized as paused. Defaults to `false`.
     * @returns The new subscription.
     */
    pipe(to: MutableSubscribable<any, T>, paused?: boolean): Subscription;
    /**
     * Subscribes to this subscribable's state and pipes a mapped version to a mutable subscribable. Whenever an update
     * of this subscribable's state is received through the subscription, it will be transformed by the specified mapping
     * function, and the transformed state will be used as an input to change the other subscribable's state.
     * @param to The mutable subscribable to which to pipe this subscribable's mapped state.
     * @param map The function to use to transform inputs.
     * @param paused Whether the new subscription should be initialized as paused. Defaults to `false`.
     * @returns The new subscription.
     */
    pipe<M>(to: MutableSubscribable<any, M>, map: (input: T) => M, paused?: boolean): Subscription;
}
//# sourceMappingURL=AbstractSubscribable.d.ts.map