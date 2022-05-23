import { GeoCircle, GeoPoint, GeoPointReadOnly, LatLonInterface, NumberUnitReadOnly, UnitFamily } from '..';
import { Facility, FlightPlanLeg } from '../navigation/Facilities';
import { CircleVectorBuilder, GreatCircleBuilder, JoinGreatCircleToPointBuilder, ProcedureTurnBuilder, TurnToCourseBuilder, DirectToPointBuilder } from './FlightPathVectorBuilder';
import { LegCalculations, LegDefinition } from './FlightPlanning';
/**
 * The state of a calculating flight path.
 */
export interface FlightPathState {
    /** The current position of the flight path. */
    currentPosition: GeoPoint | undefined;
    /** The current true course bearing of the flight path. */
    currentCourse: number | undefined;
    /** The position of the airplane. */
    readonly planePosition: GeoPointReadOnly;
    /** The true heading of the airplane. */
    readonly planeHeading: number;
    /** The altitude of the airplane. */
    readonly planeAltitude: NumberUnitReadOnly<UnitFamily.Distance>;
    /** The ground speed of the airplane. */
    readonly planeSpeed: NumberUnitReadOnly<UnitFamily.Speed>;
    /** The climb rate of the airplane. */
    readonly planeClimbRate: NumberUnitReadOnly<UnitFamily.Speed>;
    /** The desired turn radius. */
    readonly desiredTurnRadius: NumberUnitReadOnly<UnitFamily.Distance>;
}
/**
 * A flight path calculator for individual flight plan legs.
 */
export interface FlightPathLegCalculator {
    /**
     * Calculates flight path vectors for a flight plan leg and adds the calculations to the leg.
     * @param legs A sequence of flight plan legs.
     * @param calculateIndex The index of the leg to calculate.
     * @param activeLegIndex The index of the active leg.
     * @param state The current flight path state.
     * @returns The flight plan leg calculations.
     */
    calculate(legs: LegDefinition[], calculateIndex: number, activeLegIndex: number, state: FlightPathState, resolveIngressToEgress?: boolean): LegCalculations;
}
/**
 * Abstract implementation of FlightPathLegCalculator.
 */
export declare abstract class AbstractFlightPathLegCalculator implements FlightPathLegCalculator {
    protected readonly facilityCache: Map<string, Facility>;
    protected readonly skipWhenActive: boolean;
    /**
     * Constructor.
     * @param facilityCache This calculator's cache of facilities.
     * @param skipWhenActive Whether this calculator will skip calculations for active legs when the leg has already
     * been calculated. False by default.
     */
    constructor(facilityCache: Map<string, Facility>, skipWhenActive?: boolean);
    /**
     * Gets a geographical position from an ICAO string.
     * @param icao An ICAO string.
     * @param out A GeoPoint object to which to write the result.
     * @returns The geographical position corresponding to the ICAO string, or undefined if one could not be obtained.
     */
    protected getPositionFromIcao(icao: string, out: GeoPoint): GeoPoint | undefined;
    /**
     * Gets the geographic position for a flight plan leg terminator.
     * @param leg A flight plan leg.
     * @param icao The ICAO string of the leg's terminator fix.
     * @param out A GeoPoint object to which to write the result.
     * @returns The position of the leg terminator, or undefined if it could not be determined.
     */
    protected getTerminatorPosition(leg: FlightPlanLeg, icao: string, out: GeoPoint): GeoPoint | undefined;
    /**
     * Gets the true course for a flight plan leg. If the leg defines an origin or fix VOR facility, then the magnetic
     * variation defined at the VOR is used to adjust magnetic course, otherwise the computed magnetic variation for the
     * specified point is used.
     * @param leg A flight plan leg.
     * @param point The location from which to get magnetic variation, if an origin VOR is not found.
     * @returns the true course for the flight plan leg.
     */
    protected getLegTrueCourse(leg: FlightPlanLeg, point: LatLonInterface): number;
    /** @inheritdoc */
    calculate(legs: LegDefinition[], calculateIndex: number, activeLegIndex: number, state: FlightPathState, resolveIngressToEgress?: boolean): LegCalculations;
    /**
     * Checks whether vector calculations should be skipped when the leg to calculate is the active leg.
     * @param legs A sequence of flight plan legs.
     * @param calculateIndex The index of the leg to calculate.
     * @param activeLegIndex The index of the active leg.
     * @param state The current flight path state.
     * @returns Whether to skip vector calculations.
     */
    protected shouldSkipWhenActive(legs: LegDefinition[], calculateIndex: number, activeLegIndex: number, state: FlightPathState): boolean;
    /**
     * Calculates flight path vectors for a flight plan leg.
     * @param legs A sequence of flight plan legs.
     * @param calculateIndex The index of the leg to calculate.
     * @param activeLegIndex The index of the active leg.
     * @param state The current flight path state.
     * @returns The number of vectors added to the sequence.
     */
    protected abstract calculateVectors(legs: LegDefinition[], calculateIndex: number, activeLegIndex: number, state: FlightPathState): void;
    /**
     * Calculates the ingress to egress vectors for a flight plan leg and adds them to a leg calculation.
     * @param legCalc The calculations for a flight plan leg.
     */
    protected resolveIngressToEgress(legCalc: LegCalculations): void;
}
/**
 * Calculates flight path vectors for discontinuity legs.
 */
