/// <reference types="msfstypes/pages/vcockpit/instruments/shared/utils/xmllogic" />
import { EventBus, PublishPacer } from '../data';
import { SimVarPublisher } from './BasePublishers';
/**
 * Events relating to the electrical systems.
 */
export interface ElectricalEvents {
    /** Master battery power is switched on or not. */
    'elec_master_battery': boolean;
    /** The avionics circuit is on or off. */
    'elec_circuit_avionics_on': boolean;
    /** The navcom 1 circuit is on or off. */
    'elec_circuit_navcom1_on': boolean;
    /** The navcom 2 circuit is on of off. */
    'elec_circuit_navcom2_on': boolean;
    /** The navcom 3 circuit is on of off. */
    'elec_circuit_navcom3_on': boolean;
    /** The first avionics power bus. */
    'elec_av1_bus': boolean;
    /** The second avionics power bus. */
    'elec_av2_bus': boolean;
    /** A voltage value for the main elec bus */
    'elec_bus_main_v': number;
    /** A current value for the main elec bus */
    'elec_bus_main_a': number;
    /** A voltage value for the avionics bus */
    'elec_bus_avionics_v': number;
    /** A current value for the avinoics bus */
    'elec_bus_avionics_a': number;
    /** A voltage value for the generator/alternator 1 bus */
    'elec_bus_genalt_1_v': number;
    /** A voltage value for the generator/alternator 2 bus */
    'elec_bus_genalt_2_v': number;
    /** A current value for the generator/alternator 1 bus */
    'elec_bus_genalt_1_a': number;
    /** A current value for the generator/alternator 2 bus */
    'elec_bus_genalt_2_a': number;
    /** A voltage value for the battery */
    'elec_bat_v': number;
    /** A current value for the battery */
    'elec_bat_a': number;
}
/**
 * A publisher for electrical information.
 */
export declare class ElectricalPublisher extends SimVarPublisher<ElectricalEvents> {
    private static simvars;
    private flightStarted;
    private av1BusLogic;
    private av2BusLogic;
    private avBusList;
    /**
     * Create an ElectricalPublisher
     * @param bus The EventBus to publish to
     * @param pacer An optional pacer to use to control the rate of publishing
     */
    constructor(bus: EventBus, pacer?: PublishPacer<ElectricalEvents> | undefined);
    /** @inheritdoc */
    onUpdate(): void;
    /**
     * Called when the flight has started and electrical data is valid.
     * @param started True if the flight has started
     */
    setFlightStarted(started: boolean): void;
    /**
     * Sets the logic element to use for the avionics 1 bus.
     * @param logicElement The logic element to use.
     */
    setAv1Bus(logicElement: CompositeLogicXMLElement): void;
    /**
     * Sets the logic element to use for the avionics 2 bus.
     * @param logicElement The logic element to use.
     */
    setAv2Bus(logicElement: CompositeLogicXMLElement): void;
}
//# sourceMappingURL=Electrical.d.ts.map