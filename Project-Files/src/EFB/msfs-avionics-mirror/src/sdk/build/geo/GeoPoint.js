import { Vec3Math } from '../math/VecMath';
/**
 * A read-only wrapper for a GeoPoint.
 */
export class GeoPointReadOnly {
    /**
     * Constructor.
     * @param source - the source of the new read-only point.
     */
    constructor(source) {
        this.source = source;
    }
    /**
     * The latitude of this point, in degrees.
     * @returns the latitude of this point.
     */
    get lat() {
        return this.source.lat;
    }
    /**
     * The longitude of this point, in degrees.
     * @returns the longitude of this point.
     */
    get lon() {
        return this.source.lon;
    }
    // eslint-disable-next-line jsdoc/require-jsdoc
    distance(arg1, arg2) {
        if (typeof arg1 === 'number') {
            return this.source.distance(arg1, arg2);
        }
        else {
            return this.source.distance(arg1);
        }
    }
    // eslint-disable-next-line jsdoc/require-jsdoc
    distanceRhumb(arg1, arg2) {
        if (typeof arg1 === 'number') {
            return this.source.distanceRhumb(arg1, arg2);
        }
        else {
            return this.source.distanceRhumb(arg1);
        }
    }
    // eslint-disable-next-line jsdoc/require-jsdoc
    bearingTo(arg1, arg2) {
        if (typeof arg1 === 'number') {
            return this.source.bearingTo(arg1, arg2);
        }
        else {
            return this.source.bearingTo(arg1);
        }
    }
    // eslint-disable-next-line jsdoc/require-jsdoc
    bearingFrom(arg1, arg2) {
        if (typeof arg1 === 'number') {
            return this.source.bearingFrom(arg1, arg2);
        }
        else {
            return this.source.bearingFrom(arg1);
        }
    }
    // eslint-disable-next-line jsdoc/require-jsdoc
    bearingRhumb(arg1, arg2) {
        if (typeof arg1 === 'number') {
            return this.source.bearingRhumb(arg1, arg2);
        }
        else {
            return this.source.bearingRhumb(arg1);
        }
    }
    /**
     * Offsets this point by an initial bearing and distance along a great circle.
     * @param bearing The initial true bearing (forward azimuth), in degrees, by which to offset.
     * @param distance The distance, in great-arc radians, by which to offset.
     * @param out The GeoPoint to which to write the results. If not supplied, a new GeoPoint object is created.
     * @returns The offset point.
     * @throws {Error} if argument `out` is undefined.
     */
    offset(bearing, distance, out) {
        if (!out) {
            throw new Error('Cannot mutate a read-only GeoPoint.');
        }
        return this.source.offset(bearing, distance, out);
    }
    /**
     * Offsets this point by a constant bearing and distance along a rhumb line.
     * @param bearing The true bearing, in degrees, by which to offset.
     * @param distance The distance, in great-arc radians, by which to offset.
     * @param out The GeoPoint to which to write the results. If not supplied, a new GeoPoint object is created.
     * @returns The offset point.
     * @throws {Error} If argument `out` is undefined.
     */
    offsetRhumb(bearing, distance, out) {
        if (!out) {
            throw new Error('Cannot mutate a read-only GeoPoint.');
        }
        return this.source.offsetRhumb(bearing, distance, out);
    }
    /**
     * Calculates the cartesian (x, y, z) representation of this point, in units of great-arc radians. By convention,
     * in the cartesian coordinate system the origin is at the center of the Earth, the positive x-axis passes through
     * 0 degrees N, 0 degrees E, and the positive z-axis passes through the north pole.
     * @param out The vector array to which to write the result.
     * @returns The cartesian representation of this point.
     */
    toCartesian(out) {
        return this.source.toCartesian(out);
    }
    // eslint-disable-next-line jsdoc/require-jsdoc
    equals(arg1, arg2, arg3) {
        if (typeof arg1 === 'number') {
            return this.source.equals(arg1, arg2, arg3);
        }
        else {
            return this.source.equals(arg1, arg2);
        }
    }
    /** @inheritdoc */
    copy(to) {
        return this.source.copy(to);
    }
}
/**
 * A point on Earth's surface. This class uses a spherical Earth model.
 */
