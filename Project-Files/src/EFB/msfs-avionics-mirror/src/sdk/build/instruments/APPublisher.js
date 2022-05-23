/// <reference types="msfstypes/JS/simvar" />
import { EventSubscriber } from '../data/EventSubscriber';
import { SimVarValueType } from '../data/SimVars';
import { BasePublisher, SimVarPublisher } from './BasePublishers';
export var APLockType;
(function (APLockType) {
    APLockType[APLockType["Heading"] = 0] = "Heading";
    APLockType[APLockType["Nav"] = 1] = "Nav";
    APLockType[APLockType["Alt"] = 2] = "Alt";
    APLockType[APLockType["Bank"] = 3] = "Bank";
    APLockType[APLockType["WingLevel"] = 4] = "WingLevel";
    APLockType[APLockType["Vs"] = 5] = "Vs";
    APLockType[APLockType["Flc"] = 6] = "Flc";
    APLockType[APLockType["Pitch"] = 7] = "Pitch";
    APLockType[APLockType["Approach"] = 8] = "Approach";
    APLockType[APLockType["Backcourse"] = 9] = "Backcourse";
    APLockType[APLockType["Glideslope"] = 10] = "Glideslope";
    APLockType[APLockType["VNav"] = 11] = "VNav";
})(APLockType || (APLockType = {}));
/** base publisher for simvars */
class APSimVarPublisher extends SimVarPublisher {
    /**
     * Create an APSimVarPublisher
     * @param bus The EventBus to publish to
     * @param pacer An optional pacer to use to control the pace of publishing
     */
    constructor(bus, pacer = undefined) {
        super(APSimVarPublisher.simvars, bus, pacer);
    }
}
APSimVarPublisher.simvars = new Map([
    // TODO extend the next two to handle multiple APs?
    ['ap_heading_selected', { name: 'AUTOPILOT HEADING LOCK DIR:1', type: SimVarValueType.Degree }],
    ['ap_altitude_selected', { name: 'AUTOPILOT ALTITUDE LOCK VAR:1', type: SimVarValueType.Feet }],
    ['ap_master_status', { name: 'AUTOPILOT MASTER', type: SimVarValueType.Bool }],
    ['ap_yd_status', { name: 'AUTOPILOT YAW DAMPER', type: SimVarValueType.Bool }],
    ['ap_heading_hold', { name: 'AUTOPILOT HEADING LOCK', type: SimVarValueType.Bool }],
    ['ap_nav_hold', { name: 'AUTOPILOT NAV1 LOCK', type: SimVarValueType.Bool }],
    ['ap_bank_hold', { name: 'AUTOPILOT BANK HOLD', type: SimVarValueType.Bool }],
    ['ap_wing_lvl_hold', { name: 'AUTOPILOT WING LEVELER', type: SimVarValueType.Bool }],
    ['ap_approach_hold', { name: 'AUTOPILOT APPROACH HOLD', type: SimVarValueType.Bool }],
    ['ap_backcourse_hold', { name: 'AUTOPILOT BACKCOURSE HOLD', type: SimVarValueType.Bool }],
    ['ap_vs_hold', { name: 'AUTOPILOT VERTICAL HOLD', type: SimVarValueType.Bool }],
    ['ap_flc_hold', { name: 'AUTOPILOT FLIGHT LEVEL CHANGE', type: SimVarValueType.Bool }],
    ['ap_alt_hold', { name: 'AUTOPILOT ALTITUDE LOCK', type: SimVarValueType.Bool }],
    ['ap_glideslope_hold', { name: 'AUTOPILOT GLIDESLOPE HOLD', type: SimVarValueType.Bool }],
    ['ap_pitch_hold', { name: 'AUTOPILOT PITCH HOLD', type: SimVarValueType.Bool }],
    ['ap_vs_selected', { name: 'AUTOPILOT VERTICAL HOLD VAR:1', type: SimVarValueType.FPM }],
    ['ap_ias_selected', { name: 'AUTOPILOT AIRSPEED HOLD VAR', type: SimVarValueType.Knots }],
    ['ap_mach_selected', { name: 'AUTOPILOT MACH HOLD VAR', type: SimVarValueType.Number }],
    ['ap_selected_speed_is_mach', { name: 'AUTOPILOT MANAGED SPEED IN MACH', type: SimVarValueType.Bool }],
    ['flight_director_bank', { name: 'AUTOPILOT FLIGHT DIRECTOR BANK', type: SimVarValueType.Degree }],
    ['flight_director_pitch', { name: 'AUTOPILOT FLIGHT DIRECTOR PITCH', type: SimVarValueType.Degree }],
    ['flight_director_is_active', { name: 'AUTOPILOT FLIGHT DIRECTOR ACTIVE', type: SimVarValueType.Bool }],
    ['vnav_active', { name: 'L:XMLVAR_VNAVButtonValue', type: SimVarValueType.Bool }],
    ['ap_pitch_selected', { name: 'AUTOPILOT PITCH HOLD REF', type: SimVarValueType.Degree }],
    ['kap_140_installed', { name: 'L:WT1000_AP_KAP140_INSTALLED', type: SimVarValueType.Bool }]
]);
/**
 * Publishes autopilot data
 */
