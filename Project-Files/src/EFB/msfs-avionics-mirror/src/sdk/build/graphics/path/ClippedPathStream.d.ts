import { ReadonlyFloat64Array } from '../../math';
import { Subscribable } from '../../sub/Subscribable';
import { AbstractTransformingPathStream, PathStream } from './PathStream';
/**
 * A path stream which performs clipping to an axis-aligned rectangular bounding box before sending the clipped path
 * to another stream. Clipping is only supported for path segments added via the `lineTo()` and `arc()` methods. Path
 * segments added via `bezierCurveTo()` and `quadraticCurveTo()` will be passed to the consumer stream unclipped.
 */
export declare class ClippedPathStream extends AbstractTransformingPathStream {
    private readonly bounds;
    private static readonly vec2Cache;
    private static readonly vec3Cache;
    private static readonly intersectionCache;
    private readonly boundsHandler;
    private readonly boundsLines;
    private isBoundingRectNonZero;
    private readonly firstPoint;
    private readonly prevPoint;
    private prevPointOutcode;
    /**
     * Constructor.
     * @param consumer The path stream that consumes this stream's transformed output.
     * @param bounds A subscribable which provides the clipping bounds for this stream, as `[left, top, right, bottom]`.
     * Whenever the clipping bounds change, the state of this stream will be reset, as if `beginPath()` were called.
     */
    constructor(consumer: PathStream, bounds: Subscribable<ReadonlyFloat64Array>);
    /** @inheritdoc */
    beginPath(): void;
    /** @inheritdoc */
    moveTo(x: number, y: number): void;
    /** @inheritdoc */
    lineTo(x: number, y: number): void;
    /** @inheritdoc */
    bezierCurveTo(cp1x: number, cp1y: number, cp2x: number, cp2y: number, x: number, y: number): void;
    /** @inheritdoc */
    quadraticCurveTo(cpx: number, cpy: number, x: number, y: number): void;
    /** @inheritdoc */
    arc(x: number, y: number, radius: number, startAngle: number, endAngle: number, counterClockwise?: boolean): void;
    /** @inheritdoc */
    closePath(): void;
    /**
     * Resets the state of this stream.
     */
    private reset;
    /**
     * Gets the Cohen-Sutherland outcode for a point.
     * @param x The x-coordinate of the query point.
     * @param y The y-coordinate of the query point.
     * @returns The outcode for the point.
     */
    private getOutcode;
    /**
     * Handles clipping bounds change events.
     */
    private onBoundsChanged;
    /**
     * Destroys this stream.
     */
    destroy(): void;
    /**
     * Gets the line coordinate vector for a line passing through two points.
     * @param x1 The x-coordinate of the first point on the line.
     * @param y1 The y-coordinate of the first point on the line.
     * @param x2 The x-coordinate of the second point on the line.
     * @param y2 The y-coordinate of the second point on the line.
     * @param out A Float64Array object to which to write the result.
     * @returns The line coordinate vector of the line passing through the two points.
     */
    private static getLineCoordinates;
    /**
     * Finds the intersection point between two lines in 2D Euclidean space.
     * @param line1 The line coordinate vector of the first line.
     * @param line2 The line coordinate vector of the second line.
     * @param out A Float64Array object to which to write the result.
     * @returns The intersection point of the two lines, or undefined if the two lines are parallel.
     */
    private static findLineLineIntersection;
}
//# sourceMappingURL=ClippedPathStream.d.ts.map