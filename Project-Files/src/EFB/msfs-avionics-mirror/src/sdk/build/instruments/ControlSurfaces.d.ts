import { EventBus } from '../data/EventBus';
import { PublishPacer } from '../data/EventBusPacer';
import { SimVarPublisher } from './BasePublishers';
/**
 * An interface that describes the possible Control Surface events
 * on the event bus.
 */
export declare type ControlSurfacesEvents = {
    /** The handle index for flaps. */
    flaps_handle_index: number;
    /** The flaps trailing edge angle. */
    flaps_angle: number;
    /** The percent of applied elevator trim. */
    elevator_trim_pct: number;
    /** The neutral position in percent of the elevator trim. */
    elevator_trim_neutral_pct: number;
    /** The percent of applied aileron trim. */
    aileron_trim_pct: number;
    /** The percent of applied rudder trim. */
    rudder_trim_pct: number;
    /** The position index of the gear. */
    gear_position_index: number;
};
/**
 * A publisher for control surfaces information.
 */
export declare class ControlSurfacesPublisher extends SimVarPublisher<ControlSurfacesEvents> {
    private static simvars;
    /**
     * Create an ControlSurfacesPublisher
     * @param bus The EventBus to publish to
     * @param pacer An optional pacer to use to control the rate of publishing
     */
    constructor(bus: EventBus, pacer?: PublishPacer<ControlSurfacesEvents> | undefined);
}
//# sourceMappingURL=ControlSurfaces.d.ts.map