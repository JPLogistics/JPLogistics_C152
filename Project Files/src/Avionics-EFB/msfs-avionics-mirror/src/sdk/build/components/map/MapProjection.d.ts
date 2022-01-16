import { GeoPoint, GeoPointInterface, GeoPointReadOnly } from '../../utils/geo/GeoPoint';
import { GeoProjection } from '../../utils/geo/GeoProjection';
/**
 * A parameter object for MapProjection.
 */
export declare type MapProjectionParameters = {
    /**
     * The target of the projection. The target is guaranteed to be projected to a specific point in the projected
     * window defined by the center of the window plus the target projected offset.
     */
    target?: GeoPointInterface;
    /** The projected offset from the center of the projected window of the projection's target, in pixels. */
    targetProjectedOffset?: Float64Array;
    /**
     * The range of the projection, in great-arc radians. The range is measured from the center of the top edge of the
     * projection to the center of the bottom edge.
     */
    range?: number;
    /** The post-projected rotation angle, in radians. */
    rotation?: number;
    /** The size of the projected window, in pixels. */
    projectedSize?: Float64Array;
};
/**
 * The different types of map projection changes.
 */
export declare enum MapProjectionChangeType {
    Target = 1,
    Center = 2,
    TargetProjected = 4,
    Range = 8,
    Rotation = 16,
    ProjectedSize = 32,
    ProjectedResolution = 64
}
/**
 * A change listener callback for a MapProjection.
 */
export interface MapProjectionChangeListener {
    (source: MapProjection, changeFlags: number): void;
}
/**
 * A geographic projection model for a map. MapProjection uses a mercator projection.
 */
