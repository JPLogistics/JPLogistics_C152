/**
 * Options for creating a number formatter.
 */
export declare type NumberFormatterOptions = {
    /** The precision to which to round the number. A value of 0 denotes no rounding. */
    precision: number;
    /** Rounding behavior. Always round down = `-1`. Always round up = `+1`. Normal rounding = `0`. */
    round: -1 | 0 | 1;
    /**
     * The maximum number of digits to enforce. Digits to the _right_ of the decimal point will be omitted (with proper
     * rounding behavior) as necessary until the total number of digits in the output is less than or equal to the value
     * of this option or until there are no more digits to omit. Digits to the _left_ of the decimal point are always
     * preserved, even if it means the number of digits in the output will exceed the value of this option.
     */
    maxDigits: number;
    /**
     * Whether to force trailing zeroes to the right of the decimal point. The number of trailing zeroes is determined
     * by the `precision` option. Specifically, trailing zeroes are added to the least significant decimal place required
     * to represent the value of `precision` (and therefore, any possible output rounded to `precision`) with no
     * rounding.
     */
    forceDecimalZeroes: boolean;
    /** The number of digits to which to pad with zeroes to the left of the decimal point. */
    pad: number;
    /** Whether to show commas. */
    showCommas: boolean;
    /** Whether to force the display of a positive sign. */
    forceSign: boolean;
    /** The string to output for an input of NaN. */
    nanString: string;
};
/**
 * A utility class for creating number formatters.
 *
 * Each number formatter is a function which generates output strings from input numeric values. The formatting
 * behavior of a formatter is defined by its options. Please refer to the {@link NumberFormatterOptions} type
 * documentation for more information on each individual option.
 */
export declare class NumberFormatter {
    static readonly DEFAULT_OPTIONS: Readonly<NumberFormatterOptions>;
    private static readonly roundFuncs;
    /**
     * Formats a number to a string.
     * @param precision The precision to which to round the number. A value of 0 denotes no rounding.
     * @param roundFunc The rounding function to use.
     * @param maxDigits The maximum number of digits to enforce.
     * @param forceDecimalZeroes Whether to force trailing zeroes after the decimal point.
     * @param pad The number of digits to which to pad with zeroes in front of the decimal point.
     * @param showCommas Whether to show commas.
     * @param forceSign Whether to force the display of a positive sign.
     * @param nanString The string to use for NaN.
     * @param number The number to format.
     * @returns A formatted string.
     */
    private static formatNumber;
    /**
     * Creates a function which formats numeric values to strings. The formatting behavior of the function can be
     * customized using a number of options. Please refer to the {@link NumberFormatterOptions} type documentation for
     * more information on each individual option.
     * @param options Options to customize the formatter. Options not explicitly defined will be set to the following
     * default values:
     * * `precision = 0`
     * * `round = 0`
     * * `maxDigits = Infinity`
     * * `forceDecimalZeroes = true`
     * * `pad = 1`
     * * `showCommas = false`
     * * `forceSign = false`
     * * `nanString = 'NaN'`
     * @returns A function which formats numeric values to strings.
     */
    static create(options: Partial<NumberFormatterOptions>): (number: number) => string;
}
//# sourceMappingURL=NumberFormatter.d.ts.map