export declare class DiscontinuityLegCalculator extends AbstractFlightPathLegCalculator {
    protected calculateVectors(legs: LegDefinition[], calculateIndex: number, activeLegIndex: number, state: FlightPathState): void;
}
/**
 * Calculates flight path vectors for track to fix legs.
 */
export declare class TrackToFixLegCalculator extends AbstractFlightPathLegCalculator {
    protected readonly geoPointCache: GeoPoint[];
    protected readonly vectorBuilder: GreatCircleBuilder;
    /**
     * Constructor.
     * @param facilityCache This calculator's cache of facilities.
     */
    constructor(facilityCache: Map<string, Facility>);
    protected calculateVectors(legs: LegDefinition[], calculateIndex: number, activeLegIndex: number, state: FlightPathState): void;
}
/**
 * Calculates flight path vectors for direct to fix legs.
 */
export declare class DirectToFixLegCalculator extends AbstractFlightPathLegCalculator {
    protected readonly vec3Cache: Float64Array[];
    protected readonly geoPointCache: GeoPoint[];
    protected readonly geoCircleCache: GeoCircle[];
    protected readonly directToPointBuilder: DirectToPointBuilder;
    /**
     * Constructor.
     * @param facilityCache This calculator's cache of facilities.
     */
    constructor(facilityCache: Map<string, Facility>);
    protected calculateVectors(legs: LegDefinition[], calculateIndex: number, activeLegIndex: number, state: FlightPathState): void;
}
/**
 * Calculates flight path vectors for legs which define a turn ending at a defined terminator fix.
 */
export declare abstract class TurnToFixLegCalculator extends AbstractFlightPathLegCalculator {
    protected readonly vec3Cache: Float64Array[];
    protected readonly geoPointCache: GeoPoint[];
    protected readonly geoCircleCache: GeoCircle[];
    protected readonly circleVectorBuilder: CircleVectorBuilder;
    /**
     * Constructor.
     * @param facilityCache This calculator's cache of facilities.
     */
    constructor(facilityCache: Map<string, Facility>);
    protected calculateVectors(legs: LegDefinition[], calculateIndex: number, activeLegIndex: number, state: FlightPathState): void;
    /**
     * Gets the center of the turn defined by a flight plan leg.
     * @param leg A flight plan leg.
     * @returns The center of the turn defined by the flight plan leg, or undefined if it could not be determined.
     */
    protected abstract getTurnCenter(leg: FlightPlanLeg): LatLonInterface | undefined;
    /**
     * Gets the radius of the turn defined by a flight plan leg.
     * @param leg A flight plan leg.
     * @param center The center of the turn.
     * @returns The radius of the turn defined by the flight plan leg, or undefined if it could not be determined.
     */
    protected abstract getTurnRadius(leg: FlightPlanLeg, center: LatLonInterface): number | undefined;
}
/**
 * Calculates flight path vectors for radius to fix legs.
 */
