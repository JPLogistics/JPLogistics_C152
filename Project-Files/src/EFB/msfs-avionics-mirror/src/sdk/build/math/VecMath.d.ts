/**
 * A readonly version of a {@link Float64Array}.
 */
export declare type ReadonlyFloat64Array = Readonly<Omit<Float64Array, 'set' | 'copyWithin' | 'sort'>>;
/**
 * 2D vector mathematical operations.
 */
export declare class Vec2Math {
    /**
     * Creates a 2D vector initialized to `[0, 0]`.
     * @returns A new 2D vector initialized to `[0, 0]`.
     */
    static create(): Float64Array;
    /**
     * Creates a 2D vector with specified x- and y- components.
     * @param x The x-component of the new vector.
     * @param y The y-component of the new vector.
     * @returns A new 2D vector with the specified components.
     */
    static create(x: number, y: number): Float64Array;
    /**
     * Gets the polar angle theta of a vector in radians.
     * @param vec - a vector.
     * @returns the polar angle theta of the vector.
     */
    static theta(vec: ReadonlyFloat64Array): number;
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
    static add(v1: ReadonlyFloat64Array, v2: ReadonlyFloat64Array, out: Float64Array): Float64Array;
    /**
     * Subtracts one vector from another.
     * @param v1 The first vector.
     * @param v2 The second vector.
     * @param out The vector to write the results to.
     * @returns the vector difference.
     */
    static sub(v1: ReadonlyFloat64Array, v2: ReadonlyFloat64Array, out: Float64Array): Float64Array;
    /**
     * Gets the dot product of two vectors.
     * @param v1 The first vector.
     * @param v2 The second vector.
     * @returns The dot product of the vectors.
     */
    static dot(v1: ReadonlyFloat64Array, v2: ReadonlyFloat64Array): number;
    /**
     * Multiplies a vector by a scalar.
     * @param v1 The vector to multiply.
     * @param scalar The scalar to apply.
     * @param out The vector to write the results to.
     * @returns The scaled vector.
     */
    static multScalar(v1: ReadonlyFloat64Array, scalar: number, out: Float64Array): Float64Array;
    /**
     * Gets the magnitude of a vector.
     * @param v1 The vector to get the magnitude for.
     * @returns the vector's magnitude.
     */
    static abs(v1: ReadonlyFloat64Array): number;
    /**
     * Normalizes the vector to a unit vector.
     * @param v1 The vector to normalize.
     * @param out The vector to write the results to.
     * @returns the normalized vector.
     */
    static normalize(v1: ReadonlyFloat64Array, out: Float64Array): Float64Array;
    /**
     * Gets the normal of the supplied vector.
     * @param v1 The vector to get the normal for.
     * @param out The vector to write the results to.
     * @param counterClockwise Whether or not to get the counterclockwise normal.
     * @returns the normal vector.
     */
    static normal(v1: ReadonlyFloat64Array, out: Float64Array, counterClockwise?: boolean): Float64Array;
    /**
     * Gets the Euclidean distance between two vectors.
     * @param vec1 The first vector.
     * @param vec2 The second vector.
     * @returns the Euclidean distance between the two vectors.
     */
    static distance(vec1: ReadonlyFloat64Array, vec2: ReadonlyFloat64Array): number;
    /**
     * Checks if two vectors are equal.
     * @param vec1 The first vector.
     * @param vec2 The second vector.
     * @returns Whether the two vectors are equal.
     */
    static equals(vec1: ReadonlyFloat64Array, vec2: ReadonlyFloat64Array): boolean;
    /**
     * Copies one vector to another.
     * @param from The vector from which to copy.
     * @param to The vector to which to copy.
     * @returns The changed vector.
     */
    static copy(from: ReadonlyFloat64Array, to: Float64Array): Float64Array;
}
/**
 * 3D vector mathematical operations.
 */
