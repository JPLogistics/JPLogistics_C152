/**
 * 2D vector mathematical opertaions.
 */
export declare class Vec2Math {
    /**
     * Gets the polar angle theta of a vector in radians.
     * @param vec - a vector.
     * @returns the polar angle theta of the vector.
     */
    static theta(vec: Float64Array): number;
    /**
     * Sets the components of a vector.
     * @param x - the new x-component.
     * @param y - the new y-component.
     * @param vec - the vector to change.
     * @returns the vector after it has been changed.
     */
    static set(x: number, y: number, vec: Float64Array): Float64Array;
    /**
     * Sets the polar components of a vector.
     * @param r - the new length (magnitude).
     * @param theta - the new polar angle theta, in radians.
     * @param vec - the vector to change.
     * @returns the vector after it has been changed.
     */
    static setFromPolar(r: number, theta: number, vec: Float64Array): Float64Array;
    /**
     * Add one vector to another.
     * @param v1 The first vector.
     * @param v2 The second vector.
     * @param out The vector to write the results to.
     * @returns the vector sum.
     */
    static add(v1: Float64Array, v2: Float64Array, out: Float64Array): Float64Array;
    /**
     * Subtracts one vector from another.
     * @param v1 The first vector.
     * @param v2 The second vector.
     * @param out The vector to write the results to.
     * @returns the vector difference.
     */
    static sub(v1: Float64Array, v2: Float64Array, out: Float64Array): Float64Array;
    /**
     * Gets the dot product of two vectors.
     * @param v1 The first vector.
     * @param v2 The second vector.
     * @returns The dot product of the vectors.
     */
    static dot(v1: Float64Array, v2: Float64Array): number;
    /**
     * Multiplies a vector by a scalar.
     * @param v1 The vector to multiply.
     * @param scalar The scalar to apply.
     * @param out The vector to write the results to.
     * @returns The scaled vector.
     */
    static multScalar(v1: Float64Array, scalar: number, out: Float64Array): Float64Array;
    /**
     * Gets the magnitude of a vector.
     * @param v1 The vector to get the magnitude for.
     * @returns the vector's magnitude.
     */
    static abs(v1: Float64Array): number;
    /**
     * Normalizes the vector to a unit vector.
     * @param v1 The vector to normalize.
     * @param out The vector to write the results to.
     * @returns the normalized vector.
     */
    static normalize(v1: Float64Array, out: Float64Array): Float64Array;
    /**
     * Gets the normal of the supplied vector.
     * @param v1 The vector to get the normal for.
     * @param out The vector to write the results to.
     * @param counterClockwise Whether or not to get the counterclockwise normal.
     * @returns the normal vector.
     */
    static normal(v1: Float64Array, out: Float64Array, counterClockwise?: boolean): Float64Array;
    /**
     * Gets the Euclidean distance between two vectors.
     * @param vec1 The first vector.
     * @param vec2 The second vector.
     * @returns the Euclidean distance between the two vectors.
     */
    static distance(vec1: Float64Array, vec2: Float64Array): number;
    /**
     * Checks if two vectors are equal.
     * @param vec1 - the first vector.
     * @param vec2 - the second vector.
     * @returns whether the two vectors are equal.
     */
    static equals(vec1: Float64Array, vec2: Float64Array): boolean;
    /**
     * Copies one vector to another.
     * @param from - the vector from which to copy.
     * @param to - the vector to which to copy.
     * @returns the changed vector.
     */
    static copy(from: Float64Array, to: Float64Array): Float64Array;
}
/**
 * 3D vector mathematical opertaions.
 */
export declare class Vec3Math {
    /**
     * Gets the spherical angle theta of a vector in radians.
     * @param vec - a vector.
     * @returns the spherical angle theta of the vector.
     */
    static theta(vec: Float64Array): number;
    /**
     * Gets the spherical angle phi of a vector in radians.
     * @param vec - a vector.
     * @returns the spherical angle phi of the vector.
     */
    static phi(vec: Float64Array): number;
    /**
     * Sets the components of a vector.
     * @param x - the new x-component.
     * @param y - the new y-component.
     * @param z - the new z-component.
     * @param vec - the vector to change.
     * @returns the vector after it has been changed.
     */
    static set(x: number, y: number, z: number, vec: Float64Array): Float64Array;
    /**
     * Sets the spherical components of a vector.
     * @param r - the new length (magnitude).
     * @param theta - the new spherical angle theta, in radians.
     * @param phi - the new spherical angle phi, in radians.
     * @param vec - the vector to change.
     * @returns the vector after it has been changed.
     */
    static setFromSpherical(r: number, theta: number, phi: number, vec: Float64Array): Float64Array;
    /**
     * Add one vector to another.
     * @param v1 The first vector.
     * @param v2 The second vector.
     * @param out The vector to write the results to.
     * @returns the vector sum.
     */
    static add(v1: Float64Array, v2: Float64Array, out: Float64Array): Float64Array;
    /**
     * Subtracts one vector from another.
     * @param v1 The first vector.
     * @param v2 The second vector.
     * @param out The vector to write the results to.
     * @returns the vector difference.
     */
    static sub(v1: Float64Array, v2: Float64Array, out: Float64Array): Float64Array;
    /**
     * Gets the dot product of two vectors.
     * @param v1 The first vector.
     * @param v2 The second vector.
     * @returns The dot product of the vectors.
     */
    static dot(v1: Float64Array, v2: Float64Array): number;
    /**
     * Gets the cross product of two vectors.
     * @param v1 - the first vector.
     * @param v2 - the second vector.
     * @param out - the vector to which to write the result.
     * @returns the cross product.
     */
    static cross(v1: Float64Array, v2: Float64Array, out: Float64Array): Float64Array;
    /**
     * Multiplies a vector by a scalar.
     * @param v1 The vector to multiply.
     * @param scalar The scalar to apply.
     * @param out The vector to write the results to.
     * @returns The scaled vector.
     */
    static multScalar(v1: Float64Array, scalar: number, out: Float64Array): Float64Array;
    /**
     * Gets the magnitude of a vector.
     * @param v1 The vector to get the magnitude for.
     * @returns the vector's magnitude.
     */
    static abs(v1: Float64Array): number;
    /**
     * Normalizes the vector to a unit vector.
     * @param v1 The vector to normalize.
     * @param out The vector to write the results to.
     * @returns the normalized vector.
     */
    static normalize(v1: Float64Array, out: Float64Array): Float64Array;
    /**
     * Gets the Euclidean distance between two vectors.
     * @param vec1 The first vector.
     * @param vec2 The second vector.
     * @returns the Euclidean distance between the two vectors.
     */
    static distance(vec1: Float64Array, vec2: Float64Array): number;
    /**
     * Checks if two vectors are equal.
     * @param vec1 - the first vector.
     * @param vec2 - the second vector.
     * @returns whether the two vectors are equal.
     */
    static equals(vec1: Float64Array, vec2: Float64Array): boolean;
    /**
     * Copies one vector to another.
     * @param from - the vector from which to copy.
     * @param to - the vector to which to copy.
     * @returns the changed vector.
     */
    static copy(from: Float64Array, to: Float64Array): Float64Array;
}
//# sourceMappingURL=VecMath.d.ts.map