import { FSComponent, NumberUnitInterface, Subject, Unit, UnitFamily, UnitType, VNode } from 'msfssdk';
import { AbstractNumberUnitDisplay, AbstractNumberUnitDisplayProps } from 'msfssdk/components/common';

import './NumberUnitDisplay.css';

/**
 * Component props for NumberUnitDisplay.
 */
export interface NumberUnitDisplayProps<F extends string> extends AbstractNumberUnitDisplayProps<F> {
  /** A function which formats numbers. */
  formatter: (number: number) => string;

  /** CSS class(es) to add to the root of the icon component. */
  class?: string;
}

/**
 * A component which displays a number with units.
 */
export class NumberUnitDisplay<F extends string> extends AbstractNumberUnitDisplay<F, NumberUnitDisplayProps<F>> {
  private static readonly UNIT_TEXT: Record<string, Record<string, string>> = {
    [UnitFamily.Distance]: {
      [UnitType.METER.name]: 'M',
      [UnitType.FOOT.name]: 'FT',
      [UnitType.KILOMETER.name]: 'KM',
      [UnitType.NMILE.name]: 'NM'
    },
    [UnitFamily.Angle]: {
      [UnitType.DEGREE.name]: '°',
      [UnitType.RADIAN.name]: 'rad'
    },
    [UnitFamily.Duration]: {
      [UnitType.SECOND.name]: 'S',
      [UnitType.MINUTE.name]: 'M',
      [UnitType.HOUR.name]: 'H'
    },
    [UnitFamily.Weight]: {
      [UnitType.KILOGRAM.name]: 'KG',
      [UnitType.POUND.name]: 'LB',
      [UnitType.LITER_FUEL.name]: 'L',
      [UnitType.GALLON_FUEL.name]: 'GAL'
    },
    [UnitFamily.Volume]: {
      [UnitType.LITER.name]: 'L',
      [UnitType.GALLON.name]: 'GAL'
    },
    [UnitFamily.Pressure]: {
      [UnitType.HPA.name]: 'HPA',
      [UnitType.IN_HG.name]: 'INHG'
    },
    [UnitFamily.Temperature]: {
      [UnitType.CELSIUS.name]: '°C',
      [UnitType.FAHRENHEIT.name]: '°F'
    },
    [UnitType.KNOT.family]: {
      [UnitType.KNOT.name]: 'KT',
      [UnitType.KPH.name]: 'KH',
      [UnitType.MPM.name]: 'MPM',
      [UnitType.FPM.name]: 'FPM'
    },
    [UnitType.LPH_FUEL.family]: {
      [UnitType.KGH.name]: 'KGH',
      [UnitType.PPH.name]: 'PPH',
      [UnitType.LPH_FUEL.name]: 'LPH',
      [UnitType.GPH_FUEL.name]: 'GPH'
    }
  };

  private readonly unitTextBigRef = FSComponent.createRef<HTMLSpanElement>();

  private readonly numberTextSub = Subject.create('');
  private readonly unitTextBigSub = Subject.create('');
  private readonly unitTextSmallSub = Subject.create('');

  /** @inheritdoc */
  public onAfterRender(): void {
    super.onAfterRender();

    // We have to hide the "big" unit text when empty because an empty string will get rendered as a space.
    this.unitTextBigSub.sub((text): void => { this.unitTextBigRef.instance.style.display = text === '' ? 'none' : ''; }, true);
  }

  /** @inheritdoc */
  protected onValueChanged(value: NumberUnitInterface<F>): void {
    this.setDisplay(value, this.props.displayUnit.get());
  }

  /** @inheritdoc */
  protected onDisplayUnitChanged(displayUnit: Unit<F> | null): void {
    this.setDisplay(this.props.value.get(), displayUnit);
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
    this.numberTextSub.set(numberText);

    const unitText = (NumberUnitDisplay.UNIT_TEXT[displayUnit.family] && NumberUnitDisplay.UNIT_TEXT[displayUnit.family][displayUnit.name]) ?? '';

    if (unitText[0] === '°') {
      this.unitTextBigSub.set('°');
      this.unitTextSmallSub.set(unitText.substring(1));
    } else {
      this.unitTextBigSub.set('');
      this.unitTextSmallSub.set(unitText);
    }
  }

  /** @inheritdoc */
  public render(): VNode {
    return (
      <div class={this.props.class ?? ''} style='white-space: nowrap;'>
        <span class='numberunit-num'>{this.numberTextSub}</span><span ref={this.unitTextBigRef} class='numberunit-unit-big'>{this.unitTextBigSub}</span><span class='numberunit-unit-small'>{this.unitTextSmallSub}</span>
      </div>
    );
  }
}