import { HandlerSubscription } from './HandlerSubscription';
import { SubscribableArrayEventType } from './SubscribableArray';
/**
 * An array-like class to observe changes in a list of objects.
 * @class ArraySubject
 * @template T
 */
export class AbstractSubscribableArray {
    constructor() {
        this.subs = [];
        this.notifyDepth = 0;
        /** A function which sends initial notifications to subscriptions. */
        this.initialNotifyFunc = this.initialNotify.bind(this);
        /** A function which responds to when a subscription to this subscribable is destroyed. */
        this.onSubDestroyedFunc = this.onSubDestroyed.bind(this);
    }
    /** @inheritdoc */
    sub(handler, initialNotify = false, paused = false) {
        const sub = new HandlerSubscription(handler, this.initialNotifyFunc, this.onSubDestroyedFunc);
        this.subs.push(sub);
        if (paused) {
            sub.pause();
        }
        else if (initialNotify) {
            sub.initialNotify();
        }
        return sub;
    }
    /** @inheritdoc */
    unsub(handler) {
        const toDestroy = this.subs.find(sub => sub.handler === handler);
        toDestroy === null || toDestroy === void 0 ? void 0 : toDestroy.destroy();
    }
    /**
     * Gets an item from the array.
     * @param index Thex index of the item to get.
     * @returns An item.
     * @throws
     */
    get(index) {
        const array = this.getArray();
        if (index > array.length - 1) {
            throw new Error('Index out of range');
        }
        return array[index];
    }
    /**
     * Tries to get the value from the array.
     * @param index The index of the item to get.
     * @returns The value or undefined if not found.
     */
    tryGet(index) {
        return this.getArray()[index];
    }
    /**
     * Notifies subscriptions of a change in the array.
     * @param index The index that was changed.
     * @param type The type of subject event.
     * @param modifiedItem The item modified by the operation.
     */
    notify(index, type, modifiedItem) {
        let needCleanUpSubs = false;
        this.notifyDepth++;
        const subLen = this.subs.length;
        for (let i = 0; i < subLen; i++) {
            try {
                const sub = this.subs[i];
                if (sub.isAlive && !sub.isPaused) {
                    sub.handler(index, type, modifiedItem, this.getArray());
                }
                needCleanUpSubs || (needCleanUpSubs = !sub.isAlive);
            }
            catch (error) {
                console.error(`ArraySubject: error in handler: ${error}`);
                if (error instanceof Error) {
                    console.error(error.stack);
                }
            }
        }
        this.notifyDepth--;
        if (needCleanUpSubs && this.notifyDepth === 0) {
            this.subs = this.subs.filter(sub => sub.isAlive);
        }
    }
    /**
     * Notifies a subscription of this array's current state.
     * @param sub The subscription to notify.
     */
    initialNotify(sub) {
        const array = this.getArray();
        sub.handler(0, SubscribableArrayEventType.Added, array, array);
    }
    /**
     * Responds to when a subscription to this array is destroyed.
     * @param sub The destroyed subscription.
     */
    onSubDestroyed(sub) {
        // If we are not in the middle of a notify operation, remove the subscription.
        // Otherwise, do nothing and let the post-notify clean-up code handle it.
        if (this.notifyDepth === 0) {
            this.subs.splice(this.subs.indexOf(sub), 1);
        }
    }
}
