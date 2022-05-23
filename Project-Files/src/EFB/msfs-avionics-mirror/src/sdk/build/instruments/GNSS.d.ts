/// <reference types="msfstypes/js/types" />
import { EventBus } from '../data/EventBus';
import { PublishPacer } from '../data/EventBusPacer';
import { BasePublisher } from './BasePublishers';
/**
 * An interface that describes GNSS event bus events.
 */
export interface GNSSEvents {
    /** A GNSS location change event. */
    ['gps-position']: LatLongAlt;
    /** The current zulu time change event. */
    zulu_time: number;
    /** The current time of day change event. */
    time_of_day: number;
    /** The plane ground track, in degrees true north. */
    track_deg_true: number;
    /** The plane ground track, in degrees magnetic north. */
    track_deg_magnetic: number;
    /** The plane ground speed, in knots. */
    ground_speed: number;
    /** The current magnetic variation at the plane position. */
    magvar: number;
}
/**
 * A publisher for basic GNSS information.
 */
export declare class GNSSPublisher extends BasePublisher<GNSSEvents> {
    /**
     * Create an GNSSPublisher
     * @param bus The EventBus to publish to
     * @param pacer An optional pacer to use to control the rate of publishing
     */
    constructor(bus: EventBus, pacer?: PublishPacer<GNSSEvents> | undefined);
    /**
     * A callback called when the publisher updates.
     */
    onUpdate(): void;
    /**
     * Publishes the gps-position event.
     */
    private publishPosition;
    /**
     * Publishes the zulu_time and time_of_day events.
     */
    private publishTime;
    /**
     * Publishes the track_deg_true and track_deg_magnetic events.
     */
    private publishTrack;
    /**
     * Publishes the ground_speed event.
     */
    private publishGroundSpeed;
    /**
     * Publishes the ground_speed event.
     */
    private publishMagVar;
}
//# sourceMappingURL=GNSS.d.ts.map