export class GeoPoint {
    /**
     * Constructor.
     * @param lat The latitude, in degrees.
     * @param lon The longitude, in degrees.
     */
    constructor(lat, lon) {
        this._lat = 0;
        this._lon = 0;
        this.set(lat, lon);
        this.readonly = new GeoPointReadOnly(this);
    }
    /**
     * The latitude of this point, in degrees.
     * @returns the latitude of this point.
     */
    get lat() {
        return this._lat;
    }
    /**
     * The longitude of this point, in degrees.
     * @returns the longitude of this point.
     */
    get lon() {
        return this._lon;
    }
    /**
     * Converts an argument list consisting of either a LatLonInterface or lat/lon coordinates into an equivalent
     * LatLonInterface.
     * @param arg1 Argument 1.
     * @param arg2 Argument 2.
     * @returns A LatLonInterface.
     */
    static asLatLonInterface(arg1, arg2) {
        if (typeof arg1 === 'number') {
            return GeoPoint.tempGeoPoint.set(arg1, arg2);
        }
        else {
            return arg1;
        }
    }
    /**
     * Converts an argument list consisting of either a 3D vector or x, y, z components into an equivalent 3D vector.
     * @param arg1 Argument 1.
     * @param arg2 Argument 2.
     * @param arg3 Argument 3.
     * @returns A 3D vector.
     */
    static asVec3(arg1, arg2, arg3) {
        if (typeof arg1 === 'number') {
            return Vec3Math.set(arg1, arg2, arg3, GeoPoint.tempVec3);
        }
        else {
            return arg1;
        }
    }
    // eslint-disable-next-line jsdoc/require-jsdoc
    set(arg1, arg2) {
        let lat, lon;
        if (typeof arg1 === 'number') {
            lat = arg1;
            lon = arg2;
        }
        else {
            lat = arg1.lat;
            lon = arg1.lon;
        }
        lat = GeoPoint.toPlusMinus180(lat);
        lon = GeoPoint.toPlusMinus180(lon);
        if (Math.abs(lat) > 90) {
            lat = 180 - lat;
            lat = GeoPoint.toPlusMinus180(lat);
            lon += 180;
            lon = GeoPoint.toPlusMinus180(lon);
        }
        this._lat = lat;
        this._lon = lon;
        return this;
    }
    // eslint-disable-next-line jsdoc/require-jsdoc
    setFromCartesian(arg1, arg2, arg3) {
        const vec = GeoPoint.asVec3(arg1, arg2, arg3);
        const theta = Vec3Math.theta(vec);
        const phi = Vec3Math.phi(vec);
        return this.set(90 - theta * Avionics.Utils.RAD2DEG, phi * Avionics.Utils.RAD2DEG);
    }
    // eslint-disable-next-line jsdoc/require-jsdoc
    distance(arg1, arg2) {
        const other = GeoPoint.asLatLonInterface(arg1, arg2);
        return GeoPoint.distance(this.lat, this.lon, other.lat, other.lon);
    }
    // eslint-disable-next-line jsdoc/require-jsdoc
    distanceRhumb(arg1, arg2) {
        const other = GeoPoint.asLatLonInterface(arg1, arg2);
        return GeoPoint.distanceRhumb(this.lat, this.lon, other.lat, other.lon);
    }
    // eslint-disable-next-line jsdoc/require-jsdoc
    bearingTo(arg1, arg2) {
        const other = GeoPoint.asLatLonInterface(arg1, arg2);
        return GeoPoint.initialBearing(this.lat, this.lon, other.lat, other.lon);
    }
    // eslint-disable-next-line jsdoc/require-jsdoc
    bearingFrom(arg1, arg2) {
        const other = GeoPoint.asLatLonInterface(arg1, arg2);
        return GeoPoint.finalBearing(other.lat, other.lon, this.lat, this.lon);
    }
    // eslint-disable-next-line jsdoc/require-jsdoc
    bearingRhumb(arg1, arg2) {
        const other = GeoPoint.asLatLonInterface(arg1, arg2);
        return GeoPoint.bearingRhumb(this.lat, this.lon, other.lat, other.lon);
    }
    /**
     * Offsets this point by an initial bearing and distance along a great circle.
     * @param bearing The initial true bearing (forward azimuth), in degrees, by which to offset.
     * @param distance The distance, in great-arc radians, by which to offset.
     * @param out The GeoPoint to which to write the results. By default this point.
     * @returns The offset point.
     */
    offset(bearing, distance, out) {
        const latRad = this.lat * Avionics.Utils.DEG2RAD;
        const lonRad = this.lon * Avionics.Utils.DEG2RAD;
        const sinLat = Math.sin(latRad);
        const cosLat = Math.cos(latRad);
        const sinBearing = Math.sin(bearing * Avionics.Utils.DEG2RAD);
        const cosBearing = Math.cos(bearing * Avionics.Utils.DEG2RAD);
        const angularDistance = distance;
        const sinAngularDistance = Math.sin(angularDistance);
        const cosAngularDistance = Math.cos(angularDistance);
        const offsetLatRad = Math.asin(sinLat * cosAngularDistance + cosLat * sinAngularDistance * cosBearing);
        const offsetLonDeltaRad = Math.atan2(sinBearing * sinAngularDistance * cosLat, cosAngularDistance - sinLat * Math.sin(offsetLatRad));
        const offsetLat = offsetLatRad * Avionics.Utils.RAD2DEG;
        const offsetLon = (lonRad + offsetLonDeltaRad) * Avionics.Utils.RAD2DEG;
        return (out !== null && out !== void 0 ? out : this).set(offsetLat, offsetLon);
    }
    /**
     * Offsets this point by a constant bearing and distance along a rhumb line.
     * @param bearing The true bearing, in degrees, by which to offset.
     * @param distance The distance, in great-arc radians, by which to offset.
     * @param out The GeoPoint to which to write the results. By default this point.
     * @returns The offset point.
     */
    offsetRhumb(bearing, distance, out) {
        const latRad = this.lat * Avionics.Utils.DEG2RAD;
        const lonRad = this.lon * Avionics.Utils.DEG2RAD;
        const bearingRad = bearing * Avionics.Utils.DEG2RAD;
        const deltaLat = distance * Math.cos(bearingRad);
        let offsetLat = latRad + deltaLat;
        let offsetLon;
        if (Math.abs(offsetLat) >= Math.PI / 2) {
            // you can't technically go past the poles along a rhumb line, so we will simply terminate the path at the pole
            offsetLat = Math.sign(offsetLat) * 90;
            offsetLon = 0; // since longitude is meaningless at the poles, we'll arbitrarily pick a longitude of 0 degrees.
        }
        else {
            const deltaPsi = GeoPoint.deltaPsi(latRad, offsetLat);
            const correction = GeoPoint.rhumbCorrection(deltaPsi, latRad, offsetLat);
            const deltaLon = distance * Math.sin(bearingRad) / correction;
            offsetLon = lonRad + deltaLon;
            offsetLat *= Avionics.Utils.RAD2DEG;
            offsetLon *= Avionics.Utils.RAD2DEG;
        }
        return (out !== null && out !== void 0 ? out : this).set(offsetLat, offsetLon);
    }
    /** @inheritdoc */
    toCartesian(out) {
        return GeoPoint.sphericalToCartesian(this, out);
    }
    // eslint-disable-next-line jsdoc/require-jsdoc
    equals(arg1, arg2, arg3) {
        const other = GeoPoint.asLatLonInterface(arg1, arg2);
        const tolerance = typeof arg1 === 'number' ? arg3 : arg2;
        if (other) {
            return this.distance(other) <= (tolerance !== null && tolerance !== void 0 ? tolerance : GeoPoint.EQUALITY_TOLERANCE);
        }
        else {
            return false;
        }
    }
    /** @inheritdoc */
    copy(to) {
        return to ? to.set(this.lat, this.lon) : new GeoPoint(this.lat, this.lon);
    }
    // eslint-disable-next-line jsdoc/require-jsdoc
    static sphericalToCartesian(arg1, arg2, arg3) {
        const point = GeoPoint.asLatLonInterface(arg1, arg2);
        const theta = (90 - point.lat) * Avionics.Utils.DEG2RAD;
        const phi = point.lon * Avionics.Utils.DEG2RAD;
        return Vec3Math.setFromSpherical(1, theta, phi, arg3 !== null && arg3 !== void 0 ? arg3 : arg2);
    }
    // eslint-disable-next-line jsdoc/require-jsdoc
    static equals(arg1, arg2, arg3, arg4, arg5) {
        if (arg1 instanceof Float64Array) {
            return GeoPoint.distance(arg1, arg2) <= (arg3 !== null && arg3 !== void 0 ? arg3 : GeoPoint.EQUALITY_TOLERANCE);
        }
        else if (typeof arg1 === 'number') {
            return GeoPoint.distance(arg1, arg2, arg3, arg4) <= (arg5 !== null && arg5 !== void 0 ? arg5 : GeoPoint.EQUALITY_TOLERANCE);
        }
        else {
            return GeoPoint.distance(arg1, arg2) <= (arg3 !== null && arg3 !== void 0 ? arg3 : GeoPoint.EQUALITY_TOLERANCE);
        }
    }
    // eslint-disable-next-line jsdoc/require-jsdoc
    static distance(arg1, arg2, arg3, arg4) {
        if (arg1 instanceof Float64Array) {
            return Math.acos(Utils.Clamp(Vec3Math.dot(arg1, arg2), -1, 1));
        }
        else {
            let lat1, lon1, lat2, lon2;
            if (typeof arg1 === 'number') {
                lat1 = arg1 * Avionics.Utils.DEG2RAD;
                lon1 = arg2 * Avionics.Utils.DEG2RAD;
                lat2 = arg3 * Avionics.Utils.DEG2RAD;
                lon2 = arg4 * Avionics.Utils.DEG2RAD;
            }
            else {
                lat1 = arg1.lat;
                lon1 = arg1.lon;
                lat2 = arg2.lat;
                lon2 = arg2.lon;
            }
            // haversine formula
            const sinHalfDeltaLat = Math.sin((lat2 - lat1) / 2);
            const sinHalfDeltaLon = Math.sin((lon2 - lon1) / 2);
            const a = sinHalfDeltaLat * sinHalfDeltaLat + Math.cos(lat1) * Math.cos(lat2) * sinHalfDeltaLon * sinHalfDeltaLon;
            return 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        }
    }
    // eslint-disable-next-line jsdoc/require-jsdoc
    static distanceRhumb(arg1, arg2, arg3, arg4) {
        let lat1, lon1, lat2, lon2;
        if (typeof arg1 === 'number') {
            lat1 = arg1 * Avionics.Utils.DEG2RAD;
            lon1 = arg2 * Avionics.Utils.DEG2RAD;
            lat2 = arg3 * Avionics.Utils.DEG2RAD;
            lon2 = arg4 * Avionics.Utils.DEG2RAD;
        }
        else if (arg1 instanceof Float64Array) {
            const point1 = GeoPoint.tempGeoPoint.setFromCartesian(arg1);
            lat1 = point1.lat;
            lon1 = point1.lon;
            const point2 = GeoPoint.tempGeoPoint.setFromCartesian(arg2);
            lat2 = point2.lat;
            lon2 = point2.lon;
        }
        else {
            lat1 = arg1.lat;
            lon1 = arg1.lon;
            lat2 = arg2.lat;
            lon2 = arg2.lon;
        }
        const deltaLat = lat2 - lat1;
        let deltaLon = lon2 - lon1;
        const deltaPsi = GeoPoint.deltaPsi(lat1, lat2);
        const correction = GeoPoint.rhumbCorrection(deltaPsi, lat1, lat2);
        if (Math.abs(deltaLon) > Math.PI) {
            deltaLon += -Math.sign(deltaLon) * 2 * Math.PI;
        }
        return Math.sqrt(deltaLat * deltaLat + correction * correction * deltaLon * deltaLon);
    }
    /**
     * Calculates the initial true bearing (forward azimuth) from one point to another along the great circle connecting
     * the two.
     * @param lat1 The latitude of the initial point, in degrees.
     * @param lon1 The longitude of the initial point, in degrees.
     * @param lat2 The latitude of the final point, in degrees.
     * @param lon2 The longitude of the final point, in degrees.
     * @returns The initial true bearing, in degrees, from the initial point to the final point along the great circle
     * connecting the two.
     */
    static initialBearing(lat1, lon1, lat2, lon2) {
        lat1 *= Avionics.Utils.DEG2RAD;
        lat2 *= Avionics.Utils.DEG2RAD;
        lon1 *= Avionics.Utils.DEG2RAD;
        lon2 *= Avionics.Utils.DEG2RAD;
        const cosLat2 = Math.cos(lat2);
        const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * cosLat2 * Math.cos(lon2 - lon1);
        const y = Math.sin(lon2 - lon1) * cosLat2;
        const bearing = Math.atan2(y, x) * Avionics.Utils.RAD2DEG;
        return (bearing + 360) % 360; // enforce range [0, 360)
    }
    /**
     * Calculates the final true bearing from one point to another along the great circle connecting the two.
     * @param lat1 The latitude of the initial point, in degrees.
     * @param lon1 The longitude of the initial point, in degrees.
     * @param lat2 The latitude of the final point, in degrees.
     * @param lon2 The longitude of the final point, in degrees.
     * @returns The final true bearing, in degrees, from the initial point to the final point along the great circle
     * connecting the two.
     */
    static finalBearing(lat1, lon1, lat2, lon2) {
        return (GeoPoint.initialBearing(lat2, lon2, lat1, lon1) + 180) % 360;
    }
    /**
     * Calculates the constant true bearing from one point to another along the rhumb line connecting the two.
     * @param lat1 The latitude of the initial point, in degrees.
     * @param lon1 The longitude of the initial point, in degrees.
     * @param lat2 The latitude of the final point, in degrees.
     * @param lon2 The longitude of the final point, in degrees.
     * @returns The constant true bearing, in degrees, from the initial point to the final point along the rhumb line
     * connecting the two.
     */
    static bearingRhumb(lat1, lon1, lat2, lon2) {
        lat1 *= Avionics.Utils.DEG2RAD;
        lat2 *= Avionics.Utils.DEG2RAD;
        lon1 *= Avionics.Utils.DEG2RAD;
        lon2 *= Avionics.Utils.DEG2RAD;
        let deltaLon = lon2 - lon1;
        const deltaPsi = GeoPoint.deltaPsi(lat1, lat2);
        if (Math.abs(deltaLon) > Math.PI) {
            deltaLon += -Math.sign(deltaLon) * 2 * Math.PI;
        }
        return Math.atan2(deltaLon, deltaPsi) * Avionics.Utils.RAD2DEG;
    }
    /**
     * Converts an angle, in degrees, to an equivalent value in the range [-180, 180).
     * @param angle An angle in degrees.
     * @returns The angle's equivalent in the range [-180, 180).
     */
    static toPlusMinus180(angle) {
        return ((angle % 360) + 540) % 360 - 180;
    }
    /**
     * Calculates the difference in isometric latitude from a pair of geodetic (geocentric) latitudes.
     * @param latRad1 Geodetic latitude 1, in radians.
     * @param latRad2 Geodetic latitude 2, in radians.
     * @returns The difference in isometric latitude from latitude 1 to latitude 2, in radians.
     */
    static deltaPsi(latRad1, latRad2) {
        return Math.log(Math.tan(latRad2 / 2 + Math.PI / 4) / Math.tan(latRad1 / 2 + Math.PI / 4));
    }
    /**
     * Calculates the rhumb correction factor between two latitudes.
     * @param deltaPsi The difference in isometric latitude beween the two latitudes.
     * @param latRad1 Geodetic latitude 1, in radians.
     * @param latRad2 Geodetic latitude 2, in radians.
     * @returns The rhumb correction factor between the two latitudes.
     */
    static rhumbCorrection(deltaPsi, latRad1, latRad2) {
        return Math.abs(deltaPsi) > 1e-12 ? ((latRad2 - latRad1) / deltaPsi) : Math.cos(latRad1);
    }
}
/**
 * The default equality tolerance, defined as the maximum allowed distance between two equal points in great-arc
 * radians.
 */
GeoPoint.EQUALITY_TOLERANCE = 1e-7; // ~61 cm
GeoPoint.tempVec3 = new Float64Array(3);
GeoPoint.tempGeoPoint = new GeoPoint(0, 0);
