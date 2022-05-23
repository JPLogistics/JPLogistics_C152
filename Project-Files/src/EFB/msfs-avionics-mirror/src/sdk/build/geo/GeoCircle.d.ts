import { ReadonlyFloat64Array } from '../math/VecMath';
import { LatLonInterface } from './GeoInterfaces';
import { GeoPoint } from './GeoPoint';
/**
 * A circle on Earth's surface, defined as the set of points on the Earth's surface equidistant (as measured
 * geodetically) from a central point.
 */
export declare class GeoCircle {
    static readonly ANGULAR_TOLERANCE = 1e-7;
    private static readonly NORTH_POLE;
    private static readonly tempGeoPoint;
    private static readonly vec3Cache;
    private static readonly intersectionCache;
    private _center;
    private _radius;
    /**
     * Constructor.
     * @param center The center of the new small circle, represented as a position vector in the standard geographic
     * cartesian reference system.
     * @param radius The radius of the new small circle in great-arc radians.
     */
    constructor(center: ReadonlyFloat64Array, radius: number);
    /**
     * The center of this circle.
     */
    get center(): ReadonlyFloat64Array;
    /**
     * The radius of this circle, in great-arc radians.
     */
    get radius(): number;
    /**
     * Checks whether this circle is a great circle, or equivalently, whether its radius is equal to pi / 2 great-arc
     * radians.
     * @returns Whether this circle is a great circle.
     */
    isGreatCircle(): boolean;
    /**
     * Calculates the length of an arc along this circle subtended by a central angle.
     * @param angle A central angle, in radians.
     * @returns the length of the arc subtended by the angle, in great-arc radians.
     */
    arcLength(angle: number): number;
    /**
     * Sets the center and radius of this circle.
     * @param center The new center.
     * @param radius The new radius in great-arc radians.
     * @returns this circle, after it has been changed.
     */
    set(center: ReadonlyFloat64Array | LatLonInterface, radius: number): this;
    /**
     * Sets this circle to be a great circle which contains two given points. There are two possible great circles that
     * contain any two unique points; these circles differ only by their directionality (equivalently, the sign of their
     * normal vectors). The order of points passed to this method and the right-hand rule determines which of the two is
     * returned.
     * @param point1 The first point that lies on the great circle.
     * @param point2 The second point that lies on the great circle.
     * @returns this circle, after it has been changed.
     */
    setAsGreatCircle(point1: ReadonlyFloat64Array | LatLonInterface, point2: ReadonlyFloat64Array | LatLonInterface): this;
    /**
     * Sets this circle to be a great circle defined by a point and bearing offset, equivalent to the path projected from
     * the point with the specified initial bearing (forward azimuth).
     * @param point A point that lies on the great circle.
     * @param bearing The initial bearing from the point.
     * @returns this circle, after it has been changed.
     */
    setAsGreatCircle(point: ReadonlyFloat64Array | LatLonInterface, bearing: number): this;
    /**
     * Reverses the direction of this circle. This sets the center of the circle to its antipode and the radius to its
     * complement with `Math.PI`.
     * @returns This circle, after it has been reversed.
     */
    reverse(): this;
    /**
     * Gets the distance from a point to the center of this circle, in great-arc radians.
     * @param point The point to which to measure the distance.
     * @returns the distance from the point to the center of this circle.
     */
    private distanceToCenter;
    /**
     * Finds the closest point on this circle to a specified point. In other words, projects the specified point onto
     * this circle. If the specified point is equidistant from all points on this circle (i.e. it is coincident with or
     * antipodal to this circle's center), NaN will be written to all fields of the result.
     * @param point A point, represented as either a position vector or lat/long coordinates.
     * @param out A Float64Array object to which to write the result.
     * @returns The closest point on this circle to the specified point.
     */
    closest(point: ReadonlyFloat64Array | LatLonInterface, out: Float64Array): Float64Array;
    /**
     * Finds the closest point on this circle to a specified point. In other words, projects the specified point onto
     * this circle. If the specified point is equidistant from all points on this circle (i.e. it is coincident with or
     * antipodal to this circle's center), NaN will be written to all fields of the result.
     * @param point A point, represented as either a position vector or lat/long coordinates.
     * @param out A GeoPoint object to which to write the result.
     * @returns The closest point on this circle to the specified point.
     */
    closest(point: ReadonlyFloat64Array | LatLonInterface, out: GeoPoint): GeoPoint;
    /**
     * Calculates and returns the great-circle distance from a specified point to the closest point that lies on this
     * circle. In other words, calculates the shortest distance from a point to this circle. The distance is signed, with
     * positive distances representing deviation away from the center of the circle, and negative distances representing
     * deviation toward the center of the circle.
     * @param point A point, represented as either a position vector or lat/long coordinates.
     * @returns the great circle distance, in great-arc radians, from the point to the closest point on this circle.
     */
    distance(point: ReadonlyFloat64Array | LatLonInterface): number;
    /**
     * Checks whether a point lies on this circle.
     * @param point A point, represented as either a position vector or lat/long coordinates.
     * @param tolerance The error tolerance, in great-arc radians, of this operation. Defaults to
     * `GeoCircle.ANGULAR_TOLERANCE` if not specified.
     * @returns whether the point lies on this circle.
     */
    includes(point: ReadonlyFloat64Array | LatLonInterface, tolerance?: number): boolean;
    /**
     * Checks whether a point lies within the boundary defined by this circle. This is equivalent to checking whether
     * the distance of the point from the center of this circle is less than or equal to this circle's radius.
     * @param point A point, represented as either a position vector or lat/long coordinates.
     * @param inclusive Whether points that lie on this circle should pass the check. True by default.
     * @param tolerance The error tolerance, in great-arc radians, of this operation. Defaults to
     * `GeoCircle.ANGULAR_TOLERANCE` if not specified.
     * @returns whether the point lies within the boundary defined by this circle.
     */
    encircles(point: ReadonlyFloat64Array | LatLonInterface, inclusive?: boolean, tolerance?: number): boolean;
    /**
     * Gets the angular distance along an arc between two points that lie on this circle. The arc extends from the first
     * point to the second in a counterclockwise direction when viewed from above the center of the circle.
     * @param start A point on this circle which marks the beginning of an arc.
     * @param end A point on this circle which marks the end of an arc.
     * @param tolerance The error tolerance, in great-arc radians, when checking if `start` and `end` lie on this circle.
     * Defaults to `GeoCircle.ANGULAR_TOLERANCE` if not specified.
     * @returns the angular width of the arc between the two points, in radians.
     * @throws Error if either point does not lie on this circle.
     */
    angleAlong(start: ReadonlyFloat64Array | LatLonInterface, end: ReadonlyFloat64Array | LatLonInterface, tolerance?: number): number;
    /**
     * Gets the distance along an arc between two points that lie on this circle. The arc extends from the first point
     * to the second in a counterclockwise direction when viewed from above the center of the circle.
     * @param start A point on this circle which marks the beginning of an arc.
     * @param end A point on this circle which marks the end of an arc.
     * @param tolerance The error tolerance, in great-arc radians, when checking if `start` and `end` lie on this circle.
     * Defaults to `GeoCircle.ANGULAR_TOLERANCE` if not specified.
     * @returns the length of the arc between the two points, in great-arc radians.
     * @throws Error if either point does not lie on this circle.
     */
    distanceAlong(start: ReadonlyFloat64Array | LatLonInterface, end: ReadonlyFloat64Array | LatLonInterface, tolerance?: number): number;
    /**
     * Calculates the true bearing along this circle at a point on the circle.
     * @param point A point on this circle.
     * @param tolerance The error tolerance, in great-arc radians, when checking if `point` lies on this circle. Defaults
     * to `GeoCircle.ANGULAR_TOLERANCE` if not specified.
     * @returns the bearing along this circle at the point.
     * @throws Error if the point does not lie on this circle.
     */
    bearingAt(point: ReadonlyFloat64Array | LatLonInterface, tolerance?: number): number;
    /**
     * Offsets a point on this circle by a specified distance. The direction of the offset for positive distances is
     * counterclockwise when viewed from above the center of this circle.
     * @param point The point to offset.
     * @param distance The distance by which to offset, in great-arc radians.
     * @param out A Float64Array object to which to write the result.
     * @param tolerance The error tolerance, in great-arc radians, when checking if `point` lies on this circle. Defaults
     * to `GeoCircle.ANGULAR_TOLERANCE` if not specified.
     * @returns The offset point.
     * @throws Error if the point does not lie on this circle.
     */
    offsetDistanceAlong(point: ReadonlyFloat64Array | LatLonInterface, distance: number, out: Float64Array, tolerance?: number): Float64Array;
    /**
     * Offsets a point on this circle by a specified distance. The direction of the offset for positive distances is
     * counterclockwise when viewed from above the center of this circle.
     * @param point The point to offset.
     * @param distance The distance by which to offset, in great-arc radians.
     * @param out A GeoPoint object to which to write the result.
     * @param tolerance The error tolerance, in great-arc radians, when checking if `point` lies on this circle. Defaults
     * to `GeoCircle.ANGULAR_TOLERANCE` if not specified.
     * @returns The offset point.
     * @throws Error if the point does not lie on this circle.
     */
    offsetDistanceAlong(point: ReadonlyFloat64Array | LatLonInterface, distance: number, out: GeoPoint, tolerance?: number): GeoPoint;
    /**
     * Offsets a point on this circle by a specified angular distance. The direction of the offset for positive distances
     * is counterclockwise when viewed from above the center of this circle.
     * @param point The point to offset.
     * @param angle The angular distance by which to offset, in radians.
     * @param out A Float64Array object to which to write the result.
     * @param tolerance The error tolerance, in great-arc radians, when checking if `point` lies on this circle. Defaults
     * to `GeoCircle.ANGULAR_TOLERANCE` if not specified.
     * @returns The offset point.
     * @throws Error if the point does not lie on this circle.
     */
    offsetAngleAlong(point: ReadonlyFloat64Array | LatLonInterface, angle: number, out: Float64Array, tolerance?: number): Float64Array;
    /**
     * Offsets a point on this circle by a specified angular distance. The direction of the offset for positive distances
     * is counterclockwise when viewed from above the center of this circle.
     * @param point The point to offset.
     * @param angle The angular distance by which to offset, in radians.
     * @param out A GeoPoint object to which to write the result.
     * @param tolerance The error tolerance, in great-arc radians, when checking if `point` lies on this circle. Defaults
     * to `GeoCircle.ANGULAR_TOLERANCE` if not specified.
     * @returns The offset point.
     * @throws Error if the point does not lie on this circle.
     */
    offsetAngleAlong(point: ReadonlyFloat64Array | LatLonInterface, angle: number, out: GeoPoint, tolerance?: number): GeoPoint;
    /**
     * Offsets a point on this circle by a specified angular distance. The direction of the offset for positive distances
     * is counterclockwise when viewed from above the center of this circle.
     * @param point The point to offset.
     * @param angle The angular distance by which to offset, in radians.
     * @param out A Float64Array or GeoPoint object to which to write the result.
     * @param tolerance The error tolerance, in great-arc radians, when checking if `point` lies on this circle. Defaults
     * to `GeoCircle.ANGULAR_TOLERANCE` if not specified.
     * @returns The offset point.
     * @throws Error if the point does not lie on this circle.
     */
    private _offsetAngleAlong;
    /**
     * Calculates and returns the set of intersection points between this circle and another one, and writes the results
     * to an array of position vectors.
     * @param other The other circle to test for intersections.
     * @param out An array in which to store the results. The results will be stored at indexes 0 and 1. If these indexes
     * are empty, then new Float64Array objects will be created and inserted into the array.
     * @returns The number of solutions written to the out array. Either 0, 1, or 2.
     */
    intersection(other: GeoCircle, out: Float64Array[]): number;
    /**
     * Calculates and returns the set of intersection points between this circle and another one, and writes the results
     * to an array of GeoPoint objects.
     * @param other The other circle to test for intersections.
     * @param out An array in which to store the results. The results will be stored at indexes 0 and 1. If these indexes
     * are empty, then new GeoPoint objects will be created and inserted into the array.
     * @returns The number of solutions written to the out array. Either 0, 1, or 2.
     */
    intersectionGeoPoint(other: GeoCircle, out: GeoPoint[]): number;
    /**
     * Calculates and returns the number of intersection points between this circle and another one. Returns NaN if there
     * are an infinite number of intersection points.
     * @param other The other circle to test for intersections.
     * @param tolerance The error tolerance, in great-arc radians, of this operation. Defaults to
     * `GeoCircle.ANGULAR_TOLERANCE` if not specified.
     * @returns the number of intersection points between this circle and the other one.
     */
    numIntersectionPoints(other: GeoCircle, tolerance?: number): number;
    /**
     * Creates a new small circle from a lat/long coordinate pair and radius.
     * @param point The center of the new small circle.
     * @param radius The radius of the new small circle, in great-arc radians.
     * @returns a small circle.
     */
    static createFromPoint(point: LatLonInterface, radius: number): GeoCircle;
    /**
     * Creates a new great circle that contains two points. There are two possible great circles that contain any two
     * unique points; these circles differ only by their directionality (equivalently, the sign of their normal vectors).
     * The order of points passed to this method and the right-hand rule determines which of the two is returned.
     * @param point1 The first point that lies on the new great circle.
     * @param point2 The second point that lies on the new great circle.
     * @returns a great circle.
     */
    static createGreatCircle(point1: ReadonlyFloat64Array | LatLonInterface, point2: ReadonlyFloat64Array | LatLonInterface): GeoCircle;
    static createGreatCircle(point: ReadonlyFloat64Array | LatLonInterface, bearing: number): GeoCircle;
    /**
     * Creates a new great circle defined by one point and a bearing offset. The new great circle will be equivalent to
     * the path projected from the point with the specified initial bearing (forward azimuth).
     * @param point A point that lies on the new great circle.
     * @param bearing The initial bearing from the point.
     * @returns a great circle.
     */
    static createGreatCircleFromPointBearing(point: ReadonlyFloat64Array | LatLonInterface, bearing: number): GeoCircle;
    /**
     * Calculates a normal vector for a great circle given two points which lie on the circle. The order of points passed
     * to this method and the right-hand rule determines which of the two possible normal vectors for the great circle is
     * returned.
     * @param point1 The first point that lies on the great circle.
     * @param point2 The second point that lies on the great circle.
     * @param out The vector to which to write the result.
     * @returns the normal vector for the great circle.
     */
    static getGreatCircleNormal(point1: ReadonlyFloat64Array | LatLonInterface, point2: ReadonlyFloat64Array | LatLonInterface, out: Float64Array): Float64Array;
    /**
     * Calculates a normal vector for a great circle given a point and initial bearing.
     * @param point A point that lies on the great circle.
     * @param bearing The initial bearing from the point.
     * @param out The vector to which to write the result.
     * @returns the normal vector for the great circle.
     */
    static getGreatCircleNormal(point: ReadonlyFloat64Array | LatLonInterface, bearing: number, out: Float64Array): Float64Array;
    /**
     * Calculates a normal vector for a great circle given two points which lie on the circle, or a point and initial bearing.
     * @param arg1 A point that lies on the great circle.
     * @param arg2 A second point that lies on the great circle, or an initial bearing from the first point.
     * @param out The vector to which to write the result.
     * @returns the normal vector for the great circle.
     */
    private static _getGreatCircleNormal;
    /**
     * Calculates a normal vector for a great circle given two points which lie on the cirlce.
     * @param point1 The first point that lies on the great circle.
     * @param point2 The second point that lies on the great circle.
     * @param out The vector to which to write the result.
     * @returns the normal vector for the great circle.
     */
    private static getGreatCircleNormalFromPoints;
    /**
     * Calculates a normal vector for a great circle given a point and initial bearing.
     * @param point A point that lies on the great circle.
     * @param bearing The initial bearing from the point.
     * @param out The vector to which to write the result.
     * @returns the normal vector for the great circle.
     */
    private static getGreatCircleNormalFromPointBearing;
}
//# sourceMappingURL=GeoCircle.d.ts.map