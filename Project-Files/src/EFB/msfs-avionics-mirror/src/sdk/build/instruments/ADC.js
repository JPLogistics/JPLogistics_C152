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
        bus.getSubscriber().on('event_bus_topic_first_sub').handle((key) => {
            if (key === 'mach_to_kias_factor') {
                this.subscribed.add('mach_to_kias_factor');
            }
        });
    }
    /**
     * Updates the ADC publisher.
     */
    onUpdate() {
        super.onUpdate();
        if (this.subscribed.has('mach_to_kias_factor')) {
            this.publish('mach_to_kias_factor', Simplane.getMachToKias(1), false, true);
        }
    }
}
ADCPublisher.simvars = new Map([
    ['ias', { name: 'AIRSPEED INDICATED', type: SimVarValueType.Knots }],
    ['tas', { name: 'AIRSPEED TRUE', type: SimVarValueType.Knots }],
    ['alt', { name: 'INDICATED ALTITUDE', type: SimVarValueType.Feet }],
    ['pressure_alt', { name: 'PRESSURE ALTITUDE', type: SimVarValueType.Feet }],
    ['radio_alt', { name: 'RADIO HEIGHT', type: SimVarValueType.Feet }],
    ['vs', { name: 'VERTICAL SPEED', type: SimVarValueType.FPM }],
    ['hdg_deg', { name: 'PLANE HEADING DEGREES MAGNETIC', type: SimVarValueType.Degree }],
    ['pitch_deg', { name: 'PLANE PITCH DEGREES', type: SimVarValueType.Degree }],
    ['roll_deg', { name: 'PLANE BANK DEGREES', type: SimVarValueType.Degree }],
    ['hdg_deg_true', { name: 'PLANE HEADING DEGREES TRUE', type: SimVarValueType.Degree }],
    ['kohlsman_setting_hg_1', { name: 'KOHLSMAN SETTING HG', type: SimVarValueType.InHG }],
    ['kohlsman_setting_hg_1_preselect', { name: 'L:XMLVAR_Baro1_SavedPressure', type: SimVarValueType.MB }],
    ['baro_std_1', { name: 'L:XMLVAR_Baro1_ForcedToSTD', type: SimVarValueType.Bool }],
    ['turn_coordinator_ball', { name: 'TURN COORDINATOR BALL', type: SimVarValueType.Number }],
    ['delta_heading_rate', { name: 'DELTA HEADING RATE', type: SimVarValueType.Degree }],
    ['ambient_temp_c', { name: 'AMBIENT TEMPERATURE', type: SimVarValueType.Celsius }],
    ['ambient_press_in', { name: 'AMBIENT PRESSURE', type: SimVarValueType.InHG }],
    ['isa_temp_c', { name: 'STANDARD ATM TEMPERATURE', type: SimVarValueType.Celsius }],
    ['rat_temp_c', { name: 'TOTAL AIR TEMPERATURE', type: SimVarValueType.Celsius }],
    ['ambient_wind_velocity', { name: 'AMBIENT WIND VELOCITY', type: SimVarValueType.Knots }],
    ['ambient_wind_direction', { name: 'AMBIENT WIND DIRECTION', type: SimVarValueType.Degree }],
    ['kohlsman_setting_mb_1', { name: 'KOHLSMAN SETTING MB', type: SimVarValueType.MB }],
    ['on_ground', { name: 'SIM ON GROUND', type: SimVarValueType.Bool }],
    ['aoa', { name: 'INCIDENCE ALPHA', type: SimVarValueType.Degree }],
    ['stall_aoa', { name: 'STALL ALPHA', type: SimVarValueType.Degree }],
    ['mach_number', { name: 'AIRSPEED MACH', type: SimVarValueType.Mach }],
]);
