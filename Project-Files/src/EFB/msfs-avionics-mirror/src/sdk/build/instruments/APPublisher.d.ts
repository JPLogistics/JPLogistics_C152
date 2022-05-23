import { EventBus } from '../data/EventBus';
import { PublishPacer } from '../data/EventBusPacer';
import { BasePublisher, SimVarPublisher } from './BasePublishers';
/** Data related to autopilot */
interface APSimVarEvents {
    /** Whether the autopilot master is active. */
    ap_master_status: boolean;
    /** Whether the yaw damper is active. */
    ap_yd_status: boolean;
    /** Whether the autopilot is in heading hold mode. */
    ap_heading_hold: boolean;
    /** Whether the autopilot is in NAV mode. */
    ap_nav_hold: boolean;
    /** Whether the autopilot is in approach mode. */
    ap_approach_hold: boolean;
    /** Whether the autopilot is in backcourse mode. */
    ap_backcourse_hold: boolean;
    /** Whether the autopilot is in bank hold mode. */
    ap_bank_hold: boolean;
    /** Whether the autopilot is in wings level mode. */
    ap_wing_lvl_hold: boolean;
    /** Whether the autopilot is in vertical speed hold mode. */
    ap_vs_hold: boolean;
    /** Whether the autopilot is in flight level change mode. */
    ap_flc_hold: boolean;
    /** Whether the autopilot is in altitude hold mode. */
    ap_alt_hold: boolean;
    /** Whether the autopilot is in glideslope hold mode. */
    ap_glideslope_hold: boolean;
    /** Whether the autopilot is in pitch hold mode. */
    ap_pitch_hold: boolean;
    /** The autopilot's selected pitch target, in degrees. */
    ap_pitch_selected: number;
    /** The autopilot's selected heading, in degrees. */
    ap_heading_selected: number;
    /** The autopilot's selected altitude, in feet. */
    ap_altitude_selected: number;
    /** The autopilot's selected vertical speed target, in feet per minute. */
    ap_vs_selected: number;
    /** The autopilot's selected airspeed target, in knots. */
    ap_ias_selected: number;
    /** The autopilot's selected mach target. */
    ap_mach_selected: number;
    /** Whether the autopilot's selected airspeed target is in mach. */
    ap_selected_speed_is_mach: boolean;
    /** The bank commanded by the flight director, in degrees. */
    flight_director_bank: number;
    /** The pitch commanded by the flight director, in degrees. */
    flight_director_pitch: number;
    /** Whether the flight director is active. */
    flight_director_is_active: boolean;
    /** Whether VNAV is active. */
    vnav_active: boolean;
    /** Whether the WT KAP140 autopilot is installed. */
    kap_140_installed: boolean;
}
export declare enum APLockType {
    Heading = 0,
    Nav = 1,
    Alt = 2,
    Bank = 3,
    WingLevel = 4,
    Vs = 5,
    Flc = 6,
    Pitch = 7,
    Approach = 8,
    Backcourse = 9,
    Glideslope = 10,
    VNav = 11
}
/** The events related to an autopilot */
export interface APEvents extends APSimVarEvents {
    /** Autopilot has been engaged. */
    ap_master_engage: true;
    /** Autopilot has been disengaged. */
    ap_master_disengage: true;
    /** Yaw damper has been engaged. */
    ap_yd_engage: true;
    /** Yaw damper has been disengaged. */
    ap_yd_disengage: true;
    /** An autopilot lock has been set. */
    ap_lock_set: APLockType;
    /** An autopilot lock has been released. */
    ap_lock_release: APLockType;
}
/** base publisher for simvars */
declare class APSimVarPublisher extends SimVarPublisher<APSimVarEvents> {
    private static simvars;
    /**
     * Create an APSimVarPublisher
     * @param bus The EventBus to publish to
     * @param pacer An optional pacer to use to control the pace of publishing
     */
    constructor(bus: EventBus, pacer?: PublishPacer<APSimVarEvents> | undefined);
}
/**
 * Publishes autopilot data
 */
declare class AutopilotPublisher extends BasePublisher<APEvents> {
    /**
     * Creates an AutopilotPublisher
     * @param bus The event bus to publish to.
     * @param pacer An optional pacer to use to control the rate of publishing.
     */
    constructor(bus: EventBus, pacer?: PublishPacer<APEvents>);
    /**
     * Publish an AP master engage event
     */
    publishMasterEngage(): void;
    /**
     * Publish an AP master disengage event
     */
    publishMasterDisengage(): void;
    /**
     * Publish a YD engage event
     */
    publishYdEngage(): void;
    /**
     * Publish a YD disengage event
     */
    publishYdDisengage(): void;
    /**
     * Publish a lock set event
     * @param lock The lock/hold set
     */
    publishLockSet(lock: APLockType): void;
    /**
     * Publish a lock release event
     * @param lock The lock/hold released
     */
    publishLockRelease(lock: APLockType): void;
}
/**
 * Manages an autopilot system
 */
export declare class AutopilotInstrument {
    private bus;
    publisher: AutopilotPublisher;
    simVarPublisher: APSimVarPublisher;
    private simVarSubscriber;
    /**
     * Create an AutopilotInstrument
     * @param bus The event bus to publish to
     */
    constructor(bus: EventBus);
    /**
     * Initialize the instrument
     */
    init(): void;
    /** update our publishers */
    onUpdate(): void;
}
export {};
//# sourceMappingURL=APPublisher.d.ts.map