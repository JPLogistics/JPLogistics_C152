import { HandlerSubscription } from './HandlerSubscription';
import { SubscribableArray, SubscribableArrayEventType, SubscribableArrayHandler } from './SubscribableArray';
import { Subscription } from './Subscription';
/**
 * An array-like class to observe changes in a list of objects.
 * @class ArraySubject
 * @template T
 */
export declare abstract class AbstractSubscribableArray<T> implements SubscribableArray<T> {
    /** @inheritdoc */
    abstract readonly length: number;
    protected subs: HandlerSubscription<SubscribableArrayHandler<T>>[];
    protected notifyDepth: number;
    /** A function which sends initial notifications to subscriptions. */
    protected readonly initialNotifyFunc: (sub: HandlerSubscription<SubscribableArrayHandler<T>>) => void;
    /** A function which responds to when a subscription to this subscribable is destroyed. */
    protected readonly onSubDestroyedFunc: (sub: HandlerSubscription<SubscribableArrayHandler<T>>) => void;
    /** @inheritdoc */
    sub(handler: SubscribableArrayHandler<T>, initialNotify?: boolean, paused?: boolean): Subscription;
    /** @inheritdoc */
    unsub(handler: SubscribableArrayHandler<T>): void;
    /** @inheritdoc */
    abstract getArray(): readonly T[];
    /**
     * Gets an item from the array.
     * @param index Thex index of the item to get.
     * @returns An item.
     * @throws
     */
    get(index: number): T;
    /**
     * Tries to get the value from the array.
     * @param index The index of the item to get.
     * @returns The value or undefined if not found.
     */
    tryGet(index: number): T | undefined;
    /**
     * Notifies subscriptions of a change in the array.
     * @param index The index that was changed.
     * @param type The type of subject event.
     * @param modifiedItem The item modified by the operation.
     */
    protected notify(index: number, type: SubscribableArrayEventType, modifiedItem?: T | readonly T[]): void;
    /**
     * Notifies a subscription of this array's current state.
     * @param sub The subscription to notify.
     */
    protected initialNotify(sub: HandlerSubscription<SubscribableArrayHandler<T>>): void;
    /**
     * Responds to when a subscription to this array is destroyed.
     * @param sub The destroyed subscription.
     */
    protected onSubDestroyed(sub: HandlerSubscription<SubscribableArrayHandler<T>>): void;
}
//# sourceMappingURL=AbstractSubscribableArray.d.ts.map