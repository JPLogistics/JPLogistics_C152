import { NumberUnitInterface, Unit } from '../../math/NumberUnit';
import { Subscribable } from '../../sub/Subscribable';
import { ComponentProps, DisplayComponent } from '../FSComponent';
/**
 * Component props for AbstractNumberUnitDisplay.
 */
export interface AbstractNumberUnitDisplayProps<F extends string> extends ComponentProps {
    /** The {@link NumberUnitInterface} value to display, or a subscribable which provides it. */
    value: NumberUnitInterface<F> | Subscribable<NumberUnitInterface<F>>;
    /**
     * The unit type in which to display the value, or a subscribable which provides it. If the unit is `null`, then the
     * native type of the value is used instead.
     */
    displayUnit: Unit<F> | null | Subscribable<Unit<F> | null>;
}
/**
 * A component which displays a number with units.
 */
export declare abstract class AbstractNumberUnitDisplay<F extends string, P extends AbstractNumberUnitDisplayProps<F> = AbstractNumberUnitDisplayProps<F>> extends DisplayComponent<P> {
    /** A subscribable which provides the value to display. */
    protected readonly value: Subscribable<NumberUnitInterface<F>>;
    /** A subscribable which provides the unit type in which to display the value. */
    protected readonly displayUnit: Subscribable<Unit<F> | null>;
    private valueSub?;
    private displayUnitSub?;
    /** @inheritdoc */
    onAfterRender(): void;
    /**
     * A callback which is called when this component's bound value changes.
     * @param value The new value.
     */
    protected abstract onValueChanged(value: NumberUnitInterface<F>): void;
    /**
     * A callback which is called when this component's bound display unit changes.
     * @param displayUnit The new display unit.
     */
    protected abstract onDisplayUnitChanged(displayUnit: Unit<F> | null): void;
    /** @inheritdoc */
    destroy(): void;
}
//# sourceMappingURL=AbstractNumberUnitDisplay.d.ts.map