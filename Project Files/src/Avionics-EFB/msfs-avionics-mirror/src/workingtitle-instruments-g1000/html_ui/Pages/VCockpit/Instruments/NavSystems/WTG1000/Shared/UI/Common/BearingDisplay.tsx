import { FSComponent, NavAngleUnit, NumberUnitInterface, Subject, Unit, VNode } from 'msfssdk';
import { AbstractNumberUnitDisplay, AbstractNumberUnitDisplayProps } from 'msfssdk/components/common';

import './BearingDisplay.css';

/**
 * Component props for BearingDisplay.
 */
export interface BearingDisplayProps extends AbstractNumberUnitDisplayProps<typeof NavAngleUnit.FAMILY> {
  /** A function which formats numbers. */
  formatter: (number: number) => string;

  /** Whether to display 360 in place of 0. True by default. */
  use360?: boolean;

  /** CSS class(es) to add to the root of the bearing display component. */
  class?: string;
}

/**
 * Displays a bearing value.
 */
export class BearingDisplay extends AbstractNumberUnitDisplay<typeof NavAngleUnit.FAMILY, BearingDisplayProps> {
  private readonly unitTextSmallRef = FSComponent.createRef<HTMLSpanElement>();

  private readonly numberTextSub = Subject.create('');
  private readonly unitTextSmallSub = Subject.create('');

  /** @inheritdoc */
  constructor(props: BearingDisplayProps) {
    super(props);

    this.props.use360 ??= true;
  }

  /** @inheritdoc */
  public onAfterRender(): void {
    super.onAfterRender();

    // We have to hide the "small" unit text when empty because an empty string will get rendered as a space.
    this.unitTextSmallSub.sub((text): void => { this.unitTextSmallRef.instance.style.display = text === '' ? 'none' : ''; }, true);
  }

  /** @inheritdoc */
  protected onValueChanged(value: NumberUnitInterface<typeof NavAngleUnit.FAMILY>): void {
    this.setDisplay(value, this.props.displayUnit.get());
  }

  /** @inheritdoc */
  protected onDisplayUnitChanged(displayUnit: Unit<typeof NavAngleUnit.FAMILY> | null): void {
    this.setDisplay(this.props.value.get(), displayUnit);
  }

  /**
   * Displays this component's current value.
   * @param value The current value.
   * @param displayUnit The current display unit.
   */
  private setDisplay(value: NumberUnitInterface<typeof NavAngleUnit.FAMILY>, displayUnit: Unit<typeof NavAngleUnit.FAMILY> | null): void {
    if (!displayUnit || !value.unit.canConvert(displayUnit)) {
      displayUnit = value.unit;
    }

    const number = value.asUnit(displayUnit);
    let numberText = this.props.formatter(number);
    if (this.props.use360 && parseFloat(numberText) === 0) {
      numberText = this.props.formatter(360);
    }

    this.numberTextSub.set(numberText);
    this.unitTextSmallSub.set((displayUnit as NavAngleUnit).isMagnetic() ? '' : 'T');
  }

  /** @inheritdoc */
  public render(): VNode {
    return (
      <div class={this.props.class ?? ''} style='white-space: nowrap;'>
        <span class='bearing-num'>{this.numberTextSub}</span>
        <span class='bearing-unit'>°</span>
        <span ref={this.unitTextSmallRef} class='bearing-unit-small'>{this.unitTextSmallSub}</span>
      </div>
    );
  }
}