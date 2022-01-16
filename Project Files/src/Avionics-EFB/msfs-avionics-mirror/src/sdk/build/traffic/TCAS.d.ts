import { EventSubscriber } from '../data';
import { EventBus } from '../data/EventBus';
import { TrafficContact, TrafficInstrument } from '../instruments';
import { GeoPoint, GeoPointInterface, GeoPointReadOnly } from '../utils/geo/GeoPoint';
import { GeoPointSubject } from '../utils/geo/GeoPointSubject';
import { NumberUnit, NumberUnitInterface, NumberUnitReadOnly, UnitFamily } from '../utils/math/NumberUnit';
import { NumberUnitSubject } from '../utils/math/NumberUnitSubject';
import { Subject } from '../utils/Subject';
import { Subscribable } from '../utils/Subscribable';
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
    readonly positionVec: Float64Array;
    /**
     * The 3D velocity vector of this intruder at the time of the last update. Each component is expressed in units of
     * meters per second. The coordinate system is defined the same as for position vectors.
     */
    readonly velocityVec: Float64Array;
    /** The 3D position vector of this intruder relative to own airplane. */
    readonly relativePositionVec: Float64Array;
    /** The 3D velocity vector of this intruder relative to own airplane. */
    readonly relativeVelocityVec: Float64Array;
    /** Whether there is a valid prediction for time of closest approach between this intruder and own airplane. */
    readonly isPredictionValid: boolean;
    /** The predicted time-of-closest-approach of this intruder at the time of the most recent update. */
    readonly tca: NumberUnitReadOnly<UnitFamily.Duration>;
    /** The predicted 3D displacement vector from own airplane to this intruder at time of closest approach. */
    readonly tcaDisplacement: Float64Array;
    /**
     * The cylindrical norm of the predicted displacement vector between this intruder and own airplane at time of
     * closest approach. A value less than or equal to 1 indicates the intruder will be inside the protected zone.
     * Larger values correspond to greater separation.
     */
    readonly tcaNorm: number;
    /** The predicted horizontal separation between this intruder and own airplane at time of closest approach. */
    readonly tcaHorizontalSep: NumberUnitReadOnly<UnitFamily.Distance>;
    /** The predicted vertical separation between this intruder and own airplane at time of closest approach. */
    readonly tcaVerticalSep: NumberUnitReadOnly<UnitFamily.Distance>;
    /**
     * Calculates the predicted 3D displacement vector from own airplane to this intruder at a specified time based on
     * the most recent available data. If insufficient data is available to calculate the prediction, NaN will be written
     * to the result.
     * @param simTime The sim time at which to calculate the separation, as a UNIX timestamp.
     * @param out A Float64Array object to which to write the result.
     * @returns the predicted displacement vector from own airplane to this intruder at the specified time.
     */
    predictDisplacement(simTime: number, out: Float64Array): Float64Array;
    /**
     * Calculates the predicted separation between this intruder and own airplane at a specified time based on the most
     * recent available data and stores the results in the supplied WT_NumberUnit objects. If insufficient data is
     * available to calculate the prediction, NaN will be written to the results.
     * @param simTime The sim time at which to calculate the separation, as a UNIX timestamp.
     * @param horizontalOut A NumberUnit object to which to write the horizontal separation.
     * @param verticalOut A NumberUnit object to which to write the vertical separation.
     */
    predictSeparation(simTime: number, horizontalOut: NumberUnit<UnitFamily.Distance>, verticalOut: NumberUnit<UnitFamily.Distance>): void;
}
/**
 * Sensitivity settings for TCAS.
 */
export interface TCASSensitivity {
    /** A subscribable which provides the lookahead time for TCA. */
    readonly lookaheadTime: Subscribable<NumberUnitInterface<UnitFamily.Duration>>;
    /** A subscribable which provides the radius of the own airplane's protected zone. */
    readonly protectedRadius: Subscribable<NumberUnitInterface<UnitFamily.Distance>>;
    /** A subscribable which provides the half-height of the own airplane's protected zone. */
    readonly protectedHeight: Subscribable<NumberUnitInterface<UnitFamily.Distance>>;
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
}
/**
 * A TCAS-II-like system.
 */
