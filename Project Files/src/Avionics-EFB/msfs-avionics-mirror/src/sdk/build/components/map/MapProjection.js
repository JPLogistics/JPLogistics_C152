import { BitFlags } from '../../utils/BitFlags';
import { GeoPoint } from '../../utils/geo/GeoPoint';
import { MercatorProjection } from '../../utils/geo/GeoProjection';
import { Vec2Math } from '../../utils/math/VecMath';
/**
 * The different types of map projection changes.
 */
export var MapProjectionChangeType;
(function (MapProjectionChangeType) {
    MapProjectionChangeType[MapProjectionChangeType["Target"] = 1] = "Target";
    MapProjectionChangeType[MapProjectionChangeType["Center"] = 2] = "Center";
    MapProjectionChangeType[MapProjectionChangeType["TargetProjected"] = 4] = "TargetProjected";
    MapProjectionChangeType[MapProjectionChangeType["Range"] = 8] = "Range";
    MapProjectionChangeType[MapProjectionChangeType["Rotation"] = 16] = "Rotation";
    MapProjectionChangeType[MapProjectionChangeType["ProjectedSize"] = 32] = "ProjectedSize";
    MapProjectionChangeType[MapProjectionChangeType["ProjectedResolution"] = 64] = "ProjectedResolution";
})(MapProjectionChangeType || (MapProjectionChangeType = {}));
/**
 * A geographic projection model for a map. MapProjection uses a mercator projection.
 */
