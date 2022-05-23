import { ReadonlyFloat64Array } from '../math/VecMath';
import { GeoCircle } from './GeoCircle';
import { LatLonInterface } from './GeoInterfaces';
import { GeoPointInterface } from './GeoPoint';
import { GeoProjection } from './GeoProjection';
/**
 * A function which handles resampled points.
 * @param vector A vector which describes the projected path terminating at the resampled point.
 */
export declare type GeoCircleResamplerHandler = (vector: Readonly<GeoCircleResamplerVector>) => void;
/**
 * A vector describing the projected path terminating at a point resampled by {@link GeoCircleResampler}.
 */
export declare type GeoCircleResamplerVector = GeoCircleResamplerStartVector | GeoCircleResamplerLineVector | GeoCircleResamplerArcVector;
/** Base vector class. */
declare type GeoCircleResamplerBaseVector = {
    /** The type of this vector. */
    type: string;
    /** The resampled point that terminates this vector. */
    point: GeoPointInterface;
    /** The projected position, in pixel coordinates, of the resampled point that terminates this vector. */
    projected: ReadonlyFloat64Array;
    /** The index of the resampled point that terminates this vector. `0` is the first point, `1` is the second, and so on. */
    index: number;
};
/**
 * A vector describing the starting point of a path resampled by {@link GeoCircleResampler}.
 */
export declare type GeoCircleResamplerStartVector = GeoCircleResamplerBaseVector & {
    /** The type of this vector. */
    type: 'start';
};
/**
 * A vector describing a projected straight line terminating at a point resampled by {@link GeoCircleResampler}.
 */
export declare type GeoCircleResamplerLineVector = GeoCircleResamplerBaseVector & {
    /** The type of this vector. */
    type: 'line';
};
/**
 * A vector describing a projected circular arc terminating at a point resampled by {@link GeoCircleResampler}.
 */
export declare type GeoCircleResamplerArcVector = GeoCircleResamplerBaseVector & {
    /** The type of this vector. */
    type: 'arc';
    /** The center of the projected arc, in pixel coordinates. */
    projectedArcCenter: ReadonlyFloat64Array;
    /** The radius of the projected arc, in pixels. */
    projectedArcRadius: number;
    /** The radial of the start of the projected arc, in radians. */
    projectedArcStartAngle: number;
    /** The radial of the end of the projected arc, in radians. */
    projectedArcEndAngle: number;
};
/**
 * Resamples projected great- and small-circle paths between defined endpoints into series of straight line segments and circular arcs.
 */
export declare class GeoCircleResampler {
    readonly minDistance: number;
    readonly dpTolerance: number;
    readonly maxDepth: number;
    private readonly cosMinDistance;
    private readonly dpTolSq;
    private readonly geoPointCache;
    private readonly vec2Cache;
    private readonly vec3Cache;
    private readonly startVector;
    private readonly lineVector;
    private readonly arcVector;
    private readonly state;
    /**
     * Constructor.
     * @param minDistance The minimum great-circle distance this resampler enforces between two adjacent resampled
     * points, in great-arc radians.
     * @param dpTolerance The Douglas-Peucker tolerance, in pixels, this resampler uses when deciding whether to discard
     * a resampled point during the simplification process.
     * @param maxDepth The maximum depth of the resampling algorithm used by this resampler. The number of resampled
     * points is bounded from above by `2^[maxDepth] - 1`.
     */
    constructor(minDistance: number, dpTolerance: number, maxDepth: number);
    /**
     * Resamples a projected great- or small-circle path.
     * @param projection The projection to use.
     * @param circle The geo circle along which the path lies.
     * @param start The start of the path.
     * @param end The end of the path.
     * @param handler A function to handle the resampled points. The function is called once for each resampled point,
     * in order.
     */
    resample(projection: GeoProjection, circle: GeoCircle, start: LatLonInterface | ReadonlyFloat64Array, end: LatLonInterface | ReadonlyFloat64Array, handler: GeoCircleResamplerHandler): void;
    /**
     * Resamples a projected great- or small-circle path. This method will recursively split the path into two halves
     * and resample the midpoint. Based on the projected position of the midpoint relative to those of the start and end
     * points, the projected path is modeled as either a straight line from the start to the end or a circular arc
     * connecting the start, end, and midpoints. Recursion continues as long as the maximum depth has not been reached
     * and at least one of the following conditions is met:
     * * The distance from the midpoint to the endpoints is greater than or equal to the minimum resampling distance.
     * * If the path is modeled as a line: the distance from the projected midpoint to the model line is greater than
     * this resampler's Douglas-Peucker tolerance.
     * * If the path is modeled as an arc: the distance from the projected one-quarter or the three-quarter point along
     * the path to the model arc is greater than this resampler's Douglas-Peucker tolerance.
     * @param projection The projection to use.
     * @param circle The geo circle along which the path lies.
     * @param lat1 The latitude of the start of the path, in degrees.
     * @param lon1 The longitude of the start of the path, in degrees.
     * @param x1 The x-component of the Cartesian position vector of the start of the path.
     * @param y1 The y-component of the Cartesian position vector of the start of the path.
     * @param z1 The z-component of the Cartesian position vector of the start of the path.
     * @param projX1 The x-component of the projected location of the start of the path, in pixels.
     * @param projY1 The y-component of the projected location of the start of the path, in pixels.
     * @param lat2 The latitude of the end of the path, in degrees.
     * @param lon2 The longitude of the end of the path, in degrees.
     * @param x2 The x-component of the Cartesian position vector of the end of the path.
     * @param y2 The y-component of the Cartesian position vector of the end of the path.
     * @param z2 The z-component of the Cartesian position vector of the end of the path.
     * @param projX2 The x-component of the projected location of the end of the path, in pixels.
     * @param projY2 The y-component of the projected location of the end of the path, in pixels.
     * @param handler A function to handle the resampled points.
     * @param depth The current depth of the resampling algorithm.
     * @param state The current state of the resampling algorithm.
     * @returns The index of the next resampled point.
     */
    private resampleHelper;
    /**
     * Calls a handler function for a resampled point.
     * @param handler The handler function to call.
     * @param lat The latitude of the resampled point, in degrees.
     * @param lon The longitude of the resampled point, in degrees.
     * @param projX The x-coordinate of the projected resampled point, in pixels.
     * @param projY The y-coordinate of the projected resampled point, in pixels.
     * @param state The current state of the resampling algorithm.
     */
    private callHandler;
}
export {};
//# sourceMappingURL=GeoCircleResampler.d.ts.map