/**
 * Utility class for generating common mapping functions.
 */
export class SubscribableMapFunctions {
    /**
     * Generates a function which maps an input to itself.
     * @returns A function which maps an input to itself.
     */
    static identity() {
        return (input) => input;
    }
    /**
     * Generates a function which maps an input boolean to its negation.
     * @returns A function which maps an input boolean to its negation.
     */
    static not() {
        return (input) => !input;
    }
    /**
     * Generates a function which maps an input number to its negation.
     * @returns A function which maps an input number to its negation.
     */
    static negate() {
        return (input) => -input;
    }
    /**
     * Generates a function which maps an input number to its absolute value.
     * @returns A function which maps an input number to its absolute value.
     */
    static abs() {
        return Math.abs;
    }
    /**
     * Generates a function which maps an input number to a rounded version of itself at a certain precision.
     * @param precision The precision to which to round the input.
     * @returns A function which maps an input number to a rounded version of itself at the specified precision.
     */
    static withPrecision(precision) {
        return (input) => {
            return Math.round(input / precision) * precision;
        };
    }
    /**
     * Generates a function which maps an input number to itself if and only if it differs from the previous mapped value
     * by a certain amount, and to the previous mapped value otherwise.
     * @param threshold The minimum difference between the input and the previous mapped value required to map the input
     * to itself.
     * @returns A function which maps an input number to itself if and only if it differs from the previous mapped value
     * by the specified amount, and to the previous mapped value otherwise.
     */
    static changedBy(threshold) {
        return (input, currentVal) => currentVal === undefined || Math.abs(input - currentVal) >= threshold ? input : currentVal;
    }
    /**
     * Generates a function which maps an input number to itself up to a maximum frequency, and to the previous mapped
     * value otherwise.
     * @param freq The maximum frequency at which to map the input to itself, in Hertz.
     * @param timeFunc A function which gets the current time in milliseconds. Defaults to `Date.now()`.
     * @returns A function which maps an input number to itself up to the specified maximum frequency, and to the
     * previous mapped value otherwise.
     */
    atFrequency(freq, timeFunc = Date.now) {
        const period = 1000 / freq;
        let t0;
        let timeRemaining = 0;
        return (input, currentVal) => {
            let returnValue = currentVal !== null && currentVal !== void 0 ? currentVal : input;
            const currentTime = timeFunc();
            const dt = currentTime - (t0 !== null && t0 !== void 0 ? t0 : (t0 = currentTime));
            timeRemaining -= dt;
            if (timeRemaining <= 0) {
                timeRemaining = period + timeRemaining;
                returnValue = input;
            }
            return returnValue;
        };
    }
}
