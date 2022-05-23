/**
 * Possible types of hold entries
 */
export declare enum HoldEntryType {
    Direct = 0,
    Teardrop = 1,
    Parallel = 2,
    None = 3
}
export declare enum HoldMaxSpeedRule {
    Faa = 0,
    Icao = 1
}
/**
 * Utilities for hold entries
 */
export declare class HoldUtils {
    /**
     * Gets a hold direction UI string for a given inbound course.
     *
     * @param course The inbound course to get the string for.
     * @param short Whether to get the string in short form (single letter)
     *
     * @returns A UI human-readable course string.
     */
    static getDirectionString(course: number, short?: boolean): string;
    /**
     * Obtains hold speed (number and isMach) depending on altitude and speed rule (ICAO or FAA)
     *
     * @param altitude MSL altitude
     * @param rule     hold speed rule
     *
     * @returns hold speed and whether that number is in Mach
     */
    static getHoldSpeed(altitude: number, rule: HoldMaxSpeedRule): [speed: number, isMach: boolean];
}
//# sourceMappingURL=HoldUtils.d.ts.map