import { HandlerSubscription } from '../sub/HandlerSubscription';
import { Subscription } from '../sub/Subscription';
import { EventSubscriber } from './EventSubscriber';
/** A handler for handling subscription data. */
export declare type Handler<T> = (data: T) => void;
/** A handler for handling wildcard multiple subscription data. */
export declare type WildcardHandler = (topic: string, data: any) => void;
/**
 * Meta-events published for event bus happenings.
 */
export interface EventBusMetaEvents {
    /** General event bus topic, currently only used for resync requests. */
    event_bus: string;
    /** Notification that a topic has had a subscripiton.  */
    event_bus_topic_first_sub: string;
}
/**
 * An indexed event type. Indexed events have keys of the form `event_[index]`.
 */
export declare type IndexedEventType<T extends string> = `${T}_${number}`;
/**
 * Mock event types.
 */
export interface MockEventTypes {
    /** A random number event. */
    randomNumber: number;
}
/**
 * An interface that describes an event publisher.
 */
export interface Publisher<E> {
    /**
     * Publishes an event with data to a topic.
     * @param topic The topic to publish to.
     * @param data The data to publish.
     * @param sync Whether or not to sync the data on the bus.
     * @param isCached Whether or not this event should be cached for retrieval.
     */
    pub<K extends keyof E>(topic: K, data: E[K], sync?: boolean, isCached?: boolean): void;
}
/**
 * An event bus that can be used to publish data from backend
 * components and devices to consumers.
 */
export declare class EventBus {
    private _topicSubsMap;
    private _wildcardSubs;
    private _notifyDepthMap;
    private _wildcardNotifyDepth;
    private _eventCache;
    private _busSync;
    private _busId;
    protected readonly onWildcardSubDestroyedFunc: (sub: HandlerSubscription<WildcardHandler>) => void;
    /**
     * Creates an instance of an EventBus.
     * @param useCoherentEventSync Whether or not to use coherent event sync (optional, default false)
     */
    constructor(useCoherentEventSync?: boolean);
    /**
     * Subscribes to a topic on the bus.
     * @param topic The topic to subscribe to.
     * @param handler The handler to be called when an event happens.
     * @param paused Whether the new subscription should be initialized as paused. Defaults to `false`.
     * @returns The new subscription.
     */
    on(topic: string, handler: Handler<any>, paused?: boolean): Subscription;
    /**
     * Unsubscribes a handler from the topic's events.
     * @param topic The topic to unsubscribe from.
     * @param handler The handler to unsubscribe from topic.
     * @deprecated This method has been deprecated in favor of using the {@link Subscription} object returned by `.on()`
     * to manage subscriptions.
     */
    off(topic: string, handler: Handler<any>): void;
    /**
     * Subscribes to all topics.
     * @param handler The handler to subscribe to all events.
     * @returns The new subscription.
     */
    onAll(handler: WildcardHandler): Subscription;
    /**
     * Unsubscribe the handler from all topics.
     * @param handler The handler to unsubscribe from all events.
     * @deprecated This method has been deprecated in favor of using the {@link Subscription} object returned by
     * `.onAll()` to manage subscriptions.
     */
    offAll(handler: WildcardHandler): void;
    /**
     * Publishes an event to the topic on the bus.
     * @param topic The topic to publish to.
     * @param data The data portion of the event.
     * @param sync Whether or not this message needs to be synced on local stoage.
     * @param isCached Whether or not this message will be resync'd across the bus on load.
     */
    pub(topic: string, data: any, sync?: boolean, isCached?: boolean): void;
    /**
     * Responds to when a wildcard subscription is destroyed.
     * @param sub The destroyed subscription.
     */
    private onWildcardSubDestroyed;
    /**
     * Re-sync all synced events
     */
    private resyncEvents;
    /**
     * Publish an event to the sync bus.
     * @param topic The topic to publish to.
     * @param data The data to publish.
     * @param isCached Whether or not this message will be resync'd across the bus on load.
     */
    private syncEvent;
    /**
     * Gets a typed publisher from the event bus..
     * @returns The typed publisher.
     */
    getPublisher<E>(): Publisher<E>;
    /**
     * Gets a typed subscriber from the event bus.
     * @returns The typed subscriber.
     */
    getSubscriber<E>(): EventSubscriber<E>;
    /**
     * Get the number of subscribes for a given topic.
     * @param topic The name of the topic.
     * @returns The number of subscribers.
     **/
    getTopicSubsciberCount(topic: string): number;
}
//# sourceMappingURL=EventBus.d.ts.map