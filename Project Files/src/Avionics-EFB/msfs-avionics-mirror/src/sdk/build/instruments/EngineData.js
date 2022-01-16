/// <reference types="msfstypes/JS/simvar" />
import { SimVarValueType } from '../data/SimVars';
import { SimVarPublisher } from './BasePublishers';
/**
 * A publisher for Engine information.
 */
export class EISPublisher extends SimVarPublisher {
    /**
     * Create an EISPublisher
     * @param bus The EventBus to publish to
     * @param pacer An optional pacer to use to control the rate of publishing
     */
    constructor(bus, pacer = undefined) {
        const simvars = new Map(EISPublisher.simvars);
        // add engine-indexed simvars
        const engineCount = SimVar.GetSimVarValue('NUMBER OF ENGINES', SimVarValueType.Number);
        for (let i = 1; i <= engineCount; i++) {
            simvars.set(`fuel_flow_${i}`, { name: `ENG FUEL FLOW GPH:${i}`, type: SimVarValueType.GPH });
        }
        super(simvars, bus, pacer);
        this.engineCount = engineCount;
    }
    /** @inheritdoc */
    onUpdate() {
        super.onUpdate();
        if (this.subscribed.has('fuel_flow_total')) {
            let totalFuelFlow = 0;
            for (let i = 1; i <= this.engineCount; i++) {
                totalFuelFlow += SimVar.GetSimVarValue(`ENG FUEL FLOW GPH:${i}`, SimVarValueType.GPH);
            }
            this.publish('fuel_flow_total', totalFuelFlow);
        }
    }
}
EISPublisher.simvars = new Map([
    ['rpm_1', { name: 'GENERAL ENG RPM:1', type: SimVarValueType.RPM }],
    ['recip_ff_1', { name: 'RECIP ENG FUEL FLOW:1', type: SimVarValueType.PPH }],
    ['oil_press_1', { name: 'ENG OIL PRESSURE:1', type: SimVarValueType.PSI }],
    ['oil_temp_1', { name: 'ENG OIL TEMPERATURE:1', type: SimVarValueType.Farenheit }],
    ['egt_1', { name: 'ENG EXHAUST GAS TEMPERATURE:1', type: SimVarValueType.Farenheit }],
    ['vac', { name: 'SUCTION PRESSURE', type: SimVarValueType.InHG }],
    ['fuel_total', { name: 'FUEL TOTAL QUANTITY', type: SimVarValueType.GAL }],
    ['fuel_left', { name: 'FUEL LEFT QUANTITY', type: SimVarValueType.GAL }],
    ['fuel_right', { name: 'FUEL RIGHT QUANTITY', type: SimVarValueType.GAL }],
    ['eng_hours_1', { name: 'GENERAL ENG ELAPSED TIME:1', type: SimVarValueType.Hours }],
    ['elec_bus_main_v', { name: 'ELECTRICAL MAIN BUS VOLTAGE', type: SimVarValueType.Volts }],
    ['elec_bus_main_a', { name: 'ELECTRICAL MAIN BUS AMPS', type: SimVarValueType.Amps }],
    ['elec_bus_avionics_v', { name: 'ELECTRICAL AVIONICS BUS VOLTAGE', type: SimVarValueType.Volts }],
    ['elec_bus_avionics_a', { name: 'ELECTRICAL AVIONICS BUS AMPS', type: SimVarValueType.Amps }],
    ['elec_bus_genalt_1_v', { name: 'ELECTRICAL GENALT BUS VOLTAGE:1', type: SimVarValueType.Volts }],
    ['elec_bus_genalt_1_a', { name: 'ELECTRICAL GENALT BUS AMPS:1', type: SimVarValueType.Amps }],
    ['elec_bat_a', { name: 'ELECTRICAL BATTERY LOAD', type: SimVarValueType.Amps }],
    ['elec_bat_v', { name: 'ELECTRICAL BATTERY VOLTAGE', type: SimVarValueType.Volts }]
]);
