import { ComponentProps, DisplayComponent, FSComponent, NumberUnitInterface, Subject, Subscribable, Unit, UnitFamily, UnitType, VNode } from 'msfssdk';
import { NumberFormatter } from 'msfssdk/graphics/text';
import { NumberUnitDisplay } from '../UI/Common/NumberUnitDisplay';

import './MapRangeDisplay.css';

/**
 * Component props for MapRangeDisplay
 */
export interface MapRangeDisplayProps extends ComponentProps {
  /** A subscribable which provides the range. */
  range: Subscribable<NumberUnitInterface<UnitFamily.Distance>>;

  /** A subscribable which provides a display unit type. */
  displayUnit: Subscribable<Unit<UnitFamily.Distance> | null>;

  /** The class name of the display component root. */
  class?: string;
}

/**
 * The map layer showing the range display.
 */
export class MapRangeDisplay extends DisplayComponent<MapRangeDisplayProps> {
  private readonly displayUnitSub = Subject.create<Unit<UnitFamily.Distance> | null>(null);
  private readonly autoSubject = Subject.create('false');
  private readonly autoOverrideSubject = Subject.create('false');

  private readonly displayUnitHandler = this.updateDisplayUnit.bind(this);

  // eslint-disable-next-line jsdoc/require-jsdoc
  public onAfterRender(): void {
    this.props.range.sub(this.displayUnitHandler);
    this.props.displayUnit.sub(this.displayUnitHandler, true);
  }

  /**
   * Updates this component's display unit.
   */
  private updateDisplayUnit(): void {
    const nominalDisplayUnit = this.props.displayUnit.get();
    const range = this.props.range.get();

    let displayUnit;
    if (nominalDisplayUnit && nominalDisplayUnit.equals(UnitType.NMILE)) {
      if (range.asUnit(UnitType.FOOT) as number <= 2501) {
        displayUnit = UnitType.FOOT;
      } else {
        displayUnit = UnitType.NMILE;
      }
    } else if (nominalDisplayUnit && nominalDisplayUnit.equals(UnitType.KILOMETER)) {
      if (range.asUnit(UnitType.METER) as number < 999) {
        displayUnit = UnitType.METER;
      } else {
        displayUnit = UnitType.KILOMETER;
      }
    } else {
      displayUnit = nominalDisplayUnit;
    }

    this.displayUnitSub.set(displayUnit);
  }

  // eslint-disable-next-line jsdoc/require-jsdoc
  public render(): VNode {
    return (
      <div class={`map-range-display${this.props.class ? ` ${this.props.class}` : ''}`} auto={this.autoSubject} auto-override={this.autoOverrideSubject}
        style='display: flex; flex-flow: column nowrap; align-items: center;'>
        <div class='map-range-display-auto' style='display: none;'>AUTO</div>
        <NumberUnitDisplay
          value={this.props.range} displayUnit={this.displayUnitSub}
          formatter={NumberFormatter.create({ precision: 0.01, forceDecimalZeroes: false, maxDigits: 3 })}
        />
      </div>
    );
  }
}