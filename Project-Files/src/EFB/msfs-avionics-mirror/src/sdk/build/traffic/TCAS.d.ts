import { ConsumerSubject, EventSubscriber } from '../data';
import { EventBus } from '../data/EventBus';
import { TrafficContact, TrafficInstrument } from '../instruments';
import { GeoPoint, GeoPointInterface, GeoPointReadOnly } from '../geo/GeoPoint';
import { GeoPointSubject } from '../geo/GeoPointSubject';
import { NumberUnit, NumberUnitInterface, NumberUnitReadOnly, UnitFamily } from '../math/NumberUnit';
import { NumberUnitSubject } from '../math/NumberUnitSubject';
import { ReadonlyFloat64Array } from '../math/VecMath';
import { Subject } from '../sub/Subject';
import { Subscribable } from '../sub/Subscribable';
/**
 * TCAS operating modes.
 */
export declare enum TCASOperatingMode {
    Standby = 0,
    TAOnly = 1,
    TA_RA = 2
}
/**
 * TCAS alert level.
 */
export declare enum TCASAlertLevel {
    None = 0,
    ProximityAdvisory = 1,
    TrafficAdvisory = 2,
    ResolutionAdvisory = 3
}
/**
 * A time-of-closest-approach prediction made by TCAS.
 */
export interface TCASTcaPrediction {
    /** Whether this prediction is valid. */
    readonly isValid: boolean;
    /** The time at which this prediction was most recently updated, as a UNIX timestamp in milliseconds. */
    readonly time: number;
    /** The predicted time-to-closest-approach at the time of the most recent update. */
    readonly tca: NumberUnitReadOnly<UnitFamily.Duration>;
    /**
     * The predicted 3D displacement vector from own airplane to this prediction's intruder at time of closest approach.
     * Each component is expressed in units of meters.
     */
    readonly tcaDisplacement: ReadonlyFloat64Array;
    /**
     * The cylindrical norm of the predicted displacement vector between this prediction's intruder and own airplane at
     * time of closest approach. A value less than or equal to 1 indicates the intruder will be inside the protected
     * zone. Larger values correspond to greater separation.
     */
    readonly tcaNorm: number;
    /** The predicted horizontal separation between this prediction's intruder and own airplane at time of closest approach. */
    readonly tcaHorizontalSep: NumberUnitReadOnly<UnitFamily.Distance>;
    /** The predicted vertical separation between this prediction's intruder and own airplane at time of closest approach. */
    readonly tcaVerticalSep: NumberUnitReadOnly<UnitFamily.Distance>;
}
/**
 * An intruder tracked by TCAS.
 */
export interface TCASIntruder {
    /** The traffic contact associated with this intruder. */
    readonly contact: TrafficContact;
    /** A subscribable which provides the alert level assigned to this intruder. */
    readonly alertLevel: Subscribable<TCASAlertLevel>;
    /** The position of this intruder at the time of the most recent update. */
    readonly position: GeoPointReadOnly;
    /** The altitude of this intruder at the time of the most recent update. */
    readonly altitude: NumberUnitReadOnly<UnitFamily.Distance>;
    /** The true ground track of this intruder at the time of the most recent update. */
    readonly groundTrack: number;
    /** The ground speed of this intruder at the time of the most recent update. */
    readonly groundSpeed: NumberUnitReadOnly<UnitFamily.Speed>;
    /** The vertical speed of this intruder at the time of the most recent update. */
    readonly verticalSpeed: NumberUnitReadOnly<UnitFamily.Speed>;
    /**
     * The 3D position vector of this intruder at the time of the last update. Each component is expressed in units of
     * meters. The coordinate system is an Euclidean approximation of the geodetic space around the own airplane such
     * that the z-coordinate represents orthometric height and the x- and y-coordinates represent an east-
     * counterclockwise equirectangular projection of latitude and longitude, with the origin at the location of the own
     * airplane.
     */
    readonly positionVec: ReadonlyFloat64Array;
    /**
     * The 3D velocity vector of this intruder at the time of the last update. Each component is expressed in units of
     * meters per second. The coordinate system is defined the same as for position vectors.
     */
    readonly velocityVec: ReadonlyFloat64Array;
    /** The 3D position vector of this intruder relative to own airplane. */
    readonly relativePositionVec: ReadonlyFloat64Array;
    /** The 3D velocity vector of this intruder relative to own airplane. */
    readonly relativeVelocityVec: ReadonlyFloat64Array;
    /** Whether there is a valid prediction for this intruder's position and velocity. */
    readonly isPredictionValid: boolean;
    /** A time-of-closest-approach prediction for this intruder using sensitivity settings for traffic advisories. */
    readonly tcaTA: TCASTcaPrediction;
    /** A time-of-closest-approach prediction for this intruder using sensitivity settings for resolution advisories. */
    readonly tcaRA: TCASTcaPrediction;
    /**
     * Calculates the predicted 3D displacement vector from own airplane to this intruder at a specified time based on
     * the most recent available data. If insufficient data is available to calculate the prediction, NaN will be written
     * to the result.
     * @param simTime The sim time at which to calculate the separation, as a UNIX timestamp in milliseconds.
     * @param out A Float64Array object to which to write the result.
     * @returns The predicted displacement vector from own airplane to this intruder at the specified time.
     */
    predictDisplacement(simTime: number, out: Float64Array): Float64Array;
    /**
     * Calculates the predicted separation between this intruder and own airplane at a specified time based on the most
     * recent available data and stores the results in the supplied WT_NumberUnit objects. If insufficient data is
     * available to calculate the prediction, NaN will be written to the results.
     * @param simTime The sim time at which to calculate the separation, as a UNIX timestamp in milliseconds.
     * @param horizontalOut A NumberUnit object to which to write the horizontal separation.
     * @param verticalOut A NumberUnit object to which to write the vertical separation.
     */
    predictSeparation(simTime: number, horizontalOut: NumberUnit<UnitFamily.Distance>, verticalOut: NumberUnit<UnitFamily.Distance>): void;
}
/**
 * TCAS parameters for advisories defining the protected zone around the own airplane.
 */