export declare class RadiusToFixLegCalculator extends TurnToFixLegCalculator {
    protected readonly geoPointCache: GeoPoint[];
    protected getTurnCenter(leg: FlightPlanLeg): LatLonInterface | undefined;
    protected getTurnRadius(leg: FlightPlanLeg, center: LatLonInterface): number | undefined;
}
/**
 * Calculates flight path vectors for arc to fix legs.
 */
export declare class ArcToFixLegCalculator extends TurnToFixLegCalculator {
    protected getTurnCenter(leg: FlightPlanLeg): LatLonInterface | undefined;
    protected getTurnRadius(leg: FlightPlanLeg, center: LatLonInterface): number | undefined;
}
/**
 * Information about a geo circle path to intercept.
 */
export declare type CircleInterceptPathInfo = {
    /** The geo circle defining the path to intercept. */
    circle: GeoCircle | undefined;
    /** The start of the path to intercept. */
    start: LatLonInterface | undefined;
    /** The end of the path to intercept. */
    end: LatLonInterface | undefined;
};
/**
 * Calculates flight path vectors for legs which define a great-circle path terminating at an intercept with another
 * geo circle.
 */
export declare abstract class CircleInterceptLegCalculator extends AbstractFlightPathLegCalculator {
    protected readonly includeInitialTurn: boolean;
    private readonly vec3Cache;
    private readonly geoPointCache;
    private readonly geoCircleCache;
    private readonly intersectionCache;
    private readonly turnBuilder;
    private readonly joinGreatCircleToPointBuilder;
    private readonly directToPointBuilder;
    private readonly interceptBuilder;
    private readonly interceptInfo;
    /**
     * Constructor.
     * @param facilityCache This calculator's cache of facilities.
     * @param includeInitialTurn Whether this calculator should calculate an initial turn toward the intercept course.
     */
    constructor(facilityCache: Map<string, Facility>, includeInitialTurn: boolean);
    protected calculateVectors(legs: LegDefinition[], calculateIndex: number, activeLegIndex: number, state: FlightPathState): void;
    private readonly handleInvalidInterceptCache;
    /**
     * Handles cases where the path to intercept cannot be intercepted from a defined starting point and intercept
     * course. Under these cases, vectors will be added to the flight path vector sequence to define a path from the
     * starting point to a point on the path to intercept which does not follow the defined intercept course.
     * @param vectors The flight path vector sequence to which to add the vectors.
     * @param index The index in the sequence at which to add the vectors.
     * @param start The start point.
     * @param startPath The great-circle path defining the initial course.
     * @param interceptPath The great-circle path defining the intercept course.
     * @param pathToInterceptCircle The geo circle defining the path to intercept.
     * @param pathToInterceptStart The start of the path to intercept.
     * @param pathToInterceptEnd The end of the path to intercept.
     * @param pathToInterceptAngularWidth The angular width of the path to intercept, in radians.
     * @param desiredTurnRadius The desired turn radius, in meters.
     * @param onlyHandleInitialPointPastIntercept Whether to only handle cases where the start point is located beyond
     * the path to intercept as measured along the intercept course.
     * @returns The number of vectors added to the sequence, or undefined if the case was not handled.
     */
    private handleInvalidIntercept;
    /**
     * Gets the true intercept course bearing defined by a flight plan leg.
     * @param legs A sequence of leg definitions.
     * @param index The index in the sequence of the leg from which to get the course.
     * @param state The current flight path state.
     * @returns The true intercept course bearing defined by the flight plan leg, or undefined if it could not be
     * determined.
     */
    protected abstract getInterceptCourse(legs: LegDefinition[], index: number, state: FlightPathState): number | undefined;
    /**
     * Gets the geo circle path to intercept defined by a flight plan leg.
     * @param legs A sequence of leg definitions.
     * @param index The index in the sequence of the leg from which to get the course.
     * @param state The current flight path state.
     * @param out The path info object to which to write the result.
     * @returns Information on the geo circle path to intercept defined by the flight plan leg.
     */
    protected abstract getInterceptPathInfo(legs: LegDefinition[], index: number, state: FlightPathState, out: CircleInterceptPathInfo): CircleInterceptPathInfo;
}
/**
 * Calculates flight path vectors for course to DME legs.
 */
