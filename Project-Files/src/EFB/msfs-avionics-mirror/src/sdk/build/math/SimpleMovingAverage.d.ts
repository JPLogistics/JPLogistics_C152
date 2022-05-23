/**
 * A utitlity class for calculating a numerical average of a selected number of samples.
 */
export declare class SimpleMovingAverage {
    private samples;
    private _values;
    /**
     * Class to return a numerical average from a specified number of inputs.
     * @param samples is the number of samples.
     */
    constructor(samples: number);
    /**
     * Returns a numerical average of the inputs.
     * @param input is the input number.
     * @returns The numerical average.
     */
    getAverage(input: number): number;
    /**
     * Resets the average.
     */
    reset(): void;
}
//# sourceMappingURL=SimpleMovingAverage.d.ts.map