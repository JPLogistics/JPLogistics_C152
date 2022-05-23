import { GeoCircle, LatLonInterface, ReadonlyFloat64Array } from '..';
import { FlightPathVector, FlightPathVectorFlags, VectorTurnDirection } from './FlightPlanning';
/**
 * Builds circle vectors.
 */
export declare class CircleVectorBuilder {
    private static readonly geoCircleCache;
    /**
     * Builds a circle vector and adds it to a sequence.
     * @param vectors The flight path vector sequence to which to add the vector.
     * @param index The index in the sequence at which to add the vector.
     * @param direction The direction of the circle.
     * @param radius The radius of the circle, in meters.
     * @param center The center of the circle.
     * @param start The start point.
     * @param end The end point.
     * @param flags The flags to set on the vector. Defaults to none (0).
     * @returns The number of vectors added to the sequence, which is always equal to 1.
     */
    build(vectors: FlightPathVector[], index: number, direction: VectorTurnDirection, radius: number, center: ReadonlyFloat64Array | LatLonInterface, start: ReadonlyFloat64Array | LatLonInterface, end: ReadonlyFloat64Array | LatLonInterface, flags?: number): 1;
    /**
     * Builds a circle vector and adds it to a sequence.
     * @param vectors The flight path vector sequence to which to add the vector.
     * @param index The index in the sequence at which to add the vector.
     * @param circle The circle which defines the vector path.
     * @param start The start point.
     * @param end The end point.
     * @param flags The flags to set on the vector. Defaults to none (0).
     * @returns The number of vectors added to the sequence, which is always equal to 1.
     */
    build(vectors: FlightPathVector[], index: number, circle: GeoCircle, start: ReadonlyFloat64Array | LatLonInterface, end: ReadonlyFloat64Array | LatLonInterface, flags?: number): 1;
    /**
     * Sets the parameters for a circle vector in a flight path vector sequence. If a circle vector does not exist at the
     * specified index in the sequence, a new one will be created.
     * @param vectors A flight path vector sequence.
     * @param index The index in the sequence at which to set the circle vector.
     * @param direction The direction of the circle.
     * @param radius The radius of the circle, in meters.
     * @param center The center of the circle.
     * @param start The start point.
     * @param end The end point.
     * @param flags The flags to set on the vector. Defaults to none (0).
     * @returns The set circle vector.
     */
    private setFromPoints;
    /**
     * Sets the parameters for a circle vector in a flight path vector sequence. If a circle vector does not exist at the
     * specified index in the sequence, a new one will be created.
     * @param vectors A flight path vector sequence.
     * @param index The index in the sequence at which to set the circle vector.
     * @param circle The circle which defines the vector path.
     * @param start The start point.
     * @param end The end point.
     * @param flags The flags to set on the vector. Defaults to none (0).
     * @returns The set circle vector.
     */
    private setFromCircle;
}
/**
 * Builds great-circle paths between defined start and end points.
 */