export declare class CourseToDMELegCalculator extends CircleInterceptLegCalculator {
    private readonly dmeCircle;
    /**
     * Constructor.
     * @param facilityCache This calculator's cache of facilities.
     */
    constructor(facilityCache: Map<string, Facility>);
    /** @inheritdoc */
    protected getInterceptCourse(legs: LegDefinition[], index: number): number | undefined;
    /** @inheritdoc */
    protected getInterceptPathInfo(legs: LegDefinition[], index: number, state: FlightPathState, out: CircleInterceptPathInfo): CircleInterceptPathInfo;
}
/**
 * Calculates flight path vectors for course to radial intercept legs.
 */
export declare class CourseToRadialLegCalculator extends CircleInterceptLegCalculator {
    private readonly radialCircle;
    /**
     * Constructor.
     * @param facilityCache This calculator's cache of facilities.
     */
    constructor(facilityCache: Map<string, Facility>);
    /** @inheritdoc */
    protected getInterceptCourse(legs: LegDefinition[], index: number): number | undefined;
    /** @inheritdoc */
    protected getInterceptPathInfo(legs: LegDefinition[], index: number, state: FlightPathState, out: CircleInterceptPathInfo): CircleInterceptPathInfo;
}
/**
 * Calculates flight path vectors for fix to DME legs.
 */
export declare class FixToDMELegCalculator extends CircleInterceptLegCalculator {
    private readonly dmeCircle;
    /**
     * Constructor.
     * @param facilityCache This calculator's cache of facilities.
     */
    constructor(facilityCache: Map<string, Facility>);
    /** @inheritdoc */
    protected getInterceptCourse(legs: LegDefinition[], index: number): number | undefined;
    /** @inheritdoc */
    protected getInterceptPathInfo(legs: LegDefinition[], index: number, state: FlightPathState, out: CircleInterceptPathInfo): CircleInterceptPathInfo;
}
/**
 * Calculates flight path vectors for course to intercept legs.
 */
export declare class CourseToInterceptLegCalculator extends CircleInterceptLegCalculator {
    /**
     * Constructor.
     * @param facilityCache This calculator's cache of facilities.
     */
    constructor(facilityCache: Map<string, Facility>);
    /** @inheritdoc */
    protected getInterceptCourse(legs: LegDefinition[], index: number, state: FlightPathState): number | undefined;
    /** @inheritdoc */
    protected getInterceptPathInfo(legs: LegDefinition[], index: number, state: FlightPathState, out: CircleInterceptPathInfo): CircleInterceptPathInfo;
    private readonly predictLegPathCache;
    /**
     * Predicts the path of a leg. If a prediction cannot be made, NaN will be written to all fields of the result.
     * @param legs A leg sequence.
     * @param index The index of the leg in the sequence.
     * @param out A GeoCircle to which to write the result.
     * @returns the predicted path of the leg.
     */
    private predictLegPath;
}
/**
 * Calculates flight path vectors for track from fix legs.
 */
export declare class TrackFromFixLegCalculator extends AbstractFlightPathLegCalculator {
    protected readonly geoPointCache: GeoPoint[];
    protected readonly geoCircleCache: GeoCircle[];
    protected readonly vectorBuilder: GreatCircleBuilder;
    /**
     * Constructor.
     * @param facilityCache This calculator's cache of facilities.
     */
    constructor(facilityCache: Map<string, Facility>);
    protected calculateVectors(legs: LegDefinition[], calculateIndex: number, activeLegIndex: number, state: FlightPathState): void;
}
/**
 * Calculates flight path vectors for course to fix legs.
 */