export declare abstract class TCAS<I extends AbstractTCASIntruder = AbstractTCASIntruder, S extends TCASSensitivity = TCASSensitivity> {
    protected readonly bus: EventBus;
    protected readonly tfcInstrument: TrafficInstrument;
    protected readonly maxIntruderCount: number;
    protected readonly realTimeUpdateFreq: number;
    protected readonly simTimeUpdateFreq: number;
    protected readonly operatingModeSub: Subject<TCASOperatingMode>;
    protected readonly sensitivity: S;
    private readonly ownAirplane;
    protected readonly intrudersSorted: I[];
    protected intrudersFiltered: I[];
    private contactCreatedConsumer;
    private contactRemovedConsumer;
    private readonly contactCreatedHandler;
    private readonly contactRemovedHandler;
    protected readonly ownAirplaneSubs: {
        position: GeoPointSubject;
        altitude: NumberUnitSubject<UnitFamily.Distance, import("../utils/math/NumberUnit").SimpleUnit<UnitFamily.Distance>>;
        groundTrack: Subject<number>;
        groundSpeed: NumberUnitSubject<UnitFamily.Speed, import("../utils/math/NumberUnit").CompoundUnit<UnitFamily.Speed>>;
        verticalSpeed: NumberUnitSubject<UnitFamily.Speed, import("../utils/math/NumberUnit").CompoundUnit<UnitFamily.Speed>>;
    };
    protected isOwnAirplaneOnGround: boolean;
    protected lastUpdateSimTime: number;
    protected lastUpdateRealTime: number;
    private readonly alertLevelHandlers;
    private readonly eventSubscriber;
    /**
     * Constructor.
     * @param bus The event bus.
     * @param tfcInstrument The traffic instrument which provides traffic contacts for this TCAS.
     * @param maxIntruderCount The maximum number of intruders tracked at any one time by this TCAS.
     * @param realTimeUpdateFreq The maximum update frequency (Hz) in real time.
     * @param simTimeUpdateFreq The maximum update frequency (Hz) in sim time.
     */
    constructor(bus: EventBus, tfcInstrument: TrafficInstrument, maxIntruderCount: number, realTimeUpdateFreq: number, simTimeUpdateFreq: number);
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
     * @param simTime The current sim time.
     */
    protected doUpdate(simTime: number): void;
    protected abstract updateSensitivity(): void;
    /**
     * Updates the TCA predictions for all intruders tracked by this system.
     * @param simTime The current sim time.
     */
    protected updateIntruderPredictions(simTime: number): void;
    /**
     * Updates the arrays of intruders tracked by this system.
     */
    protected updateIntruderArrays(): void;
    /**
     * Updates the alert levels for all intruders tracked by this system that have not been filtered out.
     * @param simTime The current sim time.
     */
    protected updateFilteredIntruderAlertLevels(simTime: number): void;
    /**
     * Updates an intruder's alert level.
     * @param simTime The current sim time.
     * @param intruder An intruder.
     */
    protected abstract updateIntruderAlertLevel(simTime: number, intruder: I): void;
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
declare type TrafficComputerOwnAirplaneSubs = {
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
};
/**
 * An airplane managed by TCAS.
 */
declare abstract class TCASAirplane {
    protected readonly _position: GeoPoint;
    /** The position of this airplane at the time of the most recent update. */
    readonly position: GeoPointReadOnly;
    /** The altitude of this airplane at the time of the most recent update. */
    protected readonly _altitude: NumberUnit<UnitFamily.Distance, import("../utils/math/NumberUnit").SimpleUnit<UnitFamily.Distance>>;
    readonly altitude: NumberUnitReadOnly<UnitFamily.Distance, import("../utils/math/NumberUnit").SimpleUnit<UnitFamily.Distance>>;
    protected _groundTrack: number;
    /** The true ground track of this airplane at the time of the most recent update. */
    get groundTrack(): number;
    /** The ground speed of this airplane at the time of the most recent update. */
    protected readonly _groundSpeed: NumberUnit<UnitFamily.Speed, import("../utils/math/NumberUnit").CompoundUnit<UnitFamily.Speed>>;
    readonly groundSpeed: NumberUnitReadOnly<UnitFamily.Speed, import("../utils/math/NumberUnit").CompoundUnit<UnitFamily.Speed>>;
    /** The vertical speed of this airplane at the time of the most recent update. */
    protected readonly _verticalSpeed: NumberUnit<UnitFamily.Speed, import("../utils/math/NumberUnit").CompoundUnit<UnitFamily.Speed>>;
    readonly verticalSpeed: NumberUnitReadOnly<UnitFamily.Speed, import("../utils/math/NumberUnit").CompoundUnit<UnitFamily.Speed>>;
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
    /**
     * Constructor.
     * @param subs Subscribables which provide data related to this airplane.
     */
    constructor(subs: TrafficComputerOwnAirplaneSubs);
    /**
     * Updates this airplane's position, altitude, ground track, ground speed, and vertical speed.
     */
    private updateParameters;
    /**
     * Updates this airplane's position and velocity vectors.
     */
    private updateVectors;
    /**
     * Updates this airplane's position and velocity data.
     * @param simTime The current sim time, as a UNIX millisecond timestamp.
     */
    update(simTime: number): void;
}
/**
 * An abstract implementation of TCASIntruder.
 */
export declare abstract class AbstractTCASIntruder extends TCASAirplane implements TCASIntruder {
    readonly contact: TrafficContact;
    private static readonly MIN_GROUND_SPEED;
    private static readonly vec2Cache;
    private static readonly vec3Cache;
    private static readonly solutionCache;
    readonly alertLevel: Subject<TCASAlertLevel>;
    /** The 3D position vector of this intruder relative to own airplane. */
    readonly relativePositionVec: Float64Array;
    /** The 3D velocity vector of this intruder relative to own airplane. */
    readonly relativeVelocityVec: Float64Array;
    private _isPredictionValid;
    /** Whether there is a valid prediction for time of closest approach between this intruder and own airplane. */
    get isPredictionValid(): boolean;
    private readonly _tca;
    /** Time to closest approach between this intruder and own airplane. */
    readonly tca: NumberUnitReadOnly<UnitFamily.Duration, import("../utils/math/NumberUnit").SimpleUnit<UnitFamily.Duration>>;
    private _tcaNorm;
    /**
     * The cylindrical norm of the predicted displacement vector between this intruder and own airplane at time of
     * closest approach. A value less than or equal to 1 indicates the intruder will be inside the protected zone.
     * Larger values correspond to greater separation.
     */
    get tcaNorm(): number;
    /** The predicted 3D displacement vector from own airplane to this intruder at time of closest approach. */
    readonly tcaDisplacement: Float64Array;
    private readonly _tcaHorizontalSep;
    /** The predicted horizontal separation between this intruder and own airplane at time of closest approach. */
    readonly tcaHorizontalSep: NumberUnitReadOnly<UnitFamily.Distance, import("../utils/math/NumberUnit").SimpleUnit<UnitFamily.Distance>>;
    private readonly _tcaVerticalSep;
    /** The predicted vertical separation between this intruder and own airplane at time of closest approach. */
    readonly tcaVerticalSep: NumberUnitReadOnly<UnitFamily.Distance, import("../utils/math/NumberUnit").SimpleUnit<UnitFamily.Distance>>;
    /**
     * Constructor.
     * @param contact The traffic contact associated with this intruder.
     */
    constructor(contact: TrafficContact);
    predictDisplacement(simTime: number, out: Float64Array): Float64Array;
    predictSeparation(simTime: number, horizontalOut: NumberUnit<UnitFamily.Distance>, verticalOut: NumberUnit<UnitFamily.Distance>): void;
    /**
     * Updates this intruder's predicted TCA and related data.
     * @param simTime The current sim time.
     * @param ownAirplane Own airplane.
     * @param lookaheadTime The maximum lookahead time to calculate TCA.
     * @param protectedRadius The radius of the own airplane's protected zone.
     * @param protectedHeight The half-height of the own airplane's protected zone.
     */
    updatePrediction(simTime: number, ownAirplane: OwnAirplane, lookaheadTime: NumberUnitInterface<UnitFamily.Duration>, protectedRadius: NumberUnitInterface<UnitFamily.Distance>, protectedHeight: NumberUnitInterface<UnitFamily.Distance>): void;
    /**
     * Updates this intruder's position and velocity data.
     * @param simTime The current sim time.
     * @param ownAirplane The own airplane.
     */
    private updateParameters;
    /**
     * Updates this intruder's position.
     * @param simTime The current sim time.
     * @param ownAirplane The own airplane.
     */
    private updatePosition;
    /**
     * Updates this intruder's velocity.
     */
    private updateVelocity;
    /**
     * Updates the time-to-closest-approach (TCA) and related data of this intruder.
     * @param ownAirplane The own airplane.
     * @param lookaheadTime The maximum lookahead time.
     * @param protectedRadius The radius of the own airplane's protected zone.
     * @param protectedHeight The half-height of the own airplane's protected zone.
     */
    private updateTCA;
    /**
     * Invalidates this intruder's predicted TCA and related data.
     */
    private invalidatePrediction;
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
    /**
     * Converts a 3D displacement vector to a horizontal separation distance.
     * @param displacement A displacement vector, in meters.
     * @param out A NumberUnit object to which to write the result.
     * @returns The horizontal separation distance corresponding to the displacement vector.
     */
    private static displacementToHorizontalSeparation;
    /**
     * Converts a 3D displacement vector to a vertical separation distance.
     * @param displacement A displacement vector, in meters.
     * @param out A NumberUnit object to which to write the result.
     * @returns The vertical separation distance corresponding to the displacement vector.
     */
    private static displacementToVerticalSeparation;
}
/**
 * An abstract implementation of TCASSensitivity.
 */
export declare abstract class AbstractTCASSensitivity implements TCASSensitivity {
    readonly lookaheadTime: NumberUnitSubject<UnitFamily.Duration, import("../utils/math/NumberUnit").SimpleUnit<UnitFamily.Duration>>;
    readonly protectedRadius: NumberUnitSubject<UnitFamily.Distance, import("../utils/math/NumberUnit").SimpleUnit<UnitFamily.Distance>>;
    readonly protectedHeight: NumberUnitSubject<UnitFamily.Distance, import("../utils/math/NumberUnit").SimpleUnit<UnitFamily.Distance>>;
}
export {};
//# sourceMappingURL=TCAS.d.ts.map