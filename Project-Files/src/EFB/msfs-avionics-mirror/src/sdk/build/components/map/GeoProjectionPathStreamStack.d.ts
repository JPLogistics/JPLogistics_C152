import { GeoCircleResampler, GeoProjection } from '../../geo';
import { AbstractTransformingPathStream, PathStream, TransformingPathStream } from '../../graphics/path';
/**
 * A stack of {@link TransformingPathStream}s which transforms an input in spherical geographic coordinates to planar
 * projected coordinates. The stack contains two sub-stacks: a pre-projected stack which transforms the path before
 * it is projected, and a post-projected stack which transforms the projected path before it is sent to the consumer.
 * Transforming streams can be added to the top and bottom of each sub-stack. The input will be passed through each
 * stream in the pre-projected stack from top to bottom, then projected, then passed through each stream in the post-
 * projected stack from top to bottom, and the final transformed output will be passed to the consumer.
 */
export declare class GeoProjectionPathStreamStack extends AbstractTransformingPathStream {
    private readonly projectionStream;
    private readonly preStack;
    private readonly postStack;
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
    /**
     * Adds a transforming path stream to the top of the pre-projected stack.
     * @param stream A transforming path stream.
     */
    pushPreProjected(stream: TransformingPathStream): void;
    /**
     * Removes the top-most path stream from the pre-projected stack. The removed stream will have its consumer set to
     * {@link NullPathStream.INSTANCE}.
     * @returns The removed path stream, or undefined if this stack was empty.
     */
    popPreProjected(): TransformingPathStream | undefined;
    /**
     * Adds a transforming path stream to the bottom of the pre-projected stack.
     * @param stream A transforming path stream.
     */
    unshiftPreProjected(stream: TransformingPathStream): void;
    /**
     * Removes the bottom-most path stream from the pre-projected stack. The removed stream will have its consumer set to
     * {@link NullPathStream.INSTANCE}.
     * @returns The removed path stream, or undefined if this stack was empty.
     */
    shiftPreProjected(): TransformingPathStream | undefined;
    /**
     * Adds a transforming path stream to the top of the post-projected stack.
     * @param stream A transforming path stream.
     */
    pushPostProjected(stream: TransformingPathStream): void;
    /**
     * Removes the top-most path stream from the post-projected stack. The removed stream will have its consumer set to
     * {@link NullPathStream.INSTANCE}.
     * @returns The removed path stream, or undefined if this stack was empty.
     */
    popPostProjected(): TransformingPathStream | undefined;
    /**
     * Adds a transforming path stream to the bottom of the post-projected stack.
     * @param stream A transforming path stream.
     */
    unshiftPostProjected(stream: TransformingPathStream): void;
    /**
     * Removes the bottom-most path stream from the post-projected stack. The removed stream will have its consumer set
     * to {@link NullPathStream.INSTANCE}.
     * @returns The removed path stream, or undefined if this stack was empty.
     */
    shiftPostProjected(): TransformingPathStream | undefined;
    /** @inheritdoc */
    setConsumer(consumer: PathStream): void;
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
//# sourceMappingURL=GeoProjectionPathStreamStack.d.ts.map