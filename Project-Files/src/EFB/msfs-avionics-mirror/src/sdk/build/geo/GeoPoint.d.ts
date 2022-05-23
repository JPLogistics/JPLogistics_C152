import { ReadonlyFloat64Array } from '../math/VecMath';
import { LatLonInterface } from './GeoInterfaces';
/**
 * A representation of a point on Earth's surface.
 */
export interface GeoPointInterface {
    /** The latitude of the point. */
    lat: number;
    /** The longitude of the point. */
    lon: number;
    /**
     * Calculates the great-circle distance between this point and another point.
     * @param other The point to which to calculate the distance.
     * @returns The great-circle distance to the other point, in great-arc radians.
     */
    distance(other: LatLonInterface): number;
    /**
     * Calculates the great-circle distance between this point and another point.
     * @param lat The latitude of the point to which to calculate the distance.
     * @param lon The longitude of the point to which to calculate the distance.
     * @returns The great-circle distance to the other point, in great-arc radians.
     */
    distance(lat: number, lon: number): number;
    /**
     * Calculates the distance along the rhumb line connecting this point with another point.
     * @param other The other point.
     * @returns The rhumb-line distance to the other point, in great-arc radians.
     */
    distanceRhumb(other: LatLonInterface): number;
    /**
     * Calculates the distance along the rhumb line connecting this point with another point.
     * @param lat The latitude of the other point, in degrees.
     * @param lon The longitude of the other point, in degrees.
     * @returns The rhumb-line distance to the other point, in great-arc radians.
     */
    distanceRhumb(lat: number, lon: number): number;
    /**
     * Calculates the initial true bearing (forward azimuth) from this point to another point along the great circle
     * connecting the two.
     * @param other The other point.
     * @returns The initial true bearing to the other point, in degrees.
     */
    bearingTo(other: LatLonInterface): number;
    /**
     * Calculates the initial true bearing (forward azimuth) from this point to another point along the great circle
     * connecting the two.
     * @param lat The latitude of the other point, in degrees.
     * @param lon The longitude of the other point, in degrees.
     * @returns The initial true bearing to the other point, in degrees.
     */
    bearingTo(lat: number, lon: number): number;
    /**
     * Calculates the final true bearing from another point to this point (i.e. the back azimuth from this point to the
     * other point) along the great circle connecting the two.
     * @param other The other point.
     * @returns The final true bearing from the other point, in degrees.
     */
    bearingFrom(other: LatLonInterface): number;
    /**
     * Calculates the final true bearing from another point to this point (i.e. the back azimuth from this point to the
     * other point) along the great circle connecting the two.
     * @param lat The latitude of the other point, in degrees.
     * @param lon The longitude of the other point, in degrees.
     * @returns The final true bearing from the other point, in degrees.
     */
    bearingFrom(lat: number, lon: number): number;
    /**
     * Calculates the constant true bearing from this point to another point along the rhumb line connecting the two.
     * @param other The other point.
     * @returns The constant true bearing to the other point, in degrees.
     */
    bearingRhumb(other: LatLonInterface): number;
    /**
     * Calculates the constant true bearing from this point to another point along the rhumb line connecting the two.
     * @param lat The latitude of the other point, in degrees.
     * @param lon The longitude of the other point, in degrees.
     * @returns The constant true bearing to the other point, in degrees.
     */
    bearingRhumb(lat: number, lon: number): number;
    /**
     * Offsets this point by an initial bearing and distance along a great circle.
     * @param bearing The initial true bearing (forward azimuth), in degrees, by which to offset.
     * @param distance The distance, in great-arc radians, by which to offset.
     * @param out The GeoPoint to which to write the results.
     * @returns The offset point.
     */
    offset(bearing: number, distance: number, out?: GeoPoint): GeoPoint;
    /**
     * Offsets this point by a constant bearing and distance along a rhumb line.
     * @param bearing The true bearing, in degrees, by which to offset.
     * @param distance The distance, in great-arc radians, by which to offset.
     * @param out The GeoPoint to which to write the results.
     * @returns The offset point.
     */
    offsetRhumb(bearing: number, distance: number, out?: GeoPoint): GeoPoint;
    /**
     * Calculates the cartesian (x, y, z) representation of this point, in units of great-arc radians. By convention,
     * in the cartesian coordinate system the origin is at the center of the Earth, the positive x-axis passes through
     * 0 degrees N, 0 degrees E, and the positive z-axis passes through the north pole.
     * @param out The vector array to which to write the result.
     * @returns The cartesian representation of this point.
     */
    toCartesian(out: Float64Array): Float64Array;
    /**
     * Checks whether this point is equal to another point.
     * @param other The other point.
     * @param tolerance The tolerance of the equality check, defined as the maximum allowed distance between two equal
     * points in great-arc radians.
     * @returns Whether this point is equal to the other point.
     */
    equals(other: LatLonInterface, tolerance?: number): boolean;
    /**
     * Checks whether this point is equal to another point.
     * @param lat The latitude of the other point, in degrees.
     * @param lon The longitude of the other point, in degrees.
     * @param tolerance The tolerance of the equality check, defined as the maximum allowed distance between two equal
     * points in great-arc radians.
     * @returns Whether this point is equal to the other point.
     */
    equals(lat: number, lon: number, tolerance?: number): boolean;
    /**
     * Copies this point.
     * @param to An optional point to which to copy this point. If this argument is not supplied, a new GeoPoint object
     * will be created.
     * @returns A copy of this point.
     */
    copy(to?: GeoPoint): GeoPoint;
}
/**
 * A read-only wrapper for a GeoPoint.
 */
