import { LatLonInterface } from './GeoInterfaces';
/**
 * A utility class for working with magnetic variation (magnetic declination).
 */
export declare class MagVar {
    /**
     * Gets the magnetic variation (magnetic declination) at a specific point on Earth. Positive values signify eastward
     * deflection, and negative values signify westward deflection.
     * @param lat The latitude of the query point.
     * @param lon The longitude of the query point.
     * @returns The magnetic variation (magnetic declination) at the point.
     */
    static get(lat: number, lon: number): number;
    /**
     * Gets the magnetic variation (magnetic declination) at a specific point on Earth. Positive values signify eastward
     * deflection, and negative values signify westward deflection.
     * @param point The query point.
     * @returns The magnetic variation (magnetic declination) at the point.
     */
    static get(point: LatLonInterface): number;
    /**
     * Converts magnetic bearing to true bearing at a specific point on Earth.
     * @param bearing A magnetic bearing.
     * @param lat The latitude of the query point.
     * @param lon The longitude of the query point.
     * @returns The true bearing equivalent of the given magnetic bearing at the specified point.
     */
    static magneticToTrue(bearing: number, lat: number, lon: number): number;
    /**
     * Converts magnetic bearing to true bearing at a specific point on Earth.
     * @param bearing A magnetic bearing.
     * @param point The query point.
     * @returns The true bearing equivalent of the given magnetic bearing at the specified point.
     */
    static magneticToTrue(bearing: number, point: LatLonInterface): number;
    /**
     * Converts magnetic bearing to true bearing given a specific magnetic variation (magnetic declination).
     * @param bearing A magnetic bearing.
     * @param magVar The magnetic variation.
     * @returns The true bearing equivalent of the given magnetic bearing.
     */
    static magneticToTrue(bearing: number, magVar: number): number;
    /**
     * Converts true bearing to magnetic bearing at a specific point on Earth.
     * @param bearing A true bearing.
     * @param lat The latitude of the query point.
     * @param lon The longitude of the query point.
     * @returns The magnetic bearing equivalent of the given true bearing at the specified point.
     */
    static trueToMagnetic(bearing: number, lat: number, lon: number): number;
    /**
     * Converts true bearing to magnetic bearing at a specific point on Earth.
     * @param bearing A true bearing.
     * @param point The query point.
     * @returns The magnetic bearing equivalent of the given true bearing at the specified point.
     */
    static trueToMagnetic(bearing: number, point: LatLonInterface): number;
    /**
     * Converts true bearing to magnetic bearing given a specific magnetic variation (magnetic declination).
     * @param bearing A true bearing.
     * @param magVar The magnetic variation.
     * @returns The magnetic bearing equivalent of the given true bearing.
     */
    static trueToMagnetic(bearing: number, magVar: number): number;
    /**
     * Gets the magnetic variation (magnetic declination) at a specific point on Earth.
     * @param arg1 The query point, or the latitude of the query point.
     * @param arg2 The longitude of the query point.
     * @returns The magnetic variation (magnetic declination) at the point.
     */
    private static getMagVar;
}
//# sourceMappingURL=MagVar.d.ts.map