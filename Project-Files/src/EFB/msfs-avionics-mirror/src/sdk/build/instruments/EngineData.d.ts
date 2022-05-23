import { EventBus, IndexedEventType } from '../data/EventBus';
import { PublishPacer } from '../data/EventBusPacer';
import { SimVarPublisher } from './BasePublishers';
/**
 * An interface that describes the possible Engine Parameter events
 * on the event bus.
 */
export declare type EngineEvents = {
    /** An RPM for engine 1. */
    rpm_1: number;
    /** An RPM for engine 2. */
    rpm_2: number;
    /** N1% for engine 1 */
    n1_1: number;
    /** N1% for engine 2 */
    n1_2: number;
    /** N2% for engine 1 */
    n2_1: number;
    /** N2% for engine 2 */
    n2_2: number;
    /** Fuel flow rate, in gallons per hour, for an indexed engine. */
    [fuel_flow: IndexedEventType<'fuel_flow'>]: number;
    /** Total fuel flow rate, in gallons per hour. */
    fuel_flow_total: number;
    /** A fuel flow rate for recip engine 1 */
    recip_ff_1: number;
    /** A fuel flow rate for recip engine 2 */
    recip_ff_2: number;
    /** A oil press for engine 1 */
    oil_press_1: number;
    /** A oil press for engine 2 */
    oil_press_2: number;
    /** A oil temp for engine 1 */
    oil_temp_1: number;
    /** A oil temp for engine 2 */
    oil_temp_2: number;
    /** ITT in celsius for engine 1 */
    itt_1: number;
    /** ITT in celsius for engine 2 */
    itt_2: number;
    /** A egt for engine 1 */
    egt_1: number;
    /** A egt for engine 2 */
    egt_2: number;
    /** A pressure value for vacuum system */
    vac: number;
    /** The total amount of fuel remaining, in gallons. */
    fuel_total: number;
    /** The amount of fuel remaining in the left tank, in gallons. */
    fuel_left: number;
    /** The amount of fuel remaining in the right tank, in gallons. */
    fuel_right: number;
    /**
     * The fuel weight per gallon, in pounds per gallon
     */
    fuel_weight_per_gallon: number;
    /** A hours value for engine 1 total elapsed time */
    eng_hours_1: number;
    /** A hydraulic pressure value for engine 1 */
    eng_hyd_press_1: number;
    /** A hydraulic pressure value for engine 2 */
    eng_hyd_press_2: number;
    /** A value indicating if engine 1 starter is on */
    eng_starter_1: number;
    /** A value indicating if engine 2 starter is on */
    eng_starter_2: number;
    /** A value indicating if engine 1 combustion is on */
    eng_combustion_1: number;
    /** A value indicating if engine 2 combustion is on */
    eng_combustion_2: number;
    /** A value indicating if engine 1 manual ignition is on */
    eng_manual_ignition_1: number;
    /** A value indicating if engine 2 manual ignition is on */
    eng_manual_ignition_2: number;
};
/**
 * A publisher for Engine information.
 */
export declare class EISPublisher extends SimVarPublisher<EngineEvents> {
    private static simvars;
    private readonly engineCount;
    /**
     * Create an EISPublisher
     * @param bus The EventBus to publish to
     * @param pacer An optional pacer to use to control the rate of publishing
     */
    constructor(bus: EventBus, pacer?: PublishPacer<EngineEvents> | undefined);
    /** @inheritdoc */
    onUpdate(): void;
}
//# sourceMappingURL=EngineData.d.ts.map