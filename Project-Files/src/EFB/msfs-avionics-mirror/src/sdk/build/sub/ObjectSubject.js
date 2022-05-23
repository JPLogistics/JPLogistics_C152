import { AbstractSubscribable } from './AbstractSubscribable';
import { HandlerSubscription } from './HandlerSubscription';
import { MappedSubject } from './MappedSubject';
import { SubscribablePipe } from './SubscribablePipe';
/**
 * A object-valued subscribable subject which supports setting individual properties on the object and notifying
 * subscribers of any changes to those properties.
 */
export class ObjectSubject {
    /**
     * Constructs an observable object Subject.
     * @param obj The initial object.
     */
    constructor(obj) {
        this.obj = obj;
        this.isSubscribable = true;
        this.isMutableSubscribable = true;
        this.subs = [];
        this.notifyDepth = 0;
        this.initialNotifyFunc = this.initialNotify.bind(this);
        this.onSubDestroyedFunc = this.onSubDestroyed.bind(this);
    }
    /**
     * Creates and returns a new ObjectSubject.
     * @param v The initial value of the subject.
     * @returns An ObjectSubject instance.
     */
    static create(v) {
        return new ObjectSubject(v);
    }
    /**
     * Gets this subject's object.
     * @returns This subject's object.
     */
    get() {
        return this.obj;
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
    // eslint-disable-next-line jsdoc/require-jsdoc
    set(arg1, value) {
        if (typeof arg1 === 'object') {
            for (const prop in arg1) {
                if (prop in this.obj) {
                    this.set(prop, arg1[prop]);
                }
            }
        }
        else {
            const oldValue = this.obj[arg1];
            if (value !== oldValue) {
                this.obj[arg1] = value;
                this.notify(arg1, oldValue);
            }
        }
    }
    /**
     * Notifies subscriptions that one of the properties of this subject's object has changed.
     * @param key The property of the object that changed.
     * @param oldValue The old value of the property that changed.
     */
    notify(key, oldValue) {
        let needCleanUpSubs = false;
        this.notifyDepth++;
        const subLen = this.subs.length;
        for (let i = 0; i < subLen; i++) {
            try {
                const sub = this.subs[i];
                if (sub.isAlive && !sub.isPaused) {
                    sub.handler(this.obj, key, this.obj[key], oldValue);
                }
                needCleanUpSubs || (needCleanUpSubs = !sub.isAlive);
            }
            catch (error) {
                console.error(`ObjectSubject: error in handler: ${error}`);
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
     * Notifies a subscription of this subject's current state.
     * @param sub The subscription to notify.
     */
    initialNotify(sub) {
        for (const key in this.obj) {
            const v = this.obj[key];
            sub.handler(this.obj, key, v, v);
        }
    }
    /**
     * Responds to when a subscription to this subscribable is destroyed.
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
            sub = new SubscribablePipe(this, to, arg2, this.onSubDestroyedFunc);
            paused = arg3 !== null && arg3 !== void 0 ? arg3 : false;
        }
        else {
            sub = new SubscribablePipe(this, to, this.onSubDestroyedFunc);
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