export class MapProjection {
    /**
     * Creates a new map projection.
     * @param projectedWidth The initial width of the projection window, in pixels.
     * @param projectedHeight The initial height of the projection window, in pixels.
     */
    constructor(projectedWidth, projectedHeight) {
        // settable parameters
        this.target = new GeoPoint(0, 0);
        this.targetProjectedOffset = new Float64Array(2);
        this.targetProjected = new Float64Array(2);
        this.range = 1;
        this.projectedSize = new Float64Array(2);
        // computed parameters
        this.center = new GeoPoint(0, 0);
        this.centerProjected = new Float64Array(2);
        this.oldParameters = {
            target: new GeoPoint(0, 0),
            center: new GeoPoint(0, 0),
            targetProjected: new Float64Array(2),
            range: 1,
            rotation: 0,
            projectedSize: new Float64Array(2),
            projectedResolution: 0
        };
        this.changeListeners = [];
        Vec2Math.set(projectedWidth, projectedHeight, this.projectedSize);
        this.geoProjection = new MercatorProjection();
        Vec2Math.set(projectedWidth / 2, projectedHeight / 2, this.centerProjected);
        this.targetProjected.set(this.centerProjected);
        this.geoProjection.setReflectY(true).setTranslation(this.centerProjected);
        this.recompute();
    }
    /**
     * Gets this map projection's GeoProjection instance.
     * @returns this map projection's GeoProjection instance.
     */
    getGeoProjection() {
        return this.geoProjection;
    }
    /**
     * Gets the target geographic point of this projection. The target is guaranteed to be projected to a specific
     * point in the projected window defined by the center of the window plus the target projected offset.
     * @returns the target geographic point of this projection.
     */
    getTarget() {
        return this.target.readonly;
    }
    /**
     * Gets the projected offset from the center of the projected window of the target of this projection.
     * @returns the projected offset from the center of the projected window of the target of this projection.
     */
    getTargetProjectedOffset() {
        return this.targetProjectedOffset;
    }
    /**
     * Gets the projected location of the target of this projection.
     * @returns the projected location of the target of this projection.
     */
    getTargetProjected() {
        return this.targetProjected;
    }
    /**
     * Gets the range of this projection in great arc radians. The range is measured from the center of the top edge of
     * the projection to the center of the bottom edge.
     * @returns the range of this projection.
     */
    getRange() {
        return this.range;
    }
    /**
     * Gets the post-projected (planar) rotation angle of this projection in radians.
     * @returns the post-projected rotation angle of this projection.
     */
    getRotation() {
        return this.geoProjection.getPostRotation();
    }
    /**
     * Gets the size of the projected window, in pixels.
     * @returns the size of the projected window.
     */
    getProjectedSize() {
        return this.projectedSize;
    }
    /**
     * Gets the geographic point located at the center of this projection's projected window.
     * @returns the geographic point located at the center of this projection's projected window.
     */
    getCenter() {
        return this.center.readonly;
    }
    /**
     * Gets the center of this projection's projected window.
     * @returns the center of this projection's projected window.
     */
    getCenterProjected() {
        return this.centerProjected;
    }
    /**
     * Gets the resolution of the projected map, in great-arc radians per pixel.
     * @returns the resolution fo the projected map.
     */
    getProjectedResolution() {
        return this.range / this.projectedSize[1];
    }
    /**
     * Calculates the true range of this projection, in great-arc radians, given a hypothetical projected center point.
     * @param centerProjected - the projected location of the hypothetical center point to use for the calculation.
     * @returns the true range of this projection given the hypothetical projected center point.
     */
    calculateRangeAtCenter(centerProjected) {
        const projectedHeight = this.projectedSize[1];
        const topProjected = MapProjection.tempVec2_3;
        topProjected[0] = centerProjected[0];
        topProjected[1] = centerProjected[1] - projectedHeight / 2;
        const bottomProjected = MapProjection.tempVec2_4;
        bottomProjected[0] = centerProjected[0];
        bottomProjected[1] = centerProjected[1] + projectedHeight / 2;
        const top = this.geoProjection.invert(topProjected, MapProjection.tempGeoPoint_1);
        const bottom = this.geoProjection.invert(bottomProjected, MapProjection.tempGeoPoint_2);
        return top.distance(bottom);
    }
    /**
     * Recomputes this projection's computed parameters.
     */
    recompute() {
        const currentTargetProjected = this.geoProjection.project(this.target, MapProjection.tempVec2_1);
        if (isNaN(currentTargetProjected[0] + currentTargetProjected[1])) {
            return;
        }
        const currentCenterProjected = MapProjection.tempVec2_2;
        currentCenterProjected.set(currentTargetProjected);
        currentCenterProjected[0] -= this.targetProjectedOffset[0];
        currentCenterProjected[1] -= this.targetProjectedOffset[1];
        let currentRange = this.calculateRangeAtCenter(currentCenterProjected);
        let ratio = currentRange / this.range;
        if (isNaN(ratio) || ratio === 0) {
            return;
        }
        // iteratively find the appropriate scale factor (empiric testing shows this typically takes less than 4 iterations
        // to converge)
        let iterCount = 0;
        let ratioError = Math.abs(ratio - 1);
        let deltaRatioError = MapProjection.SCALE_FACTOR_TOLERANCE + 1;
        while (iterCount++ < MapProjection.SCALE_FACTOR_MAX_ITER
            && ratioError > MapProjection.SCALE_FACTOR_TOLERANCE
            && deltaRatioError > MapProjection.SCALE_FACTOR_TOLERANCE) {
            this.geoProjection.setScaleFactor(ratio * this.geoProjection.getScaleFactor());
            this.geoProjection.project(this.target, currentTargetProjected);
            currentCenterProjected.set(currentTargetProjected);
            currentCenterProjected[0] -= this.targetProjectedOffset[0];
            currentCenterProjected[1] -= this.targetProjectedOffset[1];
            currentRange = this.calculateRangeAtCenter(currentCenterProjected);
            ratio = currentRange / this.range;
            const newRatioError = Math.abs(ratio - 1);
            deltaRatioError = Math.abs(newRatioError - ratioError);
            ratioError = newRatioError;
        }
        // calculate the center point of the projection
        this.invert(currentCenterProjected, this.center);
        this.geoProjection.setCenter(this.center);
        // set the projection's pre-rotation to avoid anti-meridian wrapping issues
        const preRotation = Vec2Math.set(-this.center.lon * Avionics.Utils.DEG2RAD, 0, MapProjection.tempVec2_1);
        this.geoProjection.setPreRotation(preRotation);
    }
    /**
     * Sets this projection's parameters. Parameters not explicitly defined in the parameters argument will be left
     * unchanged.
     * @param parameters The new parameters.
     */
    set(parameters) {
        // save old values
        this.storeParameters(this.oldParameters);
        parameters.projectedSize && this.setProjectedSize(parameters.projectedSize);
        parameters.target && this.target.set(parameters.target);
        parameters.targetProjectedOffset && this.setTargetProjectedOffset(parameters.targetProjectedOffset);
        parameters.range !== undefined && (this.range = parameters.range);
        parameters.rotation !== undefined && this.geoProjection.setPostRotation(parameters.rotation);
        this.recompute();
        const changeFlags = this.computeChangeFlags(this.oldParameters);
        this.notifyChangeListeners(changeFlags);
    }
    /**
     * Sets the size of the projected window.
     * @param size The new size, in pixels.
     */
    setProjectedSize(size) {
        this.projectedSize.set(size);
        Vec2Math.set(size[0] / 2, size[1] / 2, this.centerProjected);
        this.geoProjection.setTranslation(this.centerProjected);
        Vec2Math.add(this.centerProjected, this.targetProjectedOffset, this.targetProjected);
    }
    /**
     * Sets the projected offset from the center of the projected window of the target of this projection.
     * @param offset The new offset, in pixels.
     */
    setTargetProjectedOffset(offset) {
        this.targetProjectedOffset.set(offset);
        Vec2Math.add(this.centerProjected, this.targetProjectedOffset, this.targetProjected);
    }
    /**
     * Stores this projection's current parameters into a record.
     * @param record The record in which to store the parameters.
     */
    storeParameters(record) {
        record.target.set(this.target);
        record.center.set(this.center);
        record.targetProjected.set(this.targetProjected);
        record.range = this.range;
        record.rotation = this.getRotation();
        record.projectedSize.set(this.projectedSize);
        record.projectedResolution = this.getProjectedResolution();
    }
    /**
     * Computes change flags given a set of old parameters.
     * @param oldParameters The old parameters.
     * @returns change flags based on the specified old parameters.
     */
    computeChangeFlags(oldParameters) {
        return BitFlags.union(oldParameters.target.equals(this.target) ? 0 : MapProjectionChangeType.Target, oldParameters.center.equals(this.center) ? 0 : MapProjectionChangeType.Center, Vec2Math.equals(oldParameters.targetProjected, this.targetProjected) ? 0 : MapProjectionChangeType.TargetProjected, oldParameters.range === this.range ? 0 : MapProjectionChangeType.Range, oldParameters.rotation === this.getRotation() ? 0 : MapProjectionChangeType.Rotation, Vec2Math.equals(oldParameters.projectedSize, this.projectedSize) ? 0 : MapProjectionChangeType.ProjectedSize, oldParameters.projectedResolution === this.getProjectedResolution() ? 0 : MapProjectionChangeType.ProjectedResolution);
    }
    /**
     * Projects a set of lat/lon coordinates.
     * @param point - the point to project.
     * @param out - the vector to which to write the result.
     * @returns the projected point, as a vector.
     */
    project(point, out) {
        return this.geoProjection.project(point, out);
    }
    /**
     * Inverts a set of projected coordinates. This method will determine the geographic point whose projected location
     * is the equal to that described by a 2D position vector.
     * @param vec - the 2D position vector describing the location of the projected coordinates.
     * @param out - the point to which to write the result.
     * @returns the inverted point.
     */
    invert(vec, out) {
        return this.geoProjection.invert(vec, out);
    }
    /**
     * Checks whether a point falls within certain projected bounds. The point can be specified as either a GeoPoint
     * object or a 2D vector. If a GeoPoint object is supplied, it will be projected before the bounds check takes
     * place.
     * @param point - the point to check.
     * @param bounds - the bounds to check against, expressed as a vector ([left, top, right, bottom]). Defaults to the
     * bounds of the projected window.
     * @returns whether the point falls within the projected bounds.
     */
    isInProjectedBounds(point, bounds) {
        let left;
        let top;
        let right;
        let bottom;
        if (bounds) {
            left = bounds[0];
            top = bounds[1];
            right = bounds[2];
            bottom = bounds[3];
        }
        else {
            left = 0;
            top = 0;
            right = this.projectedSize[0];
            bottom = this.projectedSize[1];
        }
        if (!(point instanceof Float64Array)) {
            point = this.project(point, MapProjection.tempVec2_2);
        }
        const x = point[0];
        const y = point[1];
        return x >= left && x <= right && y >= top && y <= bottom;
    }
    /**
     * Gets the geographic great-circle distance between two points in great-arc radians. The points can be specified as
     * either GeoPoint objects or 2D vectors. If 2D vectors are supplied, they are interpreted as projected points and
     * inverse projection will be used to convert them to geographic points.
     * @param point1 - the first point.
     * @param point2 - the second point.
     * @returns the geographic great-circle distance between the points.
     */
    geoDistance(point1, point2) {
        if (point1 instanceof Float64Array) {
            point1 = this.invert(point1, MapProjection.tempGeoPoint_1);
        }
        if (point2 instanceof Float64Array) {
            point2 = this.invert(point2, MapProjection.tempGeoPoint_2);
        }
        return point1.distance(point2);
    }
    /**
     * Gets the projected Euclidean distance between two points in pixels. The points can be specified as either GeoPoint
     * objects or 2D vectors. If GeoPoint objects are supplied, they will be projected to convert them to projected
     * points.
     * @param point1 - the first point.
     * @param point2 - the second point.
     * @returns the projected Euclidean distance between two points.
     */
    projectedDistance(point1, point2) {
        if (!(point1 instanceof Float64Array)) {
            point1 = this.project(point1, MapProjection.tempVec2_1);
        }
        if (!(point2 instanceof Float64Array)) {
            point2 = this.project(point2, MapProjection.tempVec2_2);
        }
        return Vec2Math.distance(point1, point2);
    }
    /**
     * Notifies all registered change listeners that this projection has been changed.
     * @param changeFlags The types of changes that were made.
     */
    notifyChangeListeners(changeFlags) {
        this.changeListeners.forEach(listener => listener(this, changeFlags));
    }
    /**
     * Registers a change listener with this projection. The listener will be called every time this projection changes.
     * A listener can be registered multiple times; it will be called once for every time it is registered.
     * @param listener - the change listener to register.
     */
    addChangeListener(listener) {
        this.changeListeners.push(listener);
    }
    /**
     * Removes a change listener from this projection. If the specified listener was registered multiple times, this
     * method will only remove one instance of the listener.
     * @param listener - the listener to remove.
     * @returns whether the listener was successfully removed.
     */
    removeChangeListener(listener) {
        const index = this.changeListeners.lastIndexOf(listener);
        if (index >= 0) {
            this.changeListeners.splice(index, 1);
            return true;
        }
        else {
            return false;
        }
    }
}
MapProjection.SCALE_FACTOR_MAX_ITER = 20;
MapProjection.SCALE_FACTOR_TOLERANCE = 1e-6;
MapProjection.tempVec2_1 = new Float64Array(2);
MapProjection.tempVec2_2 = new Float64Array(2);
MapProjection.tempVec2_3 = new Float64Array(2);
MapProjection.tempVec2_4 = new Float64Array(2);
MapProjection.tempGeoPoint_1 = new GeoPoint(0, 0);
MapProjection.tempGeoPoint_2 = new GeoPoint(0, 0);
