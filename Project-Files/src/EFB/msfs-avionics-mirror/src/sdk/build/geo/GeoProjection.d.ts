import { Transform3D } from '../math/Transform3D';
import { ReadonlyFloat64Array } from '../math/VecMath';
import { LatLonInterface } from './GeoInterfaces';
import { GeoPoint, GeoPointReadOnly } from './GeoPoint';
/**
 * A geographic projection.
 */
export interface GeoProjection {
    /**
     * Gets the geographic center of this projection.
     * @returns The geographic center of this projection.
     */
    getCenter(): GeoPointReadOnly;
    /**
     * Gets the nominal scale factor of this projection. At a scale factor of 1, a distance of one great-arc radian will
     * be projected to a distance of one pixel.
     * @returns The nominal scale factor of this projection.
     */
    getScaleFactor(): number;
    /**
     * Gets the pre-projection (spherical) rotation of this projection as a vector `[lambda, phi, gamma]`. The rotation
     * angles are expressed in radians. The full rotation is an intrinsic rotation with angles applied in the order
     * `lambda, phi, gamma`. The rotation uses the standard geographic cartesian coordinate system, a right-handed
     * coordinate system with the origin at the center of the earth, the positive x axis passing through 0 degrees N,
     * 0 degrees E, and the positive z axis passing through the North Pole.
     * * `lambda`: Intrinsic rotation angle about the z axis. Positive rotation is in the counterclockwise direction when
     * looking down from above the axis.
     * * `phi`: Intrinsic rotation angle about the y axis. Positive rotation is in the clockwise direction when looking
     * down from above the axis.
     * * `gamma`: Intrinsic rotation angle about the x axis. Positive rotation is in the counterclockwise direction when
     * looking down from above the axis.
     * @returns The pre-projection rotation of this projection.
     */
    getPreRotation(): ReadonlyFloat64Array;
    /**
     * Gets the post-projection (planar) translation of this projection, in pixels.
     * @returns The post-projection translation of this projection.
     */
    getTranslation(): ReadonlyFloat64Array;
    /**
     * Gets the post-projection (planar) rotation angle of this projection in radians.
     * @returns The post-projection rotation angle of this projection.
     */
    getPostRotation(): number;
    /**
     * Checks whether this projection reflects the projected coordinate system across the x-axis.
     * @returns Whether this projection reflects the projected coordinate system across the x-axis.
     */
    getReflectY(): boolean;
    /**
     * Projects a set of lat/lon coordinates.
     * @param point The point to project, as either a {@link LatLonInterface} or a `[lon, lat]` array.
     * @param out The vector to which to write the result.
     * @returns The projected point, as a vector.
     */
    project(point: LatLonInterface | ReadonlyFloat64Array, out: Float64Array): Float64Array;
    /**
     * Inverts a set of projected coordinates. This method will determine the geographic point whose projected location
     * is the equal to that described by a 2D position vector.
     * @param vec The 2D position vector describing the location of the projected coordinates.
     * @param out The point to which to write the result.
     * @returns the inverted point.
     */
    invert<T extends GeoPoint | Float64Array>(vec: ReadonlyFloat64Array, out: T): T;
}
/**
 * A mutable geographic projection.
 */
export interface MutableGeoProjection extends GeoProjection {
    /**
     * Sets the geographic center of this projection. The center point of the projection is projected to the origin,
     * before any post-projection transformations are applied.
     * @param point The new center point.
     * @returns This projection, after it has been changed.
     */
    setCenter(point: LatLonInterface): this;
    /**
     * Sets the nominal scale factor of this projection. At a scale factor of 1, a distance of one great-arc radian will
     * be projected to a distance of one pixel.
     * @param factor The new nominal scale factor.
     * @returns This projection, after it has been changed.
     */
    setScaleFactor(factor: number): this;
    /**
     * Sets the pre-projection (spherical) rotation of this projection as a vector `[lambda, phi, gamma]`. The full
     * rotation is an intrinsic rotation with angles applied in the order `lambda, phi, gamma`. The rotation uses the
     * standard geographic cartesian coordinate system, a right-handed coordinate system with the origin at the center of
     * the earth, the positive x axis passing through 0 degrees N, 0 degrees E, and the z axis passing through the North
     * Pole.
     * * `lambda`: Intrinsic rotation angle about the z axis. Positive rotation is in the counterclockwise direction when
     * looking down from above the axis.
     * * `phi`: Intrinsic rotation angle about the y axis. Positive rotation is in the clockwise direction when looking
     * down from above the axis.
     * * `gamma`: Intrinsic rotation angle about the x axis. Positive rotation is in the counterclockwise direction when
     * looking down from above the axis.
     * @param vec The pre-projection rotation, as a vector `[lambda, phi, gamma]`. The rotation angles should be
     * expressed in radians.
     * @returns This projection, after it has been changed.
     */
    setPreRotation(vec: ReadonlyFloat64Array): this;
    /**
     * Sets the post-projection (planar) translation of this projection.
     * @param vec The new post-projection translation, in pixels.
     * @returns This projection, after it has been changed.
     */
    setTranslation(vec: ReadonlyFloat64Array): this;
    /**
     * Sets the post-projection (planar) rotation of this projection.
     * @param rotation The new post-projection rotation angle, in radians.
     * @returns This projection, after it has been changed.
     */
    setPostRotation(rotation: number): this;
    /**
     * Sets whether this reflection should reflect the projected coordinate system across the x-axis. Setting this value
     * to true is useful in the situation where the projected coordinate system should use a positive-y-axis-down
     * convention.
     * @param val True if reflection is desired, false otherwise.
     * @returns This projection, after it has been changed.
     */
    setReflectY(val: boolean): this;
    /**
     * Copies all projection parameters from another projection. The parameters copied are: center, pre-projection
     * rotation angles, scale factor, post-projection translation, post-projection rotation angle, and reflectY.
     * @param other The projection from which to copy parameters.
     * @returns This projection, after it has been changed.
     */
    copyParametersFrom(other: GeoProjection): this;
}
/**
 * A partial implementation of a MutableGeoProjection. Subclasses should use the projectRaw() and invertRaw() methods
 * to define the type of projection to be implemented.
 */
