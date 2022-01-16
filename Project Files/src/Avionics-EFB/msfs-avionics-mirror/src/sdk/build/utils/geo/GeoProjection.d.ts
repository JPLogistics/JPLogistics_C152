import { LatLonInterface } from './GeoInterfaces';
import { GeoPoint, GeoPointReadOnly } from './GeoPoint';
/**
 * A geographic projection.
 */
export interface GeoProjection {
    /**
     * Gets the geographic center of this projection.
     * @returns the geographic center of this projection.
     */
    getCenter(): GeoPointReadOnly;
    /**
     * Gets the nominal scale factor of this projection. At a scale factor of 1, a distance of one great-arc radian will
     * be projected to a distance of one pixel.
     * @returns the nominal scale factor of this projection.
     */
    getScaleFactor(): number;
    /**
     * Gets the pre-projection rotation of this projection as a vector ([lambda, phi]). The rotation angles are
     * expressed in radians.
     * @returns the pre-projection rotation of this projection.
     */
    getPreRotation(): Float64Array;
    /**
     * Gets the post-projection (planar) translation of this projection, in pixels.
     * @returns the post-projection translation of this projection.
     */
    getTranslation(): Float64Array;
    /**
     * Gets the post-projection (planar) rotation angle of this projection in radians.
     * @returns the post-projection rotation angle of this projection.
     */
    getPostRotation(): number;
    /**
     * Checks whether this projection reflects the projected coordinate system across the x-axis.
     * @returns whether this projection reflects the projected coordinate system across the x-axis.
     */
    getReflectY(): boolean;
    /**
     * Projects a set of lat/lon coordinates.
     * @param point - the point to project.
     * @param out - the vector to which to write the result.
     * @returns the projected point, as a vector.
     */
    project(point: LatLonInterface | Float64Array, out: Float64Array): Float64Array;
    /**
     * Inverts a set of projected coordinates. This method will determine the geographic point whose projected location
     * is the equal to that described by a 2D position vector.
     * @param vec - the 2D position vector describing the location of the projected coordinates.
     * @param out - the point to which to write the result.
     * @returns the inverted point.
     */
    invert<T extends GeoPoint | Float64Array>(vec: Float64Array, out: T): T;
}
/**
 * A mutable geographic projection.
 */
export interface MutableGeoProjection extends GeoProjection {
    /**
     * Sets the geographic center of this projection. The center point of the projection is projected to the origin,
     * before any post-projection transformations are applied.
     * @param point - the new center point.
     * @returns this projection, after it has been changed.
     */
    setCenter(point: LatLonInterface): this;
    /**
     * Sets the nominal scale factor of this projection. At a scale factor of 1, a distance of one great-arc radian will
     * be projected to a distance of one pixel.
     * @param factor - the new nominal scale factor.
     * @returns this projection, after it has been changed.
     */
    setScaleFactor(factor: number): this;
    /**
     * Sets the pre-projection (spherical) rotation of this projection.
     * @param vec - the pre-projection rotation, as a vector ([lambda, phi]). The rotation angles should be expressed in
     * radians.
     * @returns this projection, after it has been changed.
     */
    setPreRotation(vec: Float64Array): this;
    /**
     * Sets the post-projection (planar) translation of this projection.
     * @param vec - the new post-projection translation, in pixels.
     * @returns this projection, after it has been changed.
     */
    setTranslation(vec: Float64Array): this;
    /**
     * Sets the post-projection (planar) rotation of this projection.
     * @param rotation - the new post-projection rotation angle, in radians.
     * @returns this projection, after it has been changed.
     */
    setPostRotation(rotation: number): this;
    /**
     * Sets whether this reflection should reflect the projected coordinate system across the x-axis. Setting this value
     * to true is useful in the situation where the projected coordinate system should use a positive-y-axis-down
     * convention.
     * @param val True if reflection is desired, false otherwise.
     * @returns this projection, after it has been changed.
     */
    setReflectY(val: boolean): this;
    /**
     * Copies all projection parameters from another projection. The parameters copied are: center, pre-projection
     * rotation angles, scale factor, post-projection translation, post-projection rotation angle, and reflectY.
     * @param other the projection from which to copy parameters.
     * @returns this projection, after it has been changed.
     */
    copyParametersFrom(other: GeoProjection): this;
}
/**
 * A partial implementation of a MutableGeoProjection. Subclasses should use the projectRaw() and invertRaw() methods
 * to define the type of projection to be implemented.
 */