export interface TCASAdvisoryParameters {
    /** A subscribable which provides the radius of the own airplane's protected zone. */
    readonly protectedRadius: Subscribable<NumberUnitInterface<UnitFamily.Distance>>;
    /** A subscribable which provides the half-height of the own airplane's protected zone. */
    readonly protectedHeight: Subscribable<NumberUnitInterface<UnitFamily.Distance>>;
}
/**
 * TCAS parameters for time-of-closest-approach calculations.
 */
export interface TCASTcaParameters extends TCASAdvisoryParameters {
    /** A subscribable which provides the lookahead time for TCA calculations. */
    readonly lookaheadTime: Subscribable<NumberUnitInterface<UnitFamily.Duration>>;
}
/**
 * TCAS parameters for resolution advisories.
 */
export interface TCASRAParameters extends TCASTcaParameters {
    /** A subscribable which provides the minimum vertical separation from intruders targeted by resolution advisories. */
    readonly alim: Subscribable<NumberUnitInterface<UnitFamily.Distance>>;
}
/**
 * Sensitivity settings for TCAS.
 */
export interface TCASSensitivity {
    /**
     * Protected zone parameters for proximity advisories. If any parameters have a value of `NaN`, proximity advisories
     * will not be issued.
     */
    readonly parametersPA: TCASAdvisoryParameters;
    /**
     * Parameters for time-of-closest-approach calculations for traffic advisories. If any parameters have a value of
     * `NaN`, traffic advisories will not be issued.
     */
    readonly parametersTA: TCASTcaParameters;
    /**
     * Parameters for time-of-closest-approach calculations for resolution advisories. If any parameters have a value of
     * `NaN`, resolution advisories will not be issued.
     */
    readonly parametersRA: TCASRAParameters;
}
/**
 * Bit flags describing TCAS resolution advisories.
 */
export declare enum TCASResolutionAdvisoryFlags {
    /** An initial resolution advisory. */
    Initial = 1,
    /** A corrective resolution advisory. Requires a change in the own airplane's vertical speed. */
    Corrective = 2,
    /** An upward sense resolution advisory. Commands a vertical speed above a certain value. */
    UpSense = 4,
    /** A downward sense resolution advisory. Commands a vertical speed below a certain value. */
    DownSense = 8,
    /** A resolution advisory which crosses an intruder's altitude. */
    Crossing = 16,
    /** A CLIMB resolution advisory. Commands a positive vertical speed above 1500 FPM. */
    Climb = 32,
    /** A DESCEND resolution advisory. Commands a negative vertical speed below -1500 FPM. */
    Descend = 64,
    /** An INCREASE CLIMB or INCREASE DESCENT resolution advisory. Commands a vertical speed above 2500 FPM or below -2500 FPM. */
    Increase = 128,
    /** A corrective REDUCE CLIMB resolution advisory. Commands a vertical speed of 0 FPM or less. */
    ReduceClimb = 256,
    /** A corrective REDUCE DESCENT resolution advisory. Commands a vertical speed of 0 FPM or more. */
    ReduceDescent = 512,
    /** A preventative DO NOT CLIMB resolution advisory. Commands a non-positive vertical speed. */
    DoNotClimb = 1024,
    /** A preventative DO NOT DESCEND resolution advisory. Commands a non-negative vertical speed. */
    DoNotDescend = 2048
}
/**
 * A TCAS resolution advisory.
 */
export interface TCASResolutionAdvisory {
    /** This resolution advisory's active intruders, sorted in order of increasing time to closest approach. */
    readonly intruders: readonly TCASIntruder[];
    /** The upper vertical speed limit placed by this resolution advisory. A value of `NaN` indicates no limit. */
    readonly maxVerticalSpeed: NumberUnitReadOnly<UnitFamily.Speed>;
    /** The lower vertical speed limit placed by this resolution advisory. A value of `NaN` indicates no limit. */
    readonly minVerticalSpeed: NumberUnitReadOnly<UnitFamily.Speed>;
    /** A combination of {@link TCASResolutionAdvisoryFlags} entries describing this resolution advisory. */
    readonly flags: number;
}
/**
 * TCAS events.
 */
