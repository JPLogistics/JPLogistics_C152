import { AbstractSubscribable } from '../sub/AbstractSubscribable';
/**
 * A subscribable subject which derives its value from an event consumer.
 */
export class ConsumerSubject extends AbstractSubscribable {
    /**
     * Constructor.
     * @param consumer The event consumer from which this subject obtains its value. If null, this subject's value will
     * not be updated until its consumer is set to a non-null value.
     * @param initialVal This subject's initial value.
     * @param equalityFunc The function this subject uses check for equality between values.
     * @param mutateFunc The function this subject uses to change its value. If not defined, variable assignment is used
     * instead.
     */
    constructor(consumer, initialVal, equalityFunc, mutateFunc) {
        super();
        this.equalityFunc = equalityFunc;
        this.mutateFunc = mutateFunc;
        this.consumerHandler = this.onEventConsumed.bind(this);
        this._isPaused = false;
        this.isDestroyed = false;
        this.value = initialVal;
        this.consumerSub = consumer === null || consumer === void 0 ? void 0 : consumer.handle(this.consumerHandler);
    }
    // eslint-disable-next-line jsdoc/require-returns
    /**
     * Whether event consumption is currently paused for this subject. While paused, this subject's value will not
     * update.
     */
    get isPaused() {
        return this._isPaused;
    }
    // eslint-disable-next-line jsdoc/require-jsdoc
    static create(consumer, initialVal, equalityFunc, mutateFunc) {
        return new ConsumerSubject(consumer, initialVal, equalityFunc !== null && equalityFunc !== void 0 ? equalityFunc : AbstractSubscribable.DEFAULT_EQUALITY_FUNC, mutateFunc);
    }
    /**
     * Consumes an event.
     * @param value The value of the event.
     */
    onEventConsumed(value) {
        if (!this.equalityFunc(this.value, value)) {
            if (this.mutateFunc) {
                this.mutateFunc(this.value, value);
            }
            else {
                this.value = value;
            }
            this.notify();
        }
    }
    /**
     * Sets the consumer from which this subject derives its value. If the consumer is null, this subject's value will
     * not be updated until a non-null consumer is set.
     * @param consumer An event consumer.
     * @returns This subject, after its consumer has been set.
     */
    setConsumer(consumer) {
        var _a;
        if (this.isDestroyed) {
            return this;
        }
        (_a = this.consumerSub) === null || _a === void 0 ? void 0 : _a.destroy();
        this.consumerSub = consumer === null || consumer === void 0 ? void 0 : consumer.handle(this.consumerHandler, this._isPaused);
        return this;
    }
    /**
     * Pauses consuming events for this subject. Once paused, this subject's value will not be updated.
     * @returns This subject, after it has been paused.
     */
    pause() {
        var _a;
        if (this._isPaused) {
            return this;
        }
        (_a = this.consumerSub) === null || _a === void 0 ? void 0 : _a.pause();
        this._isPaused = true;
        return this;
    }
    /**
     * Resumes consuming events for this subject. Once resumed, this subject's value will be updated from consumed
     * events.
     * @returns This subject, after it has been resumed.
     */
    resume() {
        var _a;
        if (!this._isPaused) {
            return this;
        }
        this._isPaused = false;
        (_a = this.consumerSub) === null || _a === void 0 ? void 0 : _a.resume(true);
        return this;
    }
    /** @inheritdoc */
    get() {
        return this.value;
    }
    /**
     * Destroys this subject. Once destroyed, it will no longer consume events to update its value.
     */
    destroy() {
        var _a;
        (_a = this.consumerSub) === null || _a === void 0 ? void 0 : _a.destroy();
        this.isDestroyed = true;
    }
}
