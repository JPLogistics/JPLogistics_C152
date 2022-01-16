/// <reference types="msfstypes/js/simplane" />
import { GeoPoint } from '../utils/geo/GeoPoint';
import { AirportFacility, AirportRunway, ApproachProcedure, FacilityFrequency, OneWayRunway, RunwayFacility } from './Facilities';
/**
 * Methods for working with Runways and Runway Designations.
 */
export declare class RunwayUtils {
    private static readonly RUNWAY_DESIGNATOR_LETTERS;
    protected static tempGeoPoint: GeoPoint;
    /**
     * Gets the letter for a runway designator.
     * @param designator A runway designator.
     * @param lowerCase Whether the letter should be lower case. False by default.
     * @returns The letter for the specified runway designator.
     */
    static getDesignatorLetter(designator: RunwayDesignator, lowerCase?: boolean): string;
    /**
     * Creates an empty one-way runway.
     * @returns an empty one-way runway.
     */
    static createEmptyOneWayRunway(): OneWayRunway;
    /**
     * Utility method to return two one-way runways from a single runway facility
     * @param runway is the AirportRunway object to evaluate
     * @param index is the index of the AirportRunway in the Facility
     * @returns splitRunways array of OneWayRunway objects
     */
    static getOneWayRunways(runway: AirportRunway, index: number): OneWayRunway[];
    /**
     * Utility method to return the runway name from the number and designator (L/R/C/W)
     * @param runwayNumber is the integer part of a runway name (18, 26, 27, etc)
     * @param designator is the RunwayDesignator enum for the runway
     * @param padded Whether single-char runways should be 0-padded.
     * @param prefix A prefix to put before the runway name.
     * @returns the runway name string
     */
    static getRunwayNameString(runwayNumber: number, designator: RunwayDesignator, padded?: boolean, prefix?: string): string;
    /**
     * Gets a one-way runway from an airport that matches a runway designation by number and designator.
     * @param airport The airport facility in which to search for the match.
     * @param runwayNumber A runway number to match.
     * @param runwayDesignator A runway designator to match.
     * @returns The one-way runway which matches the designation, or undefined if no match could be found.
     */
    static matchOneWayRunway(airport: AirportFacility, runwayNumber: number, runwayDesignator: RunwayDesignator): OneWayRunway | undefined;
    /**
     * Gets a one-way runway from an airport that matches a runway designation string.
     * @param airport The airport facility in which to search for the match.
     * @param designation A runway designation.
     * @returns The one-way runway which matches the designation, or undefined if no match could be found.
     */
    static matchOneWayRunwayFromDesignation(airport: AirportFacility, designation: string): OneWayRunway | undefined;
    /**
     * Gets a one-way runway from an airport that matches a runway ident.
     * @param airport The airport facility in which to search for the match.
     * @param ident A runway ident.
     * @returns The one-way runway which matches the ident, or undefined if no match could be found.
     */
    static matchOneWayRunwayFromIdent(airport: AirportFacility, ident: string): OneWayRunway | undefined;
    /**
     * Utility method to return the procedures for a given runway.
     * @param procedures The procedures for the airport.
     * @param runway The given runway to find procedures for.
     * @returns A list of approach procedures for the given runway.
     */
    static getProceduresForRunway(procedures: readonly ApproachProcedure[], runway: AirportRunway): Array<ApproachProcedure>;
    /**
     * Gets the localizer frequency for a runway.
     * @param airport The airport to which the query runway belongs.
     * @param runway The query runway.
     * @returns The localizer frequency for the query runway, or undefined if one could not be found.
     */
    static getLocFrequency(airport: AirportFacility, runway: OneWayRunway): FacilityFrequency | undefined;
    /**
     * Gets the localizer frequency for a runway.
     * @param airport The airport to which the query runway belongs.
     * @param runwayDesignation The designation of the query runway.
     * @returns The localizer frequency for the query runway, or undefined if one could not be found.
     */
    static getLocFrequency(airport: AirportFacility, runwayDesignation: string): FacilityFrequency | undefined;
    /**
     * Gets the localizer frequency for a runway.
     * @param airport The airport to which the query runway belongs.
     * @param runwayNumber The number of the query runway.
     * @param runwayDesignator The designator of the query runway.
     * @returns The localizer frequency for the query runway, or undefined if one could not be found.
     */
    static getLocFrequency(airport: AirportFacility, runwayNumber: number, runwayDesignator: RunwayDesignator): FacilityFrequency | undefined;
    /**
     * A comparer for sorting runways by number, and then by L, C, and R.
     * @param r1 The first runway to compare.
     * @param r2 The second runway to compare.
     * @returns -1 if the first is before, 0 if equal, 1 if the first is after.
     */
    static sortRunways(r1: OneWayRunway, r2: OneWayRunway): number;
    /**
     * Gets the ICAO string for the runway facility associated with a one-way runway.
     * @param airport The runway's parent airport.
     * @param runway A one-way runway.
     * @returns the ICAO string for the runway facility associated with the one-way runway.
     */
    static getRunwayFacilityIcao(airport: AirportFacility, runway: OneWayRunway): string;
    /**
     * Creates a runway waypoint facility from a runway.
     * @param airport The runway's parent airport.
     * @param runway A one-way runway.
     * @returns A runway waypoint facility corresponding to the runway.
     */
    static createRunwayFacility(airport: AirportFacility, runway: OneWayRunway): RunwayFacility;
    /**
     * Gets an alpha code from a runway number.
     * @param number is the runway number.
     * @returns a letter.
     */
    static getRunwayCode(number: number): string;
}
//# sourceMappingURL=RunwayUtils.d.ts.map