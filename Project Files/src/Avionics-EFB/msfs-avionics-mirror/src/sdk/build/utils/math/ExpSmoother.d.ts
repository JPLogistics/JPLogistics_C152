/**
 * Applies time-weighted exponential smoothing (i.e. an exponential moving average) to a sequence of raw values. When
 * a new raw value is added to the sequence, it and the last smoothed value are weighted according to the time elapsed
 * since the last smoothed value was calculated (i.e. since the last raw value was added) and averaged. The calculation
 * of the weighting is such that the weight of each raw value in the sequence decays exponentially with the "age"
 * (i.e. time elapsed between when that value was added to the sequence and when the latest value was added to the
 * sequence) of the value.
 */
export declare class ExpSmoother {
    readonly tau: number;
    readonly dtThreshold: number;
    private lastValue;
    /**
     * Constructor.
     * @param tau This smoother's time constant. The larger the constant, the greater the smoothing effect.
     * @param initial The initial smoothed value of this smoother. Defaults to null.
     * @param dtThreshold The elapsed time threshold, in seconds, above which this smoother will not smooth a new raw
     * value. Defaults to infinity.
     */
    constructor(tau: number, initial?: number | null, dtThreshold?: number);
    /**
     * Gets the last smoothed value.
     * @returns the last smoothed value, or null if none exists.
     */
    last(): number | null;
    /**
     * Adds a new raw value and gets the next smoothed value. If the new raw value is the first to be added since this
     * smoother was created or reset with no initial smoothed value, the returned smoothed value will be equal to the
     * raw value.
     * @param raw The new raw value.
     * @param dt The elapsed time, in seconds, since the last raw value was added.
     * @returns The next smoothed value.
     */
    next(raw: number, dt: number): number;
    /**
     * Calculates the smoothing factor for a given time interval.
     * @param dt A time interval, in seconds.
     * @returns the smoothing factor for the given time interval.
     */
    private calculateFactor;
    /**
     * Resets the "history" of this smoother and optionally sets the initial smoothed value.
     * @param value The new initial smoothed value. Defaults to null.
     * @returns The reset smoothed value.
     */
    reset<T extends number | null>(value?: T): T;
    /**
     * Applies exponential smoothing.
     * @param value The value to smooth.
     * @param last The last smoothed value.
     * @param factor The smoothing factor.
     * @returns A smoothed value.
     */
    private static smooth;
}
//# sourceMappingURL=ExpSmoother.d.ts.map