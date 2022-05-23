import { MappedSubject } from './MappedSubject';
import { MutableSubscribable } from './Subscribable';
import { Subscription } from './Subscription';
/**
 * A function which handles changes in an {@link ObjectSubject}'s state.
 */
export declare type ObjectSubjectHandler<T extends Record<string, any>> = (v: Readonly<T>, key: keyof T, newValue: T[keyof T], oldValue: T[keyof T]) => void;
/**
 * A object-valued subscribable subject which supports setting individual properties on the object and notifying
 * subscribers of any changes to those properties.
 */
export declare class ObjectSubject<T extends Record<string, any>> implements MutableSubscribable<Readonly<T>, Partial<Readonly<T>>> {
    private readonly obj;
    readonly isSubscribable = true;
    readonly isMutableSubscribable = true;
    private subs;
    private notifyDepth;
    private readonly initialNotifyFunc;
    private readonly onSubDestroyedFunc;
    /**
     * Constructs an observable object Subject.
     * @param obj The initial object.
     */
    private constructor();
    /**
     * Creates and returns a new ObjectSubject.
     * @param v The initial value of the subject.
     * @returns An ObjectSubject instance.
     */
    static create<IT>(v: IT): ObjectSubject<IT>;
    /**
     * Gets this subject's object.
     * @returns This subject's object.
     */
    get(): Readonly<T>;
    /** @inheritdoc */
    sub(handler: ObjectSubjectHandler<T>, initialNotify?: boolean, paused?: boolean): Subscription;
    /** @inheritdoc */
    unsub(handler: ObjectSubjectHandler<T>): void;
    /**
     * Sets the values of a subset of the properties of this subject's object and notifies subscribers if any of the
     * values changed.
     * @param value An object defining the values of the properties to set.
     */
    set(value: Partial<Readonly<T>>): void;
    /**
     * Sets the value of one of the properties of this subject's object and notifies subscribers if the value changed.
     * @param key The property to set.
     * @param value The new value.
     */
    set<K extends keyof T>(key: K, value: T[K]): void;
    /**
     * Notifies subscriptions that one of the properties of this subject's object has changed.
     * @param key The property of the object that changed.
     * @param oldValue The old value of the property that changed.
     */
    private notify;
    /**
     * Notifies a subscription of this subject's current state.
     * @param sub The subscription to notify.
     */
    private initialNotify;
    /**
     * Responds to when a subscription to this subscribable is destroyed.
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
    map<M>(fn: (input: Readonly<T>, previousVal?: M) => M, equalityFunc: ((a: M, b: M) => boolean), mutateFunc: ((oldVal: M, newVal: M) => void), initialVal: M): MappedSubject<[Readonly<T>], M>;
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
//# sourceMappingURL=ObjectSubject.d.ts.map