export declare class GreatCircleBuilder {
    private static readonly vec3Cache;
    private static readonly geoPointCache;
    private static readonly geoCircleCache;
    private readonly circleVectorBuilder;
    /**
     * Builds a sequence of vectors representing a great-circle path between two points. The great circle path chosen is
     * the shortest great-circle path between the two points.
     * @param vectors The flight path vector sequence to which to add the vectors.
     * @param index The index in the sequence at which to add the vectors.
     * @param start The start point.
     * @param end The end point.
     * @param initialCourse The initial true course bearing. Used to define a unique great-circle path when `start` and
     * `end` are antipodal.
     * @param flags The flags to set on the vector. Defaults to none (0).
     * @throws Error if `start` and `end` are antipodal and `initialCourse` is undefined.
     */
    build(vectors: FlightPathVector[], index: number, start: ReadonlyFloat64Array | LatLonInterface, end: ReadonlyFloat64Array | LatLonInterface, initialCourse?: number, flags?: number): number;
    /**
     * Builds a sequence of vectors representing a great-circle path between two points.
     * @param vectors The flight path vector sequence to which to add the vectors.
     * @param index The index in the sequence at which to add the vectors.
     * @param start The start point.
     * @param path The great-circle path.
     * @param end The end point.
     * @param flags The flags to set on the vector. Defaults to none (0).
     */
    build(vectors: FlightPathVector[], index: number, start: ReadonlyFloat64Array | LatLonInterface, path: GeoCircle, end: ReadonlyFloat64Array | LatLonInterface, flags?: number): number;
    /**
     * Builds a sequence of vectors representing a great-circle path between two points. The end point is chosen such
     * that it is offset from the start point by a specified distance.
     * @param vectors
     * @param index The index in the sequence at which to add the vectors.
     * @param start The start point.
     * @param path The great-circle path.
     * @param distance The distance along the path between the start and end points, in meters.
     * @param flags The flags to set on the vector. Defaults to none (0).
     */
    build(vectors: FlightPathVector[], index: number, start: ReadonlyFloat64Array | LatLonInterface, path: GeoCircle, distance: number, flags?: number): number;
    /**
     * Builds a sequence of vectors representing the shortest great-circle path between two points.
     * @param vectors The flight path vector sequence to which to add the vectors.
     * @param index The index in the sequence at which to add the vectors.
     * @param start The start point.
     * @param end The end point.
     * @param initialCourse The initial true course bearing. Used to define a unique great-circle path when `start` and
     * `end` are antipodal.
     * @param flags The flags to set on the vector. Defaults to none (0).
     * @returns The number of vectors added to the sequence.
     * @throws Error if `start` and `end` are antipodal and `initialCourse` is undefined.
     */
    private buildFromEndpoints;
    /**
     * Builds a sequence of vectors representing a great-circle path from a start point to either a defined endpoint
     * or a distance offset.
     * @param vectors The flight path vector sequence to which to add the vectors.
     * @param index The index in the sequence at which to add the vectors.
     * @param start The start point.
     * @param path The great-circle path.
     * @param endArg The end point or distance offset.
     * @param flags The flags to set on the vector. Defaults to none (0).
     * @returns The number of vectors added to the sequence.
     * @throws Error if `path` is not a great circle.
     */
    private buildFromPath;
}
/**
 * Builds constant-radius turns toward specified course bearings.
 */
export declare class TurnToCourseBuilder {
    private static readonly geoPointCache;
    private readonly circleVectorBuilder;
    /**
     * Adds a turn from a defined start point and initial course to a specific final course to a flight path vector
     * sequence.
     * @param vectors The flight path vector sequence to which to add the turn.
     * @param index The index in the sequence at which to add the turn.
     * @param start The start point of the turn.
     * @param radius The radius of the turn, in meters.
     * @param direction The direction of the turn.
     * @param fromCourse The initial true course at the start of the turn.
     * @param toCourse The final true course at the end of the turn.
     * @param flags The flags to set on the turn vector. Defaults to the `TurnToCourse` flag.
     * @returns The number of vectors added to the sequence.
     */
    build(vectors: FlightPathVector[], index: number, start: ReadonlyFloat64Array | LatLonInterface, radius: number, direction: VectorTurnDirection, fromCourse: number, toCourse: number, flags?: FlightPathVectorFlags): 1;
}
/**
 * Builds great-circle paths to intercept other geo circles.
 */
export declare class CircleInterceptBuilder {
    private static readonly geoCircleCache;
    private static readonly intersectionCache;
    private readonly greatCircleBuilder;
    private readonly circleVectorBuilder;
    /**
     * Builds a sequence of vectors representing a great-circle path from a defined start point to an intersection with
     * another geo circle.
     * @param vectors The flight path vector sequence to which to add the vectors.
     * @param index The index in the sequence at which to add the vectors.
     * @param start The start point.
     * @param course The initial true course bearing.
     * @param circle The circle to intercept.
     * @param flags The flags to set on the vector. Defaults to none (0).
     * @returns The number of vectors added to the sequence.
     */
    build(vectors: FlightPathVector[], index: number, start: ReadonlyFloat64Array | LatLonInterface, course: number, circle: GeoCircle, flags?: number): number;
    /**
     * Builds a sequence of vectors representing a path from a defined start point to an intersection with another geo
     * circle.
     * @param vectors The flight path vector sequence to which to add the vectors.
     * @param index The index in the sequence at which to add the vectors.
     * @param start The start point.
     * @param startPath The initial path.
     * @param circle The circle to intercept.
     * @param flags The flags to set on the vector. Defaults to none (0).
     * @returns The number of vectors added to the sequence.
     * @throws Error if `start` does not lie on `startPath`.
     */
    build(vectors: FlightPathVector[], index: number, start: ReadonlyFloat64Array | LatLonInterface, startPath: GeoCircle, circle: GeoCircle, flags?: number): number;
}
/**
 * Builds constant-radius turns to join great-circle paths.
 */
