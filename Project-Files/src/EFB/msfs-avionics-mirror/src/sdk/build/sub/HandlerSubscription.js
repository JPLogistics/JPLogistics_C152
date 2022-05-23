/**
 * A {@link Subscription} which executes a handler function every time it receives a notification.
 */
export class HandlerSubscription {
    /**
     * Constructor.
     * @param handler This subscription's handler. The handler will be called each time this subscription receives a
     * notification from its source.
     * @param initialNotifyFunc A function which sends initial notifications to this subscription. If not defined, this
     * subscription will not support initial notifications.
     * @param onDestroy A function which is called when this subscription is destroyed.
     */
    constructor(handler, initialNotifyFunc, onDestroy) {
        this.handler = handler;
        this.initialNotifyFunc = initialNotifyFunc;
        this.onDestroy = onDestroy;
        this._isAlive = true;
        this._isPaused = false;
        this.canInitialNotify = initialNotifyFunc !== undefined;
    }
    /** @inheritdoc */
    get isAlive() {
        return this._isAlive;
    }
    /** @inheritdoc */
    get isPaused() {
        return this._isPaused;
    }
    /**
     * Sends an initial notification to this subscription.
     * @throws Error if this subscription is not alive.
     */
    initialNotify() {
        if (!this._isAlive) {
            throw new Error('HandlerSubscription: cannot notify a dead Subscription.');
        }
        this.initialNotifyFunc && this.initialNotifyFunc(this);
    }
    /** @inheritdoc */
    pause() {
        if (!this._isAlive) {
            throw new Error('Subscription: cannot pause a dead Subscription.');
        }
        this._isPaused = true;
    }
    /** @inheritdoc */
    resume(initialNotify = false) {
        if (!this._isAlive) {
            throw new Error('Subscription: cannot resume a dead Subscription.');
        }
        if (!this._isPaused) {
            return;
        }
        this._isPaused = false;
        if (initialNotify) {
            this.initialNotify();
        }
    }
    /** @inheritdoc */
    destroy() {
        if (!this._isAlive) {
            return;
        }
        this._isAlive = false;
        this.onDestroy && this.onDestroy(this);
    }
}