export declare class Vec3Math {
    /**
     * Creates a 3D vector initialized to `[0, 0, 0]`.
     * @returns A new 3D vector initialized to `[0, 0, 0]`.
     */
    static create(): Float64Array;
    /**
     * Creates a 3D vector with specified x-, y-, and z- components.
     * @param x The x-component of the new vector.
     * @param y The y-component of the new vector.
     * @param z The z-component of the new vector.
     * @returns A new 3D vector with the specified components.
     */
    static create(x: number, y: number, z: number): Float64Array;
    /**
     * Gets the spherical angle theta of a vector in radians.
     * @param vec - a vector.
     * @returns the spherical angle theta of the vector.
     */
    static theta(vec: ReadonlyFloat64Array): number;
    /**
     * Gets the spherical angle phi of a vector in radians.
     * @param vec - a vector.
     * @returns the spherical angle phi of the vector.
     */
    static phi(vec: ReadonlyFloat64Array): number;
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
    static add(v1: ReadonlyFloat64Array, v2: ReadonlyFloat64Array, out: Float64Array): Float64Array;
    /**
     * Subtracts one vector from another.
     * @param v1 The first vector.
     * @param v2 The second vector.
     * @param out The vector to write the results to.
     * @returns the vector difference.
     */
    static sub(v1: ReadonlyFloat64Array, v2: ReadonlyFloat64Array, out: Float64Array): Float64Array;
    /**
     * Gets the dot product of two vectors.
     * @param v1 The first vector.
     * @param v2 The second vector.
     * @returns The dot product of the vectors.
     */
    static dot(v1: ReadonlyFloat64Array, v2: ReadonlyFloat64Array): number;
    /**
     * Gets the cross product of two vectors.
     * @param v1 - the first vector.
     * @param v2 - the second vector.
     * @param out - the vector to which to write the result.
     * @returns the cross product.
     */
    static cross(v1: ReadonlyFloat64Array, v2: ReadonlyFloat64Array, out: Float64Array): Float64Array;
    /**
     * Multiplies a vector by a scalar.
     * @param v1 The vector to multiply.
     * @param scalar The scalar to apply.
     * @param out The vector to write the results to.
     * @returns The scaled vector.
     */
    static multScalar(v1: ReadonlyFloat64Array, scalar: number, out: Float64Array): Float64Array;
    /**
     * Gets the magnitude of a vector.
     * @param v1 The vector to get the magnitude for.
     * @returns the vector's magnitude.
     */
    static abs(v1: ReadonlyFloat64Array): number;
    /**
     * Normalizes the vector to a unit vector.
     * @param v1 The vector to normalize.
     * @param out The vector to write the results to.
     * @returns the normalized vector.
     */
    static normalize(v1: ReadonlyFloat64Array, out: Float64Array): Float64Array;
    /**
     * Gets the Euclidean distance between two vectors.
     * @param vec1 The first vector.
     * @param vec2 The second vector.
     * @returns the Euclidean distance between the two vectors.
     */
    static distance(vec1: ReadonlyFloat64Array, vec2: ReadonlyFloat64Array): number;
    /**
     * Checks if two vectors are equal.
     * @param vec1 The first vector.
     * @param vec2 The second vector.
     * @returns Whether the two vectors are equal.
     */
    static equals(vec1: ReadonlyFloat64Array, vec2: ReadonlyFloat64Array): boolean;
    /**
     * Copies one vector to another.
     * @param from The vector from which to copy.
     * @param to The vector to which to copy.
     * @returns the changed vector.
     */
    static copy(from: ReadonlyFloat64Array, to: Float64Array): Float64Array;
}
/**
 * N-dimensional vector mathematical operations.
 */
export declare class VecNMath {
    /**
     * Creates an N-dimensional vector with all components initialized to `0`.
     * @param length The length of the new vector.
     * @returns A new N-dimensional vector with the specified length and all components initialized to `0`.
     */
    static create(length: number): Float64Array;
    /**
     * Creates an N-dimensional vector with specified components.
     * @param length The length of the new vector.
     * @param components The components of the new vector.
     * @returns A new N-dimensional vector with the specified length and components.
     */
    static create(length: number, ...components: number[]): Float64Array;
    /**
     * Sets the components of a vector.
     * @param vec The vector to change.
     * @param components The new components.
     * @returns The vector after it has been changed.
     */
    static set(vec: Float64Array, ...components: number[]): Float64Array;
    /**
     * Gets the magnitude of a vector.
     * @param vec The vector to get the magnitude for.
     * @returns The vector's magnitude.
     */
    static abs(vec: ReadonlyFloat64Array): number;
    /**
     * Gets the dot product of two vectors.
     * @param v1 The first vector.
     * @param v2 The second vector.
     * @returns The dot product of the vectors.
     * @throws Error if the two vectors are of unequal lengths.
     */
    static dot(v1: ReadonlyFloat64Array, v2: ReadonlyFloat64Array): number;
    /**
     * Normalizes a vector to a unit vector.
     * @param v1 The vector to normalize.
     * @param out The vector to write the results to.
     * @returns The normalized vector.
     */
    static normalize(v1: ReadonlyFloat64Array, out: Float64Array): Float64Array;
    /**
     * Checks if two vectors are equal.
     * @param vec1 The first vector.
     * @param vec2 The second vector.
     * @returns Whether the two vectors are equal.
     */
    static equals(vec1: ReadonlyFloat64Array, vec2: ReadonlyFloat64Array): boolean;
    /**
     * Copies one vector to another.
     * @param from The vector from which to copy.
     * @param to The vector to which to copy.
     * @returns The changed vector.
     * @throws Error if the vectors are of unequal lengths.
     */
    static copy(from: ReadonlyFloat64Array, to: Float64Array): Float64Array;
}
//# sourceMappingURL=VecMath.d.ts.map