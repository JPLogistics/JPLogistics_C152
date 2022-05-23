/// <reference types="msfstypes/js/types" />
import { EventBus } from '../data';
import { Instrument } from './Backplane';
import { CdiDeviation, Glideslope, Localizer, ObsSetting } from './NavProcessor';
/**
 * Events related to the active navigation radio.
 */
export interface NavRadioEvents {
    /** The location of the tuned glideslope on the active nav radio. */
    nav_radio_active_gs_location: LatLongAlt;
    /** The location of the tuned station on the active nav radio. */
    nav_radio_active_nav_location: LatLongAlt;
    /** Localizer data for the active nav radio. */
    nav_radio_active_localizer: Localizer;
    /** Glideslope data for the active nav radio. */
    nav_radio_active_glideslope: Glideslope;
    /** The obs setting of the current nav radio. */
    nav_radio_active_obs_setting: ObsSetting;
    /** The CDI deviation of the current nav radio. */
    nav_radio_active_cdi_deviation: CdiDeviation;
    /** The magnetic variation, in degrees, of the tuned station on the active nav radio. */
    nav_radio_active_magvar: number;
    /** The Nav1 Localizer. */
    nav_radio_localizer_1: Localizer;
    /** The Nav2 Localizer. */
    nav_radio_localizer_2: Localizer;
    /** The Nav1 CdiDeviation. */
    nav_radio_cdi_1: CdiDeviation;
    /** The Nav2 CdiDeviation. */
    nav_radio_cdi_2: CdiDeviation;
}
/**
 * An instrument that gathers localizer and glideslope information for use by
 * the AP systems.
 */
export declare class APRadioNavInstrument implements Instrument {
    private readonly bus;
    private readonly navRadioData;
    private readonly navProc;
    private readonly publisher;
    private currentCdiIndex;
    /**
     * Creates an instance of the APRadioNavInstrument.
     * @param bus The event bus to use with this instance.
     */
    constructor(bus: EventBus);
    /** @inheritdoc */
    init(): void;
    /** @inheritdoc */
    onUpdate(): void;
    /**
     * Sets a value in a nav radio glideslope.
     * @param index The index of the nav radio.
     * @param field The field to set.
     * @param value The value to set the field to.
     */
    private setGlideslopeValue;
    /**
     * Sends the current glideslope's LLA position.
     * @param index The index of the nav radio.
     * @param lla The LLA to send.
     */
    private setGlideslopePosition;
    /**
     * Sends the current nav's LLA position.
     * @param index The index of the nav radio.
     * @param lla The LLA to send.
     */
    private setNavPosition;
    /**
     * Sets a value in a nav radio localizer.
     * @param index The index of the nav radio.
     * @param field The field to set.
     * @param value The value to set the field to.
     */
    private setLocalizerValue;
    /**
     * Sets a value in a nav radio localizer.
     * @param index The index of the nav radio.
     * @param field The field to set.
     * @param value The value to set the field to.
     */
    private setCDIValue;
    /**
     * Sets a value in a nav radio localizer.
     * @param index The index of the nav radio.
     * @param field The field to set.
     * @param value The value to set the field to.
     */
    private setOBSValue;
    /**
     * Sets the magnetic variation of a nav radio signal source.
     * @param index The index of the nav radio.
     * @param magVar The magvar to set.
     */
    private setMagVar;
    /**
     * Creates an empty localizer data.
     * @param id The nav source ID.
     * @returns New empty localizer data.
     */
    private createEmptyLocalizer;
    /**
     * Creates an empty glideslope data.
     * @param id The nav source ID.
     * @returns New empty glideslope data.
     */
    private createEmptyGlideslope;
    /**
     * Creates an empty CDI data.
     * @param id The nav source ID.
     * @returns New empty CDI data.
     */
    private createEmptyCdi;
    /**
     * Creates an empty OBS data.
     * @param id The nav source ID.
     * @returns New empty OBS data.
     */
    private createEmptyObs;
}
//# sourceMappingURL=APRadioNavInstrument.d.ts.map