export declare class MapProjection {
    private static readonly SCALE_FACTOR_MAX_ITER;
    private static readonly SCALE_FACTOR_TOLERANCE;
    private static tempVec2_1;
    private static tempVec2_2;
    private static tempVec2_3;
    private static tempVec2_4;
    private static tempGeoPoint_1;
    private static tempGeoPoint_2;
    private geoProjection;
    private target;
    private targetProjectedOffset;
    private targetProjected;
    private range;
    private projectedSize;
    private center;
    private centerProjected;
    private oldParameters;
    private changeListeners;
    /**
     * Creates a new map projection.
     * @param projectedWidth The initial width of the projection window, in pixels.
     * @param projectedHeight The initial height of the projection window, in pixels.
     */
    constructor(projectedWidth: number, projectedHeight: number);
    /**
     * Gets this map projection's GeoProjection instance.
     * @returns this map projection's GeoProjection instance.
     */
    getGeoProjection(): GeoProjection;
    /**
     * Gets the target geographic point of this projection. The target is guaranteed to be projected to a specific
     * point in the projected window defined by the center of the window plus the target projected offset.
     * @returns the target geographic point of this projection.
     */
    getTarget(): GeoPointReadOnly;
    /**
     * Gets the projected offset from the center of the projected window of the target of this projection.
     * @returns the projected offset from the center of the projected window of the target of this projection.
     */
    getTargetProjectedOffset(): Float64Array;
    /**
     * Gets the projected location of the target of this projection.
     * @returns the projected location of the target of this projection.
     */
    getTargetProjected(): Float64Array;
    /**
     * Gets the range of this projection in great arc radians. The range is measured from the center of the top edge of
     * the projection to the center of the bottom edge.
     * @returns the range of this projection.
     */
    getRange(): number;
    /**
     * Gets the post-projected (planar) rotation angle of this projection in radians.
     * @returns the post-projected rotation angle of this projection.
     */
    getRotation(): number;
    /**
     * Gets the size of the projected window, in pixels.
     * @returns the size of the projected window.
     */
    getProjectedSize(): Float64Array;
    /**
     * Gets the geographic point located at the center of this projection's projected window.
     * @returns the geographic point located at the center of this projection's projected window.
     */
    getCenter(): GeoPointReadOnly;
    /**
     * Gets the center of this projection's projected window.
     * @returns the center of this projection's projected window.
     */
    getCenterProjected(): Float64Array;
    /**
     * Gets the resolution of the projected map, in great-arc radians per pixel.
     * @returns the resolution fo the projected map.
     */
    getProjectedResolution(): number;
    /**
     * Calculates the true range of this projection, in great-arc radians, given a hypothetical projected center point.
     * @param centerProjected - the projected location of the hypothetical center point to use for the calculation.
     * @returns the true range of this projection given the hypothetical projected center point.
     */
    private calculateRangeAtCenter;
    /**
     * Recomputes this projection's computed parameters.
     */
    private recompute;
    /**
     * Sets this projection's parameters. Parameters not explicitly defined in the parameters argument will be left
     * unchanged.
     * @param parameters The new parameters.
     */
    set(parameters: MapProjectionParameters): void;
    /**
     * Sets the size of the projected window.
     * @param size The new size, in pixels.
     */
    private setProjectedSize;
    /**
     * Sets the projected offset from the center of the projected window of the target of this projection.
     * @param offset The new offset, in pixels.
     */
    private setTargetProjectedOffset;
    /**
     * Stores this projection's current parameters into a record.
     * @param record The record in which to store the parameters.
     */
    private storeParameters;
    /**
     * Computes change flags given a set of old parameters.
     * @param oldParameters The old parameters.
     * @returns change flags based on the specified old parameters.
     */
    private computeChangeFlags;
    /**
     * Projects a set of lat/lon coordinates.
     * @param point - the point to project.
     * @param out - the vector to which to write the result.
     * @returns the projected point, as a vector.
     */
    project(point: GeoPointInterface, out: Float64Array): Float64Array;
    /**
     * Inverts a set of projected coordinates. This method will determine the geographic point whose projected location
     * is the equal to that described by a 2D position vector.
     * @param vec - the 2D position vector describing the location of the projected coordinates.
     * @param out - the point to which to write the result.
     * @returns the inverted point.
     */
    invert(vec: Float64Array, out: GeoPoint): GeoPoint;
    /**
     * Checks whether a point falls within certain projected bounds. The point can be specified as either a GeoPoint
     * object or a 2D vector. If a GeoPoint object is supplied, it will be projected before the bounds check takes
     * place.
     * @param point - the point to check.
     * @param bounds - the bounds to check against, expressed as a vector ([left, top, right, bottom]). Defaults to the
     * bounds of the projected window.
     * @returns whether the point falls within the projected bounds.
     */
    isInProjectedBounds(point: GeoPointInterface | Float64Array, bounds?: Float64Array): boolean;
    /**
     * Gets the geographic great-circle distance between two points in great-arc radians. The points can be specified as
     * either GeoPoint objects or 2D vectors. If 2D vectors are supplied, they are interpreted as projected points and
     * inverse projection will be used to convert them to geographic points.
     * @param point1 - the first point.
     * @param point2 - the second point.
     * @returns the geographic great-circle distance between the points.
     */
    geoDistance(point1: GeoPointInterface | Float64Array, point2: GeoPointInterface | Float64Array): number;
    /**
     * Gets the projected Euclidean distance between two points in pixels. The points can be specified as either GeoPoint
     * objects or 2D vectors. If GeoPoint objects are supplied, they will be projected to convert them to projected
     * points.
     * @param point1 - the first point.
     * @param point2 - the second point.
     * @returns the projected Euclidean distance between two points.
     */
    projectedDistance(point1: GeoPointInterface | Float64Array, point2: GeoPointInterface | Float64Array): number;
    /**
     * Notifies all registered change listeners that this projection has been changed.
     * @param changeFlags The types of changes that were made.
     */
    protected notifyChangeListeners(changeFlags: number): void;
    /**
     * Registers a change listener with this projection. The listener will be called every time this projection changes.
     * A listener can be registered multiple times; it will be called once for every time it is registered.
     * @param listener - the change listener to register.
     */
    addChangeListener(listener: MapProjectionChangeListener): void;
    /**
     * Removes a change listener from this projection. If the specified listener was registered multiple times, this
     * method will only remove one instance of the listener.
     * @param listener - the listener to remove.
     * @returns whether the listener was successfully removed.
     */
    removeChangeListener(listener: MapProjectionChangeListener): boolean;
}
//# sourceMappingURL=MapProjection.d.ts.map