import { AbstractTransformingPathStream } from './PathStream';
/**
 * A {@link TransformingPathStream} which applies an affine transformation to its input.
 *
 * The types of transformation supported by this class are:
 * * Translation.
 * * Uniform scaling.
 * * Rotation.
 */
export declare class AffineTransformPathStream extends AbstractTransformingPathStream {
    private static readonly vec2Cache;
    private static readonly transformCache;
    private readonly transform;
    private scale;
    private rotation;
    /**
     * Adds a translation to this stream's transformation.
     * @param x The x translation.
     * @param y The y translation.
     * @param order The order in which to add the translation (defaults to `'after'`):
     * * `'before'` - Applies the translation before this stream's current transformation.
     * * `'after'` - Applies the translation after this stream's current transformation.
     * @returns This stream, after its transformation has been changed.
     */
    addTranslation(x: number, y: number, order?: 'before' | 'after'): this;
    /**
     * Adds a uniform scaling to this stream's transformation.
     * @param factor The scaling factor.
     * @param order The order in which to add the translation (defaults to `'after'`):
     * * `'before'` - Applies the scaling before this stream's current transformation.
     * * `'after'` - Applies the scaling after this stream's current transformation.
     * @returns This stream, after its transformation has been changed.
     */
    addScale(factor: number, order?: 'before' | 'after'): this;
    /**
     * Adds a rotation to this stream's transformation.
     * @param angle The rotation angle, in radians.
     * @param order The order in which to add the translation (defaults to `'after'`):
     * * `'before'` - Applies the rotation before this stream's current transformation.
     * * `'after'` - Applies the rotation after this stream's current transformation.
     * @returns This stream, after its transformation has been changed.
     */
    addRotation(angle: number, order?: 'before' | 'after'): this;
    /**
     * Resets this stream's transformation to the identity transformation.
     * @returns This stream, after its transformation has been changed.
     */
    resetTransform(): this;
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
     * Updates this stream's cached scale and rotation values from its transformation.
     */
    private updateScaleRotation;
    /**
     * Applies this stream's transformation to a point.
     * @param x The x-coordinate of the point to transform.
     * @param y The y-coordinate of the point to transform.
     * @returns The transformed point.
     */
    private applyTransform;
}
//# sourceMappingURL=AffineTransformPathStream.d.ts.map