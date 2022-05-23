import { Subscription } from './Subscription';
/**
 * An event to which handlers can be subscribed to be notified whenever the event is emitted.
 */
export declare type ReadonlySubEvent<SenderType, DataType> = Omit<SubEvent<SenderType, DataType>, 'notify' | 'clear'>;
/**
 * An event which can be emitted with optional data to subscribers.
 */
export declare class SubEvent<SenderType, DataType> {
    private subs;
    private notifyDepth;
    private readonly onSubDestroyedFunc;
    /**
     * Subscribes to this event.
     * @param handler A function to be called when an event is emitted.
     * @param paused Whether the new subscription should be initialized as paused. Defaults to `false`.
     * @returns The new subscription.
     */
    on(handler: (sender: SenderType, data: DataType) => void, paused?: boolean): Subscription;
    /**
     * Unsubscribes a callback function from this event.
     * @param handler The function to unsubscribe.
     * @deprecated This method has been deprecated in favor of using the {@link Subscription} object returned by `.on()`
     * to manage subscriptions.
     */
    off(handler: (sender: SenderType, data: DataType) => void): void;
    /**
     * Clears all subscriptions to this event.
     */
    clear(): void;
    /**
     * Emits an event to subscribers.
     * @param sender The source of the event.
     * @param data Data associated with the event.
     */
    notify(sender: SenderType, data: DataType): void;
    /**
     * Responds to when a subscription to this event is destroyed.
     * @param sub The destroyed subscription.
     */
    private onSubDestroyed;
}
//# sourceMappingURL=SubEvent.d.ts.map