class AutopilotPublisher extends BasePublisher {
    /**
     * Creates an AutopilotPublisher
     * @param bus The event bus to publish to.
     * @param pacer An optional pacer to use to control the rate of publishing.
     */
    constructor(bus, pacer) {
        super(bus, pacer);
    }
    /**
     * Publish an AP master engage event
     */
    publishMasterEngage() {
        this.publish('ap_master_engage', true);
    }
    /**
     * Publish an AP master disengage event
     */
    publishMasterDisengage() {
        this.publish('ap_master_disengage', true);
    }
    /**
     * Publish a YD engage event
     */
    publishYdEngage() {
        this.publish('ap_yd_engage', true);
    }
    /**
     * Publish a YD disengage event
     */
    publishYdDisengage() {
        this.publish('ap_yd_disengage', true);
    }
    /**
     * Publish a lock set event
     * @param lock The lock/hold set
     */
    publishLockSet(lock) {
        this.publish('ap_lock_set', lock);
    }
    /**
     * Publish a lock release event
     * @param lock The lock/hold released
     */
    publishLockRelease(lock) {
        this.publish('ap_lock_release', lock);
    }
}
/**
 * Manages an autopilot system
 */
export class AutopilotInstrument {
    /**
     * Create an AutopilotInstrument
     * @param bus The event bus to publish to
     */
    constructor(bus) {
        this.bus = bus;
        // this.hEvents = this.bus.getSubscriber<HEvent>();
        this.publisher = new AutopilotPublisher(bus);
        this.simVarPublisher = new APSimVarPublisher(bus);
        this.simVarSubscriber = new EventSubscriber(bus);
    }
    /**
     * Initialize the instrument
     */
    init() {
        this.publisher.startPublish();
        this.simVarPublisher.startPublish();
        // console.log('initting autopilot');
        this.simVarSubscriber.on('ap_master_status').whenChangedBy(1).handle((engaged) => {
            if (engaged) {
                this.publisher.publishMasterEngage();
            }
            else {
                this.publisher.publishMasterDisengage();
            }
        });
        this.simVarSubscriber.on('ap_yd_status').whenChangedBy(1).handle((engaged) => {
            if (engaged) {
                this.publisher.publishYdEngage();
            }
            else {
                this.publisher.publishYdDisengage();
            }
        });
        this.simVarSubscriber.on('ap_alt_hold').whenChangedBy(1).handle((engaged) => {
            if (engaged) {
                this.publisher.publishLockSet(APLockType.Alt);
            }
            else {
                this.publisher.publishLockRelease(APLockType.Alt);
            }
        });
        this.simVarSubscriber.on('ap_pitch_hold').whenChangedBy(1).handle((engaged) => {
            if (engaged) {
                this.publisher.publishLockSet(APLockType.Pitch);
            }
            else {
                this.publisher.publishLockRelease(APLockType.Pitch);
            }
        });
        this.simVarSubscriber.on('ap_heading_hold').whenChangedBy(1).handle((engaged) => {
            if (engaged) {
                this.publisher.publishLockSet(APLockType.Heading);
            }
            else {
                this.publisher.publishLockRelease(APLockType.Heading);
            }
        });
        this.simVarSubscriber.on('ap_nav_hold').whenChangedBy(1).handle((engaged) => {
            if (engaged) {
                this.publisher.publishLockSet(APLockType.Nav);
            }
            else {
                this.publisher.publishLockRelease(APLockType.Nav);
            }
        });
        this.simVarSubscriber.on('ap_approach_hold').whenChangedBy(1).handle((engaged) => {
            if (engaged) {
                this.publisher.publishLockSet(APLockType.Approach);
            }
            else {
                this.publisher.publishLockRelease(APLockType.Approach);
            }
        });
        this.simVarSubscriber.on('ap_backcourse_hold').whenChangedBy(1).handle((engaged) => {
            if (engaged) {
                this.publisher.publishLockSet(APLockType.Backcourse);
            }
            else {
                this.publisher.publishLockRelease(APLockType.Backcourse);
            }
        });
        this.simVarSubscriber.on('ap_bank_hold').whenChangedBy(1).handle((engaged) => {
            if (engaged) {
                this.publisher.publishLockSet(APLockType.Bank);
            }
            else {
                this.publisher.publishLockRelease(APLockType.Bank);
            }
        });
        this.simVarSubscriber.on('ap_wing_lvl_hold').whenChangedBy(1).handle((engaged) => {
            if (engaged) {
                this.publisher.publishLockSet(APLockType.WingLevel);
            }
            else {
                this.publisher.publishLockRelease(APLockType.WingLevel);
            }
        });
        this.simVarSubscriber.on('ap_flc_hold').whenChangedBy(1).handle((engaged) => {
            if (engaged) {
                this.publisher.publishLockSet(APLockType.Flc);
            }
            else {
                this.publisher.publishLockRelease(APLockType.Flc);
            }
        });
        this.simVarSubscriber.on('ap_vs_hold').whenChangedBy(1).handle((engaged) => {
            if (engaged) {
                this.publisher.publishLockSet(APLockType.Vs);
            }
            else {
                this.publisher.publishLockRelease(APLockType.Vs);
            }
        });
        this.simVarSubscriber.on('ap_glideslope_hold').whenChangedBy(1).handle((engaged) => {
            if (engaged) {
                this.publisher.publishLockSet(APLockType.Glideslope);
            }
            else {
                this.publisher.publishLockRelease(APLockType.Glideslope);
            }
        });
        this.simVarSubscriber.on('vnav_active').whenChangedBy(1).handle((engaged) => {
            if (engaged) {
                this.publisher.publishLockSet(APLockType.VNav);
            }
            else {
                this.publisher.publishLockRelease(APLockType.VNav);
            }
        });
    }
    /** update our publishers */
    onUpdate() {
        this.simVarPublisher.onUpdate();
    }
}
