/**
 * A PublishPacer that only allows publishing on an interval.
 */
export class IntervalPacer {
    /**
     * Create an IntervalPacer.
     * @param msec Time to wait between publishs in ms
     */
    constructor(msec) {
        this.lastPublished = new Map();
        this.interval = msec;
    }
    /**
     * Determine whether the data can be published based on the time since its
     * prior publish.
     * @param topic The topic data would be sent on.
     * @param data The data which would be sent.
     * @returns A bool indicating if the data should be published.
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    canPublish(topic, data) {
        const prior = this.lastPublished.get(topic);
        const now = Date.now();
        if (prior && now - prior < this.interval) {
            return false;
        }
        this.lastPublished.set(topic, now);
        return true;
    }
}
/**
 * A PublishPacer that only allows publishing when a value has changed
 * by a specifed amount from the prior publish.
 */
export class DeltaPacer {
    /**
     * Create a DeltaPacer.
     * @param delta The difference required for publishing to be allowed.
     */
    constructor(delta) {
        this.lastPublished = new Map();
        this.delta = delta;
    }
    /**
     * Determine whether the data can be published based on its delta from the
     * pror publish.
     * @param topic The topic data would be sent on.
     * @param data The data which would be sent.
     * @returns A bool indicating if the data should be published.
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    canPublish(topic, data) {
        const prior = this.lastPublished.get(topic);
        if (prior && Math.abs(data - prior) < this.delta) {
            return false;
        }
        this.lastPublished.set(topic, data);
        return true;
    }
}
