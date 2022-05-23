import { HandlerSubscription } from './HandlerSubscription';
import { SubscribablePipe } from './SubscribablePipe';
/**
 * A subscribable subject that is a mapped stream from one or more input subscribables.
 */
export class MappedSubject {
    /**
     * Creates a new MappedSubject.
     * @param mapFunc The function which maps this subject's inputs to a value.
     * @param equalityFunc The function which this subject uses to check for equality between values.
     * @param mutateFunc The function which this subject uses to change its value.
     * @param initialVal The initial value of this subject.
     * @param inputs The subscribables which provide the inputs to this subject.
     */
    constructor(mapFunc, equalityFunc, mutateFunc, initialVal, ...inputs) {
        this.mapFunc = mapFunc;
        this.equalityFunc = equalityFunc;
        this.isSubscribable = true;
        this.subs = [];
        this.notifyDepth = 0;
        this.initialNotifyFunc = this.notifySubscription.bind(this);
        this.onSubDestroyedFunc = this.onSubDestroyed.bind(this);
        this.inputs = inputs;
        this.inputValues = inputs.map(input => input.get());
        if (initialVal && mutateFunc) {
            this.value = initialVal;
            mutateFunc(this.value, this.mapFunc(this.inputValues));
            this.mutateFunc = (newVal) => { mutateFunc(this.value, newVal); };
        }
        else {
            this.value = this.mapFunc(this.inputValues);
            this.mutateFunc = (newVal) => { this.value = newVal; };
        }
        this.inputSubs = this.inputs.map((input, index) => input.sub(this.updateValue.bind(this, index)));
    }
    // eslint-disable-next-line jsdoc/require-jsdoc
    static create(mapFunc, ...args) {
        let equalityFunc, mutateFunc, initialVal;
        if (typeof args[0] === 'function') {
            equalityFunc = args.shift();
        }
        else {
            equalityFunc = MappedSubject.DEFAULT_EQUALITY_FUNC;
        }
        if (typeof args[0] === 'function') {
            mutateFunc = args.shift();
            initialVal = args.shift();
        }
        return new MappedSubject(mapFunc, equalityFunc, mutateFunc, initialVal, ...args);
    }
    /**
     * Updates an input value, then re-maps this subject's value, and notifies subscribers if this results in a change to
     * the mapped value according to this subject's equality function.
     * @param index The index of the input value to update.
     */
    updateValue(index) {
        this.inputValues[index] = this.inputs[index].get();
        const value = this.mapFunc(this.inputValues, this.value);
        if (!this.equalityFunc(this.value, value)) {
            this.mutateFunc(value);
            this.notify();
        }
    }
    /** @inheritdoc */
    get() {
        return this.value;
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
     * Notifies subscribers that this subscribable's value has changed.
     */
    notify() {
        let needCleanUpSubs = false;
        this.notifyDepth++;
        const subLen = this.subs.length;
        for (let i = 0; i < subLen; i++) {
            try {
                const sub = this.subs[i];
                if (sub.isAlive && !sub.isPaused) {
                    this.notifySubscription(sub);
                }
                needCleanUpSubs || (needCleanUpSubs = !sub.isAlive);
            }
            catch (error) {
                console.error(`MappedSubject: error in handler: ${error}`);
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
     * Notifies a subscription of this subscribable's current state.
     * @param sub The subscription to notify.
     */
    notifySubscription(sub) {
        sub.handler(this.get());
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
    /**
     * Destroys the subscription to the parent subscribable.
     */
    destroy() {
        for (let i = 0; i < this.inputSubs.length; i++) {
            this.inputSubs[i].destroy();
        }
    }
    // eslint-disable-next-line jsdoc/require-jsdoc
    map(fn, equalityFunc, mutateFunc, initialVal) {
        const mapFunc = (inputs, previousVal) => fn(inputs[0], previousVal);
        return new MappedSubject(mapFunc, equalityFunc !== null && equalityFunc !== void 0 ? equalityFunc : MappedSubject.DEFAULT_EQUALITY_FUNC, mutateFunc, initialVal, this);
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
/**
 * Checks if two values are equal using the strict equality operator.
 * @param a The first value.
 * @param b The second value.
 * @returns whether a and b are equal.
 */
MappedSubject.DEFAULT_EQUALITY_FUNC = (a, b) => a === b;
