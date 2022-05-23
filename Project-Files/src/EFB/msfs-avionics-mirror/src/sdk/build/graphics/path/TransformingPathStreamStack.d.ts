import { AbstractTransformingPathStream, PathStream, TransformingPathStream } from './PathStream';
/**
 * A stack of {@link TransformingPathStream}s. Inputs are passed through the entire stack from top to bottom before the
 * final transformed output is sent to a consuming stream.
 */
export declare class TransformingPathStreamStack extends AbstractTransformingPathStream {
    private readonly stack;
    /**
     * Adds a transforming path stream to the top of this stack.
     * @param stream A transforming path stream.
     */
    push(stream: TransformingPathStream): void;
    /**
     * Removes the top-most path stream from this stack. The removed stream will have its consumer set to
     * {@link NullPathStream.INSTANCE}.
     * @returns The removed path stream, or undefined if this stack was empty.
     */
    pop(): TransformingPathStream | undefined;
    /**
     * Adds a transforming path stream to the bottom of this stack.
     * @param stream A transforming path stream.
     */
    unshift(stream: TransformingPathStream): void;
    /**
     * Removes the bottom-most path stream from this stack. The removed stream will have its consumer set to
     * {@link NullPathStream.INSTANCE}.
     * @returns The removed path stream, or undefined if this stack was empty.
     */
    shift(): TransformingPathStream | undefined;
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
//# sourceMappingURL=TransformingPathStreamStack.d.ts.map