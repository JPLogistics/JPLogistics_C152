/**
 * A utitlity class for calculating a numerical average of a selected number of samples.
 */
export class SimpleMovingAverage {
    /**
     * Class to return a numerical average from a specified number of inputs.
     * @param samples is the number of samples.
     */
    constructor(samples) {
        this.samples = samples;
        this._values = [];
    }
    /**
     * Returns a numerical average of the inputs.
     * @param input is the input number.
     * @returns The numerical average.
     */
    getAverage(input) {
        let samples = this.samples;
        if (this._values.length === samples) {
            this._values.splice(0, 1);
        }
        else {
            samples = this._values.length;
        }
        this._values.push(input);
        let sum = 0;
        this._values.forEach((v) => {
            sum += v;
        });
        return sum / samples;
    }
    /**
     * Resets the average.
     */
    reset() {
        this._values = [];
    }
}
