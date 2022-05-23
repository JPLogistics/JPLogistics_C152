import { UnitType } from '..';
import { KeyInterceptManager } from '../data';
import { SimVarValueType } from '../data/SimVars';
import { SimVarPublisher } from './BasePublishers';
/** A publisher for DH/DA simvar events. */
class DHSimVarPublisher extends SimVarPublisher {
    /**
     * @inheritdoc
     */
    constructor(bus) {
        super(DHSimVarPublisher.simvars, bus);
    }
}
DHSimVarPublisher.simvars = new Map([
    ['decision_height_feet', { name: 'DECISION HEIGHT', type: SimVarValueType.Feet }],
    ['decision_altitude_feet', { name: 'DECISION ALTITUDE MSL', type: SimVarValueType.Feet }]
]);
/**
 * A class that manages decision height and altitude data and events.
 */
export class DHManager {
    /**
     * Create a DHManager
     * @param bus The event bus
     */
    constructor(bus) {
        this.currentDH = 0;
        this.currentDA = 0;
        this.daDistanceUnit = UnitType.FOOT;
        this.dhDistanceUnit = UnitType.FOOT;
        this.bus = bus;
        this.simVarPublisher = new DHSimVarPublisher(bus);
        this.simVarSubscriber = bus.getSubscriber();
        this.controlSubscriber = bus.getSubscriber();
        this.publisher = bus.getPublisher();
        // Don't initialize with bogus data.
        SimVar.SetSimVarValue('K:SET_DECISION_HEIGHT', 'number', 0);
        SimVar.SetSimVarValue('K:SET_DECISION_ALTITUDE_MSL', 'number', 0);
        KeyInterceptManager.getManager(bus).then(manager => {
            manager.interceptKey('INCREASE_DECISION_HEIGHT', false);
            manager.interceptKey('DECREASE_DECISION_HEIGHT', false);
            manager.interceptKey('INCREASE_DECISION_ALTITUDE_MSL', false);
            manager.interceptKey('DECREASE_DECISION_ALTITUDE_MSL', false);
        });
        this.simVarSubscriber.on('decision_height_feet').whenChanged().handle((dh) => {
            this.currentDH = dh;
            this.publisher.pub('decision_height', this.currentDH, true, true);
        });
        this.simVarSubscriber.on('decision_altitude_feet').whenChanged().handle((da) => {
            this.currentDA = da;
            this.publisher.pub('decision_altitude', this.currentDA, true, true);
        });
        this.controlSubscriber.on('set_decision_height').handle((dh) => {
            SimVar.SetSimVarValue('K:SET_DECISION_HEIGHT', 'number', dh);
        });
        this.controlSubscriber.on('set_decision_altitude').handle((da) => {
            SimVar.SetSimVarValue('K:SET_DECISION_ALTITUDE_MSL', 'number', da);
        });
        this.controlSubscriber.on('set_dh_distance_unit').handle((unit) => {
            this.daDistanceUnit = unit == 'meters' ? UnitType.METER : UnitType.FOOT;
        });
        this.controlSubscriber.on('set_da_distance_unit').handle((unit) => {
            this.daDistanceUnit = unit == 'meters' ? UnitType.METER : UnitType.FOOT;
        });
        const sub = this.bus.getSubscriber();
        sub.on('key_intercept').handle((evt) => {
            let simvar;
            let curVal;
            let direction = 'up';
            let unit;
            if (evt.value !== undefined) {
                switch (evt.key) {
                    case 'DECREASE_DECISION_HEIGHT':
                        direction = 'down';
                    // eslint-disable-next-line no-fallthrough
                    case 'INCREASE_DECISION_HEIGHT':
                        simvar = 'K:SET_DECISION_HEIGHT';
                        unit = this.dhDistanceUnit;
                        curVal = this.currentDH;
                        break;
                    case 'DECREASE_DECISION_ALTITUDE_MSL':
                        direction = 'down';
                    // eslint-disable-next-line no-fallthrough
                    case 'INCREASE_DECISION_ALTITUDE_MSL':
                        simvar = 'K:SET_DECISION_ALTITUDE_MSL';
                        unit = this.daDistanceUnit;
                        curVal = this.currentDA;
                        break;
                }
                if (simvar !== undefined && curVal !== undefined && unit !== undefined) {
                    // There is one flaw in this logic, but I'm not sure what can be done about
                    // it.  You can set the inc/dec amount via the K event in feet or meters.
                    // If your user preference unit is one, but the simvar call uses the other,
                    // we have now way of knowing  about it so will force a conversion that's not
                    // needed.This is a fairly minor flaw, but worth acknowledging until a
                    // workaround can be found.
                    const increment = unit.convertTo(evt.value, UnitType.FOOT) * (direction == 'down' ? -1 : 1);
                    SimVar.SetSimVarValue(simvar, 'number', curVal + increment);
                }
            }
        });
    }
    /** Initialize the instrument. */
    init() {
        this.simVarPublisher.startPublish();
    }
    /** Update our simvar publisher. */
    onUpdate() {
        this.simVarPublisher.onUpdate();
    }
}
