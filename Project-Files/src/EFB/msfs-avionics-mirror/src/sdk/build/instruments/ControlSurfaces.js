import { SimVarValueType } from '../data/SimVars';
import { SimVarPublisher } from './BasePublishers';
/**
 * A publisher for control surfaces information.
 */
export class ControlSurfacesPublisher extends SimVarPublisher {
    /**
     * Create an ControlSurfacesPublisher
     * @param bus The EventBus to publish to
     * @param pacer An optional pacer to use to control the rate of publishing
     */
    constructor(bus, pacer = undefined) {
        super(ControlSurfacesPublisher.simvars, bus, pacer);
    }
}
ControlSurfacesPublisher.simvars = new Map([
    ['flaps_handle_index', { name: 'FLAPS HANDLE INDEX', type: SimVarValueType.Number }],
    ['flaps_angle', { name: 'TRAILING EDGE FLAPS LEFT ANGLE', type: SimVarValueType.Degree }],
    ['elevator_trim_pct', { name: 'ELEVATOR TRIM PCT', type: SimVarValueType.Percent }],
    ['elevator_trim_neutral_pct', { name: 'AIRCRAFT ELEVATOR TRIM NEUTRAL', type: SimVarValueType.Percent }],
    ['aileron_trim_pct', { name: 'AILERON TRIM PCT', type: SimVarValueType.Percent }],
    ['rudder_trim_pct', { name: 'RUDDER TRIM PCT', type: SimVarValueType.Percent }],
    ['gear_position_index', { name: 'GEAR POSITION', type: SimVarValueType.Number }],
]);
