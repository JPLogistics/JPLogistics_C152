var DmsDirection;
(function (DmsDirection) {
    DmsDirection["NORTH"] = "N";
    DmsDirection["SOUTH"] = "S";
    DmsDirection["WEST"] = "W";
    DmsDirection["EAST"] = "E";
})(DmsDirection || (DmsDirection = {}));
/**
 * A class to format latitude/longitude to DMS.
 * @class DmsFormatter
 */
export class DmsFormatter {
    constructor() {
        this.coordsParts = {
            direction: DmsDirection.NORTH,
            degrees: 0,
            minutes: 0,
            seconds: 0
        };
    }
    /**
     * Builds a DMS string out of the given latitude.
     * @param value The latitude.
     * @param spaceAfterDirection Whether to insert a space after the direction letter.
     * @returns The DMS string.
     */
    getLatDmsStr(value, spaceAfterDirection = true) {
        const parts = this.parseLat(value);
        if (parts.minutes >= 59.5) {
            parts.minutes = 0;
            parts.degrees++;
        }
        return `${parts.direction}${spaceAfterDirection ? ' ' : ''}${parts.degrees.toString().padStart(2, '0')}°${parts.minutes.toFixed(2).padStart(5, '0')}'`;
    }
    /**
     * Builds a DMS string out of the given longitude.
     * @param value The longitude.
     * @returns The DMS string.
     */
    getLonDmsStr(value) {
        const parts = this.parseLon(value);
        if (parts.minutes >= 59.5) {
            parts.minutes = 0;
            parts.degrees++;
        }
        return `${parts.direction}${parts.degrees.toString().padStart(3, '0')}°${parts.minutes.toFixed(2).padStart(5, '0')}'`;
    }
    /**
     * Parses a latitude in to the dms parts.
     * @param value The latitude in degrees.
     * @returns The DMS parts.
     */
    parseLat(value) {
        this.coordsParts.direction = value < 0 ? DmsDirection.SOUTH : DmsDirection.NORTH;
        return this.parse(value);
    }
    /**
     * Parses a longitude in to the dms parts.
     * @param value The longitude in degrees.
     * @returns The DMS parts.
     */
    parseLon(value) {
        this.coordsParts.direction = value < 0 ? DmsDirection.WEST : DmsDirection.EAST;
        return this.parse(value);
    }
    /**
     * Parses the latitude/longitude.
     * @private
     * @param value The value to parse.
     * @returns The DMS parts.
     */
    parse(value) {
        value = Math.abs(value);
        this.coordsParts.degrees = Math.trunc(value);
        value = (value - this.coordsParts.degrees) * 60;
        this.coordsParts.minutes = value;
        this.coordsParts.seconds = (value - this.coordsParts.minutes) * 60;
        return this.coordsParts;
    }
}
