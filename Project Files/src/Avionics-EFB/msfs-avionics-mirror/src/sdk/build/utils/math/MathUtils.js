/**
 * A utitlity class for basic math.
 */
export class MathUtils {
    /**
     * Clamps a numerical value to the min/max range.
     * @param value The value to be clamped.
     * @param min The minimum.
     * @param max The maximum.
     *
     * @returns The clamped numerical value..
     */
    static clamp(value, min, max) {
        return Math.max(min, Math.min(max, value));
    }
}
