import { SimVarPublisher } from './BasePublishers';
import { SimVarValueType } from '../data';
/**
 * A publisher for Pressurization information.
 */
export class PressurizationPublisher extends SimVarPublisher {
    /**
     * Create an PressurizationPublisher
     * @param bus The EventBus to publish to
     * @param pacer An optional pacer to use to control the rate of publishing
     */
    constructor(bus, pacer = undefined) {
        super(PressurizationPublisher.simvars, bus, pacer);
    }
    /**
     * Updates the ADC publisher.
     */
    onUpdate() {
        super.onUpdate();
    }
}
PressurizationPublisher.simvars = new Map([
    ['cabin_altitude', { name: 'PRESSURIZATION CABIN ALTITUDE', type: SimVarValueType.Feet }],
    ['cabin_altitude_rate', { name: 'PRESSURIZATION CABIN ALTITUDE RATE', type: SimVarValueType.FPM }],
    ['pressure_diff', { name: 'PRESSURIZATION PRESSURE DIFFERENTIAL', type: SimVarValueType.PSI }]
]);
