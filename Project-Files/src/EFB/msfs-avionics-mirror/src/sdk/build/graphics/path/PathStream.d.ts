/**
 * A stream of canvas 2D rendering context-like path commands.
 */
export interface PathStream {
    /**
     * Begins a path. Erases all previous path state.
     */
    beginPath(): void;
    /**
     * Moves to a specified point.
     * @param x The x-coordinate of the point to which to move.
     * @param y The y-coordinate of the point to which to move.
     */
    moveTo(x: number, y: number): void;
    /**
     * Paths a straight line from the current point to a specified point.
     * @param x The x-coordinate of the end point.
     * @param y The y-coordinate of the end point.
     */
    lineTo(x: number, y: number): void;
    /**
     * Paths a cubic Bezier curve from the current point to a specified point.
     * @param cp1x The x-coordinate of the first control point.
     * @param cp1y The y-coordinate of the first control point.
     * @param cp2x The x-coordinate of the second control point.
     * @param cp2y The y-coordinate of the second control point.
     * @param x The x-coordinate of the end point.
     * @param y The y-coordinate of the end point.
     */
    bezierCurveTo(cp1x: number, cp1y: number, cp2x: number, cp2y: number, x: number, y: number): void;
    /**
     * Paths a quadrative Bezier curve from the current point to a specified point.
     * @param cpx The x-coordinate of the control point.
     * @param cpy The y-coordinate of the control point.
     * @param x The x-coordinate of the end point.
     * @param y The y-coordinate of the end point.
     */
    quadraticCurveTo(cpx: number, cpy: number, x: number, y: number): void;
    /**
     * Paths an arc.
     * @param x The x-coordinate of the center of the circle containing the arc.
     * @param y The y-coordinate of the center of the circle containing the arc.
     * @param radius The radius of the arc.
     * @param startAngle The angle of the start of the arc, in radians.
     * @param endAngle The angle of the end of the arc, in radians.
     * @param counterClockwise Whether the arc should be drawn counterclockwise. False by default.
     */
    arc(x: number, y: number, radius: number, startAngle: number, endAngle: number, counterClockwise?: boolean): void;
    /**
     * Paths a line from the current point to the first point defined by the current path.
     */
    closePath(): void;
}
/**
 * A path stream which does nothing on any input.
 */
export declare class NullPathStream implements PathStream {
    /** An instance of a {@link NullPathStream}. */
    static readonly INSTANCE: NullPathStream;
    /**
     * Does nothing.
     */
    beginPath(): void;
    /**
     * Does nothing.
     */
    moveTo(): void;
    /**
     * Does nothing.
     */
    lineTo(): void;
    /**
     * Does nothing.
     */
    bezierCurveTo(): void;
    /**
     * Does nothing.
     */
    quadraticCurveTo(): void;
    /**
     * Does nothing.
     */
    arc(): void;
    /**
     * Does nothing.
     */
    closePath(): void;
}
/**
 * A path stream which sends a transformed version of its input to be consumed by another stream.
 */
export interface TransformingPathStream extends PathStream {
    /**
     * Gets the path stream that is consuming this stream's transformed output.
     * @returns The path stream that is consuming this stream's transformed output.
     */
    getConsumer(): PathStream;
    /**
     * Sets the path stream that consumes this stream's transformed output.
     * @param consumer The new consuming path stream.
     */
    setConsumer(consumer: PathStream): void;
}
/**
 * An abstract implementation of a path stream which sends a transformed version of its input to be consumed by another
 * stream.
 */
export declare abstract class AbstractTransformingPathStream implements TransformingPathStream {
    protected consumer: PathStream;
    /**
     * Constructor.
     * @param consumer The path stream that consumes this stream's transformed output.
     */
    constructor(consumer: PathStream);
    /** @inheritdoc */
    getConsumer(): PathStream;
    /** @inheritdoc */
    setConsumer(consumer: PathStream): void;
    /** @inheritdoc */
    abstract beginPath(): void;
    /** @inheritdoc */
    abstract moveTo(x: number, y: number): void;
    /** @inheritdoc */
    abstract lineTo(x: number, y: number): void;
    /** @inheritdoc */
    abstract bezierCurveTo(cp1x: number, cp1y: number, cp2x: number, cp2y: number, x: number, y: number): void;
    /** @inheritdoc */
    abstract quadraticCurveTo(cpx: number, cpy: number, x: number, y: number): void;
    /** @inheritdoc */
    abstract arc(x: number, y: number, radius: number, startAngle: number, endAngle: number, counterClockwise?: boolean): void;
    /** @inheritdoc */
    abstract closePath(): void;
}
/**
 * A path stream which sends its inputs unchanged to be consumed by another stream.
 */
export declare class PassThroughPathStream extends AbstractTransformingPathStream {
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
}
//# sourceMappingURL=PathStream.d.ts.map