export interface TCASEvents {
    /** The TCAS operating mode changed. */
    tcas_operating_mode: TCASOperatingMode;
    /** A new intruder was created. */
    tcas_intruder_added: TCASIntruder;
    /** The alert level of an intruder was changed. */
    tcas_intruder_alert_changed: TCASIntruder;
    /** An intruder was removed. */
    tcas_intruder_removed: TCASIntruder;
    /** The number of intruders associated with active traffic advisories. */
    tcas_ta_intruder_count: number;
    /** The number of intruders associated with an active resolution advisory. */
    tcas_ra_intruder_count: number;
    /** An initial resolution advisory has been issued. */
    tcas_ra_issued: TCASResolutionAdvisory;
    /** An active resolution advisory has been updated. */
    tcas_ra_updated: TCASResolutionAdvisory;
    /** A resolution advisory has been canceled. */
    tcas_ra_canceled: void;
}
/**
 * Options to adjust how resolution advisories are calculated by TCAS.
 */
export declare type TCASResolutionAdvisoryOptions = {
    /** The assumed response time of the own airplane following an initial resolution advisory. */
    readonly initialResponseTime: NumberUnitInterface<UnitFamily.Duration>;
    /** The assumed acceleration of the own airplane following an initial resolution advisory. */
    readonly initialAcceleration: NumberUnitInterface<UnitFamily.Acceleration>;
    /** The assumed response time of the own airplane following an updated resolution advisory. */
    readonly subsequentResponseTime: NumberUnitInterface<UnitFamily.Duration>;
    /** The assumed acceleration of the own airplane following an updated resolution advisory. */
    readonly subsequentAcceleration: NumberUnitInterface<UnitFamily.Acceleration>;
    /** A function which determines whether to allow a CLIMB resolution advisory. */
    allowClimb: (simTime: number) => boolean;
    /** A function which determines whether to allow an INCREASE CLIMB resolution advisory. */
    allowIncreaseClimb: (simTime: number) => boolean;
    /** A function which determines whether to allow a DESCEND resolution advisory. */
    allowDescend: (simTime: number) => boolean;
    /** A function which determines whether to allow an INCREASE DESCENT resolution advisory. */
    allowIncreaseDescent: (simTime: number) => boolean;
};
/**
 * A TCAS-II-like system.
 */
