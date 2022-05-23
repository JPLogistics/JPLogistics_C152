import { HandlerSubscription } from './HandlerSubscription';
import { MappedSubject } from './MappedSubject';
import { MutableSubscribable, Subscribable } from './Subscribable';
import { MutableSubscribableSet, SubscribableSet, SubscribableSetEventType, SubscribableSetHandler } from './SubscribableSet';
import { Subscription } from './Subscription';
/**
 * An abstract implementation of a subscribable set which allows adding, removing, and notifying subscribers.
 */
export declare abstract class AbstractSubscribableSet<T> implements SubscribableSet<T>, Subscribable<ReadonlySet<T>> {
    readonly isSubscribable = true;
    readonly isSubscribableSet = true;
    /** @inheritdoc */
    get size(): number;
    protected subs: HandlerSubscription<SubscribableSetHandler<T>>[];
    protected notifyDepth: number;
    /** A function which sends initial notifications to subscriptions. */
    protected readonly initialNotifyFunc: (sub: HandlerSubscription<SubscribableSetHandler<T>>) => void;
    /** A function which responds to when a subscription to this subscribable is destroyed. */
    protected readonly onSubDestroyedFunc: (sub: HandlerSubscription<SubscribableSetHandler<T>>) => void;
    /** @inheritdoc */
    abstract get(): ReadonlySet<T>;
    /** @inheritdoc */
    has(key: T): boolean;
    /** @inheritdoc */
    sub(handler: SubscribableSetHandler<T>, initialNotify?: boolean, paused?: boolean): Subscription;
    /** @inheritdoc */
    unsub(handler: SubscribableSetHandler<T>): void;
    /**
     * Notifies subscriptions of a change in this set.
     * @param type The type of change.
     * @param key The key related to the change.
     */
    protected notify(type: SubscribableSetEventType, key: T): void;
    /**
     * Notifies a subscription of this set's current state.
     * @param sub The subscription to notify.
     */
    protected initialNotify(sub: HandlerSubscription<SubscribableSetHandler<T>>): void;
    /**
     * Responds to when a subscription to this set is destroyed.
     * @param sub The destroyed subscription.
     */
    protected onSubDestroyed(sub: HandlerSubscription<SubscribableSetHandler<T>>): void;
    /**
     * Maps this subscribable to a new subscribable.
     * @param fn The function to use to map to the new subscribable.
     * @param equalityFunc The function to use to check for equality between mapped values. Defaults to the strict
     * equality comparison (`===`).
     * @returns The mapped subscribable.
     */
    map<M>(fn: (input: ReadonlySet<T>, previousVal?: M) => M, equalityFunc?: ((a: M, b: M) => boolean)): MappedSubject<[ReadonlySet<T>], M>;
    /**
     * Maps this subscribable to a new subscribable with a persistent, cached value which is mutated when it changes.
     * @param fn The function to use to map to the new subscribable.
     * @param equalityFunc The function to use to check for equality between mapped values.
     * @param mutateFunc The function to use to change the value of the mapped subscribable.
     * @param initialVal The initial value of the mapped subscribable.
     * @returns The mapped subscribable.
     */
    map<M>(fn: (input: ReadonlySet<T>, previousVal?: M) => M, equalityFunc: ((a: M, b: M) => boolean), mutateFunc: ((oldVal: M, newVal: M) => void), initialVal: M): MappedSubject<[ReadonlySet<T>], M>;
    /**
     * Subscribes to and pipes this subscribable's state to a mutable subscribable. Whenever an update of this
     * subscribable's state is received through the subscription, it will be used as an input to change the other
     * subscribable's state.
     * @param to The mutable subscribable to which to pipe this subscribable's state.
     * @param paused Whether the new subscription should be initialized as paused. Defaults to `false`.
     * @returns The new subscription.
     */
    pipe(to: MutableSubscribable<any, ReadonlySet<T>>, paused?: boolean): Subscription;
    /**
     * Subscribes to and pipes mapped inputs from another subscribable. Whenever an update of the other subscribable's
     * state is received through the subscription, it will be transformed by the specified mapping function, and the
     * transformed state will be used as an input to change this subscribable's state.
     * @param to The mutable subscribable to which to pipe this subscribable's mapped state.
     * @param map The function to use to transform inputs.
     * @param paused Whether the new subscription should be initialized as paused. Defaults to `false`.
     * @returns The new subscription.
     */
    pipe<M>(to: MutableSubscribable<any, M>, map: (input: ReadonlySet<T>) => M, paused?: boolean): Subscription;
    /**
     * Subscribes to and pipes this set's state to a mutable subscribable set. Whenever a key added or removed event is
     * received through the subscription, the same key will be added to or removed from the other set.
     * @param to The mutable subscribable set to which to pipe this set's state.
     * @param paused Whether the new subscription should be initialized as paused. Defaults to `false`.
     * @returns The new subscription.
     */
    pipe(to: MutableSubscribableSet<T>, paused?: boolean): Subscription;
    /**
     * Subscribes to this set's state and pipes a mapped version to a mutable subscribable set. Whenever a key added
     * event is received through the subscription, the key will be transformed by the specified mapping
     * function, and the transformed key will be added to the other set. Whenever a key removed event is received, the
     * transformed key is removed from the other set if and only if no remaining key in this set maps to the same
     * transformed key.
     * @param to The mutable subscribable to which to pipe this set's mapped state.
     * @param map The function to use to transform keys.
     * @param paused Whether the new subscription should be initialized as paused. Defaults to `false`.
     * @returns The new subscription.
     */
    pipe<M>(to: MutableSubscribableSet<M>, map: (input: T) => M, paused?: boolean): Subscription;
}
//# sourceMappingURL=AbstractSubscribableSet.d.ts.map