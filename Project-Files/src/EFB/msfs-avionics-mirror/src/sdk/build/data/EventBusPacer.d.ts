/** A noop interface for global type guards */
export interface EventTypes {
}
/**
 * A generic class for injecting pacing logic into a publisher.
 */
export interface PublishPacer<E extends EventTypes> {
    canPublish<K extends keyof E>(topic: K, data: E[K]): boolean;
}
/**
 * A PublishPacer that only allows publishing on an interval.
 */
export declare class IntervalPacer<E> {
    private interval;
    private lastPublished;
    /**
     * Create an IntervalPacer.
     * @param msec Time to wait between publishs in ms
     */
    constructor(msec: number);
    /**
     * Determine whether the data can be published based on the time since its
     * prior publish.
     * @param topic The topic data would be sent on.
     * @param data The data which would be sent.
     * @returns A bool indicating if the data should be published.
     */
    canPublish<K extends keyof E>(topic: keyof E, data: E[K]): boolean;
}
/**
 * A PublishPacer that only allows publishing when a value has changed
 * by a specifed amount from the prior publish.
 */
export declare class DeltaPacer<E> {
    private delta;
    private lastPublished;
    /**
     * Create a DeltaPacer.
     * @param delta The difference required for publishing to be allowed.
     */
    constructor(delta: number);
    /**
     * Determine whether the data can be published based on its delta from the
     * pror publish.
     * @param topic The topic data would be sent on.
     * @param data The data which would be sent.
     * @returns A bool indicating if the data should be published.
     */
    canPublish<K extends keyof E>(topic: keyof E, data: number): boolean;
}
//# sourceMappingURL=EventBusPacer.d.ts.map