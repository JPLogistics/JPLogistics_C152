/**
 * A class for conversions of degree units.
 */
class Degrees {
    constructor() {
        /**
         * Converts degrees to radians.
         * @param degrees The degrees to convert.
         * @returns The result as radians.
         */
        this.toRadians = (degrees) => degrees * (Math.PI / 180);
    }
}
/**
 * A class for conversions of foot units.
 */
class Feet {
    constructor() {
        /**
         * Converts feet to meters.
         * @param feet The feet to convert.
         * @returns The result as meters.
         */
        this.toMeters = (feet) => feet * 0.3048;
        /**
         * Converts feet to nautical miles.
         * @param feet The feet to convert.
         * @returns The result as nautical miles.
         */
        this.toNauticalMiles = (feet) => feet / 6076.11549;
    }
}
/**
 * A class for conversions of meter units.
 */
class Meters {
    constructor() {
        /**
         * Converts meters to feet.
         * @param meters The meters to convert.
         * @returns The result as feet.
         */
        this.toFeet = (meters) => meters / 0.3048;
        /**
         * Converts meters to nautical miles.
         * @param meters The meters to convert.
         * @returns The result as nautical miles.
         */
        this.toNauticalMiles = (meters) => meters / 1852;
    }
}
/**
 * A class for conversions of nautical mile units.
 */
class NauticalMiles {
    constructor() {
        /**
         * Converts nautical miles to feet.
         * @param nm The nautical miles to convert.
         * @returns The result as feet.
         */
        this.toFeet = (nm) => nm * 6076.11549;
        /**
         * Converts nautical miles to meters.
         * @param nm The nautical miles to convert.
         * @returns The result as meters.
         */
        this.toMeters = (nm) => nm * 1852;
    }
}
/**
 * A class for conversions of radian units.
 */
class Radians {
    constructor() {
        /**
         * Converts radians to degrees.
         * @param radians The radians to convert.
         * @returns The result as degrees.
         */
        this.toDegrees = (radians) => radians * 180 / Math.PI;
    }
}
/**
 * A class for unit conversions.
 */
export class Units {
}
/** The degrees unit. */
Units.Degrees = new Degrees();
/** The radians unit. */
Units.Radians = new Radians();
/** The feet unit. */
Units.Feet = new Feet();
/** The meters unit. */
Units.Meters = new Meters();
/** The nautical miles unit. */
Units.NauticalMiles = new NauticalMiles();