declare abstract class AbstractGeoProjection implements MutableGeoProjection {
    private static tempVec2;
    protected center: GeoPoint;
    protected centerTranslation: Float64Array;
    protected scaleFactor: number;
    protected preRotation: Float64Array;
    protected translation: Float64Array;
    protected postRotation: number;
    protected rotationSin: number;
    protected rotationCos: number;
    protected reflectY: number;
    /**
     * Gets the geographic center of this projection.
     * @returns the geographic center of this projection.
     */
    getCenter(): GeoPointReadOnly;
    /**
     * Gets the nominal scale factor of this projection. At a scale factor of 1, a distance of one great-arc radian will
     * be projected to a distance of one pixel.
     * @returns the nominal scale factor of this projection.
     */
    getScaleFactor(): number;
    /**
     * Gets the pre-projection rotation of this projection as a vector ([lambda, phi]). The rotation angles are
     * expressed in radians.
     * @returns the pre-projection rotation of this projection.
     */
    getPreRotation(): Float64Array;
    /**
     * Gets the post-projection (planar) translation of this projection, in pixels.
     * @returns the post-projection translation of this projection.
     */
    getTranslation(): Float64Array;
    /**
     * Gets the post-projection (planar) rotation angle of this projection in radians.
     * @returns the post-projection rotation angle of this projection.
     */
    getPostRotation(): number;
    /**
     * Checks whether this projection reflects the projected coordinate system across the x-axis.
     * @returns whether this projection reflects the projected coordinate system across the x-axis.
     */
    getReflectY(): boolean;
    /**
     * Sets the geographic center of this projection. The center point of the projection is projected to the origin,
     * before any post-projection transformations are applied.
     * @param point - the new center point.
     * @returns this projection, after it has been changed.
     */
    setCenter(point: LatLonInterface): this;
    /**
     * Sets the nominal scale factor of this projection. At a scale factor of 1, a distance of one great-arc radian will
     * be projected to a distance of one pixel.
     * @param factor - the new nominal scale factor.
     * @returns this projection, after it has been changed.
     */
    setScaleFactor(factor: number): this;
    /**
     * Sets the pre-projection (spherical) rotation of this projection.
     * @param vec - the pre-projection rotation, as a vector ([lambda, phi]). The rotation angles should be expressed in
     * radians.
     * @returns this projection, after it has been changed.
     */
    setPreRotation(vec: Float64Array): this;
    /**
     * Sets the post-projection (planar) translation of this projection.
     * @param vec - the new post-projection translation, in pixels.
     * @returns this projection, after it has been changed.
     */
    setTranslation(vec: Float64Array): this;
    /**
     * Sets the post-projection (planar) rotation of this projection.
     * @param rotation - the new post-projection rotation angle, in radians.
     * @returns this projection, after it has been changed.
     */
    setPostRotation(rotation: number): this;
    /**
     * Sets whether this reflection should reflect the projected coordinate system across the x-axis. Setting this value
     * to true is useful in the situation where the projected coordinate system should use a positive-y-axis-down
     * convention.
     * @param val True if reflection is desired, false otherwise.
     * @returns this projection, after it has been changed.
     */
    setReflectY(val: boolean): this;
    /**
     * Copies all projection parameters from another projection. The parameters copied are: center, pre-projection
     * rotation angles, scale factor, post-projection translation, and post-projection rotation angle.
     * @param other the projection from which to copy parameters.
     * @returns this projection, after it has been changed.
     */
    copyParametersFrom(other: GeoProjection): this;
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
    protected abstract projectRaw(vec: Float64Array, out: Float64Array): Float64Array;
    /**
     * Inverts a raw projection.
     * @param vec - a 2D vector describing the projected point to invert.
     * @param out - a 2D vector to which to write the result.
     * @returns the inverted point.
     */
    protected abstract invertRaw(vec: Float64Array, out: Float64Array): Float64Array;
    /**
     * Applies a forward rotation to a set of lat/lon coordinates using this projection's pre-projection rotation angles.
     * @param vec - the lat/lon coordinates to rotate, as a vector ([long, lat]).
     * @param out - the vector to which to write the result.
     * @returns the rotated lat/lon coordinates.
     */
    protected preRotateForward(vec: Float64Array, out: Float64Array): Float64Array;
    /**
     * Applies a reverse rotation to a set of lat/lon coordinates using this projection's pre-projection rotation angles.
     * @param vec - the lat/lon coordinates to rotate, as a vector ([long, lat]).
     * @param out - the vector to which to write the result.
     * @returns the rotated lat/lon coordinates.
     */
    protected preRotateReverse(vec: Float64Array, out: Float64Array): Float64Array;
    /**
     * Projects a set of lat/lon coordinates.
     * @param point - the point to project.
     * @param out - the vector to which to write the result.
     * @returns the projected point, as a vector.
     */
    project(point: LatLonInterface | Float64Array, out: Float64Array): Float64Array;
    /**
     * Inverts a set of projected coordinates. This method will determine the geographic point whose projected location
     * is the equal to that described by a 2D position vector.
     * @param vec - the 2D position vector describing the location of the projected coordinates.
     * @param out - the point to which to write the result.
     * @returns the inverted point.
     */
    invert<T extends GeoPoint | Float64Array>(vec: Float64Array, out: T): T;
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
    protected projectRaw(vec: Float64Array, out: Float64Array): Float64Array;
    /**
     * Inverts a raw projection.
     * @param vec - a 2D vector describing the projected point to invert.
     * @param out - a 2D vector to which to write the result.
     * @returns the inverted point.
     */
    protected invertRaw(vec: Float64Array, out: Float64Array): Float64Array;
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
    protected projectRaw(vec: Float64Array, out: Float64Array): Float64Array;
    /**
     * Inverts a raw projection.
     * @param vec - a 2D vector describing the projected point to invert.
     * @param out - a 2D vector to which to write the result.
     * @returns the inverted point.
     */
    protected invertRaw(vec: Float64Array, out: Float64Array): Float64Array;
}
export {};
//# sourceMappingURL=GeoProjection.d.ts.map