import { EventBus } from '../data/EventBus';
/** Events that need an index number. */
export declare type APIndexedData = {
    /** Any autopilot data. */
    data: any;
    /** The index number of the relevant device. */
    index: number;
};
/** A snapshot of the autopilot state */
export declare type APState = {
    /** Current selected heading. */
    heading: Array<APIndexedData>;
    /** Current selected altitude */
    alt: Array<APIndexedData>;
    /** Autopilot master engaged state. */
    engage: boolean;
    /** Current AP lock, if any. */
    lockType: APLockType | null;
};
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
export interface APEvents {
    /** the selceted heading */
    heading_select: number;
    /** the selected altitude */
    alt_select: number;
    /** AP has been engaged. */
    ap_master_engage: boolean;
    /** AP has been disengaged. */
    ap_master_disengage: boolean;
    /** what lock is set if any */
    ap_lock_set: APLockType;
    /** a lock ahs been relaesed */
    ap_lock_release: APLockType;
    /** full state snaprhot */
    ap_state_update: APState;
    /** the selected vs */
    vs_hold_fpm: number;
    /** the selected ias */
    flc_hold_knots: number;
    /** the flight director commanded bank in degrees */
    flight_director_bank: number;
    /** the flight director commanded pitch in degrees */
    flight_director_pitch: number;
    /** The flight director state */
    flight_director_state: boolean;
    /** Alt lock. */
    alt_lock: boolean;
    /** Pitch Ref Value */
    pitch_ref: number;
    /** Set to True if WT KAP140 AP is Installed */
    kap_140_installed: boolean;
}
/**
 * Manages an autopilot system
 */
export declare class AutopilotInstrument {
    private bus;
    private publisher;
    private simVarPublisher;
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
//# sourceMappingURL=APPublisher.d.ts.map