declare abstract class AbstractGeoProjection implements MutableGeoProjection {
    private static readonly vec2Cache;
    private static readonly vec3Cache;
    private static readonly geoPointCache;
    private static readonly transformCache;
    protected readonly center: GeoPoint;
    protected readonly centerTranslation: Float64Array;
    protected scaleFactor: number;
    protected readonly preRotation: Float64Array;
    protected readonly translation: Float64Array;
    protected postRotation: number;
    protected rotationSin: number;
    protected rotationCos: number;
    protected reflectY: number;
    protected readonly preRotationForwardTransform: Transform3D;
    protected readonly preRotationReverseTransform: Transform3D;
    /** @inheritdoc */
    getCenter(): GeoPointReadOnly;
    /** @inheritdoc */
    getScaleFactor(): number;
    /** @inheritdoc */
    getPreRotation(): ReadonlyFloat64Array;
    /** @inheritdoc */
    getTranslation(): ReadonlyFloat64Array;
    /** @inheritdoc */
    getPostRotation(): number;
    /** @inheritdoc */
    getReflectY(): boolean;
    /** @inheritdoc */
    setCenter(point: LatLonInterface): this;
    /** @inheritdoc */
    setScaleFactor(factor: number): this;
    /** @inheritdoc */
    setPreRotation(vec: ReadonlyFloat64Array): this;
    /** @inheritdoc */
    setTranslation(vec: ReadonlyFloat64Array): this;
    /** @inheritdoc */
    setPostRotation(rotation: number): this;
    /** @inheritdoc */
    setReflectY(val: boolean): this;
    /** @inheritdoc */
    copyParametersFrom(other: GeoProjection): this;
    /**
     * Updates the pre-rotation transformation matrices.
     */
    protected updatePreRotationTransforms(): void;
    /**
     * Updates the translation vector to move the center of this projection to the origin.
     */
    protected updateCenterTranslation(): void;
    /**
     * Applies a raw projection.
     * @param vec - a [lon, lat] vector describing the geographic point to project.
     * @param out - a 2D vector to which to write the result.
     * @returns the projected point.
     */
    protected abstract projectRaw(vec: ReadonlyFloat64Array, out: Float64Array): Float64Array;
    /**
     * Inverts a raw projection.
     * @param vec - a 2D vector describing the projected point to invert.
     * @param out - a 2D vector to which to write the result.
     * @returns the inverted point.
     */
    protected abstract invertRaw(vec: ReadonlyFloat64Array, out: Float64Array): Float64Array;
    /**
     * Applies a forward rotation to a set of lat/lon coordinates using this projection's pre-projection rotation angles.
     * @param vec - the lat/lon coordinates to rotate, as a vector ([long, lat]).
     * @param out - the vector to which to write the result.
     * @returns the rotated lat/lon coordinates.
     */
    protected preRotateForward(vec: ReadonlyFloat64Array, out: Float64Array): Float64Array;
    /**
     * Applies a reverse rotation to a set of lat/lon coordinates using this projection's pre-projection rotation angles.
     * @param vec - the lat/lon coordinates to rotate, as a vector ([long, lat]).
     * @param out - the vector to which to write the result.
     * @returns the rotated lat/lon coordinates.
     */
    protected preRotateReverse(vec: ReadonlyFloat64Array, out: Float64Array): Float64Array;
    /** @inheritdoc */
    project(point: LatLonInterface | ReadonlyFloat64Array, out: Float64Array): Float64Array;
    /** @inheritdoc */
    invert<T extends GeoPoint | Float64Array>(vec: ReadonlyFloat64Array, out: T): T;
}
/**
 * A Mercator projection.
 */
export declare class MercatorProjection extends AbstractGeoProjection {
    /**
     * Applies a raw projection.
     * @param vec - a [lon, lat] vector describing the geographic point to project.
     * @param out - a 2D vector to which to write the result.
     * @returns the projected point.
     */
    protected projectRaw(vec: ReadonlyFloat64Array, out: Float64Array): Float64Array;
    /**
     * Inverts a raw projection.
     * @param vec - a 2D vector describing the projected point to invert.
     * @param out - a 2D vector to which to write the result.
     * @returns the inverted point.
     */
    protected invertRaw(vec: ReadonlyFloat64Array, out: Float64Array): Float64Array;
}
/**
 * An orthographic projection.
 */
export declare class OrthographicProjection extends AbstractGeoProjection {
    /**
     * Applies a raw projection.
     * @param vec - a [lon, lat] vector describing the geographic point to project.
     * @param out - a 2D vector to which to write the result.
     * @returns the projected point.
     */
    protected projectRaw(vec: ReadonlyFloat64Array, out: Float64Array): Float64Array;
    /**
     * Inverts a raw projection.
     * @param vec - a 2D vector describing the projected point to invert.
     * @param out - a 2D vector to which to write the result.
     * @returns the inverted point.
     */
    protected invertRaw(vec: ReadonlyFloat64Array, out: Float64Array): Float64Array;
}
export {};
//# sourceMappingURL=GeoProjection.d.ts.map