export declare class TurnToJoinGreatCircleBuilder {
    private static readonly vec3Cache;
    private static readonly geoCircleCache;
    private readonly circleVectorBuilder;
    /**
     * Builds an arc representing a turn from a defined start point and initial course toward a defined target great-
     * circle path, ending at the point in the turn circle which is closest to the target path.
     * @param vectors The flight path vector sequence to which to add the vectors.
     * @param index The index in the sequence at which to add the vectors.
     * @param start The start point.
     * @param startCourse The initial true course bearing.
     * @param endPath The great-circle path defining the target course.
     * @param radius The radius of the turn, in meters.
     * @param flags The flags to set on the turn vector. Defaults to the `TurnToCourse` flag.
     * @returns The number of vectors added to the sequence, which is always equal to 1.
     * @throws Error if `endPath` is not a great circle.
     */
    build(vectors: FlightPathVector[], index: number, start: ReadonlyFloat64Array | LatLonInterface, startCourse: number, endPath: GeoCircle, radius: number, flags?: number): 1;
    /**
     * Builds an arc representing a turn from a defined start point and initial course toward a defined target great-
     * circle path, ending at the point in the turn circle which is closest to the target path.
     * @param vectors The flight path vector sequence to which to add the vectors.
     * @param index The index in the sequence at which to add the vectors.
     * @param start The start point.
     * @param startPath The great-circle path defining the initial course.
     * @param endPath The great-circle path defining the target course.
     * @param radius The radius of the turn, in meters.
     * @param flags The flags to set on the turn vector. Defaults to the `TurnToCourse` flag.
     * @returns The number of vectors added to the sequence, which is always equal to 1.
     * @throws Error if `startPath` or `endPath` is not a great circle, or if `start` does not lie on `startPath`.
     */
    build(vectors: FlightPathVector[], index: number, start: ReadonlyFloat64Array | LatLonInterface, startPath: GeoCircle, endPath: GeoCircle, radius: number, flags?: number): 1;
}
/**
 * Builds paths to connect two geo circles.
 */
export declare class ConnectCirclesBuilder {
    private static readonly vec3Cache;
    private static readonly geoCircleCache;
    private static readonly intersectionCache;
    private readonly circleVectorBuilder;
    /**
     * Builds a sequence of vectors representing a path which consists of a single geo circle which connects two other
     * circles and optionally paths to link the connecting circle with a start point on the from circle and an end point
     * on the to circle.
     * @param vectors The flight path vector sequence to which to add the vectors.
     * @param index The index in the sequence at which to add the vectors.
     * @param fromCircle The circle from which to add the connecting circle.
     * @param toCircle The circle to which to add the connecting circle.
     * @param radius The radius, in meters, of the circle to join the two circles. If not defined, defaults to pi / 2
     * times the radius of the Earth (and therefore the connecting circle will be a great circle).
     * @param from The starting point along `fromCircle`. If not defined, this will be assumed to be equal to the
     * point where the connecting circle meets `fromCircle`.
     * @param to The ending point along `toCircle`. If not defined, this will be assumed to be equal to the point where
     * the connecting circle meets `toCircle`.
     * @param fromCircleVectorFlags The flags to set on the vector along `fromCircle`. Defaults to none (0).
     * @param toCircleVectorFlags The flags to set on the vector along the `toCircle`. Defaults to none (0).
     * @param connectVectorFlags The flags to set on the vector connecting `fromCircle` to `toCircle`. Defaults to none
     * (0).
     * @returns The number of vectors added to the sequence.
     */
    build(vectors: FlightPathVector[], index: number, fromCircle: GeoCircle, toCircle: GeoCircle, radius?: number, from?: ReadonlyFloat64Array | LatLonInterface, to?: ReadonlyFloat64Array | LatLonInterface, fromCircleVectorFlags?: number, toCircleVectorFlags?: number, connectVectorFlags?: number): number;
    /**
     * Finds a GeoCircle which connects (is tangent to) two other circles.
     * @param fromCircle The circle at the beginning of the connecting circle.
     * @param toCircle The circle at the end of the connecting circle.
     * @param radius The desired radius of the connecting circle, in great-arc radians.
     * @param out A GeoCircle object to which to write the result.
     * @param from The starting point along `fromCircle`. If not defined, this will be assumed to be equal to the
     * point where the connecting circle meets `fromCircle`.
     * @param to The ending point along `toCircle`. If not defined, this will be assumed to be equal to the point where
     * the connecting circle meets `toCircle`.
     * @returns a GeoCircle which connects the two circles, or null if one could not be found.
     */
    private findCircleToJoinCircles;
    /**
     * Calculates the total distance along the joining path between two circles.
     * @param fromCircle The circle at the beginning of the connecting circle.
     * @param toCircle The circle at the end of the connecting circle.
     * @param joinCircle The connecting circle.
     * @param from The starting point along `fromCircle`. If not defined, this will be assumed to be equal to the
     * point where the connecting circle meets `fromCircle`.
     * @param to The ending point along `toCircle`. If not defined, this will be assumed to be equal to the point where
     * the connecting circle meets `toCircle`.
     * @returns the total distance along the joining path, in great-arc radians.
     */
    private calculateJoinCirclesPathDistance;
}
/**
 * Builds paths connecting initial great circle paths to final great circle paths via a turn starting at the start
 * point and a turn ending at the end point, connected by a great-circle path.
 */
