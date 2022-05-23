import { NumberUnitInterface, Unit, UnitFamily } from '../../math/NumberUnit';
import { Subscribable } from '../../sub/Subscribable';
import { SubscribableSet } from '../../sub/SubscribableSet';
import { ComponentProps, DisplayComponent, VNode } from '../FSComponent';
export declare enum DurationDisplayFormat {
    /** hh:mm:ss. */
    hh_mm_ss = 0,
    /** hh:mm. */
    hh_mm = 1,
    /** mm:ss. */
    mm_ss = 2,
    /** hh:mm if value is greater or equal to 1 hour, otherwise mm:ss. */
    hh_mm_or_mm_ss = 3
}
export declare enum DurationDisplayDelim {
    /** Colon (`:`). */
    Colon = 0,
    /** `:` if hh:mm:ss or mm:ss, `+` if hh:mm. */
    ColonOrCross = 1,
    /** Space (` `). */
    Space = 2
}
/**
 * Formatting options for DurationDisplay.
 */
export declare type DurationDisplayOptions = {
    /** The format with which to display values. */
    format: DurationDisplayFormat;
    /** The delimiter to insert between parts of formatted values. */
    delim: DurationDisplayDelim;
    /** The number of digits to which to pad the first part of formatted values with leading zeroes. */
    pad: number;
    /** A function used to format the last part of formatted values. */
    numberFormatter: (value: number) => string;
    /** Whether to show units. */
    showUnits: boolean;
    /** A function used to format units. */
    unitFormatter: (value: number, unit: Unit<UnitFamily.Duration>) => string;
    /** The string to display when the value is NaN. */
    nanString: string;
};
/**
 * Component props for DurationDisplay.
 */
export interface DurationDisplayProps extends ComponentProps {
    /** The duration to display, or a subscribable which provides it. */
    value: NumberUnitInterface<UnitFamily.Duration> | Subscribable<NumberUnitInterface<UnitFamily.Duration>>;
    /** Formatting options. Any options not explicitly set will revert to the default. */
    options?: Partial<DurationDisplayOptions>;
    /** CSS class(es) to add to the root of the icon component. */
    class?: string | SubscribableSet<string>;
}
/**
 * A component which displays duration values.
 */
export declare class DurationDisplay extends DisplayComponent<DurationDisplayProps> {
    /** Default formatting options. */
    static readonly DEFAULT_OPTIONS: DurationDisplayOptions;
    private readonly value;
    private valueSub?;
    private readonly options;
    private readonly delim;
    private readonly text;
    /** @inheritdoc */
    constructor(props: DurationDisplayProps);
    /** @inheritdoc */
    onAfterRender(): void;
    /**
     * A callback which is called when this component's bound value changes.
     * @param value The new value.
     */
    private onValueChanged;
    /**
     * Displays this component's current value.
     * @param value The current value.
     */
    private setDisplay;
    /**
     * Pads the integer part of a string which represents a number.
     * @param str A string which represents a number.
     * @param maxLength The length to which the integer part of the string will be padded.
     * @param fillString The string with which to pad the original string.
     * @returns a new string which is the result of padding the original string.
     */
    private static padIntegerPart;
    /** @inheritdoc */
    render(): VNode;
    /** @inheritdoc */
    destroy(): void;
}
//# sourceMappingURL=DurationDisplay.d.ts.map