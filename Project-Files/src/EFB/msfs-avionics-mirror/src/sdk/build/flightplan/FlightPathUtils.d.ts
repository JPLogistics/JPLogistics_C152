import { GeoCircle, GeoPoint, LatLonInterface, ReadonlyFloat64Array } from '..';
import { CircleVector, FlightPathVector, LegCalculations, VectorTurnDirection } from './FlightPlanning';
/**
 * Utility class for working with flight path calculations.
 */
export declare class FlightPathUtils {
    private static readonly vec3Cache;
    private static readonly geoPointCache;
    private static readonly geoCircleCache;
    /**
     * Creates an empty arc vector.
     * @returns An empty arc vector.
     */
    static createEmptyCircleVector(): CircleVector;
    /**
     * Sets the parameters of a circle vector.
     * @param vector The circle vector to set.
     * @param circle The GeoCircle defining the vector's path.
     * @param start The start of the vector.
     * @param end The end of the vector.
     * @param flags The flags to set on the vector.
     * @returns The circle vector, after its parameters have been set.
     */
    static setCircleVector(vector: CircleVector, circle: GeoCircle, start: ReadonlyFloat64Array | LatLonInterface, end: ReadonlyFloat64Array | LatLonInterface, flags: number): CircleVector;
    /**
     * Checks whether a circle vector describes a great-circle path.
     * @param vector A flight path circle vector.
     * @returns Whether the vector describes a great-circle path.
     */
    static isVectorGreatCircle(vector: CircleVector): boolean;
    /**
     * Sets the parameters of a GeoCircle from a flight path circle vector.
     * @param vector A flight path circle vector.
     * @param out The GeoCircle to set.
     * @returns The GeoCircle, after its parameters have been set.
     */
    static setGeoCircleFromVector(vector: CircleVector, out: GeoCircle): GeoCircle;
    /**
     * Gets the initial true course bearing of a flight path vector.
     * @param vector A flight path vector.
     * @returns The initial true course bearing of the vector, or undefined if one could not be calculated.
     */
    static getVectorInitialCourse(vector: FlightPathVector): number;
    /**
     * Gets the final true course bearing of a flight path vector.
     * @param vector A flight path vector.
     * @returns The final true course bearing of the vector, or `undefined` if one could not be calculated.
     */
    static getVectorFinalCourse(vector: FlightPathVector): number;
    /**
     * Gets the final position of a calculated leg.
     * @param legCalc A set of leg calculations.
     * @param out The GeoPoint object to which to write the result.
     * @returns The final position of the leg, or `undefined` if one could not be obtained.
     */
    static getLegFinalPosition(legCalc: LegCalculations, out: GeoPoint): GeoPoint | undefined;
    /**
     * Gets the final true course of a calculated leg.
     * @param legCalc A set of leg calculations.
     * @returns The final true course of the leg, or `undefined` if one could not be obtained.
     */
    static getLegFinalCourse(legCalc: LegCalculations): number | undefined;
    /**
     * Gets the circle describing the path of a turn.
     * @param center The center of the turn.
     * @param radius The radius of the turn, in great-arc radians.
     * @param turnDirection The direction of the turn.
     * @param out A GeoCircle object to which to write the result.
     * @returns The circle describing the path of the turn.
     */
    static getTurnCircle(center: ReadonlyFloat64Array | LatLonInterface, radius: number, turnDirection: VectorTurnDirection, out: GeoCircle): GeoCircle;
    /**
     * Reverses the direction of a turn circle while keeping the turn center and turn radius constant.
     * @param circle The turn circle to reverse.
     * @param out A GeoCircle object to which to write the result.
     * @returns A turn circle which has the same turn center and turn radius, but the opposite direction as `circle`.
     */
    static reverseTurnCircle(circle: GeoCircle, out: GeoCircle): GeoCircle;
    /**
     * Gets the direction of a turn described by a circle.
     * @param circle The geo circle describing the turn.
     * @returns The direction of the turn described by the circle.
     */
    static getTurnDirectionFromCircle(circle: GeoCircle): VectorTurnDirection;
    /**
     * Gets the radius of a turn described by a circle.
     * @param circle The geo circle describing the turn.
     * @returns The radius of the turn described by the circle, in great-arc radians.
     */
    static getTurnRadiusFromCircle(circle: GeoCircle): number;
    /**
     * Gets the center of a turn described by a circle.
     * @param circle The geo circle describing the turn.
     * @param out A GeoPoint or 3D vector object to which to write the result.
     * @returns The center of a turn described by the circle.
     */
    static getTurnCenterFromCircle<T extends GeoPoint | Float64Array>(circle: GeoCircle, out: T): T;
    /**
     * Gets the signed distance along an arc from a defined start point to a query point. The start, query, and end
     * points will be projected onto the arc's parent circle if they do not already lie on it. A negative distance
     * indicates that the query point lies somewhere before the start of the arc but after the point on the arc's parent
     * circle that is diametrically opposed to the midpoint of the arc.
     * @param circle The arc's parent circle.
     * @param start The start point of the arc.
     * @param end The end point of the arc.
     * @param pos The query point.
     * @param tolerance The error tolerance, in great-arc radians, when checking if `start` and `query` are equal.
     * Defaults to `GeoCircle.ANGULAR_TOLERANCE` if not specified.
     * @returns The signed distance along the arc from the start point to the query point, in great-arc radians.
     */
    static getAlongArcSignedDistance(circle: GeoCircle, start: ReadonlyFloat64Array | LatLonInterface, end: ReadonlyFloat64Array | LatLonInterface, pos: ReadonlyFloat64Array | LatLonInterface, tolerance?: number): number;
    /**
     * Gets the normalized distance along an arc from a defined start point to a query point. The start, query, and end
     * points will be projected onto the arc's parent circle if they do not already lie on it. The distance is normalized
     * such that 1 equals the arc length from the start point to the end point. A negative distance indicates that the
     * query point lies somewhere before the start of the arc but after the point on the arc's parent circle that is
     * diametrically opposed to the midpoint of the arc.
     * @param circle The arc's parent circle.
     * @param start The start point of the arc.
     * @param end The end point of the arc.
     * @param pos The query point.
     * @param tolerance The error tolerance, in great-arc radians, when checking if `start` and `query` are equal.
     * Defaults to `GeoCircle.ANGULAR_TOLERANCE` if not specified.
     * @returns The normalized distance along the arc from the start point to the query point.
     */
    static getAlongArcNormalizedDistance(circle: GeoCircle, start: ReadonlyFloat64Array | LatLonInterface, end: ReadonlyFloat64Array | LatLonInterface, pos: ReadonlyFloat64Array | LatLonInterface, tolerance?: number): number;
    /**
     * Checks if a point lies between the start and end points (inclusive) of an arc along a geo circle. The start, end,
     * and query points will be projected onto the arc's parent circle if they do not already lie on it.
     * @param circle The arc's parent circle.
     * @param start The start point of the arc.
     * @param end The end point of the arc.
     * @param pos The query point.
     * @param tolerance The error tolerance, in great-arc radians.
     * @returns Whether the query point lies between the start and end points (inclusive) of the specified arc.
     */
    static isPointAlongArc(circle: GeoCircle, start: ReadonlyFloat64Array | LatLonInterface, end: ReadonlyFloat64Array | LatLonInterface, pos: ReadonlyFloat64Array | LatLonInterface, tolerance?: number): boolean;
    /**
     * Checks if a point lies between the start and end points (inclusive) of an arc along a geo circle. The start and
     * query points will be projected onto the arc's parent circle if they do not already lie on it.
     * @param circle The arc's parent circle.
     * @param start The start point of the arc.
     * @param angularWidth The angular width of the arc, in radians.
     * @param pos The query point.
     * @param tolerance The error tolerance, in great-arc radians.
     * @returns Whether the query point lies between the start and end points (inclusive) of the specified arc.
     */
    static isPointAlongArc(circle: GeoCircle, start: ReadonlyFloat64Array | LatLonInterface, angularWidth: number, pos: ReadonlyFloat64Array | LatLonInterface, tolerance?: number): boolean;
    /**
     * Resolves the ingress to egress vectors for a set of flight plan leg calculations. This operation will populate the
     * `ingressToEgress` array with a sequence of vectors connecting the ingress transition to the egress transition
     * while following the flight path defined by the vectors in the `flightPath` array.
     * @param legCalc A set of flight plan leg calculations.
     * @returns The flight plan leg calculations, after the ingress to egress vectors have been resolved.
     */
    static resolveIngressToEgress<T extends LegCalculations>(legCalc: T): T;
}
//# sourceMappingURL=FlightPathUtils.d.ts.map