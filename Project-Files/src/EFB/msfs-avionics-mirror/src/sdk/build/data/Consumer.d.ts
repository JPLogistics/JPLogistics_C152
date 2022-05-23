import { Subscription } from '../sub/Subscription';
import { EventBus, Handler } from './EventBus';
/**
 * An event bus consumer for a specific topic.
 */
export declare class Consumer<T> {
    protected bus: EventBus;
    protected topic: string;
    private state;
    private readonly currentHandler?;
    private readonly activeSubs;
    /**
     * Creates an instance of a Consumer.
     * @param bus The event bus to subscribe to.
     * @param topic The topic of the subscription.
     * @param state The state for the consumer to track.
     * @param currentHandler The current build filter handler stack, if any.
     */
    constructor(bus: EventBus, topic: string, state?: any, currentHandler?: ((data: T, state: any, next: Handler<T>) => void) | undefined);
    /**
     * Handles an event using the provided event handler.
     * @param handler The event handler for the event.
     * @param paused Whether the new subscription should be initialized as paused. Defaults to `false`.
     * @returns A new subscription for the provided handler.
     */
    handle(handler: Handler<T>, paused?: boolean): Subscription;
    /**
     * Disables handling of the event.
     * @param handler The handler to disable.
     * @deprecated This method has been deprecated in favor of using the {@link Subscription} object returned by
     * `.handle()` to manage subscriptions.
     */
    off(handler: Handler<T>): void;
    /**
     * Caps the event subscription to a specified frequency, in Hz.
     * @param frequency The frequency, in Hz, to cap to.
     * @param immediateFirstPublish Whether to fire once immediately before throttling.
     * @returns A new consumer with the applied frequency filter.
     */
    atFrequency(frequency: number, immediateFirstPublish?: boolean): Consumer<T>;
    /**
     * Gets a handler function for a 'atFrequency' filter.
     * @param frequency The frequency, in Hz, to cap to.
     * @returns A handler function for a 'atFrequency' filter.
     */
    protected getAtFrequencyHandler(frequency: number): (data: any, state: any, next: Handler<T>) => void;
    /**
     * Quantizes the numerical event data to consume only at the specified decimal precision.
     * @param precision The decimal precision to snap to.
     * @returns A new consumer with the applied precision filter.
     */
    withPrecision(precision: number): Consumer<T>;
    /**
     * Gets a handler function for a 'withPrecision' filter.
     * @param precision The decimal precision to snap to.
     * @returns A handler function for a 'withPrecision' filter.
     */
    protected getWithPrecisionHandler(precision: number): (data: any, state: any, next: Handler<T>) => void;
    /**
     * Filter the subscription to consume only when the value has changed by a minimum amount.
     * @param amount The minimum amount threshold below which the consumer will not consume.
     * @returns A new consumer with the applied change threshold filter.
     */
    whenChangedBy(amount: number): Consumer<T>;
    /**
     * Gets a handler function for a 'whenChangedBy' filter.
     * @param amount The minimum amount threshold below which the consumer will not consume.
     * @returns A handler function for a 'whenChangedBy' filter.
     */
    protected getWhenChangedByHandler(amount: number): (data: any, state: any, next: Handler<T>) => void;
    /**
     * Filter the subscription to consume only if the value has changed. At all.  Really only
     * useful for strings or other events that don't change much.
     * @returns A new consumer with the applied change threshold filter.
     */
    whenChanged(): Consumer<T>;
    /**
     * Gets a handler function for a 'whenChanged' filter.
     * @returns A handler function for a 'whenChanged' filter.
     */
    protected getWhenChangedHandler(): (data: any, state: any, next: Handler<T>) => void;
    /**
     * Filters events by time such that events will not be consumed until a minimum duration
     * has passed since the previous event.
     * @param deltaTime The minimum delta time between events.
     * @returns A new consumer with the applied change threshold filter.
     */
    onlyAfter(deltaTime: number): Consumer<T>;
    /**
     * Gets a handler function for an 'onlyAfter' filter.
     * @param deltaTime The minimum delta time between events.
     * @returns A handler function for an 'onlyAfter' filter.
     */
    protected getOnlyAfterHandler(deltaTime: number): (data: any, state: any, next: Handler<T>) => void;
    /**
     * Builds a handler stack from the current handler.
     * @param data The data to send in to the handler.
     * @param handler The handler to use for processing.
     */
    protected with(data: T, handler: Handler<T>): void;
}
//# sourceMappingURL=Consumer.d.ts.map