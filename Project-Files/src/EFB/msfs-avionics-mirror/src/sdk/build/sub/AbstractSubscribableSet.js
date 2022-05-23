import { AbstractSubscribable } from './AbstractSubscribable';
import { HandlerSubscription } from './HandlerSubscription';
import { MappedSubject } from './MappedSubject';
import { SubscribablePipe } from './SubscribablePipe';
import { SubscribableSetEventType } from './SubscribableSet';
import { SubscribableSetPipe } from './SubscribableSetPipe';
/**
 * An abstract implementation of a subscribable set which allows adding, removing, and notifying subscribers.
 */
export class AbstractSubscribableSet {
    constructor() {
        this.isSubscribable = true;
        this.isSubscribableSet = true;
        this.subs = [];
        this.notifyDepth = 0;
        /** A function which sends initial notifications to subscriptions. */
        this.initialNotifyFunc = this.initialNotify.bind(this);
        /** A function which responds to when a subscription to this subscribable is destroyed. */
        this.onSubDestroyedFunc = this.onSubDestroyed.bind(this);
    }
    /** @inheritdoc */
    get size() {
        return this.get().size;
    }
    /** @inheritdoc */
    has(key) {
        return this.get().has(key);
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
     * Notifies subscriptions of a change in this set.
     * @param type The type of change.
     * @param key The key related to the change.
     */
    notify(type, key) {
        const set = this.get();
        let needCleanUpSubs = false;
        this.notifyDepth++;
        const subLen = this.subs.length;
        for (let i = 0; i < subLen; i++) {
            try {
                const sub = this.subs[i];
                if (sub.isAlive && !sub.isPaused) {
                    sub.handler(set, type, key);
                }
                needCleanUpSubs || (needCleanUpSubs = !sub.isAlive);
            }
            catch (error) {
                console.error(`AbstractSubscribableSet: error in handler: ${error}`);
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
     * Notifies a subscription of this set's current state.
     * @param sub The subscription to notify.
     */
    initialNotify(sub) {
        const set = this.get();
        for (const key of set) {
            sub.handler(set, SubscribableSetEventType.Added, key);
        }
    }
    /**
     * Responds to when a subscription to this set is destroyed.
     * @param sub The destroyed subscription.
     */
    onSubDestroyed(sub) {
        // If we are not in the middle of a notify operation, remove the subscription.
        // Otherwise, do nothing and let the post-notify clean-up code handle it.
        if (this.notifyDepth === 0) {
            this.subs.splice(this.subs.indexOf(sub), 1);
        }
    }
    // eslint-disable-next-line jsdoc/require-jsdoc
    map(fn, equalityFunc, mutateFunc, initialVal) {
        const mapFunc = (inputs, previousVal) => fn(inputs[0], previousVal);
        return mutateFunc
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            ? MappedSubject.create(mapFunc, equalityFunc, mutateFunc, initialVal, this)
            : MappedSubject.create(mapFunc, equalityFunc !== null && equalityFunc !== void 0 ? equalityFunc : AbstractSubscribable.DEFAULT_EQUALITY_FUNC, this);
    }
    // eslint-disable-next-line jsdoc/require-jsdoc
    pipe(to, arg2, arg3) {
        let sub;
        let paused;
        if (typeof arg2 === 'function') {
            if ('isSubscribableSet' in to) {
                sub = new SubscribableSetPipe(this, to, arg2, this.onSubDestroyedFunc);
            }
            else {
                sub = new SubscribablePipe(this, to, arg2, this.onSubDestroyedFunc);
            }
            paused = arg3 !== null && arg3 !== void 0 ? arg3 : false;
        }
        else {
            if ('isSubscribableSet' in to) {
                sub = new SubscribableSetPipe(this, to, this.onSubDestroyedFunc);
            }
            else {
                sub = new SubscribablePipe(this, to, this.onSubDestroyedFunc);
            }
            paused = arg2 !== null && arg2 !== void 0 ? arg2 : false;
        }
        this.subs.push(sub);
        if (paused) {
            sub.pause();
        }
        else {
            sub.initialNotify();
        }
        return sub;
    }
}
