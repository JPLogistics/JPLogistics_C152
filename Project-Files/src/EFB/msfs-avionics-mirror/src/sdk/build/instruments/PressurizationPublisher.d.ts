import { SimVarPublisher } from './BasePublishers';
import { EventBus, PublishPacer } from '../data';
/**
 * An interface that describes the possible Pressurization events
 * on the event bus.
 */
export interface PressurizationEvents {
    /** A cabin altitude value. */
    cabin_altitude: number;
    /** A cabin altitude rate value. */
    cabin_altitude_rate: number;
    /** A pressure differential value. */
    pressure_diff: number;
}
/**
 * A publisher for Pressurization information.
 */
export declare class PressurizationPublisher extends SimVarPublisher<PressurizationEvents> {
    private static simvars;
    /**
     * Updates the ADC publisher.
     */
    onUpdate(): void;
    /**
     * Create an PressurizationPublisher
     * @param bus The EventBus to publish to
     * @param pacer An optional pacer to use to control the rate of publishing
     */
    constructor(bus: EventBus, pacer?: PublishPacer<PressurizationEvents> | undefined);
}
//# sourceMappingURL=PressurizationPublisher.d.ts.map