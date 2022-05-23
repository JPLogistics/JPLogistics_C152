/// <reference types="msfstypes/JS/simvar" />
import { SimVarValueType } from '../data';
import { SimVarPublisher } from './BasePublishers';
/**
 * A publisher for electrical information.
 */
export class ElectricalPublisher extends SimVarPublisher {
    /**
     * Create an ElectricalPublisher
     * @param bus The EventBus to publish to
     * @param pacer An optional pacer to use to control the rate of publishing
     */
    constructor(bus, pacer = undefined) {
        super(ElectricalPublisher.simvars, bus, pacer);
        this.flightStarted = false;
        this.avBusList = ['elec_av1_bus', 'elec_av2_bus'];
        for (const topic of this.avBusList) {
            if (bus.getTopicSubsciberCount(topic)) {
                this.subscribed.add(topic);
            }
        }
        bus.getSubscriber().on('event_bus_topic_first_sub').handle((event) => {
            if (this.avBusList.includes(event)) {
                this.subscribed.add(event);
            }
        });
    }
    /** @inheritdoc */
    onUpdate() {
        if (this.flightStarted) {
            super.onUpdate();
            if (this.av1BusLogic && this.subscribed.has('elec_av1_bus')) {
                this.publish('elec_av1_bus', this.av1BusLogic.getValue() !== 0);
            }
            if (this.av2BusLogic && this.subscribed.has('elec_av2_bus')) {
                this.publish('elec_av2_bus', this.av2BusLogic.getValue() !== 0);
            }
        }
    }
    /**
     * Called when the flight has started and electrical data is valid.
     * @param started True if the flight has started
     */
    setFlightStarted(started) {
        this.flightStarted = started;
    }
    /**
     * Sets the logic element to use for the avionics 1 bus.
     * @param logicElement The logic element to use.
     */
    setAv1Bus(logicElement) {
        this.av1BusLogic = logicElement;
    }
    /**
     * Sets the logic element to use for the avionics 2 bus.
     * @param logicElement The logic element to use.
     */
    setAv2Bus(logicElement) {
        this.av2BusLogic = logicElement;
    }
}
ElectricalPublisher.simvars = new Map([
    ['elec_master_battery', { name: 'ELECTRICAL MASTER BATTERY', type: SimVarValueType.Bool }],
    ['elec_circuit_avionics_on', { name: 'CIRCUIT AVIONICS ON', type: SimVarValueType.Bool }],
    ['elec_circuit_navcom1_on', { name: 'CIRCUIT NAVCOM1 ON', type: SimVarValueType.Bool }],
    ['elec_circuit_navcom2_on', { name: 'CIRCUIT NAVCOM2 ON', type: SimVarValueType.Bool }],
    ['elec_circuit_navcom3_on', { name: 'CIRCUIT NAVCOM3 ON', type: SimVarValueType.Bool }],
    ['elec_bus_main_v', { name: 'ELECTRICAL MAIN BUS VOLTAGE', type: SimVarValueType.Volts }],
    ['elec_bus_main_a', { name: 'ELECTRICAL MAIN BUS AMPS', type: SimVarValueType.Amps }],
    ['elec_bus_avionics_v', { name: 'ELECTRICAL AVIONICS BUS VOLTAGE', type: SimVarValueType.Volts }],
    ['elec_bus_avionics_a', { name: 'ELECTRICAL AVIONICS BUS AMPS', type: SimVarValueType.Amps }],
    ['elec_bus_genalt_1_v', { name: 'ELECTRICAL GENALT BUS VOLTAGE:1', type: SimVarValueType.Volts }],
    ['elec_bus_genalt_2_v', { name: 'ELECTRICAL GENALT BUS VOLTAGE:2', type: SimVarValueType.Volts }],
    ['elec_bus_genalt_1_a', { name: 'ELECTRICAL GENALT BUS AMPS:1', type: SimVarValueType.Amps }],
    ['elec_bus_genalt_2_a', { name: 'ELECTRICAL GENALT BUS AMPS:2', type: SimVarValueType.Amps }],
    ['elec_bat_a', { name: 'ELECTRICAL BATTERY LOAD', type: SimVarValueType.Amps }],
    ['elec_bat_v', { name: 'ELECTRICAL BATTERY VOLTAGE', type: SimVarValueType.Volts }]
]);
