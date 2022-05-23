import { AirportFacility, AirportRunway } from './Facilities';
/**
 * Utility functions for working with airport data.
 */
export declare class AirportUtils {
    /**
     * Gets the longest runway of an airport.
     * @param facility The facility record for the airport.
     * @returns The longest runway as an AirportRunway, or null.
     */
    static getLongestRunway(facility: AirportFacility): AirportRunway | null;
    /**
     * Get a list of runways at an airport matching specific criteria.
     * @param facility The facility record for the airport.
     * @param minLength The minimum length of the runway, in feet.
     * @param surfaceTypes An optional bitfield of RunwaySurfaceCategory values to allow.
     * @returns A list of matching runways.
     */
    static getFilteredRunways(facility: AirportFacility, minLength: number, surfaceTypes?: number): AirportRunway[];
    /**
     * Checks to see whether an airport has a runway matching specific criteria.   This is a
     * lighter version of getFilteredRunways that doesn't do any extra assignments.
     * @param facility The facility record for the airport.
     * @param minLength The minimum length of the runway, in feet.
     * @param surfaceTypes An optional bitfield of RunwaySurfaceCategory values to allow.
     * @returns A boolean if a matching runway exists.
     */
    static hasMatchingRunway(facility: AirportFacility, minLength: number, surfaceTypes?: number): boolean;
}
//# sourceMappingURL=AirportUtils.d.ts.map