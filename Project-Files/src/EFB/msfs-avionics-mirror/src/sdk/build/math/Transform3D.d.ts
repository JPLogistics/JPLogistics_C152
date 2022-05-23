import { ReadonlyFloat64Array } from './VecMath';
/**
 * A 3D affine transformation. By default, Transform3D objects are initially created as identity transformations.
 */
export declare class Transform3D {
    private static readonly transformCache;
    private readonly array;
    /**
     * Gets the parameters of this transformation as a 12-tuple:
     * `[scaleX, skewX(Y), skewX(Z), translateX, skewY(X), scaleY, skewY(Z), translateY, skewZ(X), skewZ(Y), scaleZ, translateZ]`.
     * @returns The parameters of this transformation.
     */
    getParameters(): Readonly<Float64Array>;
    /**
     * Sets the parameters of this transformation.
     * @param scaleX The x scaling factor.
     * @param skewXY The x skew factor along the y axis.
     * @param skewXZ The x skew factor along the z axis.
     * @param translateX The x translation.
     * @param skewYX The y skew factor along the x axis.
     * @param scaleY The y scaling factor.
     * @param skewYZ The y skew factor along the z axis.
     * @param translateY The y translation.
     * @param skewZX The z skew factor along the x axis.
     * @param skewZY The z skew factor along the y axis.
     * @param scaleZ The z scaling factor.
     * @param translateZ The z translation.
     * @returns This transformation, after it has been changed.
     */
    set(scaleX: number, skewXY: number, skewXZ: number, translateX: number, skewYX: number, scaleY: number, skewYZ: number, translateY: number, skewZX: number, skewZY: number, scaleZ: number, translateZ: number): this;
    /**
     * Sets the parameters of this transformation from another transformation.
     * @param transform The transformation from which to take parameters.
     */
    set(transform: Transform3D): this;
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
     * Sets the z scaling factor of this transformation.
     * @param value The new z scaling factor.
     * @returns This transformation, after it has been changed.
     */
    setScaleZ(value: number): this;
    /**
     * Sets the x and y scaling factors of this transformation.
     * @param x The new x scaling factor.
     * @param y The new y scaling factor.
     * @param z The new z scaling factor.
     * @returns This transformation, after it has been changed.
     */
    setScale(x: number, y: number, z: number): this;
    /**
     * Sets the x skew factor of this transformation.
     * @param y The new x skew factor along the y axis.
     * @param z The new x skew factor along the z axis.
     * @returns This transformation, after it has been changed.
     */
    setSkewX(y: number, z: number): this;
    /**
     * Sets the y skew factor of this transformation.
     * @param x The new y skew factor along the x axis.
     * @param z The new y skew factor along the z axis.
     * @returns This transformation, after it has been changed.
     */
    setSkewY(x: number, z: number): this;
    /**
     * Sets the z skew factor of this transformation.
     * @param x The new z skew factor along the x axis.
     * @param y The new z skew factor along the y axis.
     * @returns This transformation, after it has been changed.
     */
    setSkewZ(x: number, y: number): this;
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
     * Sets the z translation of this transformation.
     * @param value The new z translation.
     * @returns This transformation, after it has been changed.
     */
    setTranslateZ(value: number): this;
    /**
     * Sets the x and y translations of this transformation.
     * @param x The new x translation.
     * @param y The new y translation.
     * @param z The new z translation.
     * @returns This transformation, after it has been changed.
     */
    setTranslate(x: number, y: number, z: number): this;
    /**
     * Inverts this transformation.
     * @returns This transformation, after it has been inverted.
     * @throws Error if this transformation cannot be inverted.
     */
    invert(): this;
    /**
     * Copies this transformation.
     * @returns A copy of this transformation.
     */
    copy(): Transform3D;
    /**
     * Applies this transformation to a 3D vector.
     * @param vec A 3D vector.
     * @param out The vector to which to write the result.
     * @returns The result of applying this transformation to `vec`.
     */
    apply(vec: ReadonlyFloat64Array, out: Float64Array): Float64Array;
    /**
     * Changes this transformation to the one that is the result of offsetting this transformation's origin.
     * @param x The x-coordinate of the offset origin.
     * @param y The y-coordinate of the offset origin.
     * @param z The z-coordinate of the offset origin.
     * @returns This transformation, after it has been changed.
     */
    offsetOrigin(x: number, y: number, z: number): this;
    /**
     * Sets this transformation to the identity transformation.
     * @returns This transformation, after it has been changed.
     */
    toIdentity(): this;
    /**
     * Sets this transformation to a translation.
     * @param x The x translation.
     * @param y The y translation.
     * @param z The z translation.
     * @returns This transformation, after it has been changed.
     */
    toTranslation(x: number, y: number, z: number): this;
    /**
     * Sets this transformation to a scaling about the origin (0, 0, 0).
     * @param x The x scaling factor.
     * @param y The y scaling factor.
     * @param z The z scaling factor.
     * @returns This transformation, after it has been changed.
     */
    toScale(x: number, y: number, z: number): this;
    /**
     * Sets this transformation to a scaling about an arbitrary origin.
     * @param x The x scaling factor.
     * @param y The y scaling factor.
     * @param z The z scaling factor.
     * @param originX The x-coordinate of the scaling origin.
     * @param originY The y-coordinate of the scaling origin.
     * @param originZ The z-coordinate of the scaling origin.
     * @returns This transformation, after it has been changed.
     */
    toScale(x: number, y: number, z: number, originX: number, originY: number, originZ: number): this;
    /**
     * Sets this transformation to a rotation about an axis parallel to the x axis passing through the origin (0, 0, 0).
     * @param theta The rotation angle, in radians.
     * @returns This transformation, after it has been changed.
     */
    toRotationX(theta: number): this;
    /**
     * Sets this transformation to a rotation about an axis parallel to the x axis passing through an arbitrary point.
     * @param theta The rotation angle, in radians.
     * @param originX The x-coordinate of the rotation origin.
     * @param originY The y-coordinate of the rotation origin.
     * @param originZ The z-coordinate of the rotation origin.
     * @returns This transformation, after it has been changed.
     */
    toRotationX(theta: number, originX: number, originY: number, originZ: number): this;
    /**
     * Sets this transformation to a rotation about an axis parallel to the y axis passing through the origin (0, 0, 0).
     * @param theta The rotation angle, in radians.
     * @returns This transformation, after it has been changed.
     */
    toRotationY(theta: number): this;
    /**
     * Sets this transformation to a rotation about an axis parallel to the y axis passing through an arbitrary point.
     * @param theta The rotation angle, in radians.
     * @param originX The x-coordinate of the rotation origin.
     * @param originY The y-coordinate of the rotation origin.
     * @param originZ The z-coordinate of the rotation origin.
     * @returns This transformation, after it has been changed.
     */
    toRotationY(theta: number, originX: number, originY: number, originZ: number): this;
    /**
     * Sets this transformation to a rotation about an axis parallel to the z axis passing through the origin (0, 0, 0).
     * @param theta The rotation angle, in radians.
     * @returns This transformation, after it has been changed.
     */
    toRotationZ(theta: number): this;
    /**
     * Sets this transformation to a rotation about an axis parallel to the z axis passing through an arbitrary point.
     * @param theta The rotation angle, in radians.
     * @param originX The x-coordinate of the rotation origin.
     * @param originY The y-coordinate of the rotation origin.
     * @param originZ The z-coordinate of the rotation origin.
     * @returns This transformation, after it has been changed.
     */
    toRotationZ(theta: number, originX: number, originY: number, originZ: number): this;
    /**
     * Sets this transformation to a rotation about an arbitrary axis passing through the origin (0, 0, 0).
     * @param theta The rotation angle, in radians.
     * @param axisX The x component of the vector defining the direction of the rotation axis.
     * @param axisY The y component of the vector defining the direction of the rotation axis.
     * @param axisZ The z component of the vector defining the direction of the rotation axis.
     * @returns This transformation, after it has been changed.
     */
    toRotation(theta: number, axisX: number, axisY: number, axisZ: number): this;
    /**
     * Sets this transformation to a rotation about an arbitrary axis passing through an arbitrary point.
     * @param theta The rotation angle, in radians.
     * @param axisX The x component of the vector defining the direction of the rotation axis.
     * @param axisY The y component of the vector defining the direction of the rotation axis.
     * @param axisZ The z component of the vector defining the direction of the rotation axis.
     * @param originX The x-coordinate of the rotation origin.
     * @param originY The y-coordinate of the rotation origin.
     * @param originZ The z-coordinate of the rotation origin.
     * @returns This transformation, after it has been changed.
     */
    toRotation(theta: number, axisX: number, axisY: number, axisZ: number, originX: number, originY: number, originZ: number): this;
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
    static concat<T extends Transform3D>(out: T, ...transforms: Transform3D[]): T;
}
//# sourceMappingURL=Transform3D.d.ts.map