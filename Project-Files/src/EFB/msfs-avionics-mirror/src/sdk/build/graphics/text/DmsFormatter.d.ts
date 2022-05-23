declare enum DmsDirection {
    NORTH = "N",
    SOUTH = "S",
    WEST = "W",
    EAST = "E"
}
/** Holds the parts  */
declare type DmsValues = {
    /** The direction N/S/E/W */
    direction: DmsDirection;
    /** The degrees component */
    degrees: number;
    /** The minutes component */
    minutes: number;
    /** The seconds component */
    seconds: number;
};
/**
 * A class to format latitude/longitude to DMS.
 * @class DmsFormatter
 */
export declare class DmsFormatter {
    private readonly coordsParts;
    /**
     * Builds a DMS string out of the given latitude.
     * @param value The latitude.
     * @param spaceAfterDirection Whether to insert a space after the direction letter.
     * @returns The DMS string.
     */
    getLatDmsStr(value: number, spaceAfterDirection?: boolean): string;
    /**
     * Builds a DMS string out of the given longitude.
     * @param value The longitude.
     * @returns The DMS string.
     */
    getLonDmsStr(value: number): string;
    /**
     * Parses a latitude in to the dms parts.
     * @param value The latitude in degrees.
     * @returns The DMS parts.
     */
    parseLat(value: number): DmsValues;
    /**
     * Parses a longitude in to the dms parts.
     * @param value The longitude in degrees.
     * @returns The DMS parts.
     */
    parseLon(value: number): DmsValues;
    /**
     * Parses the latitude/longitude.
     * @private
     * @param value The value to parse.
     * @returns The DMS parts.
     */
    private parse;
}
export {};
//# sourceMappingURL=DmsFormatter.d.ts.map