export declare abstract class TCAS<I extends AbstractTCASIntruder = AbstractTCASIntruder, S extends TCASSensitivity = TCASSensitivity> {
    protected readonly bus: EventBus;
    protected readonly tfcInstrument: TrafficInstrument;
    protected readonly maxIntruderCount: number;
    protected readonly realTimeUpdateFreq: number;
    protected readonly simTimeUpdateFreq: number;
    private static readonly DEFAULT_RA_OPTIONS;
    protected readonly operatingModeSub: Subject<TCASOperatingMode>;
    protected readonly sensitivity: S;
    protected readonly ownAirplane: OwnAirplane;
    protected readonly intrudersSorted: I[];
    protected intrudersFiltered: I[];
    protected readonly intrudersRA: Set<I>;
    protected readonly resolutionAdvisory: TCASResolutionAdvisoryClass;
    private contactCreatedConsumer;
    private contactRemovedConsumer;
    private readonly contactCreatedHandler;
    private readonly contactRemovedHandler;
    protected readonly ownAirplaneSubs: {
        position: GeoPointSubject;
        altitude: NumberUnitSubject<UnitFamily.Distance, import("../math/NumberUnit").SimpleUnit<UnitFamily.Distance>>;
        groundTrack: ConsumerSubject<number>;
        groundSpeed: NumberUnitSubject<UnitFamily.Speed, import("../math/NumberUnit").CompoundUnit<UnitFamily.Speed>>;
        verticalSpeed: NumberUnitSubject<UnitFamily.Speed, import("../math/NumberUnit").CompoundUnit<UnitFamily.Speed>>;
        radarAltitude: NumberUnitSubject<UnitFamily.Distance, import("../math/NumberUnit").SimpleUnit<UnitFamily.Distance>>;
        isOnGround: ConsumerSubject<boolean>;
    };
    protected readonly simTime: ConsumerSubject<number>;
    protected lastUpdateSimTime: number;
    protected lastUpdateRealTime: number;
    private readonly alertLevelHandlers;
    private readonly eventPublisher;
    private readonly eventSubscriber;
    /**
     * Constructor.
     * @param bus The event bus.
     * @param tfcInstrument The traffic instrument which provides traffic contacts for this TCAS.
     * @param maxIntruderCount The maximum number of intruders tracked at any one time by this TCAS.
     * @param realTimeUpdateFreq The maximum update frequency (Hz) in real time.
     * @param simTimeUpdateFreq The maximum update frequency (Hz) in sim time.
     * @param raOptions Options to adjust how resolution advisories are calculated.
     */
    constructor(bus: EventBus, tfcInstrument: TrafficInstrument, maxIntruderCount: number, realTimeUpdateFreq: number, simTimeUpdateFreq: number, raOptions?: Partial<TCASResolutionAdvisoryOptions>);
    /**
     * Creates a TCAS sensitivity object.
     * @returns A TCAS sensitivity object.
     */
    protected abstract createSensitivity(): S;
    /**
     * Gets this system's operating mode.
     * @returns This system's operating mode.
     */
    getOperatingMode(): TCASOperatingMode;
    /**
     * Sets this system's operating mode.
     * @param mode The new operating mode.
     */
    setOperatingMode(mode: TCASOperatingMode): void;
    /**
     * Gets an array of all currently tracked intruders. The intruders are sorted in order of decreasing threat.
     * @returns an array of all currently tracked intruders.
     */
    getIntruders(): readonly TCASIntruder[];
    /**
     * Gets an event bus subscriber for TCAS events.
     * @returns an event bus subscriber for TCAS events..
     */
    getEventSubscriber(): EventSubscriber<TCASEvents>;
    /**
     * Initializes this system.
     */
    init(): void;
    /**
     * Sorts two intruders.
     * @param a The first intruder.
     * @param b The second intruder.
     * @returns A negative number if `a` is to be sorted before `b`, a positive number if `b` is to be sorted before `a`,
     * and zero if the two are equal.
     */
    protected intruderComparator(a: I, b: I): number;
    /**
     * Creates a TCAS intruder entry from a traffic contact.
     * @param contact A traffic contact.
     */
    protected abstract createIntruderEntry(contact: TrafficContact): I;
    /**
     * A callback which is called when a new traffic contact is added by this system's traffic instrument.
     * @param uid The ID number of the new contact.
     */
    private onContactAdded;
    /**
     * A callback which is called when a traffic contact is removed by this system's traffic instrument.
     * @param uid The ID number of the removed contact.
     */
    private onContactRemoved;
    /**
     * A callback which is called when the sim time changes.
     * @param simTime The current sim time.
     */
    private onSimTimeChanged;
    /**
     * Executes an update.
     * @param simTime The current sim time, as a UNIX timestamp in milliseconds.
     */
    protected doUpdate(simTime: number): void;
    protected abstract updateSensitivity(): void;
    /**
     * Updates the TCA predictions for all intruders tracked by this system.
     * @param simTime The current sim time, as a UNIX timestamp in milliseconds.
     */
    protected updateIntruderPredictions(simTime: number): void;
    /**
     * Updates the arrays of intruders tracked by this system.
     */
    protected updateIntruderArrays(): void;
    /**
     * Updates the alert levels for all intruders tracked by this system that have not been filtered out.
     * @param simTime The current sim time, as a UNIX timestamp in milliseconds.
     */
    protected updateFilteredIntruderAlertLevels(simTime: number): void;
    protected readonly paSeparationCache: {
        horizontal: NumberUnit<UnitFamily.Distance, import("../math/NumberUnit").SimpleUnit<UnitFamily.Distance>>;
        vertical: NumberUnit<UnitFamily.Distance, import("../math/NumberUnit").SimpleUnit<UnitFamily.Distance>>;
    };
    /**
     * Updates an intruder's alert level.
     * @param simTime The current sim time, as a UNIX timestamp in milliseconds.
     * @param intruder An intruder.
     */
    protected updateIntruderAlertLevel(simTime: number, intruder: I): void;
    /**
     * Checks whether a resolution advisory can be issued for an intruder.
     * @param simTime The current sim time, as a UNIX timestamp in milliseconds.
     * @param intruder An intruder.
     * @returns Whether a resolution advisory can be issued for the intruder.
     */
    protected canIssueResolutionAdvisory(simTime: number, intruder: I): boolean;
    /**
     * Checks whether a resolution advisory can be canceled for an intruder.
     * @param simTime The current sim time, as a UNIX timestamp in milliseconds.
     * @param intruder An intruder.
     * @returns Whether a resolution advisory can be issued for the intruder.
     */
    protected canCancelResolutionAdvisory(simTime: number, intruder: I): boolean;
    /**
     * Checks whether a traffic advisory can be issued for an intruder.
     * @param simTime The current sim time, as a UNIX timestamp in milliseconds.
     * @param intruder An intruder.
     * @returns Whether a traffic advisory can be issued for the intruder.
     */
    protected canIssueTrafficAdvisory(simTime: number, intruder: I): boolean;
    /**
     * Checks whether a traffic advisory can be canceled for an intruder.
     * @param simTime The current sim time, as a UNIX timestamp in milliseconds.
     * @param intruder An intruder.
     * @returns Whether a traffic advisory can be canceled for the intruder.
     */
    protected canCancelTrafficAdvisory(simTime: number, intruder: I): boolean;
    /**
     * Checks whether a proximity advisory can be issued for an intruder.
     * @param simTime The current sim time, as a UNIX timestamp in milliseconds.
     * @param intruder An intruder.
     * @returns Whether a proximity advisory can be issued for the intruder.
     */
    protected canIssueProximityAdvisory(simTime: number, intruder: I): boolean;
    /**
     * Checks whether a proximity advisory can be canceled for an intruder.
     * @param simTime The current sim time, as a UNIX timestamp in milliseconds.
     * @param intruder An intruder.
     * @returns Whether a proximity advisory can be canceled for the intruder.
     */
    protected canCancelProximityAdvisory(simTime: number, intruder: I): boolean;
    /**
     * Updates this TCAS's resolution advisory.
     * @param simTime The current sim time, as a UNIX timestamp in milliseconds.
     */
    protected updateResolutionAdvisory(simTime: number): void;
    /**
     * Executes initialization code when an intruder is added.
     * @param intruder The newly added intruder.
     */
    private initIntruder;
    /**
     * Executes cleanup code when an intruder is removed.
     * @param intruder The intruder that was removed.
     */
    private cleanUpIntruder;
    /**
     * A callback which is called when an intruder's alert level changes.
     * @param intruder The intruder whose alert level changed.
     */
    private onAlertLevelChanged;
}
/**
 * Subscribables which provide data related to the own airplane.
 */
