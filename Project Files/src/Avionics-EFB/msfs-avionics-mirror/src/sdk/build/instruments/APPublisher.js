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
    ['selected_heading', { name: 'AUTOPILOT HEADING LOCK DIR:1', type: SimVarValueType.Degree }],
    ['selected_altitude', { name: 'AUTOPILOT ALTITUDE LOCK VAR:1', type: SimVarValueType.Feet }],
    ['ap_master_status', { name: 'AUTOPILOT MASTER', type: SimVarValueType.Bool }],
    ['ap_heading_lock', { name: 'AUTOPILOT HEADING LOCK', type: SimVarValueType.Bool }],
    ['ap_nav_lock', { name: 'AUTOPILOT NAV1 LOCK', type: SimVarValueType.Bool }],
    ['ap_bank_hold', { name: 'AUTOPILOT BANK HOLD', type: SimVarValueType.Bool }],
    ['ap_wing_lvl', { name: 'AUTOPILOT WING LEVELER', type: SimVarValueType.Bool }],
    ['ap_approach_hold', { name: 'AUTOPILOT APPROACH HOLD', type: SimVarValueType.Bool }],
    ['ap_backcourse_hold', { name: 'AUTOPILOT BACKCOURSE HOLD', type: SimVarValueType.Bool }],
    ['ap_vs_hold', { name: 'AUTOPILOT VERTICAL HOLD', type: SimVarValueType.Bool }],
    ['ap_flc_hold', { name: 'AUTOPILOT FLIGHT LEVEL CHANGE', type: SimVarValueType.Bool }],
    ['ap_alt_lock', { name: 'AUTOPILOT ALTITUDE LOCK', type: SimVarValueType.Bool }],
    ['ap_glideslope_hold', { name: 'AUTOPILOT GLIDESLOPE HOLD', type: SimVarValueType.Bool }],
    ['ap_pitch_hold', { name: 'AUTOPILOT PITCH HOLD', type: SimVarValueType.Bool }],
    ['vs_hold_fpm', { name: 'AUTOPILOT VERTICAL HOLD VAR:1', type: SimVarValueType.FPM }],
    ['flc_hold_knots', { name: 'AUTOPILOT AIRSPEED HOLD VAR', type: SimVarValueType.Knots }],
    ['flight_director_bank', { name: 'AUTOPILOT FLIGHT DIRECTOR BANK', type: SimVarValueType.Degree }],
    ['flight_director_pitch', { name: 'AUTOPILOT FLIGHT DIRECTOR PITCH', type: SimVarValueType.Degree }],
    ['flight_director_lock', { name: 'AUTOPILOT FLIGHT DIRECTOR ACTIVE', type: SimVarValueType.Bool }],
    ['vnav_active', { name: 'L:XMLVAR_VNAVButtonValue', type: SimVarValueType.Bool }],
    ['alt_lock', { name: 'AUTOPILOT ALTITUDE LOCK', type: SimVarValueType.Bool }],
    ['pitch_ref', { name: 'AUTOPILOT PITCH HOLD REF', type: SimVarValueType.Degree }],
    ['kap_140_simvar', { name: 'L:WT1000_AP_KAP140_INSTALLED', type: SimVarValueType.Bool }]
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
     * Publish a selected alt change
     * @param newAlt The new selected altitude.
     */
    publishAltChange(newAlt) {
        this.publish('alt_select', newAlt);
    }
    /**
     * Publish a selected hdg change
     * @param newHdg The new selected heading.
     */
    publishHdgChange(newHdg) {
        this.publish('heading_select', newHdg);
    }
    /**
     * Publish a selected vs change
     * @param newVs The new selected vs.
     */
    publishVsChange(newVs) {
        this.publish('vs_hold_fpm', newVs);
    }
    /**
     * Publish a selected flc ias change
     * @param newIas The new selected ias.
     */
    publishFlcIasChange(newIas) {
        this.publish('flc_hold_knots', newIas);
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
    /**
     * Publish a pitch ref value.
     * @param newPitch The new commanded pitch angle.
     */
    publishPitchRefChange(newPitch) {
        this.publish('pitch_ref', newPitch);
    }
    /**
     * Publish a flight director pitch value.
     * @param newPitch The new commanded pitch angle.
     */
    publishFlightDirectorPitchChange(newPitch) {
        this.publish('flight_director_pitch', newPitch);
    }
    /**
     * Publish a flight director bank value
     * @param newBank The new commanded bank angle.
     */
    publishFlightDirectorBankChange(newBank) {
        this.publish('flight_director_bank', newBank);
    }
    /**
     * Publish an FD lock event
     * @param state is the flight director state (true = on, false = off).
     */
    publishFlightDirectorState(state) {
        this.publish('flight_director_state', state);
    }
    /**
     * Publish alt lock
     * @param locked is if it is locked.
     */
    publishAltLock(locked) {
        this.publish('alt_lock', locked);
    }
    /**
     * Publish KAP140 Installed State
     * @param state is the state of the simvar.
     */
    publishKAP140State(state) {
        this.publish('kap_140_installed', state);
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
        this.simVarPublisher.subscribe('ap_master_status');
        this.simVarPublisher.subscribe('selected_altitude');
        this.simVarPublisher.subscribe('selected_heading');
        this.simVarPublisher.subscribe('ap_alt_lock');
        this.simVarPublisher.subscribe('ap_bank_hold');
        this.simVarPublisher.subscribe('ap_wing_lvl');
        this.simVarPublisher.subscribe('ap_flc_hold');
        this.simVarPublisher.subscribe('ap_heading_lock');
        this.simVarPublisher.subscribe('ap_nav_lock');
        this.simVarPublisher.subscribe('ap_approach_hold');
        this.simVarPublisher.subscribe('ap_backcourse_hold');
        this.simVarPublisher.subscribe('ap_pitch_hold');
        this.simVarPublisher.subscribe('ap_glideslope_hold');
        this.simVarPublisher.subscribe('ap_vs_hold');
        this.simVarPublisher.subscribe('vs_hold_fpm');
        this.simVarPublisher.subscribe('flc_hold_knots');
        this.simVarPublisher.subscribe('flight_director_bank');
        this.simVarPublisher.subscribe('flight_director_pitch');
        this.simVarPublisher.subscribe('flight_director_lock');
        this.simVarPublisher.subscribe('vnav_active');
        this.simVarPublisher.subscribe('alt_lock');
        this.simVarPublisher.subscribe('pitch_ref');
        this.simVarPublisher.subscribe('kap_140_simvar');
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
        this.simVarSubscriber.on('selected_altitude').whenChangedBy(1).handle((newAlt) => {
            this.publisher.publishAltChange(newAlt);
        });
        this.simVarSubscriber.on('selected_heading').whenChangedBy(1).handle((newHdg) => {
            this.publisher.publishHdgChange(newHdg);
        });
        this.simVarSubscriber.on('vs_hold_fpm').whenChangedBy(1).handle((newVs) => {
            this.publisher.publishVsChange(newVs);
        });
        this.simVarSubscriber.on('flc_hold_knots').whenChangedBy(1).handle((newIas) => {
            this.publisher.publishFlcIasChange(newIas);
        });
        this.simVarSubscriber.on('ap_alt_lock').whenChangedBy(1).handle((engaged) => {
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
        this.simVarSubscriber.on('ap_heading_lock').whenChangedBy(1).handle((engaged) => {
            if (engaged) {
                this.publisher.publishLockSet(APLockType.Heading);
            }
            else {
                this.publisher.publishLockRelease(APLockType.Heading);
            }
        });
        this.simVarSubscriber.on('ap_nav_lock').whenChangedBy(1).handle((engaged) => {
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
        this.simVarSubscriber.on('ap_wing_lvl').whenChangedBy(1).handle((engaged) => {
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
        this.simVarSubscriber.on('flight_director_bank').whenChangedBy(.25).handle((newBank) => {
            this.publisher.publishFlightDirectorBankChange(newBank);
        });
        this.simVarSubscriber.on('flight_director_pitch').whenChangedBy(.25).handle((newPitch) => {
            this.publisher.publishFlightDirectorPitchChange(newPitch);
        });
        this.simVarSubscriber.on('flight_director_lock').whenChanged().handle((state) => {
            this.publisher.publishFlightDirectorState(state);
        });
        this.simVarSubscriber.on('vnav_active').whenChangedBy(1).handle((engaged) => {
            if (engaged) {
                this.publisher.publishLockSet(APLockType.VNav);
            }
            else {
                this.publisher.publishLockRelease(APLockType.VNav);
            }
        });
        this.simVarSubscriber.on('alt_lock').whenChanged().handle((lock) => {
            this.publisher.publishAltLock(lock);
        });
        this.simVarSubscriber.on('pitch_ref').whenChangedBy(0.1).handle((val) => {
            this.publisher.publishPitchRefChange(val);
        });
        this.simVarSubscriber.on('kap_140_simvar').whenChanged().handle((val) => {
            this.publisher.publishKAP140State(val);
        });
    }
    /** update our publishers */
    onUpdate() {
        this.simVarPublisher.onUpdate();
    }
}
