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
    /**
     * Calculates the angular difference between two angles in the range `[0, 2 * pi)`. The calculation supports both
     * directional and non-directional differences. The directional difference is the angle swept from the start angle
     * to the end angle proceeding in the direction of increasing angle. The non-directional difference is the smaller
     * of the two angles swept from the start angle to the end angle proceeding in either direction.
     * @param start The starting angle, in radians.
     * @param end The ending angle, in radians.
     * @param directional Whether to calculate the directional difference. Defaults to `true`.
     * @returns The angular difference between the two angles, in radians, in the range `[0, 2 * pi)`.
     */
    static diffAngle(start, end, directional = true) {
        const diff = ((end - start) % MathUtils.TWO_PI + MathUtils.TWO_PI) % MathUtils.TWO_PI;
        return directional ? diff : Math.min(diff, MathUtils.TWO_PI - diff);
    }
    /**
     * Linearly interpolates a keyed value along one dimension.
     * @param x The key of the value to interpolate.
     * @param x0 The key of the first known value.
     * @param x1 The key of the second known value.
     * @param y0 The first known value.
     * @param y1 The second known value.
     * @param clampStart Whether to clamp the interpolated value to the first known value. Defaults to false.
     * @param clampEnd Whether to clamp the interpolated value to the second known value. Defaults to false.
     * @returns The interpolated value corresponding to the specified key.
     */
    static lerp(x, x0, x1, y0, y1, clampStart = false, clampEnd = false) {
        if (x0 !== x1 && y0 !== y1) {
            const fraction = MathUtils.clamp((x - x0) / (x1 - x0), clampStart ? 0 : -Infinity, clampEnd ? 1 : Infinity);
            return fraction * (y1 - y0) + y0;
        }
        else {
            return y0;
        }
    }
}
/** Twice the value of pi. */
MathUtils.TWO_PI = Math.PI * 2;
/** Half the value of pi. */
MathUtils.HALF_PI = Math.PI / 2;
