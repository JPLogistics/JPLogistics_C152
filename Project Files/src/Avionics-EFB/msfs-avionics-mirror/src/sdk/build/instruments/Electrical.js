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
    }
    /** @inheritdoc */
    onUpdate() {
        super.onUpdate();
        if (this.av1BusLogic && this.subscribed.has('elec_av1_bus')) {
            this.publish('elec_av1_bus', this.av1BusLogic.getValue() !== 0);
        }
        if (this.av2BusLogic && this.subscribed.has('elec_av2_bus')) {
            this.publish('elec_av2_bus', this.av2BusLogic.getValue() !== 0);
        }
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
    ['elec_circuit_navcom3_on', { name: 'CIRCUIT NAVCOM3 ON', type: SimVarValueType.Bool }]
]);
