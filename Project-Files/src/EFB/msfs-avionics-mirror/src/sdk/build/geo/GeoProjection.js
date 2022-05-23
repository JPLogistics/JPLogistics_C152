import { UnitType } from '../math/NumberUnit';
import { Transform3D } from '../math/Transform3D';
import { Vec2Math } from '../math/VecMath';
import { GeoPoint } from './GeoPoint';
/**
 * A partial implementation of a MutableGeoProjection. Subclasses should use the projectRaw() and invertRaw() methods
 * to define the type of projection to be implemented.
 */
class AbstractGeoProjection {
    constructor() {
        this.center = new GeoPoint(0, 0);
        this.centerTranslation = new Float64Array(2);
        this.scaleFactor = UnitType.GA_RADIAN.convertTo(1, UnitType.NMILE); // 1 pixel = 1 nautical mile
        this.preRotation = new Float64Array(3);
        this.translation = new Float64Array(2);
        this.postRotation = 0;
        this.rotationSin = 0;
        this.rotationCos = 1;
        this.reflectY = 1;
        this.preRotationForwardTransform = new Transform3D();
        this.preRotationReverseTransform = new Transform3D();
    }
    /** @inheritdoc */
    getCenter() {
        return this.center.readonly;
    }
    /** @inheritdoc */
    getScaleFactor() {
        return this.scaleFactor;
    }
    /** @inheritdoc */
    getPreRotation() {
        return this.preRotation;
    }
    /** @inheritdoc */
    getTranslation() {
        return this.translation;
    }
    /** @inheritdoc */
    getPostRotation() {
        return this.postRotation;
    }
    /** @inheritdoc */
    getReflectY() {
        return this.reflectY === -1;
    }
    /** @inheritdoc */
    setCenter(point) {
        this.center.set(point);
        this.updateCenterTranslation();
        return this;
    }
    /** @inheritdoc */
    setScaleFactor(factor) {
        this.scaleFactor = factor;
        return this;
    }
    /** @inheritdoc */
    setPreRotation(vec) {
        this.preRotation.set(vec);
        this.updatePreRotationTransforms();
        this.updateCenterTranslation();
        return this;
    }
    /** @inheritdoc */
    setTranslation(vec) {
        this.translation.set(vec);
        return this;
    }
    /** @inheritdoc */
    setPostRotation(rotation) {
        this.postRotation = rotation;
        this.rotationCos = Math.cos(rotation);
        this.rotationSin = Math.sin(rotation);
        return this;
    }
    /** @inheritdoc */
    setReflectY(val) {
        this.reflectY = val ? -1 : 1;
        return this;
    }
    /** @inheritdoc */
    copyParametersFrom(other) {
        return this.setCenter(other.getCenter())
            .setPreRotation(other.getPreRotation())
            .setScaleFactor(other.getScaleFactor())
            .setTranslation(other.getTranslation())
            .setPostRotation(other.getPostRotation())
            .setReflectY(other.getReflectY());
    }
    /**
     * Updates the pre-rotation transformation matrices.
     */
    updatePreRotationTransforms() {
        const phi = this.preRotation[1];
        const gamma = this.preRotation[2];
        const phiRotation = AbstractGeoProjection.transformCache[1].toRotationY(-phi);
        const gammaRotation = AbstractGeoProjection.transformCache[0].toRotationX(gamma);
        Transform3D.concat(this.preRotationForwardTransform, gammaRotation, phiRotation);
        this.preRotationReverseTransform.set(this.preRotationForwardTransform);
        this.preRotationReverseTransform.invert();
    }
    /**
     * Updates the translation vector to move the center of this projection to the origin.
     */
    updateCenterTranslation() {
        const centerArray = AbstractGeoProjection.vec2Cache[0];
        centerArray[0] = this.center.lon;
        centerArray[1] = this.center.lat;
        this.preRotateForward(centerArray, centerArray);
        this.projectRaw(centerArray, this.centerTranslation);
    }
    /**
     * Applies a forward rotation to a set of lat/lon coordinates using this projection's pre-projection rotation angles.
     * @param vec - the lat/lon coordinates to rotate, as a vector ([long, lat]).
     * @param out - the vector to which to write the result.
     * @returns the rotated lat/lon coordinates.
     */
    preRotateForward(vec, out) {
        const lambda = this.preRotation[0];
        const phi = this.preRotation[1];
        const gamma = this.preRotation[2];
        if (lambda === 0 && phi === 0 && gamma === 0) {
            out.set(vec);
            return out;
        }
        const lat = vec[1];
        const lon = vec[0];
        const rotatedLon = ((lon + lambda * Avionics.Utils.RAD2DEG) % 360 + 540) % 360 - 180; // enforce [-180, 180)
        if (phi === 0 && gamma === 0) {
            return Vec2Math.set(rotatedLon, lat, out);
        }
        const cartesianVec = GeoPoint.sphericalToCartesian(lat, rotatedLon, AbstractGeoProjection.vec3Cache[0]);
        const rotatedCartesianVec = this.preRotationForwardTransform.apply(cartesianVec, cartesianVec);
        const rotated = AbstractGeoProjection.geoPointCache[0].setFromCartesian(rotatedCartesianVec);
        return Vec2Math.set(rotated.lon, rotated.lat, out);
    }
    /**
     * Applies a reverse rotation to a set of lat/lon coordinates using this projection's pre-projection rotation angles.
     * @param vec - the lat/lon coordinates to rotate, as a vector ([long, lat]).
     * @param out - the vector to which to write the result.
     * @returns the rotated lat/lon coordinates.
     */
    preRotateReverse(vec, out) {
        const lambda = this.preRotation[0];
        const phi = this.preRotation[1];
        const gamma = this.preRotation[2];
        if (lambda === 0 && phi === 0 && gamma === 0) {
            out.set(vec);
            return out;
        }
        const lat = vec[1];
        const lon = vec[0];
        let rotatedLat = lat;
        let rotatedLon = lon;
        if (phi !== 0 || gamma !== 0) {
            const rotatedCartesianVec = GeoPoint.sphericalToCartesian(rotatedLat, rotatedLon, AbstractGeoProjection.vec3Cache[0]);
            const cartesianVec = this.preRotationReverseTransform.apply(rotatedCartesianVec, rotatedCartesianVec);
            const unrotated = AbstractGeoProjection.geoPointCache[0].setFromCartesian(cartesianVec);
            rotatedLat = unrotated.lat;
            rotatedLon = unrotated.lon;
        }
        rotatedLon = ((rotatedLon - lambda * Avionics.Utils.RAD2DEG) % 360 + 540) % 360 - 180; // enforce [-180, 180)
        return Vec2Math.set(rotatedLon, rotatedLat, out);
    }
    /** @inheritdoc */
    project(point, out) {
        if (point instanceof Float64Array) {
            out.set(point);
        }
        else {
            out[0] = point.lon;
            out[1] = point.lat;
        }
        this.preRotateForward(out, out);
        this.projectRaw(out, out);
        // translate projected center point to origin
        out[0] -= this.centerTranslation[0];
        out[1] -= this.centerTranslation[1];
        // apply y-reflection
        out[1] *= this.reflectY;
        // apply scale factor
        out[0] *= this.scaleFactor;
        out[1] *= this.scaleFactor;
        // apply post-projection rotation
        const x = out[0];
        const y = out[1];
        out[0] = x * this.rotationCos - y * this.rotationSin;
        out[1] = x * this.rotationSin + y * this.rotationCos;
        // apply post-projection translation
        out[0] += this.translation[0];
        out[1] += this.translation[1];
        return out;
    }
    /** @inheritdoc */
    invert(vec, out) {
        const projected = AbstractGeoProjection.vec2Cache[0];
        projected.set(vec);
        // invert post-projection translation
        projected[0] -= this.translation[0];
        projected[1] -= this.translation[1];
        // invert post-projection rotation
        const x = projected[0];
        const y = projected[1];
        projected[0] = x * this.rotationCos + y * this.rotationSin;
        projected[1] = -x * this.rotationSin + y * this.rotationCos;
        // invert scale factor
        projected[0] /= this.scaleFactor;
        projected[1] /= this.scaleFactor;
        // invert y-reflection
        projected[1] *= this.reflectY;
        // translate projected center point to default projected position
        projected[0] += this.centerTranslation[0];
        projected[1] += this.centerTranslation[1];
        const inverted = this.invertRaw(projected, projected);
        this.preRotateReverse(inverted, inverted);
        if (out instanceof Float64Array) {
            out.set(inverted);
            return out;
        }
        else {
            return out.set(inverted[1], inverted[0]);
        }
    }
}
AbstractGeoProjection.vec2Cache = [new Float64Array(2)];
AbstractGeoProjection.vec3Cache = [new Float64Array(3)];
AbstractGeoProjection.geoPointCache = [new GeoPoint(0, 0)];
AbstractGeoProjection.transformCache = [new Transform3D(), new Transform3D()];
/**
 * A Mercator projection.
 */
