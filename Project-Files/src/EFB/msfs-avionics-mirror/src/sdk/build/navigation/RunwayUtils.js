import { GeoPoint } from '../geo/GeoPoint';
import { NavMath } from '../geo/NavMath';
import { UnitType } from '../math/NumberUnit';
import { RunwaySurfaceType } from './Facilities';
export var RunwaySurfaceCategory;
(function (RunwaySurfaceCategory) {
    RunwaySurfaceCategory[RunwaySurfaceCategory["Unknown"] = 1] = "Unknown";
    RunwaySurfaceCategory[RunwaySurfaceCategory["Hard"] = 2] = "Hard";
    RunwaySurfaceCategory[RunwaySurfaceCategory["Soft"] = 4] = "Soft";
    RunwaySurfaceCategory[RunwaySurfaceCategory["Water"] = 8] = "Water";
})(RunwaySurfaceCategory || (RunwaySurfaceCategory = {}));
/**
 * Methods for working with Runways and Runway Designations.
 */
export class RunwayUtils {
    /**
     * Gets the letter for a runway designator.
     * @param designator A runway designator.
     * @param lowerCase Whether the letter should be lower case. False by default.
     * @returns The letter for the specified runway designator.
     */
    static getDesignatorLetter(designator, lowerCase = false) {
        const letter = RunwayUtils.RUNWAY_DESIGNATOR_LETTERS[designator];
        return lowerCase
            ? letter.toLowerCase()
            : letter;
    }
    /**
     * Creates an empty one-way runway.
     * @returns an empty one-way runway.
     */
    static createEmptyOneWayRunway() {
        return {
            parentRunwayIndex: -1,
            designation: '',
            direction: 36,
            runwayDesignator: RunwayDesignator.RUNWAY_DESIGNATOR_NONE,
            course: 0,
            elevation: 0,
            latitude: 0,
            longitude: 0,
            length: 0,
            startThresholdLength: 0,
            endThresholdLength: 0
        };
    }
    /**
     * Utility method to return two one-way runways from a single runway facility
     * @param runway is the AirportRunway object to evaluate
     * @param index is the index of the AirportRunway in the Facility
     * @returns splitRunways array of OneWayRunway objects
     */
    static getOneWayRunways(runway, index) {
        const splitRunways = [];
        const designations = runway.designation.split('-');
        for (let i = 0; i < designations.length; i++) {
            const runwayNumber = parseInt(designations[i]);
            let designator = RunwayDesignator.RUNWAY_DESIGNATOR_NONE;
            let course = 0;
            let thresholdDistanceFromCenter = 0;
            let thresholdElevation = 0;
            let ilsFrequency;
            let startThresholdLength = 0, endThresholdLength = 0;
            if (i === 0) {
                designator = runway.designatorCharPrimary;
                course = runway.direction;
                thresholdDistanceFromCenter = (runway.length / 2) - runway.primaryThresholdLength;
                thresholdElevation = runway.primaryElevation;
                ilsFrequency = runway.primaryILSFrequency.freqMHz === 0 ? undefined : runway.primaryILSFrequency;
                startThresholdLength = runway.primaryThresholdLength;
                endThresholdLength = runway.secondaryThresholdLength;
            }
            else if (i === 1) {
                designator = runway.designatorCharSecondary;
                course = NavMath.normalizeHeading(runway.direction + 180);
                thresholdDistanceFromCenter = (runway.length / 2) - runway.secondaryThresholdLength;
                thresholdElevation = runway.secondaryElevation;
                ilsFrequency = runway.secondaryILSFrequency.freqMHz === 0 ? undefined : runway.secondaryILSFrequency;
                startThresholdLength = runway.secondaryThresholdLength;
                endThresholdLength = runway.primaryThresholdLength;
            }
            const designation = RunwayUtils.getRunwayNameString(runwayNumber, designator);
            const coordinates = RunwayUtils.tempGeoPoint
                .set(runway.latitude, runway.longitude)
                .offset(course - 180, UnitType.METER.convertTo(thresholdDistanceFromCenter, UnitType.GA_RADIAN));
            splitRunways.push({
                parentRunwayIndex: index,
                designation,
                direction: runwayNumber,
                runwayDesignator: designator,
                course,
                elevation: thresholdElevation,
                latitude: coordinates.lat,
                longitude: coordinates.lon,
                ilsFrequency,
                length: runway.length,
                startThresholdLength,
                endThresholdLength
            });
        }
        return splitRunways;
    }
    /**
     * Utility method to return the runway name from the number and designator (L/R/C/W)
     * @param runwayNumber is the integer part of a runway name (18, 26, 27, etc)
     * @param designator is the RunwayDesignator enum for the runway
     * @param padded Whether single-char runways should be 0-padded.
     * @param prefix A prefix to put before the runway name.
     * @returns the runway name string
     */
    static getRunwayNameString(runwayNumber, designator, padded = true, prefix = '') {
        let numberText = `${runwayNumber}`;
        if (padded) {
            numberText = numberText.padStart(2, '0');
        }
        return prefix + numberText + RunwayUtils.getDesignatorLetter(designator);
    }
    /**
     * Gets a one-way runway from an airport that matches a runway designation by number and designator.
     * @param airport The airport facility in which to search for the match.
     * @param runwayNumber A runway number to match.
     * @param runwayDesignator A runway designator to match.
     * @returns The one-way runway which matches the designation, or undefined if no match could be found.
     */
    static matchOneWayRunway(airport, runwayNumber, runwayDesignator) {
        const length = airport.runways.length;
        for (let r = 0; r < length; r++) {
            const runway = airport.runways[r];
            const designation = runway.designation;
            const primaryRunwayNumber = parseInt(designation.split('-')[0]);
            const secondaryRunwayNumber = parseInt(designation.split('-')[1]);
            if (primaryRunwayNumber === runwayNumber && runway.designatorCharPrimary === runwayDesignator) {
                const oneWayRunways = RunwayUtils.getOneWayRunways(runway, r);
                return oneWayRunways[0];
            }
            else if (secondaryRunwayNumber === runwayNumber && runway.designatorCharSecondary === runwayDesignator) {
                const oneWayRunways = RunwayUtils.getOneWayRunways(runway, r);
                return oneWayRunways[1];
            }
        }
        return undefined;
    }
    /**
     * Gets a one-way runway from an airport that matches a runway designation string.
     * @param airport The airport facility in which to search for the match.
     * @param designation A runway designation.
     * @returns The one-way runway which matches the designation, or undefined if no match could be found.
     */
    static matchOneWayRunwayFromDesignation(airport, designation) {
        const length = airport.runways.length;
        for (let i = 0; i < length; i++) {
            const match = RunwayUtils.getOneWayRunways(airport.runways[i], i).find((r) => {
                return (r.designation === designation);
            });
            if (match) {
                return match;
            }
        }
        return undefined;
    }
    /**
     * Gets a one-way runway from an airport that matches a runway ident.
     * @param airport The airport facility in which to search for the match.
     * @param ident A runway ident.
     * @returns The one-way runway which matches the ident, or undefined if no match could be found.
     */
    static matchOneWayRunwayFromIdent(airport, ident) {
        return RunwayUtils.matchOneWayRunwayFromDesignation(airport, ident.substr(2).trim());
    }
    /**
     * Utility method to return the procedures for a given runway.
     * @param procedures The procedures for the airport.
     * @param runway The given runway to find procedures for.
     * @returns A list of approach procedures for the given runway.
     */
    static getProceduresForRunway(procedures, runway) {
        const oneways = new Array();
        // TODO Make the designation splitting logic a common routine too.
        const designations = runway.designation.split('-');
        for (let i = 0; i < designations.length; i++) {
            const runwayNumber = parseInt(designations[i]);
            let runwayName;
            if (i === 0) {
                runwayName = RunwayUtils.getRunwayNameString(runwayNumber, runway.designatorCharPrimary, false, '');
            }
            else {
                runwayName = RunwayUtils.getRunwayNameString(runwayNumber, runway.designatorCharSecondary, false, '');
            }
            oneways.push(runwayName);
        }
        const found = new Array();
        for (const procedure of procedures) {
            if (oneways.includes(procedure.runway.trim())) {
                found.push(procedure);
            }
            else if (procedure.runwayNumber === 0) {
                found.push(procedure);
            }
        }
        return found;
    }
    // eslint-disable-next-line jsdoc/require-jsdoc
    static getLocFrequency(airport, arg1, arg2) {
        let runway;
        if (typeof arg1 === 'string') {
            const matchedRunway = RunwayUtils.matchOneWayRunwayFromDesignation(airport, arg1);
            if (!matchedRunway) {
                return undefined;
            }
            runway = matchedRunway;
        }
        else if (typeof arg1 === 'number') {
            const matchedRunway = RunwayUtils.matchOneWayRunway(airport, arg1, arg2);
            if (!matchedRunway) {
                return undefined;
            }
            runway = matchedRunway;
        }
        else {
            runway = arg1;
        }
        const runwayDesignation = runway.designation;
        if (runway.ilsFrequency) {
            return runway.ilsFrequency;
        }
        for (let i = 0; i < airport.frequencies.length; i++) {
            // Note: drop the leading zero in the runway designation for the search because some third-party sceneries
            // format the frequency names without the leading zero.
            const match = airport.frequencies[i].name.search(runwayDesignation.replace(/^0/, ''));
            if (match > -1) {
                return airport.frequencies[i];
            }
        }
        return undefined;
    }
    /**
     * A comparer for sorting runways by number, and then by L, C, and R.
     * @param r1 The first runway to compare.
     * @param r2 The second runway to compare.
     * @returns -1 if the first is before, 0 if equal, 1 if the first is after.
     */
    static sortRunways(r1, r2) {
        if (r1.direction === r2.direction) {
            let v1 = 0;
            if (r1.designation.indexOf('L') != -1) {
                v1 = 1;
            }
            else if (r1.designation.indexOf('C') != -1) {
                v1 = 2;
            }
            else if (r1.designation.indexOf('R') != -1) {
                v1 = 3;
            }
            let v2 = 0;
            if (r2.designation.indexOf('L') != -1) {
                v2 = 1;
            }
            else if (r2.designation.indexOf('C') != -1) {
                v2 = 2;
            }
            else if (r2.designation.indexOf('R') != -1) {
                v2 = 3;
            }
            return v1 - v2;
        }
        return r1.direction - r2.direction;
    }
    /**
     * Gets the ICAO string for the runway facility associated with a one-way runway.
     * @param airport The runway's parent airport.
     * @param runway A one-way runway.
     * @returns the ICAO string for the runway facility associated with the one-way runway.
     */
    static getRunwayFacilityIcao(airport, runway) {
        return `R  ${airport.icao.substr(7, 4)}RW${runway.designation.padEnd(3, ' ')}`;
    }
    /**
     * Creates a runway waypoint facility from a runway.
     * @param airport The runway's parent airport.
     * @param runway A one-way runway.
     * @returns A runway waypoint facility corresponding to the runway.
     */
    static createRunwayFacility(airport, runway) {
        return {
            icao: RunwayUtils.getRunwayFacilityIcao(airport, runway),
            name: `Runway ${runway.designation}`,
            region: airport.region,
            city: airport.city,
            lat: runway.latitude,
            lon: runway.longitude,
            magvar: airport.magvar,
            runway
        };
    }
    /**
     * Gets an alpha code from a runway number.
     * @param number is the runway number.
     * @returns a letter.
     */
    static getRunwayCode(number) {
        const n = Math.round(number);
        return String.fromCharCode(48 + n + (n > 9 ? 7 : 0));
    }
    /**
     * Gets the runway surface category from a runway based on its surface type.
     * @param runway An {@link AirportRunway}.
     * @returns The surface category of that runway.
     */
    static getSurfaceCategory(runway) {
        if (this.SURFACES_HARD.includes(runway.surface)) {
            return RunwaySurfaceCategory.Hard;
        }
        else if (this.SURFACES_SOFT.includes(runway.surface)) {
            return RunwaySurfaceCategory.Soft;
        }
        else if (this.SURFACES_WATER.includes(runway.surface)) {
            return RunwaySurfaceCategory.Water;
        }
        else {
            return RunwaySurfaceCategory.Unknown;
        }
    }
}
RunwayUtils.RUNWAY_DESIGNATOR_LETTERS = {
    [RunwayDesignator.RUNWAY_DESIGNATOR_NONE]: '',
    [RunwayDesignator.RUNWAY_DESIGNATOR_LEFT]: 'L',
    [RunwayDesignator.RUNWAY_DESIGNATOR_RIGHT]: 'R',
    [RunwayDesignator.RUNWAY_DESIGNATOR_CENTER]: 'C',
    [RunwayDesignator.RUNWAY_DESIGNATOR_WATER]: 'W',
    [RunwayDesignator.RUNWAY_DESIGNATOR_A]: 'A',
    [RunwayDesignator.RUNWAY_DESIGNATOR_B]: 'B',
};
RunwayUtils.SURFACES_HARD = [
    RunwaySurfaceType.Asphalt,
    RunwaySurfaceType.Bituminous,
    RunwaySurfaceType.Brick,
    RunwaySurfaceType.Concrete,
    RunwaySurfaceType.Ice,
    RunwaySurfaceType.Macadam,
    RunwaySurfaceType.Paint,
    RunwaySurfaceType.Planks,
    RunwaySurfaceType.SteelMats,
    RunwaySurfaceType.Tarmac,
    RunwaySurfaceType.Urban,
];
RunwayUtils.SURFACES_SOFT = [
    RunwaySurfaceType.Coral,
    RunwaySurfaceType.Dirt,
    RunwaySurfaceType.Forest,
    RunwaySurfaceType.Grass,
    RunwaySurfaceType.GrassBumpy,
    RunwaySurfaceType.Gravel,
    RunwaySurfaceType.HardTurf,
    RunwaySurfaceType.LongGrass,
    RunwaySurfaceType.OilTreated,
    RunwaySurfaceType.Sand,
    RunwaySurfaceType.Shale,
    RunwaySurfaceType.ShortGrass,
    RunwaySurfaceType.Snow,
    RunwaySurfaceType.WrightFlyerTrack
];
RunwayUtils.SURFACES_WATER = [
    RunwaySurfaceType.WaterFSX,
    RunwaySurfaceType.Lake,
    RunwaySurfaceType.Ocean,
    RunwaySurfaceType.Pond,
    RunwaySurfaceType.River,
    RunwaySurfaceType.WasteWater,
    RunwaySurfaceType.Water
];
RunwayUtils.tempGeoPoint = new GeoPoint(0, 0);
