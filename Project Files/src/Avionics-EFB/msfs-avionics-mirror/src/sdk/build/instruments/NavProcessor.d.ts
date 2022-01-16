/// <reference types="msfstypes/js/types" />
import { EventBus, PublishPacer } from '../data/EventBus';
import { SimVarPublisher } from './BasePublishers';
/** Simvars used by a NavProcessor */
export interface NavProcSimVars {
    /** the selected OBS heading for NAV1 */
    nav1_obs: number;
    /** the course deviation for NAV1 */
    nav1_cdi: number;
    /** the distance to NAV1 */
    nav1_dme: number;
    /** does the nav have dme */
    nav1_has_dme: boolean;
    /** does the nav have nav */
    nav1_has_nav: boolean;
    /** the radial for nav1 */
    nav1_radial: number;
    /** signal strength for nav1 */
    nav1_signal: number;
    /** the ident for nav1 */
    nav1_ident: string;
    /** NAV1 tofrom flag */
    nav1_to_from: VorToFrom;
    /** NAV1 localizer flag */
    nav1_localizer: boolean;
    /** NAV1 localizer course */
    nav1_localizer_crs: number;
    /** NAV1 glideslope flag */
    nav1_glideslope: boolean;
    /** NAV1 glideslope error */
    nav1_gs_error: number;
    /** NAV1 raw glideslope angle */
    nav1_raw_gs: number;
    /** NAV1 glideslope end position. */
    nav1_gs_lla: LatLongAlt;
    /** NAV1 magvar correction */
    nav1_magvar: number;
    /** the selected OBS heading for NAV2 */
    nav2_obs: number;
    /** the course deviation for NAV2 */
    nav2_cdi: number;
    /** the distance to NAV2 */
    nav2_dme: number;
    /** does the nav have dme */
    nav2_has_dme: boolean;
    /** does the nav have nav */
    nav2_has_nav: boolean;
    /** the radial for nav1 */
    nav2_radial: number;
    /** signal strength for nav1 */
    nav2_signal: number;
    /** ident of the nav2 source */
    nav2_ident: string;
    /** NAV2 tofrom flag */
    nav2_to_from: VorToFrom;
    /** NAV1 localizer flag */
    nav2_localizer: boolean;
    /** NAV1 localizer course */
    nav2_localizer_crs: number;
    /** NAV1 glideslope flag */
    nav2_glideslope: boolean;
    /** NAV1 glideslope error */
    nav2_gs_error: number;
    /** NAV1 raw glideslope angle */
    nav2_raw_gs: number;
    /** NAV1 glideslope end position. */
    nav2_gs_lla: LatLongAlt;
    /** NAV1 magvar correction */
    nav2_magvar: number;
    /** DTK to the next GPS waypoint */
    gps_dtk: number;
    /** XTK error for the next GPS waypoint */
    gps_xtk: number;
    /** next GPS waypoint */
    gps_wp: string;
    /** next GPS waypoint bearing */
    gps_wp_bearing: number;
    /** next GPS waypoint distance */
    gps_wp_distance: number;
    /** ADF signal strength */
    adf1_signal: number;
    /** ADF bearing */
    adf1_bearing: number;
    /** Marker Beacon State */
    mkr_bcn_state_simvar: MarkerBeaconState;
    /** Nav 1 Tuned LLA */
    nav1_lla: LatLongAlt;
    /** Nav 2 Tuned LLA */
    nav2_lla: LatLongAlt;
    /** GPS Obs Active */
    gps_obs_active_simvar: boolean;
    /** GPS Obs Value Setting */
    gps_obs_value_simvar: number;
}
/** Publish simvars for ourselves */
export declare class NavProcSimVarPublisher extends SimVarPublisher<NavProcSimVars> {
    private static simvars;
    /**
     * Create a NavProcSimVarPublisher
     * @param bus The EventBus to publish to
     * @param pacer An optional pacer to use to control the pace of publishing
     */
    constructor(bus: EventBus, pacer?: PublishPacer<NavProcSimVars> | undefined);
}
export declare enum NavSourceType {
    Nav = 0,
    Gps = 1,
    Adf = 2
}
export declare enum VorToFrom {
    OFF = 0,
    TO = 1,
    FROM = 2
}
/** Specified for a particular navigation source */
export declare type NavSourceId = {
    /** The type of source it is. */
    type: NavSourceType | null;
    /** The index of this in the given source type. */
    index: number;
};
/** The OBS setting for a nav source. */
export declare type ObsSetting = {
    /** the nav source */
    source: NavSourceId;
    /** the setting in degrees */
    heading: number | null;
};
/** the deviation setting for a nav source */
export declare type CdiDeviation = {
    /** the nav source */
    source: NavSourceId;
    /** the setting in degrees */
    deviation: number | null;
};
/** The to/from value for a vor radio. */
export declare type VorToFromSetting = {
    /** the to/from setting for the VOR */
    toFrom: VorToFrom;
    /** the nav source id */
    source: NavSourceId;
};
/** The dme state for a nav radio. */
export declare type DmeState = {
    /** whether the radio has DME */
    hasDme: boolean;
    /** this distance to the DME station */
    dmeDistance: number | null;
    /** the nav source id */
    source: NavSourceId;
};
/** whether a nav source has a localizer signal. */
export declare type Localizer = {
    /** whether there is a localizer signal */
    isValid: boolean;
    /** the localizer course */
    course: number;
    /** the nav source id */
    source: NavSourceId;
};
/** whether a nav source is tuned to a localizer frequency. */
export declare type LocalizerFrequency = {
    /** if the freq is a loc */
    isLocalizer: boolean;
    /** the nav source id */
    source: NavSourceId;
};
/** whether a nav source has a glideslope signal. */
export declare type Glideslope = {
    /** whether there is a gs signal */
    isValid: boolean;
    /** the gs deviation value */
    deviation: number;
    /** the angle of the gs */
    gsAngle: number;
    /** the nav source id */
    source: NavSourceId;
};
/** The magnetic variation for a tuned nav station. */
export declare type NavMagneticVariation = {
    /** the magnetic variation value */
    variation: number;
    /** the nav source id */
    source: NavSourceId;
};
/** The validity for a bearing source. */
export declare type BearingValidity = {
    /** the index number of the reference being changed */
    index: number;
    /** the new validity */
    valid: boolean;
};
/** The ident for a bearing source. */
export declare type BearingIdent = {
    /** the index number of the reference being changed */
    index: number;
    /** the new ident */
    ident: string | null;
    /** is this station a loc */
    isLoc: boolean | null;
};
/** An indexed source setting */
export declare type BearingSource = {
    /** the index number of the reference being changed */
    index: number;
    /** the new source instrument */
    source: NavSourceId | null;
};
/** An indexed source setting */
export declare type BearingDirection = {
    /** the index number of the reference being changed */
    index: number;
    /** the new source instrument */
    direction: number | null;
};
/** An indexed source setting */
export declare type BearingDistance = {
    /** the index number of the reference being changed */
    index: number;
    /** the new source instrument */
    distance: number | null;
};
/** If the bearing source is a localizer. */
export declare type BearingIsLoc = {
    /** the index number of the reference being changed */
    index: number;
    /** if the source is a loc */
    isLoc: boolean | null;
};
/** Marker beacon signal state. */
export declare enum MarkerBeaconState {
    Inactive = 0,
    Outer = 1,
    Middle = 2,
    Inner = 3
}
/** navprocessor events */
export interface NavEvents {
    /** an OBS heading in degrees*/
    obs_set: ObsSetting;
    /** a CDI selection event */
    cdi_select: NavSourceId;
    /** actual deviation in points */
    cdi_deviation: CdiDeviation;
    /** dme distance in nm */
    dme_distance: number;
    /** dme speed in kt */
    dme_speed: number;
    /** vor distance in m */
    vor_distance: number;
    /** nav to/from value */
    vor_to_from: VorToFromSetting;
    /** nav radio selected */
    nav_select: number;
    /** the validity of a bearing source */
    brg_validity: BearingValidity;
    /** the ident for a bearing needle */
    brg_ident: BearingIdent;
    /** changed source of a bearing needle */
    brg_source: BearingSource;
    /** changed distance of a bearing needle */
    brg_distance: BearingDistance;
    /** changed heading to a bearing source */
    brg_direction: BearingDirection;
    /** changed magnetic variation for a tune nav station */
    mag_variation: NavMagneticVariation;
    /** whether a localizer exists and its course */
    localizer: Localizer;
    /** whether a glideslope exists and its deviation */
    glideslope: Glideslope;
    /** whether a nav source frequency is a localizer frequency */
    is_localizer_frequency: LocalizerFrequency;
    /** Marker Beacon State */
    mkr_bcn_state: MarkerBeaconState;
    /** DME State */
    dme_state: DmeState;
    /** GPS Obs Active */
    gps_obs_active: boolean;
    /** GPS Obs Value Setting */
    gps_obs_value: number;
}
/** The interface to a nav source. */
export interface NavSource {
    /** The ID of the source. */
    srcId: NavSourceId;
    /** The nav signal strength. */
    signal: number | null;
    /** Whether the source info is valed. */
    valid: boolean;
    /** Whether this is an active bearing source. */
    activeBrg: boolean;
    /** Whether this is an active CDI source. */
    activeCdi: boolean;
    /** Whether this source provides course deviation information. */
    hasCdi: boolean;
    /** Whether the source provides DME info. */
    hasDme: boolean;
    /** Whether the source has glideslope info. */
    hasGlideslope: boolean;
    /** Whether the source has localizer info. */
    hasLocalizer: boolean;
    /** Whether the source is a localizer frequency. */
    isLocalizerFrequency: boolean | null;
    /** A handler to call when source validity changes. */
    validHandler?: ((valid: boolean, source: NavSourceId) => void);
    /** A handler to call when the source ident changes. */
    identHandler?: ((ident: string | null, source: NavSourceId) => void);
    /** A handler to call when the bearing to the source changes. */
    brgHandler?: ((bearing: number | null, source: NavSourceId) => void);
    /** A handler to call when the distance to the source changes. */
    distHandler?: ((distance: number | null, source: NavSourceId) => void);
    /** A handler to call when the OBS setting for the source changes. */
    obsHandler?: ((heading: number | null, source: NavSourceId) => void);
    /** A handler to call when the lateral deviation from the source changes. */
    deviationHandler?: ((deviation: number | null, source: NavSourceId) => void);
    /** A handler to call when the to/from state of the source changes. */
    toFromHandler?: ((toFrom: VorToFrom, source: NavSourceId) => void);
    /** A handler to call when the vertical deviation from the source changes. */
    glideslopeDeviationHandler?: ((deviation: number | null, source: NavSourceId) => void);
    /** A handler to call when the angle on the glide slope changes. */
    glideslopeAngleHandler?: ((angle: number | null, source: NavSourceId) => void);
    /** A handler to call when the magvar of the source changes. */
    magvarHandler?: ((magvar: number | null, source: NavSourceId) => void);
    /** A handler to call when wtf.  */
    isLocalizerFrequencyHandler?: ((isLocalizer: boolean | null, source: NavSourceId) => void);
    /** The ident for this source. */
    ident: string | null;
    /** The bearing to this source. */
    bearing: number | null;
    /** Distance to the source. */
    distance: number | null;
    /** OBS bearing in degrees. */
    obs?: number;
    /** Deviation in points. */
    deviation?: number | null;
    /** The to/from state of the source. */
    toFrom?: VorToFrom;
    /** The localizer course. */
    localizerCourse?: number | null;
    /** The glideslope deviation. */
    glideslopeDeviation?: number | null;
    /** The glideslope angle. */
    glideslopeAngle?: number | null;
    /** The magnetic variation at the source. */
    magneticVariation?: number | null;
}
/**
 * A convenience class for creating a navproc configuration set.
 *
 * Implementers should instantiate this and then populate the sets with the
 * HEvents that their radio sends for various actions.
 */