export class MercatorProjection extends AbstractGeoProjection {
    /**
     * Applies a raw projection.
     * @param vec - a [lon, lat] vector describing the geographic point to project.
     * @param out - a 2D vector to which to write the result.
     * @returns the projected point.
     */
    projectRaw(vec, out) {
        out[0] = vec[0] * Avionics.Utils.DEG2RAD;
        out[1] = Math.log(Math.tan((90 + vec[1]) * Avionics.Utils.DEG2RAD / 2));
        return out;
    }
    /**
     * Inverts a raw projection.
     * @param vec - a 2D vector describing the projected point to invert.
     * @param out - a 2D vector to which to write the result.
     * @returns the inverted point.
     */
    invertRaw(vec, out) {
        out[0] = vec[0] * Avionics.Utils.RAD2DEG;
        out[1] = 2 * Math.atan(Math.exp(vec[1])) * Avionics.Utils.RAD2DEG - 90;
        return out;
    }
}
/**
 * An orthographic projection.
 */
export class OrthographicProjection extends AbstractGeoProjection {
    /**
     * Applies a raw projection.
     * @param vec - a [lon, lat] vector describing the geographic point to project.
     * @param out - a 2D vector to which to write the result.
     * @returns the projected point.
     */
    projectRaw(vec, out) {
        const lonRad = vec[0] * Avionics.Utils.DEG2RAD;
        const latRad = vec[1] * Avionics.Utils.DEG2RAD;
        out[0] = Math.cos(latRad) * Math.sin(lonRad);
        out[1] = Math.sin(latRad);
        return out;
    }
    /**
     * Inverts a raw projection.
     * @param vec - a 2D vector describing the projected point to invert.
     * @param out - a 2D vector to which to write the result.
     * @returns the inverted point.
     */
    invertRaw(vec, out) {
        const x = vec[0];
        const y = vec[1];
        const rho = Math.hypot(x, y);
        const c = Math.asin(rho);
        const sinC = Math.sin(c);
        const cosC = Math.cos(c);
        out[0] = Math.atan2(x * sinC, rho * cosC) * Avionics.Utils.RAD2DEG;
        out[1] = Math.asin(rho === 0 ? rho : y * sinC / rho) * Avionics.Utils.RAD2DEG;
        return out;
    }
}
