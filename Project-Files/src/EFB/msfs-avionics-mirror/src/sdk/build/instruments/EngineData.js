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
        this.subscribed.add('fuel_flow_total');
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
    ['rpm_2', { name: 'GENERAL ENG RPM:2', type: SimVarValueType.RPM }],
    ['n1_1', { name: 'TURB ENG CORRECTED N1:1', type: SimVarValueType.Percent }],
    ['n1_2', { name: 'TURB ENG CORRECTED N1:2', type: SimVarValueType.Percent }],
    ['n2_1', { name: 'TURB ENG CORRECTED N2:1', type: SimVarValueType.Percent }],
    ['n2_2', { name: 'TURB ENG CORRECTED N2:2', type: SimVarValueType.Percent }],
    ['recip_ff_1', { name: 'RECIP ENG FUEL FLOW:1', type: SimVarValueType.PPH }],
    ['recip_ff_2', { name: 'RECIP ENG FUEL FLOW:2', type: SimVarValueType.PPH }],
    ['oil_press_1', { name: 'ENG OIL PRESSURE:1', type: SimVarValueType.PSI }],
    ['oil_press_2', { name: 'ENG OIL PRESSURE:2', type: SimVarValueType.PSI }],
    ['oil_temp_1', { name: 'ENG OIL TEMPERATURE:1', type: SimVarValueType.Farenheit }],
    ['oil_temp_2', { name: 'ENG OIL TEMPERATURE:2', type: SimVarValueType.Farenheit }],
    ['itt_1', { name: 'TURB ENG1 ITT', type: SimVarValueType.Celsius }],
    ['itt_2', { name: 'TURB ENG2 ITT', type: SimVarValueType.Celsius }],
    ['egt_1', { name: 'ENG EXHAUST GAS TEMPERATURE:1', type: SimVarValueType.Farenheit }],
    ['egt_2', { name: 'ENG EXHAUST GAS TEMPERATURE:2', type: SimVarValueType.Farenheit }],
    ['vac', { name: 'SUCTION PRESSURE', type: SimVarValueType.InHG }],
    ['fuel_total', { name: 'FUEL TOTAL QUANTITY', type: SimVarValueType.GAL }],
    ['fuel_left', { name: 'FUEL LEFT QUANTITY', type: SimVarValueType.GAL }],
    ['fuel_right', { name: 'FUEL RIGHT QUANTITY', type: SimVarValueType.GAL }],
    ['fuel_weight_per_gallon', { name: 'FUEL WEIGHT PER GALLON', type: SimVarValueType.LBS }],
    ['eng_hours_1', { name: 'GENERAL ENG ELAPSED TIME:1', type: SimVarValueType.Hours }],
    ['eng_hyd_press_1', { name: 'ENG HYDRAULIC PRESSURE:1', type: SimVarValueType.PSI }],
    ['eng_hyd_press_2', { name: 'ENG HYDRAULIC PRESSURE:2', type: SimVarValueType.PSI }],
    ['eng_starter_1', { name: 'GENERAL ENG STARTER:1', type: SimVarValueType.Number }],
    ['eng_starter_2', { name: 'GENERAL ENG STARTER:2', type: SimVarValueType.Number }],
    ['eng_combustion_1', { name: 'GENERAL ENG COMBUSTION:1', type: SimVarValueType.Number }],
    ['eng_combustion_2', { name: 'GENERAL ENG COMBUSTION:2', type: SimVarValueType.Number }],
    ['eng_manual_ignition_1', { name: 'TURB ENG IGNITION SWITCH EX1:1', type: SimVarValueType.Number }],
    ['eng_manual_ignition_2', { name: 'TURB ENG IGNITION SWITCH EX1:2', type: SimVarValueType.Number }]
]);