declare type TCASOwnAirplaneSubs = {
    /** A subscribable which provides the own airplane's position. */
    position: Subscribable<GeoPointInterface>;
    /** A subscribable which provides the own airplane's altitude. */
    altitude: Subscribable<NumberUnitInterface<UnitFamily.Distance>>;
    /** A subscribable which provides the own airplane's ground track. */
    groundTrack: Subscribable<number>;
    /** A subscribable which provides the own airplane's ground speed. */
    groundSpeed: Subscribable<NumberUnitInterface<UnitFamily.Speed>>;
    /** A subscribable which provides the own airplane's vertical speed. */
    verticalSpeed: Subscribable<NumberUnitInterface<UnitFamily.Speed>>;
    /** A subscribable which provides the own airplane's radar altitude. */
    radarAltitude: Subscribable<NumberUnitInterface<UnitFamily.Distance>>;
    /** A subscribable which provides whether the own airplane is on the ground. */
    isOnGround: Subscribable<boolean>;
};
/**
 * An airplane managed by TCAS.
 */
declare abstract class TCASAirplane {
    protected readonly _position: GeoPoint;
    /** The position of this airplane at the time of the most recent update. */
    readonly position: GeoPointReadOnly;
    /** The altitude of this airplane at the time of the most recent update. */
    protected readonly _altitude: NumberUnit<UnitFamily.Distance, import("../math/NumberUnit").SimpleUnit<UnitFamily.Distance>>;
    readonly altitude: NumberUnitReadOnly<UnitFamily.Distance, import("../math/NumberUnit").SimpleUnit<UnitFamily.Distance>>;
    protected _groundTrack: number;
    /** The true ground track of this airplane at the time of the most recent update. */
    get groundTrack(): number;
    /** The ground speed of this airplane at the time of the most recent update. */
    protected readonly _groundSpeed: NumberUnit<UnitFamily.Speed, import("../math/NumberUnit").CompoundUnit<UnitFamily.Speed>>;
    readonly groundSpeed: NumberUnitReadOnly<UnitFamily.Speed, import("../math/NumberUnit").CompoundUnit<UnitFamily.Speed>>;
    /** The vertical speed of this airplane at the time of the most recent update. */
    protected readonly _verticalSpeed: NumberUnit<UnitFamily.Speed, import("../math/NumberUnit").CompoundUnit<UnitFamily.Speed>>;
    readonly verticalSpeed: NumberUnitReadOnly<UnitFamily.Speed, import("../math/NumberUnit").CompoundUnit<UnitFamily.Speed>>;
    /**
     * The 3D position vector of this airplane at the time of the last update. Each component is expressed in units of
     * meters. The coordinate system is an Euclidean approximation of the geodetic space around the own airplane such
     * that the z-coordinate represents orthometric height and the x- and y-coordinates represent an east-
     * counterclockwise equirectangular projection of latitude and longitude, with the origin at the location of the own
     * airplane.
     */
    readonly positionVec: Float64Array;
    /**
     * The 3D velocity vector of this airplane at the time of the last update. Each component is expressed in units of
     * meters per second. The coordinate system is defined the same as for position vectors.
     */
    readonly velocityVec: Float64Array;
    protected lastUpdateTime: number;
}
/**
 * The own airplane managed by TCAS.
 */
declare class OwnAirplane extends TCASAirplane {
    private readonly subs;
    /** The radar altitude of this airplane at the time of the most recent update. */
    protected readonly _radarAltitude: NumberUnit<UnitFamily.Distance, import("../math/NumberUnit").SimpleUnit<UnitFamily.Distance>>;
    readonly radarAltitude: NumberUnitReadOnly<UnitFamily.Distance, import("../math/NumberUnit").SimpleUnit<UnitFamily.Distance>>;
    private _isOnGround;
    /** Whether this airplane is on the ground. */
    get isOnGround(): boolean;
    /**
     * Constructor.
     * @param subs Subscribables which provide data related to this airplane.
     */
    constructor(subs: TCASOwnAirplaneSubs);
    /**
     * Calculates the predicted 3D position vector of this airplane at a specified time based on the most recent
     * available data. Each component of the vector is expressed in units of meters, and the origin lies at the most
     * recent updated position of this airplane.
     * @param simTime The sim time at which to calculate the position, as a UNIX timestamp in milliseconds.
     * @param out A Float64Array object to which to write the result.
     * @returns The predicted position vector of this airplane at the specified time.
     */
    predictPosition(simTime: number, out: Float64Array): Float64Array;
    /**
     * Updates this airplane's position and velocity data.
     * @param simTime The current sim time, as a UNIX millisecond timestamp.
     */
    update(simTime: number): void;
    /**
     * Updates this airplane's position, altitude, ground track, ground speed, vertical speed, and whether it is on the ground.
     */
    private updateParameters;
    /**
     * Updates this airplane's position and velocity vectors.
     */
    private updateVectors;
}
/**
 * An abstract implementation of {@link TCASIntruder}.
 */
