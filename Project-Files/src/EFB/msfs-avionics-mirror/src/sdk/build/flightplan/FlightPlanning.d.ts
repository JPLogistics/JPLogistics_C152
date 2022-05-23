import { AltitudeRestrictionType, FlightPlanLeg, OneWayRunway } from '../navigation';
/**
 * A flight path vector turn direction.
 */
export declare type VectorTurnDirection = 'left' | 'right';
/**
 * The transition type to which a flight path vector belongs.
 */
export declare enum FlightPathVectorFlags {
    None = 0,
    TurnToCourse = 1,
    Arc = 2,
    HoldInboundLeg = 4,
    HoldOutboundLeg = 8,
    HoldDirectEntry = 16,
    HoldTeardropEntry = 32,
    HoldParallelEntry = 64,
    CourseReversal = 128,
    LegToLegTurn = 256,
    AnticipatedTurn = 512
}
/**
 * A basic flight path vector.
 */
export interface BaseFlightPathVector {
    /** The type of vector. */
    vectorType: string;
    /** Bit flags describing the vector. */
    flags: number;
    /** The latitude of the start of the vector. */
    startLat: number;
    /** The longitude of the start of the vector. */
    startLon: number;
    /** The latitude of the end of the vector. */
    endLat: number;
    /** The longitude of the end of the vector. */
    endLon: number;
    /** The total distance of the vector, in meters. */
    distance: number;
}
/**
 * A flight path vector whose path is defined by a geo circle.
 */
export interface CircleVector extends BaseFlightPathVector {
    /** The type of vector. */
    vectorType: 'circle';
    /** The radius of the circle, in great-arc radians. */
    radius: number;
    /** The x-coordinate of the center of the circle. */
    centerX: number;
    /** The y-coordinate of the center of the circle. */
    centerY: number;
    /** The z-coordinate of the center of the circle. */
    centerZ: number;
}
/**
 * A flight path vector within a leg flight path calculation.
 */
export declare type FlightPathVector = CircleVector;
/**
 * The details of procedures selected in the flight plan.
 */
export declare class ProcedureDetails {
    /** The origin runway object, consisting of the index of the origin runway
     * in the origin runway information and the direction */
    originRunway: OneWayRunway | undefined;
    /** The ICAO for the facility associated with the departure procedure. */
    departureFacilityIcao: string | undefined;
    /** The index of the departure in the origin airport information. */
    departureIndex: number;
    /** The index of the departure transition in the origin airport departure information. */
    departureTransitionIndex: number;
    /** The index of the selected runway in the original airport departure information. */
    departureRunwayIndex: number;
    /** The ICAO for the facility associated with the arrival procedure. */
    arrivalFacilityIcao: string | undefined;
    /** The index of the arrival in the destination airport information. */
    arrivalIndex: number;
    /** The index of the arrival transition in the destination airport arrival information. */
    arrivalTransitionIndex: number;
    /** The index of the selected runway transition at the destination airport arrival information. */
    arrivalRunwayTransitionIndex: number;
    /** The ICAO for the facility associated with the approach procedure. */
    approachFacilityIcao: string | undefined;
    /** The index of the apporach in the destination airport information.*/
    approachIndex: number;
    /** The index of the approach transition in the destination airport approach information.*/
    approachTransitionIndex: number;
    /**
     * The destination runway object, consisting of the index of the destination runway
     * in the destination runway information and the direction
     */
    destinationRunway: OneWayRunway | undefined;
}
/**
 * A prototype for signalling application-specific type metadata for plan segments.
 */
export declare enum FlightPlanSegmentType {
    Origin = "Origin",
    Departure = "Departure",
    Enroute = "Enroute",
    Arrival = "Arrival",
    Approach = "Approach",
    Destination = "Destination",
    MissedApproach = "MissedApproach",
    RandomDirectTo = "RandomDirectTo"
}
/**
 * A segment of a flight plan.
 */
export declare class FlightPlanSegment {
    segmentIndex: number;
    offset: number;
    legs: LegDefinition[];
    segmentType: FlightPlanSegmentType;
    airway?: string | undefined;
    /**
     * Creates a new FlightPlanSegment.
     * @param segmentIndex The index of the segment within the flight plan.
     * @param offset The leg offset within the original flight plan that
     * the segment starts at.
     * @param legs The legs in the flight plan segment.
     * @param segmentType The type of segment this is.
     * @param airway The airway associated with this segment, if any.
     */
    constructor(segmentIndex: number, offset: number, legs: LegDefinition[], segmentType?: FlightPlanSegmentType, airway?: string | undefined);
    /** An empty flight plan segment. */
    static Empty: FlightPlanSegment;
}
/**
 * Metadata about a particular flight plan leg.
 */
export interface LegCalculations {
    /** The initial DTK of the leg. */
    initialDtk: number | undefined;
    /** The leg's total distance in meters, not cut short by ingress/egress turn radii. */
    distance: number;
    /** The cumulative distance in meters up to this point in the flight plan. */
    cumulativeDistance: number;
    /** The leg's total distance in meters, with leg transition turns take into account. */
    distanceWithTransitions: number;
    /** The cumulative distance in meters up to this point, with leg transition turns taken into account. */
    cumulativeDistanceWithTransitions: number;
    /** The latitude of the start of the leg. */
    startLat: number | undefined;
    /** The longitude of the start of the leg. */
    startLon: number | undefined;
    /** The latitude of the end of the leg. */
    endLat: number | undefined;
    /** The longitude of the end of the leg. */
    endLon: number | undefined;
    /** The calculated flight path for the leg. */
    flightPath: FlightPathVector[];
    /** The leg's flight path ingress transition. */
    ingress: FlightPathVector[];
    /** The index of the flight path vector in `flightPath` to which the ingress transition is joined. */
    ingressJoinIndex: number;
    /** The leg's flight path between the ingress and egress transitions. */
    ingressToEgress: FlightPathVector[];
    /** The index of the flight path vector in `flightPath` to which the egress transition is joined. */
    egressJoinIndex: number;
    /** The leg's flight path egress transition. */
    egress: FlightPathVector[];
}
/**
 * Bitflags describing a leg definition.
 */
export declare enum LegDefinitionFlags {
    None = 0,
    DirectTo = 1,
    MissedApproach = 2,
    Obs = 4,
    VectorsToFinal = 8
}
/**
 * Vertical metadata about a flight plan leg.
 */
export interface VerticalData {
    /** The type of altitude restriction for the leg. */
    altDesc: AltitudeRestrictionType;
    /** The first altitude field for restrictions. */
    altitude1: number;
    /** The second altitude field for restrictions. */
    altitude2: number;
    /** The optional speed restriction for this leg. */
    speed?: number;
    /** The speed type/unit. */
    speedDesc?: SpeedType;
    /** The FPA for this constraint, optional. */
    fpa?: number;
}
export declare enum SpeedType {
    IAS = 0,
    MACH = 1
}
/**
 * A definition of a leg in a flight plan.
 */
export interface LegDefinition {
    /** The display name of the leg. */
    readonly name?: string;
    /** The calculated leg data. */
    calculated?: LegCalculations;
    /** The leg of the flight plan. */
    leg: Readonly<FlightPlanLeg>;
    /** Leg definition flags. */
    readonly flags: number;
    /** Vertical Leg Data. All the fields should be readonly except for calculated fields like `fpa`. */
    readonly verticalData: Readonly<VerticalData> & Pick<VerticalData, 'fpa'>;
}
//# sourceMappingURL=FlightPlanning.d.ts.map