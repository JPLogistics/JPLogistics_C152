import { EventBus, IndexedEventType } from '../data/EventBus';
import { PublishPacer } from '../data/EventBusPacer';
import { SimVarPublisher } from './BasePublishers';
/** SimVar definitions for a NavComSimVarPublisher */
export interface NavComSimVars {
    /** NAV active freq */
    [nav_active_frequency: IndexedEventType<'nav_active_frequency'>]: number;
    /** NAV standby freq */
    [nav_standby_frequency: IndexedEventType<'nav_standby_frequency'>]: number;
    /** NAV ident */
    [nav_ident: IndexedEventType<'nav_ident'>]: string;
    /** NAV signal */
    [nav_signal: IndexedEventType<'nav_signal'>]: number;
    /** COM active freq */
    [com_active_frequency: IndexedEventType<'com_active_frequency'>]: number;
    /** COM standby freq */
    [com_standby_frequency: IndexedEventType<'com_standby_frequency'>]: number;
    /** ADF Standby Frequency */
    [adf_standby_frequency: IndexedEventType<'adf_standby_frequency'>]: number;
    /** ADF Active Frequency */
    [adf_active_frequency: IndexedEventType<'adf_active_frequency'>]: number;
}
/** A publisher to poll and publish nav/com simvars. */
export declare class NavComSimVarPublisher extends SimVarPublisher<NavComSimVars> {
    private static simvars;
    /**
     * Create a NavComSimVarPublisher
     * @param bus The EventBus to publish to
     * @param pacer An optional pacer to use to control the pace of publishing
     */
    constructor(bus: EventBus, pacer?: PublishPacer<NavComSimVars> | undefined);
}
/**
 * A convenience class for creating a radio configuration set.
 *
 * Implementers should instantiate this and then populate the various maps
 * with the H events that their radio sends and which displays they affect.
 */
export declare class NavComConfig {
    navSwitchEvents: Map<string, string>;
    navSelectorEvents: Map<string, string>;
    navWholeIncEvents: Map<string, string>;
    navWholeDecEvents: Map<string, string>;
    navFractionIncEvents: Map<string, string>;
    navFractionDecEvents: Map<string, string>;
    comSwitchEvents: Map<string, string>;
    comSelectorEvents: Map<string, string>;
    comWholeIncEvents: Map<string, string>;
    comWholeDecEvents: Map<string, string>;
    comFractionIncEvents: Map<string, string>;
    comFractionDecEvents: Map<string, string>;
}
/**
 * The core instrument that will drive all of a system's radios.
 */
export declare class NavComInstrument {
    private bus;
    private hevents;
    private publisher;
    private simVarPublisher;
    private simVarSubscriber;
    private controlSubscriber;
    private navRadios;
    private comRadios;
    private config?;
    /**
     * Create a NavComController.
     * @param bus The event bus to publish to.
     * @param config A NavComConfig object defining the radio configuration.
     * @param numNavRadios The number of nav radios in the system.
     * @param numComRadios The number of com radios in the system.
     * @param sync Whether to sync events or not, default true.
     */
    constructor(bus: EventBus, config: NavComConfig | undefined, numNavRadios: number, numComRadios: number, sync?: boolean);
    /**
     * Initialize the instrument.
     */
    init(): void;
    /**
     * Perform events for the update loop.
     */
    onUpdate(): void;
    /**
     * Get the current frequency of a radio.
     * @param radioType The RadioType to query.
     * @param index The index number of the desired radio.
     * @param bank The FrequencyBank to query.
     * @returns The frequency in MHz.
     */
    private getFrequency;
    /**
     * React to a change on a radio frequency simvar.
     * @param type The RadioType to update.
     * @param index Index of the radio in the internal array.
     * @param bank The FrequencyBank in the selected radio to update.
     * @param freq The new frequency in MHz.
     */
    private updateRadioFreqCb;
    /**
     * Handle an hEvent.
     * @param hEvent The event that needs to be handled.
     */
    private eventHandler;
    /**
     * Get the current selected radio in a collection of radios.
     * @param radios An array of Radios.
     * @returns The selected Radio in the array.
     */
    private getSelectedRadio;
    /**
     * Swap frequencies in a radio.
     * @param radio The radio whose frequencies we want to swap.
     */
    private swapFreqs;
    /**
     * Update the frequencies in a radio from simvars.
     *
     * This is useful for snapshot updates as long as we're not worried
     * about one of the frequencies being updated while the snapshot is in
     * flight.
     * @param radio the radio to update
     */
    private updateAndPublish;
    /**
     * Explicitly set a new selected nav radio.
     * @param navSourceId An array of Radios to toggle.
     */
    private setActiveRadio;
    /**
     * Set the standby frequency of the currently selected nav or com radio.
     * @param radioType The radio type we want to set standby for.
     * @param frequency The frequency in MHz as a string.
     */
    private setStandbyFreq;
    /**
     * Toggle which of the radios is selected.
     * @param radios An array of Radios to toggle.
     */
    private swapSelection;
    /**
     * Increase the integer portion of a frequency.
     * @param radio The Radio to update.
     */
    private wholeInc;
    /**
     * Decrease the integer portion of a frequency.
     * @param radio The Radio to update.
     */
    private wholeDec;
    /**
     * Increase the decimal portion of a frequency.
     * @param radio The Radio to update.
     */
    private fractInc;
    /**
     * Decrease the decimal portion of a frequency.
     * @param radio The Radio to update.
     */
    private fractDec;
    /**
     * Set the full frequency of a radio.
     * @param radio The Radio to update.
     * @param bank The FrequencyBank to update.
     * @param freq The new frequency in MHz as a string.
     */
    private freqSet;
    /**
     * Set the K var for a frequency event
     * @param action A string defining whole/fract and inc/dec.
     * @param radio The radio this frequency is for.
     */
    private setKVar;
    /**
     * Send an update of all our radio states.
     * @param data True if we really want to do this.  (We need to support non-paramaterized commands.())
     */
    private publishRadioStates;
    /**
     * Sets the COM frequency spacing.
     * @param evt The event that is setting the spacing.
     */
    private setComSpacing;
}
//# sourceMappingURL=NavCom.d.ts.map