export declare class CourseToFixLegCalculator extends AbstractFlightPathLegCalculator {
    protected readonly vec3Cache: Float64Array[];
    protected readonly geoPointCache: GeoPoint[];
    protected readonly geoCircleCache: GeoCircle[];
    protected readonly greatCircleBuilder: GreatCircleBuilder;
    protected readonly joinGreatCircleToPointBuilder: JoinGreatCircleToPointBuilder;
    protected readonly procTurnBuilder: ProcedureTurnBuilder;
    /**
     * Constructor.
     * @param facilityCache This calculator's cache of facilities.
     */
    constructor(facilityCache: Map<string, Facility>);
    protected calculateVectors(legs: LegDefinition[], calculateIndex: number, activeLegIndex: number, state: FlightPathState): void;
}
/**
 * Calculates flight path vectors for procedure turn legs.
 */
export declare class ProcedureTurnLegCalculator extends AbstractFlightPathLegCalculator {
    protected readonly geoPointCache: GeoPoint[];
    protected readonly geoCircleCache: GeoCircle[];
    protected readonly greatCircleBuilder: GreatCircleBuilder;
    protected readonly joinGreatCircleToPointBuilder: JoinGreatCircleToPointBuilder;
    protected readonly procTurnBuilder: ProcedureTurnBuilder;
    /**
     * Constructor.
     * @param facilityCache This calculator's cache of facilities.
     */
    constructor(facilityCache: Map<string, Facility>);
    protected calculateVectors(legs: LegDefinition[], calculateIndex: number, activeLegIndex: number, state: FlightPathState): void;
    /**
     * Predicts the final true course of a leg at its terminator fix.
     * @param legs A leg sequence.
     * @param index The index of the leg in the sequence.
     * @param terminator The location of the leg's terminator fix.
     * @returns the predicted final course of a leg at its terminator fix, or undefined if a prediction cannot be made.
     */
    private predictLegFinalTrueCourse;
    /**
     * Predicts the initial true course of a leg at its origin fix.
     * @param legs A leg sequence.
     * @param index The index of the leg in the sequence.
     * @param origin The location of the leg's origin.
     * @returns the predicted final course of a leg at its terminator fix, or undefined if a prediction cannot be made.
     */
    private predictLegInitialTrueCourse;
}
/**
 * Calculates flight path vectors for course to manual legs.
 */
export declare class CourseToManualLegCalculator extends AbstractFlightPathLegCalculator {
    protected readonly geoPointCache: GeoPoint[];
    protected readonly greatCircleBuilder: GreatCircleBuilder;
    /**
     * Constructor.
     * @param facilityCache This calculator's cache of facilities.
     */
    constructor(facilityCache: Map<string, Facility>);
    protected calculateVectors(legs: LegDefinition[], calculateIndex: number, activeLegIndex: number, state: FlightPathState): void;
}
/**
 * Calculates flight path vectors for course to altitude legs.
 */
export declare class CourseToAltitudeLegCalculator extends AbstractFlightPathLegCalculator {
    protected readonly vec3Cache: Float64Array[];
    protected readonly geoPointCache: GeoPoint[];
    protected readonly geoCircleCache: GeoCircle[];
    protected readonly greatCircleBuilder: GreatCircleBuilder;
    /**
     * Constructor.
     * @param facilityCache This calculator's cache of facilities.
     */
    constructor(facilityCache: Map<string, Facility>);
    protected calculateVectors(legs: LegDefinition[], calculateIndex: number, activeLegIndex: number, state: FlightPathState): void;
}
/**
 * Calculates flight path vectors for hold legs.
 */
export declare class HoldLegCalculator extends AbstractFlightPathLegCalculator {
    protected readonly geoPointCache: GeoPoint[];
    protected readonly geoCircleCache: GeoCircle[];
    protected readonly greatCircleBuilder: GreatCircleBuilder;
    protected readonly circleVectorBuilder: CircleVectorBuilder;
    protected readonly turnToCourseBuilder: TurnToCourseBuilder;
    protected readonly joinGreatCircleToPointBuilder: JoinGreatCircleToPointBuilder;
    protected readonly procTurnBuilder: ProcedureTurnBuilder;
    /**
     * Constructor.
     * @param facilityCache This calculator's cache of facilities.
     */
    constructor(facilityCache: Map<string, Facility>);
    protected calculateVectors(legs: LegDefinition[], calculateIndex: number, activeLegIndex: number, state: FlightPathState): void;
}
//# sourceMappingURL=FlightPathLegCalculator.d.ts.map