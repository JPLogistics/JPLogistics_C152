/// <reference types="msfstypes/JS/simvar" />
import { SimVarValueType } from '../data/SimVars';
import { SimVarPublisher } from './BasePublishers';
/**
 * A publisher for basic ADC/AHRS information.
 */
export class ADCPublisher extends SimVarPublisher {
    /**
     * Create an ADCPublisher
     * @param bus The EventBus to publish to
     * @param pacer An optional pacer to use to control the rate of publishing
     */
    constructor(bus, pacer = undefined) {
        super(ADCPublisher.simvars, bus, pacer);
    }
    /**
     * Updates the ADC publisher.
     */
    onUpdate() {
        super.onUpdate();
    }
}
ADCPublisher.simvars = new Map([
    ['ias', { name: 'AIRSPEED INDICATED', type: SimVarValueType.Knots }],
    ['tas', { name: 'AIRSPEED TRUE', type: SimVarValueType.Knots }],
    ['alt', { name: 'INDICATED ALTITUDE', type: SimVarValueType.Feet }],
    ['vs', { name: 'VERTICAL SPEED', type: SimVarValueType.FPM }],
    ['hdg_deg', { name: 'PLANE HEADING DEGREES MAGNETIC', type: SimVarValueType.Degree }],
    ['pitch_deg', { name: 'PLANE PITCH DEGREES', type: SimVarValueType.Degree }],
    ['roll_deg', { name: 'PLANE BANK DEGREES', type: SimVarValueType.Degree }],
    ['hdg_deg_true', { name: 'PLANE HEADING DEGREES TRUE', type: SimVarValueType.Degree }],
    ['kohlsman_setting_hg_1', { name: 'KOHLSMAN SETTING HG', type: SimVarValueType.InHG }],
    ['turn_coordinator_ball', { name: 'TURN COORDINATOR BALL', type: SimVarValueType.Number }],
    ['delta_heading_rate', { name: 'DELTA HEADING RATE', type: SimVarValueType.Degree }],
    ['ambient_temp_c', { name: 'AMBIENT TEMPERATURE', type: SimVarValueType.Celsius }],
    ['ambient_wind_velocity', { name: 'AMBIENT WIND VELOCITY', type: SimVarValueType.Knots }],
    ['ambient_wind_direction', { name: 'AMBIENT WIND DIRECTION', type: SimVarValueType.Degree }],
    ['kohlsman_setting_mb_1', { name: 'KOHLSMAN SETTING MB', type: SimVarValueType.MB }],
    ['baro_units_hpa_1', { name: 'L:XMLVAR_Baro_Selector_HPA_1', type: SimVarValueType.Bool }],
    ['on_ground', { name: 'SIM ON GROUND', type: SimVarValueType.Bool }],
    ['aoa', { name: 'INCIDENCE ALPHA', type: SimVarValueType.Degree }]
]);