export declare class TurnToJoinGreatCircleAtPointBuilder {
    private static readonly vec3Cache;
    private static readonly geoCircleCache;
    private readonly connectCirclesBuilder;
    /**
     * Builds a sequence of vectors representing a path from a defined start point and initial course which turns and
     * connects with another turn via a great-circle path to terminate at a defined end point and final course.
     * @param vectors The flight path vector sequence to which to add the vectors.
     * @param index The index in the sequence at which to add the vectors.
     * @param start The start point.
     * @param startPath The great-circle path defining the initial course.
     * @param startTurnRadius The radius of the initial turn, in meters.
     * @param startTurnDirection The direction of the initial turn.
     * @param end The end point.
     * @param endPath The great-circle path defining the final course.
     * @param endTurnRadius The radius of the final turn, in meters.
     * @param endTurnDirection The direction of the final turn.
     * @param startTurnVectorFlags The flags to set on the initial turn vector. Defaults to none (0).
     * @param endTurnVectorFlags The flags to set on the final turn vector. Defaults to none (0).
     * @param connectVectorFlags The flags to set on the vector along the great-circle path connecting the turns.
     * Defaults to none (0).
     * @returns The number of vectors added to the sequence.
     */
    build(vectors: FlightPathVector[], index: number, start: ReadonlyFloat64Array | LatLonInterface, startPath: GeoCircle, startTurnRadius: number, startTurnDirection: VectorTurnDirection, end: ReadonlyFloat64Array | LatLonInterface, endPath: GeoCircle, endTurnRadius: number, endTurnDirection: VectorTurnDirection, startTurnVectorFlags?: number, endTurnVectorFlags?: number, connectVectorFlags?: number): number;
}
/**
 * Builds paths connecting initial great-circle paths to final great-circle paths terminating at defined end points.
 */
export declare class JoinGreatCircleToPointBuilder {
    private static readonly vec3Cache;
    private static readonly geoCircleCache;
    private static readonly intersectionCache;
    private readonly circleVectorBuilder;
    private readonly greatCircleBuilder;
    private readonly connectCirclesBuilder;
    private readonly turnToJoinGreatCircleBuilder;
    private readonly turnToJoinGreatCircleAtPointBuilder;
    /**
     * Builds a sequence of vectors representing a path from a defined start point and initial course which turns and
     * joins a great-circle path which terminates at a defined end point.
     * @param vectors The flight path vector sequence to which to add the vectors.
     * @param index The index in the sequence at which to add the vectors.
     * @param start The start point.
     * @param startPath The great-circle path defining the initial course.
     * @param end The end point.
     * @param endPath The great-circle path defining the final course.
     * @param desiredTurnDirection The desired initial turn direction. If not defined, the most efficient turn direction
     * that satisfies the constraints will be chosen.
     * @param minTurnRadius The minimum turn radius, in meters. Defaults to 0.
     * @param preferSingleTurn Whether to prefer flight path solutions that consist of a single constant-radius turn
     * from the initial to final course. False by default.
     * @param intersection The point of intersection between the start and end paths closest to the start point. If
     * not defined, it will be calculated.
     * @param flags The flags to set on the vectors. Defaults to none (0).
     * @param includeTurnToCourseFlag Whether to include the `TurnToCourse` flag on the turn vectors. True by default.
     * @returns The number of vectors added to the sequence.
     */
    build(vectors: FlightPathVector[], index: number, start: ReadonlyFloat64Array | LatLonInterface, startPath: GeoCircle, end: ReadonlyFloat64Array | LatLonInterface, endPath: GeoCircle, desiredTurnDirection?: VectorTurnDirection, minTurnRadius?: number, preferSingleTurn?: boolean, intersection?: ReadonlyFloat64Array, flags?: number, includeTurnToCourseFlag?: boolean): number;
}
/**
 * Builds procedure turns.
 */
