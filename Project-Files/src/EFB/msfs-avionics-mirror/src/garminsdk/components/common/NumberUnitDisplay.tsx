import { FSComponent, NumberUnitInterface, Subject, SubscribableSet, Unit, VNode } from 'msfssdk';
import { AbstractNumberUnitDisplay, AbstractNumberUnitDisplayProps } from 'msfssdk/components/common';
import { UnitFormatter } from '../../graphics/text/UnitFormatter';

/**
 * Component props for NumberUnitDisplay.
 */
export interface NumberUnitDisplayProps<F extends string> extends AbstractNumberUnitDisplayProps<F> {
  /** A function which formats numbers. */
  formatter: (number: number) => string;

  /** CSS class(es) to add to the root of the icon component. */
  class?: string | SubscribableSet<string>;
}

/**
 * A component which displays a number with units.
 */
export class NumberUnitDisplay<F extends string> extends AbstractNumberUnitDisplay<F, NumberUnitDisplayProps<F>> {
  private static readonly UNIT_FORMATTER = UnitFormatter.create();

  private readonly unitTextBigRef = FSComponent.createRef<HTMLSpanElement>();

  private readonly numberText = Subject.create('');
  private readonly unitTextBig = Subject.create('');
  private readonly unitTextSmall = Subject.create('');

  /** @inheritdoc */
  public onAfterRender(): void {
    super.onAfterRender();

    // We have to hide the "big" unit text when empty because an empty string will get rendered as a space.
    this.unitTextBig.sub((text): void => { this.unitTextBigRef.instance.style.display = text === '' ? 'none' : ''; }, true);
  }

  /** @inheritdoc */
  protected onValueChanged(value: NumberUnitInterface<F>): void {
    this.setDisplay(value, this.displayUnit.get());
  }

  /** @inheritdoc */
  protected onDisplayUnitChanged(displayUnit: Unit<F> | null): void {
    this.setDisplay(this.value.get(), displayUnit);
  }

  /**
   * Displays this component's current value.
   * @param value The current value.
   * @param displayUnit The current display unit.
   */
  private setDisplay(value: NumberUnitInterface<F>, displayUnit: Unit<F> | null): void {
    if (!displayUnit || !value.unit.canConvert(displayUnit)) {
      displayUnit = value.unit;
    }

    const numberText = this.props.formatter(value.asUnit(displayUnit));
    this.numberText.set(numberText);

    const unitText = NumberUnitDisplay.UNIT_FORMATTER(displayUnit);

    if (unitText[0] === '°') {
      this.unitTextBig.set('°');
      this.unitTextSmall.set(unitText.substring(1));
    } else {
      this.unitTextBig.set('');
      this.unitTextSmall.set(unitText);
    }
  }

  /** @inheritdoc */
  public render(): VNode {
    return (
      <div class={this.props.class ?? ''} style='white-space: nowrap;'>
        <span class='numberunit-num'>{this.numberText}</span><span ref={this.unitTextBigRef} class='numberunit-unit-big'>{this.unitTextBig}</span><span class='numberunit-unit-small'>{this.unitTextSmall}</span>
      </div>
    );
  }
}