/**
 * An event bus consumer for a specific topic.
 */
export class Consumer {
    /**
     * Creates an instance of a Consumer.
     * @param bus The event bus to subscribe to.
     * @param topic The topic of the subscription.
     * @param state The state for the consumer to track.
     * @param currentHandler The current build filter handler stack, if any.
     */
    constructor(bus, topic, state = {}, currentHandler) {
        this.bus = bus;
        this.topic = topic;
        this.state = state;
        this.currentHandler = currentHandler;
        this.activeSubs = new Map();
    }
    /**
     * Handles an event using the provided event handler.
     * @param handler The event handler for the event.
     * @param paused Whether the new subscription should be initialized as paused. Defaults to `false`.
     * @returns A new subscription for the provided handler.
     */
    handle(handler, paused = false) {
        let activeHandler;
        if (this.currentHandler !== undefined) {
            /**
             * The handler reference to store.
             * @param data The input data to the handler.
             */
            activeHandler = (data) => {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                this.currentHandler(data, this.state, handler);
            };
        }
        else {
            activeHandler = handler;
        }
        let activeSubArray = this.activeSubs.get(handler);
        if (!activeSubArray) {
            activeSubArray = [];
            this.activeSubs.set(handler, activeSubArray);
        }
        const onDestroyed = (destroyed) => {
            const activeSubsArray = this.activeSubs.get(handler);
            if (activeSubsArray) {
                activeSubsArray.splice(activeSubsArray.indexOf(destroyed), 1);
                if (activeSubsArray.length === 0) {
                    this.activeSubs.delete(handler);
                }
            }
        };
        const sub = new ConsumerSubscription(this.bus.on(this.topic, activeHandler, paused), onDestroyed);
        // Need to handle the case where the subscription is destroyed immediately
        if (sub.isAlive) {
            activeSubArray.push(sub);
        }
        else if (activeSubArray.length === 0) {
            this.activeSubs.delete(handler);
        }
        return sub;
    }
    /**
     * Disables handling of the event.
     * @param handler The handler to disable.
     * @deprecated This method has been deprecated in favor of using the {@link Subscription} object returned by
     * `.handle()` to manage subscriptions.
     */
    off(handler) {
        var _a;
        const activeSubArray = this.activeSubs.get(handler);
        if (activeSubArray) {
            (_a = activeSubArray.shift()) === null || _a === void 0 ? void 0 : _a.destroy();
            if (activeSubArray.length === 0) {
                this.activeSubs.delete(handler);
            }
        }
    }
    /**
     * Caps the event subscription to a specified frequency, in Hz.
     * @param frequency The frequency, in Hz, to cap to.
     * @param immediateFirstPublish Whether to fire once immediately before throttling.
     * @returns A new consumer with the applied frequency filter.
     */
    atFrequency(frequency, immediateFirstPublish = true) {
        const initialState = {
            previousTime: Date.now(),
            firstRun: immediateFirstPublish
        };
        return new Consumer(this.bus, this.topic, initialState, this.getAtFrequencyHandler(frequency));
    }
    /**
     * Gets a handler function for a 'atFrequency' filter.
     * @param frequency The frequency, in Hz, to cap to.
     * @returns A handler function for a 'atFrequency' filter.
     */
    getAtFrequencyHandler(frequency) {
        const deltaTimeTrigger = 1000 / frequency;
        return (data, state, next) => {
            const currentTime = Date.now();
            const deltaTime = currentTime - state.previousTime;
            if (deltaTimeTrigger <= deltaTime || state.firstRun) {
                while ((state.previousTime + deltaTimeTrigger) < currentTime) {
                    state.previousTime += deltaTimeTrigger;
                }
                if (state.firstRun) {
                    state.firstRun = false;
                }
                this.with(data, next);
            }
        };
    }
    /**
     * Quantizes the numerical event data to consume only at the specified decimal precision.
     * @param precision The decimal precision to snap to.
     * @returns A new consumer with the applied precision filter.
     */
    withPrecision(precision) {
        return new Consumer(this.bus, this.topic, { lastValue: 0 }, this.getWithPrecisionHandler(precision));
    }
    /**
     * Gets a handler function for a 'withPrecision' filter.
     * @param precision The decimal precision to snap to.
     * @returns A handler function for a 'withPrecision' filter.
     */
    getWithPrecisionHandler(precision) {
        return (data, state, next) => {
            const dataValue = data;
            const multiplier = Math.pow(10, precision);
            const currentValueAtPrecision = Math.round(dataValue * multiplier) / multiplier;
            if (currentValueAtPrecision !== state.lastValue) {
                state.lastValue = currentValueAtPrecision;
                this.with(currentValueAtPrecision, next);
            }
        };
    }
    /**
     * Filter the subscription to consume only when the value has changed by a minimum amount.
     * @param amount The minimum amount threshold below which the consumer will not consume.
     * @returns A new consumer with the applied change threshold filter.
     */
    whenChangedBy(amount) {
        return new Consumer(this.bus, this.topic, { lastValue: 0 }, this.getWhenChangedByHandler(amount));
    }
    /**
     * Gets a handler function for a 'whenChangedBy' filter.
     * @param amount The minimum amount threshold below which the consumer will not consume.
     * @returns A handler function for a 'whenChangedBy' filter.
     */
    getWhenChangedByHandler(amount) {
        return (data, state, next) => {
            const dataValue = data;
            const diff = Math.abs(dataValue - state.lastValue);
            if (diff >= amount) {
                state.lastValue = dataValue;
                this.with(data, next);
            }
        };
    }
    /**
     * Filter the subscription to consume only if the value has changed. At all.  Really only
     * useful for strings or other events that don't change much.
     * @returns A new consumer with the applied change threshold filter.
     */
    whenChanged() {
        return new Consumer(this.bus, this.topic, { lastValue: '' }, this.getWhenChangedHandler());
    }
    /**
     * Gets a handler function for a 'whenChanged' filter.
     * @returns A handler function for a 'whenChanged' filter.
     */
    getWhenChangedHandler() {
        return (data, state, next) => {
            if (state.lastValue !== data) {
                state.lastValue = data;
                this.with(data, next);
            }
        };
    }
    /**
     * Filters events by time such that events will not be consumed until a minimum duration
     * has passed since the previous event.
     * @param deltaTime The minimum delta time between events.
     * @returns A new consumer with the applied change threshold filter.
     */
    onlyAfter(deltaTime) {
        return new Consumer(this.bus, this.topic, { previousTime: Date.now() }, this.getOnlyAfterHandler(deltaTime));
    }
    /**
     * Gets a handler function for an 'onlyAfter' filter.
     * @param deltaTime The minimum delta time between events.
     * @returns A handler function for an 'onlyAfter' filter.
     */
    getOnlyAfterHandler(deltaTime) {
        return (data, state, next) => {
            const currentTime = Date.now();
            const timeDiff = currentTime - state.previousTime;
            if (timeDiff > deltaTime) {
                state.previousTime += deltaTime;
                this.with(data, next);
            }
        };
    }
    /**
     * Builds a handler stack from the current handler.
     * @param data The data to send in to the handler.
     * @param handler The handler to use for processing.
     */
    with(data, handler) {
        if (this.currentHandler !== undefined) {
            this.currentHandler(data, this.state, handler);
        }
        else {
            handler(data);
        }
    }
}
/**
 * A {@link Subscription} for a {@link Consumer}.
 */
class ConsumerSubscription {
    /**
     * Constructor.
     * @param sub The event bus subscription backing this subscription.
     * @param onDestroy A function which is called when this subscription is destroyed.
     */
    constructor(sub, onDestroy) {
        this.sub = sub;
        this.onDestroy = onDestroy;
    }
    /** @inheritdoc */
    get isAlive() {
        return this.sub.isAlive;
    }
    /** @inheritdoc */
    get isPaused() {
        return this.sub.isPaused;
    }
    /** @inheritdoc */
    get canInitialNotify() {
        return this.sub.canInitialNotify;
    }
    /** @inheritdoc */
    pause() {
        this.sub.pause();
    }
    /** @inheritdoc */
    resume(initialNotify = false) {
        this.sub.resume(initialNotify);
    }
    /** @inheritdoc */
    destroy() {
        this.sub.destroy();
        this.onDestroy(this);
    }
}
