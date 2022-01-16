/**
 * A class for conversions of degree units.
 */
declare class Degrees {
    /**
     * Converts degrees to radians.
     * @param degrees The degrees to convert.
     * @returns The result as radians.
     */
    toRadians: (degrees: number) => number;
}
/**
 * A class for conversions of foot units.
 */
declare class Feet {
    /**
     * Converts feet to meters.
     * @param feet The feet to convert.
     * @returns The result as meters.
     */
    toMeters: (feet: number) => number;
    /**
     * Converts feet to nautical miles.
     * @param feet The feet to convert.
     * @returns The result as nautical miles.
     */
    toNauticalMiles: (feet: number) => number;
}
/**
 * A class for conversions of meter units.
 */
declare class Meters {
    /**
     * Converts meters to feet.
     * @param meters The meters to convert.
     * @returns The result as feet.
     */
    toFeet: (meters: number) => number;
    /**
     * Converts meters to nautical miles.
     * @param meters The meters to convert.
     * @returns The result as nautical miles.
     */
    toNauticalMiles: (meters: number) => number;
}
/**
 * A class for conversions of nautical mile units.
 */
declare class NauticalMiles {
    /**
     * Converts nautical miles to feet.
     * @param nm The nautical miles to convert.
     * @returns The result as feet.
     */
    toFeet: (nm: number) => number;
    /**
     * Converts nautical miles to meters.
     * @param nm The nautical miles to convert.
     * @returns The result as meters.
     */
    toMeters: (nm: number) => number;
}
/**
 * A class for conversions of radian units.
 */
declare class Radians {
    /**
     * Converts radians to degrees.
     * @param radians The radians to convert.
     * @returns The result as degrees.
     */
    toDegrees: (radians: number) => number;
}
/**
 * A class for unit conversions.
 */
export declare class Units {
    /** The degrees unit. */
    static Degrees: Degrees;
    /** The radians unit. */
    static Radians: Radians;
    /** The feet unit. */
    static Feet: Feet;
    /** The meters unit. */
    static Meters: Meters;
    /** The nautical miles unit. */
    static NauticalMiles: NauticalMiles;
}
export {};
//# sourceMappingURL=Units.d.ts.map