export declare class GeoPointReadOnly implements GeoPointInterface, LatLonInterface {
    private readonly source;
    /**
     * Constructor.
     * @param source - the source of the new read-only point.
     */
    constructor(source: GeoPoint);
    /**
     * The latitude of this point, in degrees.
     * @returns the latitude of this point.
     */
    get lat(): number;
    /**
     * The longitude of this point, in degrees.
     * @returns the longitude of this point.
     */
    get lon(): number;
    /** @inheritdoc */
    distance(other: LatLonInterface): number;
    /** @inheritdoc */
    distance(lat: number, lon: number): number;
    /** @inheritdoc */
    distanceRhumb(other: LatLonInterface): number;
    /** @inheritdoc */
    distanceRhumb(lat: number, lon: number): number;
    /** @inheritdoc */
    bearingTo(other: LatLonInterface): number;
    /** @inheritdoc */
    bearingTo(lat: number, lon: number): number;
    /** @inheritdoc */
    bearingFrom(other: LatLonInterface): number;
    /** @inheritdoc */
    bearingFrom(lat: number, lon: number): number;
    /** @inheritdoc */
    bearingRhumb(other: LatLonInterface): number;
    /** @inheritdoc */
    bearingRhumb(lat: number, lon: number): number;
    /**
     * Offsets this point by an initial bearing and distance along a great circle.
     * @param bearing The initial true bearing (forward azimuth), in degrees, by which to offset.
     * @param distance The distance, in great-arc radians, by which to offset.
     * @param out The GeoPoint to which to write the results. If not supplied, a new GeoPoint object is created.
     * @returns The offset point.
     * @throws {Error} if argument `out` is undefined.
     */
    offset(bearing: number, distance: number, out?: GeoPoint): GeoPoint;
    /**
     * Offsets this point by a constant bearing and distance along a rhumb line.
     * @param bearing The true bearing, in degrees, by which to offset.
     * @param distance The distance, in great-arc radians, by which to offset.
     * @param out The GeoPoint to which to write the results. If not supplied, a new GeoPoint object is created.
     * @returns The offset point.
     * @throws {Error} If argument `out` is undefined.
     */
    offsetRhumb(bearing: number, distance: number, out?: GeoPoint): GeoPoint;
    /**
     * Calculates the cartesian (x, y, z) representation of this point, in units of great-arc radians. By convention,
     * in the cartesian coordinate system the origin is at the center of the Earth, the positive x-axis passes through
     * 0 degrees N, 0 degrees E, and the positive z-axis passes through the north pole.
     * @param out The vector array to which to write the result.
     * @returns The cartesian representation of this point.
     */
    toCartesian(out: Float64Array): Float64Array;
    /** @inheritdoc */
    equals(other: LatLonInterface, tolerance?: number): boolean;
    /** @inheritdoc */
    equals(lat: number, lon: number, tolerance?: number): boolean;
    /** @inheritdoc */
    copy(to?: GeoPoint): GeoPoint;
}
/**
 * A point on Earth's surface. This class uses a spherical Earth model.
 */
