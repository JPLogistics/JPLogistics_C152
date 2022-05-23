import { GeoPoint, GeoPointInterface, GeoPointReadOnly } from '../../geo/GeoPoint';
import { GeoProjection } from '../../geo/GeoProjection';
import { ReadonlyFloat64Array } from '../../math/VecMath';
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
    targetProjectedOffset?: ReadonlyFloat64Array;
    /**
     * The range of the projection, in great-arc radians. The range is measured between the projection's two range
     * endpoints.
     */
    range?: number;
    /**
     * The endpoints used to measure the range of the projection, as a 4-tuple `[relX1, relY1, relX2, relY2]`. Each
     * component is expressed in relative projected coordinates, where `0` is the left/top of the projected window, and
     * `1` is the right/bottom of the projected window.
     */
    rangeEndpoints?: ReadonlyFloat64Array;
    /** The post-projected rotation angle, in radians. */
    rotation?: number;
    /** The size of the projected window, in pixels. */
    projectedSize?: ReadonlyFloat64Array;
};
/**
 * The different types of map projection changes.
 */
export declare enum MapProjectionChangeType {
    Target = 1,
    Center = 2,
    TargetProjected = 4,
    Range = 8,
    RangeEndpoints = 16,
    ScaleFactor = 32,
    Rotation = 64,
    ProjectedSize = 128,
    ProjectedResolution = 256
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
    private static readonly tempVec2_1;
    private static readonly tempVec2_2;
    private static readonly tempVec2_3;
    private static readonly tempVec2_4;
    private static readonly tempGeoPoint_1;
    private static readonly tempGeoPoint_2;
    private readonly geoProjection;
    private readonly target;
    private readonly targetProjectedOffset;
    private readonly targetProjected;
    private range;
    private readonly rangeEndpoints;
    private readonly projectedSize;
    private readonly center;
    private readonly centerProjected;
    private projectedRange;
    private widthRange;
    private heightRange;
    private readonly oldParameters;
    private readonly queuedParameters;
    private updateQueued;
    private readonly changeListeners;
    /**
     * Creates a new map projection.
     * @param projectedWidth The initial width of the projection window, in pixels.
     * @param projectedHeight The initial height of the projection window, in pixels.
     */
    constructor(projectedWidth: number, projectedHeight: number);
    /**
     * Gets this map projection's GeoProjection instance.
     * @returns This map projection's GeoProjection instance.
     */
    getGeoProjection(): GeoProjection;
    /**
     * Gets the target geographic point of this projection. The target is guaranteed to be projected to a specific
     * point in the projected window defined by the center of the window plus the target projected offset.
     * @returns The target geographic point of this projection.
     */
    getTarget(): GeoPointReadOnly;
    /**
     * Gets the projected offset from the center of the projected window of the target of this projection.
     * @returns The projected offset from the center of the projected window of the target of this projection.
     */
    getTargetProjectedOffset(): ReadonlyFloat64Array;
    /**
     * Gets the projected location of the target of this projection.
     * @returns The projected location of the target of this projection.
     */
    getTargetProjected(): ReadonlyFloat64Array;
    /**
     * Gets the range of this projection, in great-arc radians, as measured between the projection's two range endpoints.
     * @returns The range of this projection, in great-arc radians.
     */
    getRange(): number;
    /**
     * Gets the endpoints used to measure the range of the projection, as a 4-tuple `[relX1, relY1, relX2, relY2]`. Each
     * component is expressed in relative projected coordinates, where `0` is the left/top of the projected window, and
     * `1` is the right/bottom of the projected window.
     * @returns The endpoints used to measure the range of the projection, as a 4-tuple `[relX1, relY1, relX2, relY2]`.
     */
    getRangeEndpoints(): ReadonlyFloat64Array;
    /**
     * Gets the range of this projection, in great-arc radians, as measured from the center-left to the center-right of
     * the projected window.
     * @returns The range of this projection's projected window width, in great-arc radians.
     */
    getWidthRange(): number;
    /**
     * Gets the range of this projection, in great-arc radians, as measured from the top-center to the bottom-center of
     * the projected window.
     * @returns The range of this projection's projected window height, in great-arc radians.
     */
    getHeightRange(): number;
    /**
     * Gets the nominal scale factor of this projection. At a scale factor of 1, a distance of one great-arc radian will
     * be projected to a distance of one pixel.
     * @returns The nominal scale factor of this projection.
     */
    getScaleFactor(): number;
    /**
     * Gets the post-projected (planar) rotation angle of this projection in radians.
     * @returns The post-projected rotation angle of this projection.
     */
    getRotation(): number;
    /**
     * Gets the size of the projected window, in pixels.
     * @returns The size of the projected window.
     */
    getProjectedSize(): ReadonlyFloat64Array;
    /**
     * Gets the geographic point located at the center of this projection's projected window.
     * @returns The geographic point located at the center of this projection's projected window.
     */
    getCenter(): GeoPointReadOnly;
    /**
     * Gets the center of this projection's projected window.
     * @returns The center of this projection's projected window.
     */
    getCenterProjected(): ReadonlyFloat64Array;
    /**
     * Gets the average resolution, in great-arc radians per pixel, of the projected map along a line between the range
     * endpoints.
     * @returns The average resolution of the projected map along a line between the range endpoints.
     */
    getProjectedResolution(): number;
    /**
     * Calculates the true range of this projection, in great-arc radians, given a hypothetical projected center point.
     * @param centerProjected The projected location of the hypothetical center point to use for the calculation.
     * @returns The true range of this projection given the hypothetical projected center point.
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
     * Sets the projection parameters to be applied when applyQueued() is called.
     * @param parameters The parameter changes to queue.
     */
    setQueued(parameters: MapProjectionParameters): void;
    /**
     * Applies the set of queued projection changes, if any are queued.
     */
    applyQueued(): void;
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
     * @returns Change flags based on the specified old parameters.
     */
    private computeChangeFlags;
    /**
     * Projects a set of lat/lon coordinates.
     * @param point The point to project.
     * @param out The vector to which to write the result.
     * @returns The projected point, as a vector.
     */
    project(point: GeoPointInterface, out: Float64Array): Float64Array;
    /**
     * Inverts a set of projected coordinates. This method will determine the geographic point whose projected location
     * is the equal to that described by a 2D position vector.
     * @param vec The 2D position vector describing the location of the projected coordinates.
     * @param out The point to which to write the result.
     * @returns The inverted point.
     */
    invert(vec: ReadonlyFloat64Array, out: GeoPoint): GeoPoint;
    /**
     * Checks whether a point falls within certain projected bounds. The point can be specified as either a GeoPoint
     * object or a 2D vector. If a GeoPoint object is supplied, it will be projected before the bounds check takes
     * place.
     * @param point The point to check.
     * @param bounds The bounds to check against, expressed as a vector ([left, top, right, bottom]). Defaults to the
     * bounds of the projected window.
     * @returns Whether the point falls within the projected bounds.
     */
    isInProjectedBounds(point: GeoPointInterface | ReadonlyFloat64Array, bounds?: ReadonlyFloat64Array): boolean;
    /**
     * Gets the geographic great-circle distance between two points in great-arc radians. The points can be specified as
     * either GeoPoint objects or 2D vectors. If 2D vectors are supplied, they are interpreted as projected points and
     * inverse projection will be used to convert them to geographic points.
     * @param point1 The first point.
     * @param point2 The second point.
     * @returns The geographic great-circle distance between the points.
     */
    geoDistance(point1: GeoPointInterface | ReadonlyFloat64Array, point2: GeoPointInterface | ReadonlyFloat64Array): number;
    /**
     * Gets the projected Euclidean distance between two points in pixels. The points can be specified as either GeoPoint
     * objects or 2D vectors. If GeoPoint objects are supplied, they will be projected to convert them to projected
     * points.
     * @param point1 The first point.
     * @param point2 The second point.
     * @returns The projected Euclidean distance between two points.
     */
    projectedDistance(point1: GeoPointInterface | ReadonlyFloat64Array, point2: GeoPointInterface | ReadonlyFloat64Array): number;
    /**
     * Notifies all registered change listeners that this projection has been changed.
     * @param changeFlags The types of changes that were made.
     */
    protected notifyChangeListeners(changeFlags: number): void;
    /**
     * Registers a change listener with this projection. The listener will be called every time this projection changes.
     * A listener can be registered multiple times; it will be called once for every time it is registered.
     * @param listener The change listener to register.
     */
    addChangeListener(listener: MapProjectionChangeListener): void;
    /**
     * Removes a change listener from this projection. If the specified listener was registered multiple times, this
     * method will only remove one instance of the listener.
     * @param listener The listener to remove.
     * @returns Whether the listener was successfully removed.
     */
    removeChangeListener(listener: MapProjectionChangeListener): boolean;
}
//# sourceMappingURL=MapProjection.d.ts.map