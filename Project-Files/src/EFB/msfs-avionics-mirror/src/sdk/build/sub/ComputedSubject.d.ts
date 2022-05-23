import { MappedSubject } from './MappedSubject';
import { MutableSubscribable } from './Subscribable';
import { Subscription } from './Subscription';
/**
 * A class for subjects that return a computed value.
 * @class ComputedSubject
 * @template I The type of the input value.
 * @template T The type of the computed output value.
 */
export declare class ComputedSubject<I, T> implements MutableSubscribable<T, I> {
    private readonly computeFn;
    readonly isSubscribable = true;
    readonly isMutableSubscribable = true;
    private value;
    private rawValue;
    private subs;
    private notifyDepth;
    private readonly initialNotifyFunc;
    private readonly onSubDestroyedFunc;
    /**
     * Creates an instance of ComputedSubject.
     * @param value The initial value.
     * @param computeFn The computation function.
     */
    private constructor();
    /**
     * Creates and returns a new ComputedSubject.
     * @param v The initial value of the Subject.
     * @param fn A function which transforms raw values to computed values.
     * @returns A ComputedSubject instance.
     */
    static create<IT, CT>(v: IT, fn: (v: IT) => CT): ComputedSubject<IT, CT>;
    /**
     * Sets the new value and notifies the subscribers when value changed.
     * @param value The new value.
     */
    set(value: I): void;
    /**
     * Gets the computed value of the Subject.
     * @returns The computed value.
     */
    get(): T;
    /**
     * Gets the raw value of the Subject.
     * @returns The raw value.
     */
    getRaw(): I;
    /** @inheritdoc */
    sub(handler: (v: T, rv: I) => void, initialNotify?: boolean, paused?: boolean): Subscription;
    /** @inheritdoc */
    unsub(handler: (v: T, rv: I) => void): void;
    /**
     * Notifies subscriptions that this subject's value has changed.
     */
    private notify;
    /**
     * Notifies a subscription of this subject's current state.
     * @param sub The subscription to notify.
     */
    private notifySubscription;
    /**
     * Responds to when a subscription to this subject is destroyed.
     * @param sub The destroyed subscription.
     */
    private onSubDestroyed;
    /**
     * Maps this subject to a new subscribable.
     * @param fn The function to use to map to the new subscribable.
     * @param equalityFunc The function to use to check for equality between mapped values. Defaults to the strict
     * equality comparison (`===`).
     * @returns The mapped subscribable.
     */
    map<M>(fn: (input: T, previousVal?: M) => M, equalityFunc?: ((a: M, b: M) => boolean)): MappedSubject<[T], M>;
    /**
     * Maps this subject to a new subscribable with a persistent, cached value which is mutated when it changes.
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
//# sourceMappingURL=ComputedSubject.d.ts.map