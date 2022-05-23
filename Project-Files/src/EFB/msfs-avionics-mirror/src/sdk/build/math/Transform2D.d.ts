import { ReadonlyFloat64Array } from './VecMath';
/**
 * A 2D affine transformation. By default, Transform2D objects are initially created as identity transformations.
 */
export declare class Transform2D {
    private static readonly transformCache;
    private readonly array;
    /**
     * Gets the parameters of this transformation as a 6-tuple: `[scaleX, skewX, translateX, skewY, scaleY, translateY]`.
     * @returns The parameters of this transformation.
     */
    getParameters(): ReadonlyFloat64Array;
    /**
     * Sets the parameters of this transformation.
     * @param scaleX The x scaling factor.
     * @param skewX The x skew factor.
     * @param translateX The x translation.
     * @param skewY The y skew factor.
     * @param scaleY The y scaling factor.
     * @param translateY The y translation.
     * @returns This transformation, after it has been changed.
     */
    set(scaleX: number, skewX: number, translateX: number, skewY: number, scaleY: number, translateY: number): this;
    /**
     * Sets the parameters of this transformation from another transformation.
     * @param transform The transformation from which to take parameters.
     */
    set(transform: Transform2D): this;
    /**
     * Sets the x scaling factor of this transformation.
     * @param value The new x scaling factor.
     * @returns This transformation, after it has been changed.
     */
    setScaleX(value: number): this;
    /**
     * Sets the y scaling factor of this transformation.
     * @param value The new y scaling factor.
     * @returns This transformation, after it has been changed.
     */
    setScaleY(value: number): this;
    /**
     * Sets the x and y scaling factors of this transformation.
     * @param x The new x scaling factor.
     * @param y The new y scaling factor.
     * @returns This transformation, after it has been changed.
     */
    setScale(x: number, y: number): this;
    /**
     * Sets the x skew factor of this transformation.
     * @param value The new x skew factor.
     * @returns This transformation, after it has been changed.
     */
    setSkewX(value: number): this;
    /**
     * Sets the y skew factor of this transformation.
     * @param value The new y skew factor.
     * @returns This transformation, after it has been changed.
     */
    setSkewY(value: number): this;
    /**
     * Sets the x translation of this transformation.
     * @param value The new x translation.
     * @returns This transformation, after it has been changed.
     */
    setTranslateX(value: number): this;
    /**
     * Sets the y translation of this transformation.
     * @param value The new y translation.
     * @returns This transformation, after it has been changed.
     */
    setTranslateY(value: number): this;
    /**
     * Sets the x and y translations of this transformation.
     * @param x The new x translation.
     * @param y The new y translation.
     * @returns This transformation, after it has been changed.
     */
    setTranslate(x: number, y: number): this;
    /**
     * Inverts this transformation.
     * @returns This transformation, after it has been inverted.
     */
    invert(): this;
    /**
     * Copies this transformation.
     * @returns A copy of this transformation.
     */
    copy(): Transform2D;
    /**
     * Applies this transformation to a 2D vector.
     * @param vec A 2D vector.
     * @param out The vector to which to write the result.
     * @returns The result of applying this transformation to `vec`.
     */
    apply(vec: ReadonlyFloat64Array, out: Float64Array): Float64Array;
    /**
     * Changes this transformation to the one that is the result of offsetting this transformation's origin.
     * @param x The x-coordinate of the offset origin.
     * @param y The y-coordinate of the offset origin.
     * @returns This transformation, after it has been changed.
     */
    offsetOrigin(x: number, y: number): this;
    /**
     * Sets this transformation to the identity transformation.
     * @returns This transformation, after it has been changed.
     */
    toIdentity(): this;
    /**
     * Sets this transformation to a translation.
     * @param x The x translation.
     * @param y The y translation.
     * @returns This transformation, after it has been changed.
     */
    toTranslation(x: number, y: number): this;
    /**
     * Sets this transformation to a scaling about the origin (0, 0).
     * @param x The x scaling factor.
     * @param y The y scaling factor.
     * @returns This transformation, after it has been changed.
     */
    toScale(x: number, y: number): this;
    /**
     * Sets this transformation to a scaling about an arbitrary origin.
     * @param x The x scaling factor.
     * @param y The y scaling factor.
     * @param originX The x-coordinate of the scaling origin.
     * @param originY The y-coordinate of the scaling origin.
     * @returns This transformation, after it has been changed.
     */
    toScale(x: number, y: number, originX: number, originY: number): this;
    /**
     * Sets this transformation to a rotation about the origin (0, 0).
     * @param theta The rotation angle, in radians.
     * @returns This transformation, after it has been changed.
     */
    toRotation(theta: number): this;
    /**
     * Sets this transformation to a rotation about an arbitrary origin.
     * @param theta The rotation angle, in radians.
     * @param originX The x-coordinate of the rotation origin.
     * @param originY The y-coordinate of the rotation origin.
     * @returns This transformation, after it has been changed.
     */
    toRotation(theta: number, originX: number, originY: number): this;
    /**
     * Sets this transformation to a reflection across a line passing through the origin (0, 0).
     * @param theta The angle of the reflection line, in radians, with respect to the positive x axis.
     * @returns This transformation, after it has been changed.
     */
    toReflection(theta: number): this;
    /**
     * Sets this transformation to a reflection across a line passing through an arbitrary origin.
     * @param theta The angle of the reflection line, in radians, with respect to the positive x axis.
     * @param originX The x-coordinate of the reflection origin.
     * @param originY The y-coordinate of the reflection origin.
     * @returns This transformation, after it has been changed.
     */
    toReflection(theta: number, originX: number, originY: number): this;
    /**
     * Concatenates one or more transformations and returns the result. Concatenating transformations `[A, B, ...]`
     * results in a transformation that is equivalent to first applying `A`, then applying `B`, etc. Note that this order
     * is the _opposite_ of the one resulting from multiplying the individual transformation _matrices_
     * `M_A * M_B * ...`.
     *
     * If the number of transformations to concatenate equals zero, the identity matrix is returned.
     * @param out The transformation to which to write the result.
     * @param transforms The transformations to concatenate, in order.
     * @returns The result of concatenating all transformations in `transforms`.
     */
    static concat<T extends Transform2D>(out: T, ...transforms: Transform2D[]): T;
}
//# sourceMappingURL=Transform2D.d.ts.map