export declare class NavProcessorConfig {
    numNav: number;
    numGps: number;
    numAdf: number;
    initialCdiIndex: number;
    courseIncEvents: Set<string>;
    courseDecEvents: Set<string>;
    simVarPublisher?: NavProcSimVarPublisher;
    additionalSources: NavSource[];
}
/**
 * The core of tne nav processor
 */
export declare class NavProcessor {
    private bus;
    private config;
    private cdiSourceIdx;
    private bearingSourceIdxs;
    private hEvents;
    private navComSubscriber;
    private publisher;
    private simVarPublisher;
    private controlSubscriber;
    private simVarSubscriber;
    private navSources;
    private subController;
    /**
     * Create a NavProcessor.
     * @param bus The event bus to publish to.
     * @param config A config object defining our radio options.
     */
    constructor(bus: EventBus, config: NavProcessorConfig);
    /**
     * Initialize a nav processor
     */
    init(): void;
    /**
     * Add a custom nav source to the processor.
     * @param source The implementation of NavSourceBase to add.
     */
    addNavSource(source: NavSource): void;
    /**
     * Process a CDI source change event.
     * @param index is specified if a specific cdiSourceIdx is requested
     */
    private switchCdiSrc;
    /**srcent.
     */
    private initCdi;
    /**
     * Process a bearing source change event.
     * @param index The index of the source to change
     */
    private switchBrgSrc;
    /**
     * Handle HEvents
     * @param event The hEvent name
     */
    private eventHandler;
    /**
     * Handle a course inc event if we have a nav radio as our active CDI source.
     */
    private handleCrsInc;
    /**
     * Handle a course dec event if we have a nav radio as our active CDI source.
     */
    private handleCrsDec;
    /**
     * Handle a bearing validity change.
     * @param valid The new bearing validity
     * @param source The source of
     */
    private onBrgValidity;
    /**
     * Handle a bearing distance change.
     * @param distance The distance to the source.
     * @param source The nav source ID.
     */
    private onBrgDistance;
    /**
     * Handle a bearing direction change.
     * @param direction The distance to the source.
     * @param source The nav source ID.
     */
    private onBrgDirection;
    /**
     * Handle a bearing ident change.
     * @param ident The ident of the source.
     * @param source The nav source ID.
     */
    private onBrgIdent;
    /**
     * Handle a localizer course change.
     * @param course The localizer course of the source.
     * @param source The nav source ID.
     */
    private onLocalizerCourse;
    /**
     * Handle a glideslope deviation change.
     * @param deviation The glideslope deviation of the source.
     * @param source The nav source ID.
     */
    private onGlideslopeDeviation;
    /**
     * Handle a glideslope angle change.
     * @param angle The glideslope angle of the source.
     * @param source The nav source ID.
     */
    private onGlideslopeAngle;
    /**
     * Determine whether a set frequency is a localizer frequency.
     * @param frequency The frequency to evaluate.
     * @returns a bool true if the frequency is a loc freq.
     */
    private frequencyIsLocalizer;
    /**
     * Publishers whether a set frequency is a localizer frequency.
     * @param isLoc whether the freq is a loc.
     * @param source the selected nav source.
     */
    private onIsLocalizerFrequency;
    /**
     * Publishers dme distance info.  This should be replaced by a generalization of
     * BearingDistance that provides the distance to any nav source if it has DME.
     * @param hasDme whether the radio has dme.
     * @param distance is the dme distance.
     * @param source the selected nav source.
     */
    private onDme;
    /**
     * Toggles CDI between GPS and NAV1.
     */
    private onCdiGpsToggle;
    /**
     * Perform events for the update loop.
     */
    onUpdate(): void;
}
//# sourceMappingURL=NavProcessor.d.ts.map