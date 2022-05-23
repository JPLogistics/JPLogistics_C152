import { BasePublisher } from '../instruments/BasePublishers';
import { XPDRMode } from '../instruments/XPDR';
import { NavSourceId } from '../instruments/NavProcessor';
import { EventBus, IndexedEventType } from './EventBus';
import { ComSpacingChangeEvent } from '../instruments';
import { FacilityFrequency } from '../navigation';
import { PublishPacer } from './EventBusPacer';
/** Type for setting an indexed instrument source */
export declare type IndexedNavSourceSetting = {
    /** The index of the specific device to increment  */
    index: number;
    /** The source to set this device to */
    source: NavSourceId;
};
/** Control events, for where HEvents don't exist */
export interface ControlEvents {
    /** increment the CDI source */
    cdi_src_switch: boolean;
    /** explicitly set a CDI source */
    cdi_src_set: NavSourceId;
    /** toggle CDI source between GPS and NAV */
    cdi_src_gps_toggle: boolean;
    /** Set the source of a given bearing needle */
    brg_src_set: IndexedNavSourceSetting;
    /**Increment the source of a given bearing needle number */
    brg_src_switch: number;
    /**Publish radio state */
    publish_radio_states: boolean;
    /** Set new xpdr code */
    [publish_xpdr_code: IndexedEventType<'publish_xpdr_code'>]: number;
    /** Set new xpdr mode */
    [publish_xpdr_mode: IndexedEventType<'publish_xpdr_mode'>]: XPDRMode;
    /** Tell XPDR to send ident to ATC */
    [xpdr_send_ident: IndexedEventType<'xpdr_send_ident'>]: boolean;
    /** Init the CDI Source */
    init_cdi: boolean;
    /** toggle DME window */
    dme_toggle: boolean;
    /** Set the current standby com frequency as a string. */
    standby_com_freq: string;
    /** Set the COM spacing for a radio. */
    com_spacing_set: ComSpacingChangeEvent;
    /** Set the current standby nav frequency as a string. */
    standby_nav_freq: string;
    /** Event when user presses 'B' to auto set pressure. */
    baro_set: boolean;
    /** Event when a user suspends LNAV leg sequencing. */
    suspend_sequencing: boolean;
    /** Whether LNAV should automatically inhibit the next attempt to sequence to the next flight plan leg. */
    lnav_inhibit_next_sequence: boolean;
    /** Event for setting missed approach state. */
    activate_missed_approach: boolean;
    /** Approach Frequency Set by FMS. */
    approach_freq_set: FacilityFrequency | undefined;
    /** Whether or not an approach is available for guidance. */
    approach_available: boolean;
    /** Set a new decision height. */
    set_decision_height: number;
    /** Set a new decision altitude. */
    set_decision_altitude: number;
    /** Set the decision height unit. */
    set_dh_distance_unit: 'feet' | 'meters';
    /** Set the decision altitude unit. */
    set_da_distance_unit: 'feet' | 'meters';
}
/**
 * A publisher for control interactions.
 * This is meant to handle the events for which there aren't existing HEvents
 * in the sim to allow us to maintain a decoupled, event-driven architecture.
 */
export declare class ControlPublisher extends BasePublisher<ControlEvents> {
    /**
     * Create a ControlPublisher.
     * @param bus The EventBus to publish to.
     * @param pacer An optional pacer to use to control the rate of publishing.
     */
    constructor(bus: EventBus, pacer?: PublishPacer<ControlEvents> | undefined);
    /**
     * Publish a control event.
     * @param event The event from ControlEvents.
     * @param value The value of the event.
     */
    publishEvent<K extends keyof ControlEvents>(event: K, value: ControlEvents[K]): void;
    /** debug logger */
    startPublish(): void;
}
//# sourceMappingURL=ControlPublisher.d.ts.map