export declare class GeoPoint implements GeoPointInterface, LatLonInterface {
    /**
     * The default equality tolerance, defined as the maximum allowed distance between two equal points in great-arc
     * radians.
     */
    static readonly EQUALITY_TOLERANCE = 1e-7;
    private static readonly tempVec3;
    private static readonly tempGeoPoint;
    private _lat;
    private _lon;
    readonly readonly: GeoPointReadOnly;
    /**
     * Constructor.
     * @param lat The latitude, in degrees.
     * @param lon The longitude, in degrees.
     */
    constructor(lat: number, lon: number);
    /**
     * The latitude of this point, in degrees.
     * @returns the latitude of this point.
     */
    get lat(): number;
    /**
     * The longitude of this point, in degrees.
     * @returns the longitude of this point.
     */
    get lon(): number;
    /**
     * Converts an argument list consisting of either a LatLonInterface or lat/lon coordinates into an equivalent
     * LatLonInterface.
     * @param arg1 Argument 1.
     * @param arg2 Argument 2.
     * @returns A LatLonInterface.
     */
    private static asLatLonInterface;
    /**
     * Converts an argument list consisting of either a 3D vector or x, y, z components into an equivalent 3D vector.
     * @param arg1 Argument 1.
     * @param arg2 Argument 2.
     * @param arg3 Argument 3.
     * @returns A 3D vector.
     */
    private static asVec3;
    /**
     * Sets this point's latitude/longitude values.
     * @param other The point from which to take the new latitude/longitude values.
     * @returns This point, after it has been changed.
     */
    set(other: LatLonInterface): this;
    /**
     * Sets this point's latitude/longitude values.
     * @param lat The new latitude, in degrees.
     * @param lon The new longitude, in degrees.
     * @returns This point, after it has been changed.
     */
    set(lat: number, lon: number): this;
    /**
     * Sets this point's coordinate values from a cartesian position vector. By convention, in the cartesian coordinate
     * system the origin is at the center of the Earth, the positive x-axis passes through 0 degrees N, 0 degrees E, and
     * the positive z-axis passes through the north pole.
     * @param vec A position vector defining the new coordinates.
     * @returns This point, after it has been changed.
     */
    setFromCartesian(vec: ReadonlyFloat64Array): this;
    /**
     * Sets this point's coordinate values from a cartesian position vector. By convention, in the cartesian coordinate
     * system the origin is at the center of the Earth, the positive x-axis passes through 0 degrees N, 0 degrees E, and
     * the positive z-axis passes through the north pole.
     * @param x The x component of a position vector defining the new coordinates.
     * @param y The y component of a position vector defining the new coordinates.
     * @param z The z component of a position vector defining the new coordinates.
     * @returns This point, after it has been changed.
     */
    setFromCartesian(x: number, y: number, z: number): this;
    /** @inheritdoc */
    distance(other: LatLonInterface): number;
    /** @inheritdoc */
    distance(lat: number, lon: number): number;
    /** @inheritdoc */
    distanceRhumb(other: LatLonInterface): number;
    /** @inheritdoc */
    distanceRhumb(lat: number, lon: number): number;
    /** @inheritdoc */
    bearingTo(other: LatLonInterface): number;
    /** @inheritdoc */
    bearingTo(lat: number, lon: number): number;
    /** @inheritdoc */
    bearingFrom(other: LatLonInterface): number;
    /** @inheritdoc */
    bearingFrom(lat: number, lon: number): number;
    /** @inheritdoc */
    bearingRhumb(other: LatLonInterface): number;
    /** @inheritdoc */
    bearingRhumb(lat: number, lon: number): number;
    /**
     * Offsets this point by an initial bearing and distance along a great circle.
     * @param bearing The initial true bearing (forward azimuth), in degrees, by which to offset.
     * @param distance The distance, in great-arc radians, by which to offset.
     * @param out The GeoPoint to which to write the results. By default this point.
     * @returns The offset point.
     */
    offset(bearing: number, distance: number, out?: GeoPoint): GeoPoint;
    /**
     * Offsets this point by a constant bearing and distance along a rhumb line.
     * @param bearing The true bearing, in degrees, by which to offset.
     * @param distance The distance, in great-arc radians, by which to offset.
     * @param out The GeoPoint to which to write the results. By default this point.
     * @returns The offset point.
     */
    offsetRhumb(bearing: number, distance: number, out?: GeoPoint): GeoPoint;
    /** @inheritdoc */
    toCartesian(out: Float64Array): Float64Array;
    /** @inheritdoc */
    equals(other: LatLonInterface, tolerance?: number): boolean;
    /** @inheritdoc */
    equals(lat: number, lon: number, tolerance?: number): boolean;
    /** @inheritdoc */
    copy(to?: GeoPoint): GeoPoint;
    /**
     * Calculates the cartesian (x, y, z) representation of a point, in units of great-arc radians. By convention,
     * in the cartesian coordinate system the origin is at the center of the Earth, the positive x-axis passes through
     * 0 degrees N, 0 degrees E, and the positive z-axis passes through the north pole.
     * @param point The point to convert.
     * @param out The vector array to which to write the result.
     * @returns the cartesian representation of the point.
     */
    static sphericalToCartesian(point: LatLonInterface, out: Float64Array): Float64Array;
    /**
     * Calculates the cartesian (x, y, z) representation of a point, in units of great-arc radians. By convention,
     * in the cartesian coordinate system the origin is at the center of the Earth, the positive x-axis passes through
     * 0 degrees N, 0 degrees E, and the positive z-axis passes through the north pole.
     * @param lat The latitude of the point to convert, in degrees.
     * @param lon The longitude of the point to convert, in degrees.
     * @param out The vector array to which to write the result.
     * @returns the cartesian representation of the point.
     */
    static sphericalToCartesian(lat: number, lon: number, out: Float64Array): Float64Array;
    /**
     * Checks whether two points are equal.
     * @param lat1 The latitude of the first point, in degrees.
     * @param lon1 The longitude of the first point, in degrees.
     * @param lat2 The latitude of the second point, in degrees.
     * @param lon2 The longitude of the second point, in degrees.
     * @param tolerance The tolerance of the equality check, defined as the maximum allowed distance between two equal
     * points in great-arc radians. Defaults to `GeoPoint.EQUALITY_TOLERANCE`.
     * @returns Whether the two points are equal.
     */
    static equals(lat1: number, lon1: number, lat2: number, lon2: number, tolerance?: number): boolean;
    /**
     * Checks whether two points are equal.
     * @param point1 The first point.
     * @param point2 The second point.
     * @param tolerance The tolerance of the equality check, defined as the maximum allowed distance between two equal
     * points in great-arc radians. Defaults to `GeoPoint.EQUALITY_TOLERANCE`.
     * @returns Whether the two points are equal.
     */
    static equals(point1: LatLonInterface, point2: LatLonInterface, tolerance?: number): boolean;
    /**
     * Checks whether two points are equal.
     * @param point1 The first point, in cartesian form.
     * @param point2 The second point, in cartesian form.
     * @param tolerance The tolerance of the equality check, defined as the maximum allowed distance between two equal
     * points in great-arc radians. Defaults to `GeoPoint.EQUALITY_TOLERANCE`.
     * @returns Whether the two points are equal.
     */
    static equals(point1: ReadonlyFloat64Array, point2: ReadonlyFloat64Array, tolerance?: number): boolean;
    /**
     * Calculates the great-circle distance between two points.
     * @param lat1 The latitude of the first point, in degrees.
     * @param lon1 The longitude of the first point, in degrees.
     * @param lat2 The latitude of the second point, in degrees.
     * @param lon2 The longitude of the second point, in degrees.
     * @returns The great-circle distance between the two points, in great-arc radians.
     */
    static distance(lat1: number, lon1: number, lat2: number, lon2: number): number;
    /**
     * Calculates the great-circle distance between two points.
     * @param point1 The first point.
     * @param point2 The second point.
     * @returns The great-circle distance between the two points, in great-arc radians.
     */
    static distance(point1: LatLonInterface, point2: LatLonInterface): number;
    /**
     * Calculates the great-circle distance between two points.
     * @param point1 The first point, in cartesian form.
     * @param point2 The second point, in cartesian form.
     * @returns The great-circle distance between the two points, in great-arc radians.
     */
    static distance(point1: ReadonlyFloat64Array, point2: ReadonlyFloat64Array): number;
    /**
     * Calculates the distance along the rhumb line connecting this point with another point.
     * @param lat1 The latitude of the first point, in degrees.
     * @param lon1 The longitude of the first point, in degrees.
     * @param lat2 The latitude of the second point, in degrees.
     * @param lon2 The longitude of the second point, in degrees.
     * @returns The distance along the rhumb line connecting the two points, in great-arc radians.
     */
    static distanceRhumb(lat1: number, lon1: number, lat2: number, lon2: number): number;
    /**
     * Calculates the distance along the rhumb line connecting this point with another point.
     * @param point1 The first point.
     * @param point2 The second point.
     * @returns The distance along the rhumb line connecting the two points, in great-arc radians.
     */
    static distanceRhumb(point1: LatLonInterface, point2: LatLonInterface): number;
    /**
     * Calculates the distance along the rhumb line connecting this point with another point.
     * @param point1 The first point, in cartesian form.
     * @param point2 The second point, in cartesian form.
     * @returns The distance along the rhumb line connecting the two points, in great-arc radians.
     */
    static distanceRhumb(point1: ReadonlyFloat64Array, point2: ReadonlyFloat64Array): number;
    /**
     * Calculates the initial true bearing (forward azimuth) from one point to another along the great circle connecting
     * the two.
     * @param lat1 The latitude of the initial point, in degrees.
     * @param lon1 The longitude of the initial point, in degrees.
     * @param lat2 The latitude of the final point, in degrees.
     * @param lon2 The longitude of the final point, in degrees.
     * @returns The initial true bearing, in degrees, from the initial point to the final point along the great circle
     * connecting the two.
     */
    static initialBearing(lat1: number, lon1: number, lat2: number, lon2: number): number;
    /**
     * Calculates the final true bearing from one point to another along the great circle connecting the two.
     * @param lat1 The latitude of the initial point, in degrees.
     * @param lon1 The longitude of the initial point, in degrees.
     * @param lat2 The latitude of the final point, in degrees.
     * @param lon2 The longitude of the final point, in degrees.
     * @returns The final true bearing, in degrees, from the initial point to the final point along the great circle
     * connecting the two.
     */
    static finalBearing(lat1: number, lon1: number, lat2: number, lon2: number): number;
    /**
     * Calculates the constant true bearing from one point to another along the rhumb line connecting the two.
     * @param lat1 The latitude of the initial point, in degrees.
     * @param lon1 The longitude of the initial point, in degrees.
     * @param lat2 The latitude of the final point, in degrees.
     * @param lon2 The longitude of the final point, in degrees.
     * @returns The constant true bearing, in degrees, from the initial point to the final point along the rhumb line
     * connecting the two.
     */
    static bearingRhumb(lat1: number, lon1: number, lat2: number, lon2: number): number;
    /**
     * Converts an angle, in degrees, to an equivalent value in the range [-180, 180).
     * @param angle An angle in degrees.
     * @returns The angle's equivalent in the range [-180, 180).
     */
    private static toPlusMinus180;
    /**
     * Calculates the difference in isometric latitude from a pair of geodetic (geocentric) latitudes.
     * @param latRad1 Geodetic latitude 1, in radians.
     * @param latRad2 Geodetic latitude 2, in radians.
     * @returns The difference in isometric latitude from latitude 1 to latitude 2, in radians.
     */
    private static deltaPsi;
    /**
     * Calculates the rhumb correction factor between two latitudes.
     * @param deltaPsi The difference in isometric latitude beween the two latitudes.
     * @param latRad1 Geodetic latitude 1, in radians.
     * @param latRad2 Geodetic latitude 2, in radians.
     * @returns The rhumb correction factor between the two latitudes.
     */
    private static rhumbCorrection;
}
//# sourceMappingURL=GeoPoint.d.ts.map