export declare abstract class AbstractTCASIntruder extends TCASAirplane implements TCASIntruder {
    readonly contact: TrafficContact;
    private static readonly MIN_GROUND_SPEED;
    private static readonly vec3Cache;
    readonly alertLevel: Subject<TCASAlertLevel>;
    /** The 3D position vector of this intruder relative to own airplane. */
    readonly relativePositionVec: Float64Array;
    /** The 3D velocity vector of this intruder relative to own airplane. */
    readonly relativeVelocityVec: Float64Array;
    private _isPredictionValid;
    /** Whether there is a valid prediction for time of closest approach between this intruder and own airplane. */
    get isPredictionValid(): boolean;
    /** @inheritdoc */
    readonly tcaTA: TCASTcaPredictionClass;
    /** @inheritdoc */
    readonly tcaRA: TCASTcaPredictionClass;
    /**
     * Constructor.
     * @param contact The traffic contact associated with this intruder.
     */
    constructor(contact: TrafficContact);
    /** @inheritdoc */
    predictDisplacement(simTime: number, out: Float64Array): Float64Array;
    /** @inheritdoc */
    predictSeparation(simTime: number, horizontalOut: NumberUnit<UnitFamily.Distance>, verticalOut: NumberUnit<UnitFamily.Distance>): void;
    /**
     * Updates this intruder's predicted TCA and related data.
     * @param simTime The current sim time, as a UNIX timestamp in milliseconds.
     * @param ownAirplane Own airplane.
     * @param sensitivity The TCAS sensitivity parameters to use when calculating predictions.
     */
    updatePrediction(simTime: number, ownAirplane: OwnAirplane, sensitivity: TCASSensitivity): void;
    /**
     * Updates this intruder's position and velocity data.
     * @param simTime The current sim time, as a UNIX timestamp in milliseconds.
     * @param ownAirplane The own airplane.
     */
    private updateParameters;
    /**
     * Updates this intruder's position.
     * @param simTime The current sim time, as a UNIX timestamp in milliseconds.
     * @param ownAirplane The own airplane.
     */
    private updatePosition;
    /**
     * Updates this intruder's velocity.
     * @param ownAirplane The own airplane.
     */
    private updateVelocity;
    /**
     * Invalidates this intruder's predicted TCA and related data.
     */
    private invalidatePredictions;
    /**
     * Converts a 3D displacement vector to a horizontal separation distance.
     * @param displacement A displacement vector, in meters.
     * @param out A NumberUnit object to which to write the result.
     * @returns The horizontal separation distance corresponding to the displacement vector.
     */
    static displacementToHorizontalSeparation(displacement: Float64Array, out: NumberUnit<UnitFamily.Distance>): NumberUnit<UnitFamily.Distance>;
    /**
     * Converts a 3D displacement vector to a vertical separation distance.
     * @param displacement A displacement vector, in meters.
     * @param out A NumberUnit object to which to write the result.
     * @returns The vertical separation distance corresponding to the displacement vector.
     */
    static displacementToVerticalSeparation(displacement: Float64Array, out: NumberUnit<UnitFamily.Distance>): NumberUnit<UnitFamily.Distance>;
}
/**
 * An default implementation of {@link TCASIntruder}.
 */
export declare class DefaultTCASIntruder extends AbstractTCASIntruder {
}
/**
 * A time-of-closest-approach prediction made by TCAS.
 */
