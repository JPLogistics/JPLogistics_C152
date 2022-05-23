import { MappedSubscribable, MutableSubscribable, Subscribable } from './Subscribable';
import { Subscription } from './Subscription';
/**
 * A type which contains the `length` property of a tuple.
 */
declare type TupleLength<T extends [...any[]]> = {
    length: T['length'];
};
/**
 * A type which maps a tuple of input types to a tuple of subscribables that provide the input types.
 */
export declare type MappedSubscribableInputs<Types extends [...any[]]> = {
    [Index in keyof Types]: Subscribable<Types[Index]>;
} & TupleLength<Types>;
/**
 * A subscribable subject that is a mapped stream from one or more input subscribables.
 */
export declare class MappedSubject<I extends [...any[]], T> implements MappedSubscribable<T> {
    private readonly mapFunc;
    private readonly equalityFunc;
    /**
     * Checks if two values are equal using the strict equality operator.
     * @param a The first value.
     * @param b The second value.
     * @returns whether a and b are equal.
     */
    static readonly DEFAULT_EQUALITY_FUNC: (a: any, b: any) => boolean;
    readonly isSubscribable = true;
    private readonly inputs;
    private readonly inputValues;
    private readonly inputSubs;
    private value;
    private readonly mutateFunc;
    private subs;
    private notifyDepth;
    private readonly initialNotifyFunc;
    private readonly onSubDestroyedFunc;
    /**
     * Creates a new MappedSubject.
     * @param mapFunc The function which maps this subject's inputs to a value.
     * @param equalityFunc The function which this subject uses to check for equality between values.
     * @param mutateFunc The function which this subject uses to change its value.
     * @param initialVal The initial value of this subject.
     * @param inputs The subscribables which provide the inputs to this subject.
     */
    private constructor();
    /**
     * Creates a new mapped subject. Values are compared for equality using the strict equality comparison (`===`).
     * @param mapFunc The function to use to map inputs to the new subject value.
     * @param inputs The subscribables which provide the inputs to the new subject.
     */
    static create<I extends [...any[]], T>(mapFunc: (inputs: Readonly<I>, previousVal?: T) => T, ...inputs: MappedSubscribableInputs<I>): MappedSubject<I, T>;
    /**
     * Creates a new mapped subject. Values are compared for equality using a custom function.
     * @param mapFunc The function to use to map inputs to the new subject value.
     * @param equalityFunc The function which the new subject uses to check for equality between values.
     * @param inputs The subscribables which provide the inputs to the new subject.
     */
    static create<I extends [...any[]], T>(mapFunc: (inputs: Readonly<I>, previousVal?: T) => T, equalityFunc: (a: T, b: T) => boolean, ...inputs: MappedSubscribableInputs<I>): MappedSubject<I, T>;
    /**
     * Creates a new mapped subject with a persistent, cached value which is mutated when it changes. Values are
     * compared for equality using a custom function.
     * @param mapFunc The function to use to map inputs to the new subject value.
     * @param equalityFunc The function which the new subject uses to check for equality between values.
     * @param mutateFunc The function to use to change the value of the new subject.
     * @param initialVal The initial value of the new subject.
     * @param inputs The subscribables which provide the inputs to the new subject.
     */
    static create<I extends [...any[]], T>(mapFunc: (inputs: Readonly<I>, previousVal?: T) => T, equalityFunc: (a: T, b: T) => boolean, mutateFunc: (oldVal: T, newVal: T) => void, initialVal: T, ...inputs: MappedSubscribableInputs<I>): MappedSubject<I, T>;
    /**
     * Updates an input value, then re-maps this subject's value, and notifies subscribers if this results in a change to
     * the mapped value according to this subject's equality function.
     * @param index The index of the input value to update.
     */
    private updateValue;
    /** @inheritdoc */
    get(): T;
    /** @inheritdoc */
    sub(handler: (v: T) => void, initialNotify?: boolean, paused?: boolean): Subscription;
    /** @inheritdoc */
    unsub(handler: (v: T) => void): void;
    /**
     * Notifies subscribers that this subscribable's value has changed.
     */
    private notify;
    /**
     * Notifies a subscription of this subscribable's current state.
     * @param sub The subscription to notify.
     */
    private notifySubscription;
    /**
     * Responds to when a subscription to this subscribable is destroyed.
     * @param sub The destroyed subscription.
     */
    private onSubDestroyed;
    /**
     * Destroys the subscription to the parent subscribable.
     */
    destroy(): void;
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
export {};
//# sourceMappingURL=MappedSubject.d.ts.map