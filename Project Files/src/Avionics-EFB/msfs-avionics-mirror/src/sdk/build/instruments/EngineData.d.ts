import { EventBus, IndexedEventType, PublishPacer } from '../data/EventBus';
import { SimVarPublisher } from './BasePublishers';
/**
 * An interface that describes the possible Engine Parameter events
 * on the event bus.
 */
export interface EngineEvents {
    /** An RPM for engine 1. */
    rpm_1: number;
    /** Fuel flow rate, in gallons per hour, for an indexed engine. */
    [fuel_flow: IndexedEventType<'fuel_flow'>]: number;
    /** Total fuel flow rate, in gallons per hour. */
    fuel_flow_total: number;
    /** A fuel flow rate for recip engine 1 */
    recip_ff_1: number;
    /** A oil press for engine 1 */
    oil_press_1: number;
    /** A oil temp for engine 1 */
    oil_temp_1: number;
    /** A egt for engine 1 */
    egt_1: number;
    /** A pressure value for vacuum system */
    vac: number;
    /** The total amount of fuel remaining, in gallons. */
    fuel_total: number;
    /** The amount of fuel remaining in the left tank, in gallons. */
    fuel_left: number;
    /** The amount of fuel remaining in the right tank, in gallons. */
    fuel_right: number;
    /** A hours value for engine 1 total elapsed time */
    eng_hours_1: number;
    /** A voltage value for the main elec bus */
    elec_bus_main_v: number;
    /** A current value for the main elec bus */
    elec_bus_main_a: number;
    /** A voltage value for the avionics bus */
    elec_bus_avionics_v: number;
    /** A current value for the avinoics bus */
    elec_bus_avionics_a: number;
    /** A voltage value for the generator/alternator 1 bus */
    elec_bus_genalt_1_v: number;
    /** A current value for the generator/alternator 1 bus */
    elec_bus_genalt_1_a: number;
    /** A voltage value for the battery */
    elec_bat_v: number;
    /** A current value for the battery */
    elec_bat_a: number;
}
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