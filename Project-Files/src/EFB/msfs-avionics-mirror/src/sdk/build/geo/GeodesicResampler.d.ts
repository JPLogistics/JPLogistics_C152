import { LatLonInterface } from './GeoInterfaces';
import { GeoPointInterface } from './GeoPoint';
import { GeoProjection } from './GeoProjection';
/**
 * A function which handles resampled points.
 */
export declare type GeodesicResamplerHandler = (point: GeoPointInterface, projected: Float64Array, index: number) => void;
/**
 * Resamples projected geodesic (great-circle) paths between defined endpoints into series of straight line segments.
 */
export declare class GeodesicResampler {
    readonly minDistance: number;
    readonly dpTolerance: number;
    readonly maxDepth: number;
    private readonly cosMinDistance;
    private readonly dpTolSq;
    private geoPointCache;
    private vec2Cache;
    private vec3Cache;
    /**
     * Constructor.
     * @param minDistance The minimum geodesic distance this resampler enforces between two adjacent resampled points, in
     * great-arc radians.
     * @param dpTolerance The Douglas-Peucker tolerance this resampler uses when deciding whether to discard a resampled
     * point during the line simplification process.
     * @param maxDepth The maximum depth of the resampling algorithm used by this resampler. The number of resampled
     * points is bounded from above by 2^[maxDepth] - 1.
     */
    constructor(minDistance: number, dpTolerance: number, maxDepth: number);
    /**
     * Resamples a projected geodesic (great-circle) path.
     * @param projection The projection to use.
     * @param start The start of the path.
     * @param end The end of the path.
     * @param handler A function to handle the resampled points. The function is called once for each resampled point,
     * in order.
     * @throws Error when the start and end of the path are antipodal.
     */
    resample(projection: GeoProjection, start: LatLonInterface, end: LatLonInterface, handler: GeodesicResamplerHandler): void;
    /**
     * Resamples a projected geodesic (great-circle) path. This method will recursively split the path into two halves
     * and resample the midpoint. Recursion continues as long as the maximum depth has not been reached and at least one
     * of the following conditions is met:
     * * The distance from the midpoint to the endpoints is greater than or equal to the minimum resampling distance.
     * * The Douglas-Peucker metric of the projected midpoint is greater than or equal to the set tolerance.
     * @param projection The projection to use.
     * @param lat1 The latitude of the start of the path.
     * @param lon1 The longitude of the start of the path.
     * @param x1 The x-component of the Cartesian position vector of the start of the path.
     * @param y1 The y-component of the Cartesian position vector of the start of the path.
     * @param z1 The z-component of the Cartesian position vector of the start of the path.
     * @param projX1 The x-component of the projected location of the start of the path.
     * @param projY1 The y-component of the projected location of the start of the path.
     * @param lat2 The latitude of the end of the path.
     * @param lon2 The longitude of the end of the path.
     * @param x2 The x-component of the Cartesian position vector of the end of the path.
     * @param y2 The y-component of the Cartesian position vector of the end of the path.
     * @param z2 The z-component of the Cartesian position vector of the end of the path.
     * @param projX2 The x-component of the projected location of the end of the path.
     * @param projY2 The y-component of the projected location of the end of the path.
     * @param handler A function to handle the resampled points.
     * @param depth The current depth of the resampling algorithm.
     * @param index The index of the next resampled point.
     * @returns The index of the next resampled point.
     * @throws Error when the start and end of the path are antipodal.
     */
    private resampleHelper;
}
//# sourceMappingURL=GeodesicResampler.d.ts.map