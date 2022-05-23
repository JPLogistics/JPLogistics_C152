import { PathStream, TransformingPathStream } from './PathStream';
/**
 * A pattern which can be drawn along a path.
 */
export interface PathPattern {
    /** The along-path length of each repeating unit of this pattern. */
    readonly length: number;
    /**
     * The anchor point of each repeating unit of this pattern along its length, as a fraction of the total length. The
     * orientation of each pattern unit is determined by the direction of the path at its anchor point.
     */
    readonly anchor: number;
    /**
     * Draws a single unit of this pattern to a path stream. The coordinate system of the path stream is set such that
     * the anchor point of the pattern unit is located at the origin (0, 0), and the positive x-axis points in the
     * direction of the path on which the pattern unit is placed.
     * @param stream The path stream to which to draw this pattern.
     */
    draw(stream: PathStream): void;
}
/**
 * A {@link TransformingPathStream} which converts an input path into path commands to draw a repeating pattern along
 * the input path.
 */
export declare class PatternPathStream implements TransformingPathStream {
    private pattern;
    private static readonly vec2Cache;
    private readonly clipBounds;
    private readonly transformStream;
    private readonly clipStream;
    private readonly firstPoint;
    private readonly prevPoint;
    private distanceLeft;
    /**
     * Constructor.
     * @param consumer The path stream that consumes this stream's transformed output.
     * @param pattern The pattern drawn by this stream. If the pattern is `null`, then this stream will pass through path
     * commands to its consumer without transforming them into a pattern.
     */
    constructor(consumer: PathStream, pattern: PathPattern | null);
    /**
     * Gets the pattern drawn by this stream.
     * @returns The pattern drawn by this stream.
     */
    getPattern(): PathPattern | null;
    /**
     * Sets the pattern drawn by this stream. If the pattern is `null`, then this stream will pass through path commands
     * to its consumer without transforming them into a pattern.
     * @param pattern A pattern.
     */
    setPattern(pattern: PathPattern | null): void;
    /** @inheritdoc */
    getConsumer(): PathStream;
    /** @inheritdoc */
    setConsumer(consumer: PathStream): void;
    /** @inheritdoc */
    beginPath(): void;
    /** @inheritdoc */
    moveTo(x: number, y: number): void;
    /** @inheritdoc */
    lineTo(x: number, y: number): void;
    /**
     * Not supported by this path stream. Calling this method will execute a `moveTo()` command to the specified end
     * point.
     * @param cp1x The x-coordinate of the first control point.
     * @param cp1y The y-coordinate of the first control point.
     * @param cp2x The x-coordinate of the second control point.
     * @param cp2y The y-coordinate of the second control point.
     * @param x The x-coordinate of the end point.
     * @param y The y-coordinate of the end point.
     */
    bezierCurveTo(cp1x: number, cp1y: number, cp2x: number, cp2y: number, x: number, y: number): void;
    /**
     * Not supported by this path stream. Calling this method will execute a `moveTo()` command to the specified end
     * point.
     * @param cpx The x-coordinate of the control point.
     * @param cpy The y-coordinate of the control point.
     * @param x The x-coordinate of the end point.
     * @param y The y-coordinate of the end point.
     */
    quadraticCurveTo(cpx: number, cpy: number, x: number, y: number): void;
    /** @inheritdoc */
    arc(x: number, y: number, radius: number, startAngle: number, endAngle: number, counterClockwise?: boolean): void;
    /** @inheritdoc */
    closePath(): void;
    /**
     * Resets the state of this stream.
     */
    private reset;
}
//# sourceMappingURL=PatternPathStream.d.ts.map