declare class TCASTcaPredictionClass implements TCASTcaPrediction {
    private readonly intruder;
    private static readonly vec2Cache;
    private static readonly solutionCache;
    private _isValid;
    /** @inheritdoc */
    get isValid(): boolean;
    private _time;
    /** @inheritdoc */
    get time(): number;
    private readonly _tca;
    /** @inheritdoc */
    readonly tca: NumberUnitReadOnly<UnitFamily.Duration, import("../math/NumberUnit").SimpleUnit<UnitFamily.Duration>>;
    private _tcaNorm;
    /** @inheritdoc */
    get tcaNorm(): number;
    /** @inheritdoc */
    readonly tcaDisplacement: Float64Array;
    private readonly _tcaHorizontalSep;
    /** @inheritdoc */
    readonly tcaHorizontalSep: NumberUnitReadOnly<UnitFamily.Distance, import("../math/NumberUnit").SimpleUnit<UnitFamily.Distance>>;
    private readonly _tcaVerticalSep;
    /** @inheritdoc */
    readonly tcaVerticalSep: NumberUnitReadOnly<UnitFamily.Distance, import("../math/NumberUnit").SimpleUnit<UnitFamily.Distance>>;
    /**
     * Constructor.
     * @param intruder The intruder associated with this prediction.
     */
    constructor(intruder: TCASIntruder);
    /**
     * Updates the time-to-closest-approach (TCA) and related data of this intruder.
     * @param simTime The current sim time, as a UNIX timestamp in milliseconds.
     * @param lookaheadTime The maximum lookahead time.
     * @param protectedRadius The radius of the own airplane's protected zone.
     * @param protectedHeight The half-height of the own airplane's protected zone.
     */
    update(simTime: number, lookaheadTime: NumberUnitInterface<UnitFamily.Duration>, protectedRadius: NumberUnitInterface<UnitFamily.Distance>, protectedHeight: NumberUnitInterface<UnitFamily.Distance>): void;
    /**
     * Invalidates this intruder's predicted TCA and related data.
     */
    invalidate(): void;
    /**
     * Evaluates a TCA candidate against the best existing solution, and if the candidate produces a smaller cylindrical
     * norm, replaces the best existing solution with the candidate.
     * @param t The candidate TCA time, in seconds.
     * @param s The relative position vector of the intruder, in meters.
     * @param v The relative velocity vector of the intruder, in meters per second.
     * @param r The radius of the own airplane's protected zone, in meters.
     * @param h The half-height of the own airplane's protected zone, in meters.
     * @param best The best existing solution.
     * @param candidate A TcaSolution object to which to temporarily write the candidate solution.
     */
    private static evaluateCandidate;
    /**
     * Calculates a TCA solution.
     * @param t The candidate TCA time, in seconds.
     * @param s The relative position vector of the intruder, in meters.
     * @param v The relative velocity vector of the intruder, in meters per second.
     * @param r The radius of the own airplane's protected zone, in meters.
     * @param h The half-height of the own airplane's protected zone, in meters.
     * @param out A TcaSolution object to which to write the result.
     * @returns A TCA solution.
     */
    private static calculateSolution;
    /**
     * Copies a TCA solution.
     * @param from The solution from which to copy.
     * @param to The solution to which to copy.
     */
    private static copySolution;
    /**
     * Calculates a time-offset displacement vector given an initial displacement, a velocity vector, and elapsed time.
     * @param initial The initial displacement vector.
     * @param velocity A velocity vector.
     * @param elapsedTime The elapsed time.
     * @param out A Float64Array object to which to write the result.
     * @returns The time-offset displacement vector.
     */
    private static calculateDisplacementVector;
    /**
     * Calculates a cylindrical norm.
     * @param vector A displacement vector.
     * @param radius The radius of the protected zone.
     * @param halfHeight The half-height of the protected zone.
     * @returns A cylindrical norm.
     */
    private static calculateCylindricalNorm;
}
/**
 * A TCAS resolution advisory.
 */
