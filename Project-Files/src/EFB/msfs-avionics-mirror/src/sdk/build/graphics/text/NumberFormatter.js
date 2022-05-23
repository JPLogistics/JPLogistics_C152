/**
 * A utility class for creating number formatters.
 *
 * Each number formatter is a function which generates output strings from input numeric values. The formatting
 * behavior of a formatter is defined by its options. Please refer to the {@link NumberFormatterOptions} type
 * documentation for more information on each individual option.
 */
export class NumberFormatter {
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
    static formatNumber(precision, roundFunc, maxDigits, forceDecimalZeroes, pad, showCommas, forceSign, nanString, number) {
        if (isNaN(number)) {
            return nanString;
        }
        const sign = number < 0 ? '-' : '+';
        const abs = Math.abs(number);
        let formatted;
        if (precision != 0) {
            const rounded = roundFunc(abs / precision) * precision;
            const precisionString = `${precision}`;
            const decimalIndex = precisionString.indexOf('.');
            if (decimalIndex >= 0) {
                formatted = rounded.toFixed(precisionString.length - decimalIndex - 1);
            }
            else {
                formatted = `${rounded}`;
            }
        }
        else {
            formatted = `${abs}`;
        }
        let decimalIndex = formatted.indexOf('.');
        if (!forceDecimalZeroes && decimalIndex >= 0) {
            formatted = formatted.replace(/0+$/, '');
            if (formatted.indexOf('.') == formatted.length - 1) {
                formatted = formatted.substring(0, formatted.length - 1);
            }
        }
        decimalIndex = formatted.indexOf('.');
        if (decimalIndex >= 0 && formatted.length - 1 > maxDigits) {
            const shift = Math.max(maxDigits - decimalIndex, 0);
            const shiftPrecision = Math.pow(0.1, shift);
            formatted = (roundFunc(abs / shiftPrecision) * shiftPrecision).toFixed(shift);
        }
        formatted;
        if (pad === 0) {
            formatted = formatted.replace(/^0\./, '.');
        }
        else if (pad > 1) {
            decimalIndex = formatted.indexOf('.');
            if (decimalIndex < 0) {
                decimalIndex = formatted.length;
            }
            formatted = formatted.padStart(pad + formatted.length - decimalIndex, '0');
        }
        if (showCommas) {
            const parts = formatted.split('.');
            parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
            formatted = parts.join('.');
        }
        return ((forceSign || sign === '-') ? sign : '') + formatted;
    }
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
    static create(options) {
        const optsToUse = Object.assign({}, NumberFormatter.DEFAULT_OPTIONS);
        Object.assign(optsToUse, options);
        return NumberFormatter.formatNumber.bind(undefined, optsToUse.precision, NumberFormatter.roundFuncs[optsToUse.round], optsToUse.maxDigits, optsToUse.forceDecimalZeroes, optsToUse.pad, optsToUse.showCommas, optsToUse.forceSign, optsToUse.nanString);
    }
}
NumberFormatter.DEFAULT_OPTIONS = {
    precision: 0,
    round: 0,
    maxDigits: Infinity,
    forceDecimalZeroes: true,
    pad: 1,
    showCommas: false,
    forceSign: false,
    nanString: 'NaN'
};
NumberFormatter.roundFuncs = {
    [-1]: Math.floor,
    [0]: Math.round,
    [1]: Math.ceil
};
