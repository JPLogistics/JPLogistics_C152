import { BitFlags, UnitType } from '../math';
import { RunwayUtils } from './RunwayUtils';
/**
 * Utility functions for working with airport data.
 */
export class AirportUtils {
    /**
     * Gets the longest runway of an airport.
     * @param facility The facility record for the airport.
     * @returns The longest runway as an AirportRunway, or null.
     */
    static getLongestRunway(facility) {
        let longestRunway = null;
        for (const runway of facility.runways) {
            if (longestRunway === null || runway.length > longestRunway.length) {
                longestRunway = runway;
            }
        }
        return longestRunway;
    }
    /**
     * Get a list of runways at an airport matching specific criteria.
     * @param facility The facility record for the airport.
     * @param minLength The minimum length of the runway, in feet.
     * @param surfaceTypes An optional bitfield of RunwaySurfaceCategory values to allow.
     * @returns A list of matching runways.
     */
    static getFilteredRunways(facility, minLength, surfaceTypes) {
        minLength = UnitType.METER.convertFrom(minLength, UnitType.FOOT);
        const result = [];
        for (const runway of facility.runways) {
            if (runway.length >= minLength) {
                if (surfaceTypes === undefined ||
                    BitFlags.isAny(RunwayUtils.getSurfaceCategory(runway), surfaceTypes)) {
                    result.push(runway);
                }
            }
        }
        return result;
    }
    /**
     * Checks to see whether an airport has a runway matching specific criteria.   This is a
     * lighter version of getFilteredRunways that doesn't do any extra assignments.
     * @param facility The facility record for the airport.
     * @param minLength The minimum length of the runway, in feet.
     * @param surfaceTypes An optional bitfield of RunwaySurfaceCategory values to allow.
     * @returns A boolean if a matching runway exists.
     */
    static hasMatchingRunway(facility, minLength, surfaceTypes) {
        minLength = UnitType.METER.convertFrom(minLength, UnitType.FOOT);
        for (const runway of facility.runways) {
            if (runway.length >= minLength) {
                if (surfaceTypes === undefined ||
                    BitFlags.isAny(RunwayUtils.getSurfaceCategory(runway), surfaceTypes)) {
                    return true;
                }
            }
        }
        return false;
    }
}
