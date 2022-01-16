import { AbstractTransformingPathStream, PathStream } from './PathStream';
import { GeodesicResampler } from '../geo/GeodesicResampler';
import { GeoProjection } from '../geo/GeoProjection';
/**
 * A path stream which transforms a path stream in spherical coordinates to one in projected planar coordinates.
 */
export declare class GeoProjectionPathStream extends AbstractTransformingPathStream {
    private readonly projection;
    private static vec2Cache;
    private static geoPointCache;
    private readonly resampler;
    private readonly firstPoint;
    private readonly prevPoint;
    private readonly prevPointProjected;
    private readonly resampleHandler;
    /**
     * Constructor.
     * @param consumer The path stream that consumes this stream's transformed output.
     * @param projection The projection this stream uses.
     * @param minDistance The minimum geodesic distance this stream's resampler enforces between two adjacent resampled
     * points, in great-arc radians.
     * @param dpTolerance The Douglas-Peucker tolerance this stream's resampler uses when deciding whether to discard a
     * resampled point during the line simplification process.
     * @param maxDepth The maximum depth of the resampling algorithm used by this stream's resampler. The number of
     * resampled points is bounded from above by 2^[maxDepth] - 1.
     */
    constructor(consumer: PathStream, projection: GeoProjection, minDistance: number, dpTolerance: number, maxDepth: number);
    /**
     * Constructor.
     * @param consumer The path stream that consumes this stream's transformed output.
     * @param projection The projection this stream uses.
     * @param resampler The geodesic resampler this stream uses.
     */
    constructor(consumer: PathStream, projection: GeoProjection, resampler: GeodesicResampler);
    /** @inheritdoc */
    beginPath(): void;
    /**
     * Moves to a specified point.
     * @param lon The longitude of the point to which to move, in degrees.
     * @param lat The latitude of the point to which to move, in degrees.
     */
    moveTo(lon: number, lat: number): void;
    /**
     * Paths a great-circle arc from the current point to a specified point.
     * @param lon The longitude of the end point, in degrees.
     * @param lat The latitude of the end point, in degrees.
     */
    lineTo(lon: number, lat: number): void;
    /**
     * Handles resampled points.
     * @param point The resampled point.
     * @param projected The projected resampled point.
     * @param index The index of the resampled point.
     */
    private onResampled;
    /**
     * Not supported by this path stream.
     * @throws Error when called.
     */
    bezierCurveTo(): void;
    /**
     * Not supported by this path stream.
     * @throws Error when called.
     */
    quadraticCurveTo(): void;
    /**
     * Paths a small-circle arc.
     * @param lon The longitude of the center of the circle containing the arc, in degrees.
     * @param lat The latitude of the center of the circle containing the arc, in degrees.
     * @param radius The radius of the arc, in great-arc radians.
     * @param startAngle The true bearing from the center of the circle to the start of the arc, in degrees.
     * @param endAngle The true bearing from the center of the circle to the end of the arc, in degrees.
     * @param counterClockwise Whether the arc should be drawn counterclockwise. False by default.
     */
    arc(lon: number, lat: number, radius: number, startAngle: number, endAngle: number, counterClockwise?: boolean): void;
    /**
     * Paths a great-circle arc from the current point to the first point defined by the current path.
     */
    closePath(): void;
    /**
     * Resets the state of this stream.
     */
    private reset;
}
//# sourceMappingURL=GeoProjectionPathStream.d.ts.map