import { UnitType } from '../../math/NumberUnit';
import { Subject } from '../../sub/Subject';
import { DisplayComponent, FSComponent } from '../FSComponent';
export var DurationDisplayFormat;
(function (DurationDisplayFormat) {
    /** hh:mm:ss. */
    DurationDisplayFormat[DurationDisplayFormat["hh_mm_ss"] = 0] = "hh_mm_ss";
    /** hh:mm. */
    DurationDisplayFormat[DurationDisplayFormat["hh_mm"] = 1] = "hh_mm";
    /** mm:ss. */
    DurationDisplayFormat[DurationDisplayFormat["mm_ss"] = 2] = "mm_ss";
    /** hh:mm if value is greater or equal to 1 hour, otherwise mm:ss. */
    DurationDisplayFormat[DurationDisplayFormat["hh_mm_or_mm_ss"] = 3] = "hh_mm_or_mm_ss";
})(DurationDisplayFormat || (DurationDisplayFormat = {}));
export var DurationDisplayDelim;
(function (DurationDisplayDelim) {
    /** Colon (`:`). */
    DurationDisplayDelim[DurationDisplayDelim["Colon"] = 0] = "Colon";
    /** `:` if hh:mm:ss or mm:ss, `+` if hh:mm. */
    DurationDisplayDelim[DurationDisplayDelim["ColonOrCross"] = 1] = "ColonOrCross";
    /** Space (` `). */
    DurationDisplayDelim[DurationDisplayDelim["Space"] = 2] = "Space";
})(DurationDisplayDelim || (DurationDisplayDelim = {}));
/**
 * A component which displays duration values.
 */
export class DurationDisplay extends DisplayComponent {
    /** @inheritdoc */
    constructor(props) {
        super(props);
        this.value = ('isSubscribable' in this.props.value)
            ? this.props.value
            : Subject.create(this.props.value);
        this.options = Object.assign({}, DurationDisplay.DEFAULT_OPTIONS, this.props.options);
        this.text = Subject.create('');
        switch (this.options.delim) {
            case DurationDisplayDelim.Colon:
                this.delim = ':';
                break;
            case DurationDisplayDelim.Space:
                this.delim = ' ';
                break;
            default:
                this.delim = '';
        }
    }
    /** @inheritdoc */
    onAfterRender() {
        this.valueSub = this.value.sub(this.onValueChanged.bind(this), true);
    }
    /**
     * A callback which is called when this component's bound value changes.
     * @param value The new value.
     */
    onValueChanged(value) {
        this.setDisplay(value);
    }
    /**
     * Displays this component's current value.
     * @param value The current value.
     */
    setDisplay(value) {
        let text;
        if (value.isNaN()) {
            text = this.options.nanString;
        }
        else {
            let hrText = '';
            let minText = '';
            let secText = '';
            let hrUnitText = '';
            let minUnitText = '';
            let secUnitText = '';
            let hrDelim = '';
            let minDelim = '';
            const hours = Math.floor(value.asUnit(UnitType.HOUR));
            if (this.options.format != DurationDisplayFormat.mm_ss && !(this.options.format === DurationDisplayFormat.hh_mm_or_mm_ss && hours == 0)) {
                hrText = hours.toFixed(0);
                if (this.options.delim === DurationDisplayDelim.ColonOrCross) {
                    if (this.options.format === DurationDisplayFormat.hh_mm_or_mm_ss || this.options.format === DurationDisplayFormat.hh_mm) {
                        hrDelim = '+';
                    }
                    else {
                        hrDelim = ':';
                    }
                }
                else {
                    hrDelim = this.delim;
                }
            }
            let minutes;
            let seconds;
            if (this.options.format === DurationDisplayFormat.hh_mm || (this.options.format === DurationDisplayFormat.hh_mm_or_mm_ss && hours !== 0)) {
                minutes = value.asUnit(UnitType.MINUTE) % 60;
                minText = this.options.numberFormatter(minutes);
            }
            else {
                minutes = Math.floor(value.asUnit(UnitType.MINUTE) - hours * 60);
                minText = minutes.toFixed(0);
                minDelim = this.options.delim === DurationDisplayDelim.ColonOrCross ? ':' : this.delim;
                seconds = value.asUnit(UnitType.SECOND) % 60;
                secText = this.options.numberFormatter(seconds);
            }
            if (secText && secText.replace(/\b0+/, '').substring(0, 2) === '60') {
                secText = this.options.numberFormatter(parseFloat(secText) - 60);
                minText = `${minutes + 1}`;
            }
            if (minText && minText.replace(/\b0+/, '').substring(0, 2) === '60' && hrText) {
                if (secText) {
                    minText = '00';
                }
                else {
                    minText = this.options.numberFormatter(parseFloat(minText) - 60);
                }
                hrText = `${(hours + 1)}`;
            }
            // pad parts with leading zeroes
            if (hrText) {
                hrText = hrText.padStart(this.options.pad, '0');
                if (secText) {
                    minText = minText.padStart(2, '0');
                    secText = DurationDisplay.padIntegerPart(secText.replace(/^0+/, ''), 2, '0');
                }
                else {
                    minText = DurationDisplay.padIntegerPart(minText.replace(/^0+/, ''), 2, '0');
                }
            }
            else {
                minText = minText.padStart(this.options.pad, '0');
                secText = DurationDisplay.padIntegerPart(secText.replace(/^0+/, ''), 2, '0');
            }
            // format units
            if (this.options.showUnits) {
                hrText && (hrUnitText = this.options.unitFormatter(parseFloat(hrText), UnitType.HOUR));
                minUnitText = this.options.unitFormatter(parseFloat(minText), UnitType.MINUTE);
                secText && (secUnitText = this.options.unitFormatter(parseFloat(secText), UnitType.SECOND));
            }
            text = `${hrText}${hrUnitText}${hrDelim}${minText}${minUnitText}${minDelim}${secText}${secUnitText}`;
        }
        this.text.set(text);
    }
    /**
     * Pads the integer part of a string which represents a number.
     * @param str A string which represents a number.
     * @param maxLength The length to which the integer part of the string will be padded.
     * @param fillString The string with which to pad the original string.
     * @returns a new string which is the result of padding the original string.
     */
    static padIntegerPart(str, maxLength, fillString) {
        const decimalIndex = str.indexOf('.');
        return str.padStart(decimalIndex < 0 ? maxLength : str.length - decimalIndex + maxLength, fillString);
    }
    /** @inheritdoc */
    render() {
        var _a;
        return (FSComponent.buildComponent("div", { class: (_a = this.props.class) !== null && _a !== void 0 ? _a : '', style: 'white-space: nowrap;' }, this.text));
    }
    /** @inheritdoc */
    destroy() {
        var _a;
        (_a = this.valueSub) === null || _a === void 0 ? void 0 : _a.destroy();
    }
}
/** Default formatting options. */
DurationDisplay.DEFAULT_OPTIONS = {
    pad: 0,
    format: DurationDisplayFormat.hh_mm_ss,
    delim: DurationDisplayDelim.Colon,
    showUnits: false,
    numberFormatter: (value) => value.toFixed(0),
    unitFormatter: (value, unit) => unit.name[0],
    nanString: ''
};
