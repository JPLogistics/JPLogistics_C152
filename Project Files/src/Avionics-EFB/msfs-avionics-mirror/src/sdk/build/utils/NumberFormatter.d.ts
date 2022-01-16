/**
 * Options for creating a number formatter.
 */
export declare type NumberFormatterOptions = {
    /** The precision to which to round the number. A value of 0 denotes no rounding. */
    precision: number;
    /** Rounding behavior. Always round down = -1. Always round up = +1. Normal rounding = 0. */
    round: -1 | 0 | 1;
    /** The maximum number of digits to enforce. */
    maxDigits: number;
    /** Whether to force trailing zeroes after the decimal point. */
    forceDecimalZeroes: boolean;
    /** The number of digits to which to pad with zeroes in front of the decimal point. */
    pad: number;
    /** Whether to show commas. */
    showCommas: boolean;
    /** Whether to force the display of a positive sign. */
    forceSign: boolean;
    /** The string to use for NaN. */
    nanString: string;
};
/**
 * A utility class for creating number formatters.
 */
export declare class NumberFormatter {
    static readonly DEFAULT_OPTIONS: NumberFormatterOptions;
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
     * Creates a number formatter.
     * @param options Options to customize the formatter.
     * @returns A number formatter.
     */
    static create(options: Partial<NumberFormatterOptions>): (number: number) => string;
}
//# sourceMappingURL=NumberFormatter.d.ts.map