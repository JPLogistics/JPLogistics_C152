import { AbstractTransformingPathStream, PathStream } from './PathStream';
import { GeoProjection } from '../../geo/GeoProjection';
import { GeoCircleResampler } from '../../geo/GeoCircleResampler';
/**
 * A path stream which transforms a path stream in geographic spherical coordinates to one in projected planar
 * coordinates.
 */
export declare class GeoProjectionPathStream extends AbstractTransformingPathStream {
    private projection;
    private static readonly geoPointCache;
    private static readonly geoCircleCache;
    private readonly resampler;
    private readonly firstPoint;
    private readonly prevPoint;
    private readonly prevPointProjected;
    private readonly resampleHandler;
    /**
     * Constructor.
     * @param consumer The path stream that consumes this stream's transformed output.
     * @param projection The projection this stream uses.
     * @param minDistance The minimum great-circle distance this stream's resampler enforces between two adjacent
     * resampled points, in great-arc radians.
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
     * @param resampler The geo circle resampler this stream uses.
     */
    constructor(consumer: PathStream, projection: GeoProjection, resampler: GeoCircleResampler);
    /**
     * Gets the projection used by this stream.
     * @returns The projection used by this stream.
     */
    getProjection(): GeoProjection;
    /**
     * Sets the projection used by this stream.
     * @param projection A projection.
     */
    setProjection(projection: GeoProjection): void;
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
     * @throws Error if the specified point is antipodal to the last pathed point.
     */
    lineTo(lon: number, lat: number): void;
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
     * @param startAngle If the center of the circle containing the arc is not one of the poles, the true bearing, in
     * degrees, from the center of the circle to the start of the arc; otherwise the longitude, in degrees, of the start
     * of the arc.
     * @param endAngle If the center of the circle containing the arc is not one of the poles, the true bearing, in
     * degrees, from the center of the circle to the end of the arc; otherwise the longitude, in degrees, of the end of
     * the arc.
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
    /**
     * Handles resampled points.
     * @param vector A vector which describes the projected path terminating at the resampled point.
     */
    private onResampled;
}
//# sourceMappingURL=GeoProjectionPathStream.d.ts.map