export declare class ProcedureTurnBuilder {
    private static readonly vec3Cache;
    private static readonly geoPointCache;
    private static readonly geoCircleCache;
    private static readonly intersectionCache;
    private readonly greatCircleBuilder;
    private readonly circleVectorBuilder;
    /**
     * Builds a sequence of vectors representing a procedure turn from a defined starting point and initial course to a
     * defined end point and final course. A procedure turn begins with a variable-length leg from the start point along
     * the initial course followed by an initial turn to intercept the outbound leg of the procedure turn, then a
     * variable-length outbound leg, a 180-degree turn, a variable-length inbound leg, and finally a turn to intercept
     * the final course at the end point. If a full set of vectors cannot be computed given the restraints imposed by the
     * path geometry and the desired turn radius, parts of the turn beginning with the inbound leg of the procedure turn
     * may be altered or omitted entirely.
     * @param vectors The flight path vector sequence to which to add the vectors.
     * @param index The index in the sequence at which to add the vectors.
     * @param start The start point.
     * @param startPath The great-circle path defining the initial course.
     * @param end The end point.
     * @param endPath The great-circle path defining the final course.
     * @param outboundCourse The true course, in degrees, of the outbound leg of the turn.
     * @param desiredTurnRadius The desired turn radius, in meters.
     * @param desiredTurnDirection The desired turn direction.
     * @param initialCourse The initial course. If not defined, it will be calculated from `startPath` and `start`.
     * @param finalCourse The final course. If not defined, it will be calculated from `endPath` and `end`.
     * @param flags The flags to set on the vectors. Defaults to the `CourseReversal` flag.
     * @param includeTurnToCourseFlag Whether to include the `TurnToCourse` flag on the turn vectors. True by default.
     * @returns The number of vectors added to the sequence.
     */
    build(vectors: FlightPathVector[], index: number, start: ReadonlyFloat64Array | LatLonInterface, startPath: GeoCircle, end: ReadonlyFloat64Array | LatLonInterface, endPath: GeoCircle, outboundCourse: number, desiredTurnRadius: number, desiredTurnDirection?: VectorTurnDirection, initialCourse?: number, finalCourse?: number, flags?: FlightPathVectorFlags, includeTurnToCourseFlag?: boolean): number;
}
/**
 * Builds paths directly connecting a defined initial point and course and a defined end point.
 */
export declare class DirectToPointBuilder {
    private static readonly vec3Cache;
    private static readonly geoPointCache;
    private static readonly geoCircleCache;
    private readonly circleVectorBuilder;
    private readonly greatCircleBuilder;
    /**
     * Builds a sequence of vectors representing a path which consists of an optional turn from an initial point and
     * course toward an end point followed by an optional great-circle path terminating at the end point.
     * @param vectors The flight path vector sequence to which to add the vectors.
     * @param index The index in the sequence at which to add the vectors.
     * @param start The start point.
     * @param startPath The great-circle path defining the initial course.
     * @param end The end point.
     * @param desiredTurnRadius The desired turn radius, in meters.
     * @param desiredTurnDirection The desired turn direction. If undefined, a turn direction will be chosen such that
     * the initial turn is always toward the end point.
     * @param flags The flags to set on the vectors. Defaults to none (0).
     * @param includeTurnToCourseFlag Whether to include the `TurnToCourse` flag on the turn vectors. True by default.
     * @returns The number of vectors added to the sequence.
     */
    build(vectors: FlightPathVector[], index: number, start: ReadonlyFloat64Array | LatLonInterface, startPath: GeoCircle, end: ReadonlyFloat64Array | LatLonInterface, desiredTurnRadius: number, desiredTurnDirection?: VectorTurnDirection, flags?: number, includeTurnToCourseFlag?: boolean): number;
}
//# sourceMappingURL=FlightPathVectorBuilder.d.ts.map