declare class TCASResolutionAdvisoryClass implements TCASResolutionAdvisory {
    private readonly options;
    private readonly ownAirplane;
    private static readonly CLIMB_DESC_VS_MPS;
    private static readonly INC_CLIMB_DESC_VS_MPS;
    private static readonly VSL_MAX_VS_MPS;
    private static readonly VSL_VS_STEP_MPS;
    private static readonly INTRUDER_SORT_FUNC;
    private static readonly vec3Cache;
    private static readonly senseCandidateCache;
    readonly intruders: TCASIntruder[];
    private readonly _maxVerticalSpeed;
    /** @inheritdoc */
    readonly maxVerticalSpeed: NumberUnitReadOnly<UnitFamily.Speed, import("../math/NumberUnit").CompoundUnit<UnitFamily.Speed>>;
    private readonly _minVerticalSpeed;
    /** @inheritdoc */
    readonly minVerticalSpeed: NumberUnitReadOnly<UnitFamily.Speed, import("../math/NumberUnit").CompoundUnit<UnitFamily.Speed>>;
    private _flags;
    /** @inheritdoc */
    get flags(): number;
    private isActive;
    private timeUpdated;
    private canReverseSense;
    private readonly publisher;
    /**
     * Constructor.
     * @param bus The event bus.
     * @param options Options to adjust how this resolution advisory should be calculated.
     * @param ownAirplane The own airplane of this resolution advisory.
     */
    constructor(bus: EventBus, options: TCASResolutionAdvisoryOptions, ownAirplane: OwnAirplane);
    /**
     * Updates this resolution advisory.
     * @param simTime The current sim time, as a UNIX timestamp in milliseconds.
     * @param alim The required vertical separation between own airplane and intruders.
     * @param intruders The set of active intruders to be tracked by this resolution advisory.
     */
    update(simTime: number, alim: NumberUnitInterface<UnitFamily.Distance>, intruders: ReadonlySet<TCASIntruder>): void;
    /**
     * Activates this resolution advisory.
     * @param simTime The current sim time, as a UNIX timestamp in milliseconds.
     * @param alim The required vertical separation between own airplane and intruders.
     * @param intruders The set of active intruders to be tracked by this resolution advisory.
     */
    private activate;
    /**
     * Updates this resolution advisory while it is active.
     * @param simTime The current sim time, as a UNIX timestamp in milliseconds.
     * @param alim The required vertical separation between own airplane and intruders.
     * @param intruders The set of active intruders to be tracked by this resolution advisory.
     */
    private updateActive;
    /**
     * Updates this resolution advisory's array of active intruders.
     * @param intruders The set of active intruders to be tracked by this resolution advisory.
     */
    private updateIntrudersArray;
    /**
     * Applies a vertical speed target to this resolution advisory.
     * @param simTime The current sim time, as a UNIX timestamp in milliseconds.
     * @param sense The sense of the vertical speed target.
     * @param targetVS The vertical speed target, in meters per second.
     * @param ownAirplaneVS The current vertical speed of the own airplane, in meters per second.
     * @param isCrossing Whether the applied sense crosses an intruder's altitude.
     */
    private apply;
    /**
     * Cancels this resolution advisory.
     */
    private cancel;
    /**
     * Selects the best sense and vertical speed target for a resolution advisory. If the non-crossing sense is able to
     * achieve the target vertical separation, it will be selected. Otherwise, the sense that achieves the greatest
     * vertical separation at time of closest approach will be selected.
     * @param simTime The current sim time, as a UNIX timestamp in milliseconds.
     * @param tca The time to closest approach, in seconds.
     * @param alim The minimum target vertical separation, in meters, between the own airplane and intruders at the time
     * of closest approach.
     * @param responseTime The response time of the own airplane, in seconds.
     * @param accel The acceleration of the own airplane, in meters per second squared.
     * @param ownAirplaneAlt The current altitude of the own airplane, in meters.
     * @param ownAirplaneVS The current vertical speed of the own airplane, in meters per second.
     * @param ownAirplaneAltTca The predicted altitude of the own airplane at the time of closest approach, in meters.
     * @param intruderAltTca The predicted altitude of the intruder at the time of closest approach, in meters.
     * @param out The object to which to write the results.
     * @returns Information on the selected sense and vertical speed target.
     */
    private selectSense;
    /**
     * Calculates the vertical speed required to achieve a desired altitude target at time of closest approach.
     * @param tca The time to closest approach from the present, in seconds.
     * @param currentAlt The current altitude of the own airplane, in meters.
     * @param vs The current vertical speed of the own airplane, in meters per second.
     * @param responseTime The response time of the own airplane, in seconds.
     * @param accel The acceleration of the own airplane, in meters per second squared.
     * @param targetAlt The target altitude of the own airplane at time of closest approach, in meters.
     * @returns The vertical speed, in meters per second, required to achieve a desired altitude target at time of
     * closest approach. A value of `NaN` indicates the altitude target cannot be reached with the specified parameters.
     */
    private static calculateVSToTargetAlt;
}
/**
 * An abstract implementation of {@link TCASSensitivity}.
 */
export declare abstract class AbstractTCASSensitivity implements TCASSensitivity {
    readonly parametersPA: {
        protectedRadius: NumberUnitSubject<UnitFamily.Distance, import("../math/NumberUnit").SimpleUnit<UnitFamily.Distance>>;
        protectedHeight: NumberUnitSubject<UnitFamily.Distance, import("../math/NumberUnit").SimpleUnit<UnitFamily.Distance>>;
    };
    readonly parametersTA: {
        lookaheadTime: NumberUnitSubject<UnitFamily.Duration, import("../math/NumberUnit").SimpleUnit<UnitFamily.Duration>>;
        protectedRadius: NumberUnitSubject<UnitFamily.Distance, import("../math/NumberUnit").SimpleUnit<UnitFamily.Distance>>;
        protectedHeight: NumberUnitSubject<UnitFamily.Distance, import("../math/NumberUnit").SimpleUnit<UnitFamily.Distance>>;
    };
    readonly parametersRA: {
        lookaheadTime: NumberUnitSubject<UnitFamily.Duration, import("../math/NumberUnit").SimpleUnit<UnitFamily.Duration>>;
        protectedRadius: NumberUnitSubject<UnitFamily.Distance, import("../math/NumberUnit").SimpleUnit<UnitFamily.Distance>>;
        protectedHeight: NumberUnitSubject<UnitFamily.Distance, import("../math/NumberUnit").SimpleUnit<UnitFamily.Distance>>;
        alim: NumberUnitSubject<UnitFamily.Distance, import("../math/NumberUnit").SimpleUnit<UnitFamily.Distance>>;
    };
}
/**
 * TCAS sensitivity settings which update based on the altitude of the own airplane to standard values defined in the
 * TCAS II specification.
 */
export declare class DefaultTCASSensitivity extends AbstractTCASSensitivity {
    private static readonly TA_LEVELS;
    private static readonly RA_LEVELS;
    /** @inheritdoc */
    constructor();
    /**
     * Updates the sensitivity level.
     * @param altitude The indicated altitude of the own airplane.
     * @param radarAltitude The radar altitude of the own airplane.
     */
    update(altitude: NumberUnitInterface<UnitFamily.Distance>, radarAltitude: NumberUnitInterface<UnitFamily.Distance>): void;
}
export {};
//# sourceMappingURL=TCAS.d.ts.map