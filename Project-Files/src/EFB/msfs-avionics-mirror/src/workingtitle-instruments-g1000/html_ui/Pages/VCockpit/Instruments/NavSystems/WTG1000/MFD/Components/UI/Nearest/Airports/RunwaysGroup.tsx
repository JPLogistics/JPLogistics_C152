import { FSComponent, NumberUnitSubject, Subject, UnitType, VNode } from 'msfssdk';
import { AirportFacility, AirportRunway, RunwaySurfaceCategory, RunwayUtils } from 'msfssdk/navigation';
import { ScrollDirection } from 'msfssdk/components/controls';
import { NumberFormatter } from 'msfssdk/graphics/text';
import { NumberUnitDisplay } from '../../../../../Shared/UI/Common/NumberUnitDisplay';
import { G1000UiControl, G1000UiControlProps } from '../../../../../Shared/UI/G1000UiControl';
import { UnitsUserSettingManager } from '../../../../../Shared/Units/UnitsUserSettings';
import { GroupBox } from '../../GroupBox';

import './RunwaysGroup.css';

/** Props on the RunwaysGroup control. */
interface RunwaysGroupProps extends G1000UiControlProps {
  /** A user setting manager for measurement units. */
  unitsSettingManager: UnitsUserSettingManager;

  /** Whether or not the inner knob is the only scroll controller. */
  innerScrollOnly?: boolean;
}

/**
 * A component that displays runway information on the MFD nearest
 * airports page.
 */
export class RunwaysGroup extends G1000UiControl<RunwaysGroupProps> {
  private readonly content = FSComponent.createRef<HTMLDivElement>();
  private readonly runwaySelector = FSComponent.createRef<RunwaySelector>();

  private readonly surface = Subject.create<string>('');
  private readonly runwayWidth = NumberUnitSubject.createFromNumberUnit(UnitType.METER.createNumber(NaN));
  private readonly runwayLength = NumberUnitSubject.createFromNumberUnit(UnitType.METER.createNumber(NaN));

  /**
   * Sets the currently displayed set of runways for the given airport.
   * @param facility The airport facility to display runways for.
   */
  public set(facility: AirportFacility | null): void {
    this.runwaySelector.instance.set(facility);
  }

  /**
   * A callback called when a runway is selected from the runway selector.
   * @param runway The runway that was selected.
   */
  private onRunwaySelected(runway: AirportRunway): void {
    this.runwayLength.set(runway.length);
    this.runwayWidth.set(runway.width);

    const surface = RunwayUtils.getSurfaceCategory(runway);
    switch (surface) {
      case RunwaySurfaceCategory.Hard:
        this.surface.set('HARD SURFACE'); break;
      case RunwaySurfaceCategory.Soft:
        this.surface.set('TURF SURFACE'); break;
      default:
        this.surface.set('');
    }
  }

  /** @inheritdoc */
  public render(): VNode {
    return (
      <GroupBox title='Runways'>
        <div class="mfd-nearest-airport-runways" ref={this.content}>
          <RunwaySelector onSelected={this.onRunwaySelected.bind(this)} ref={this.runwaySelector} innerKnobScroll innerScrollOnly={this.props.innerScrollOnly} />
          <div class='mfd-nearest-airport-runways-surface'>{this.surface}</div>
          <div class='mfd-nearest-airport-runways-dimensions'>
            <NumberUnitDisplay
              value={this.runwayLength}
              displayUnit={this.props.unitsSettingManager.distanceUnitsSmall}
              formatter={NumberFormatter.create({ precision: 1, nanString: '______' })}
            />
            <div> x </div>
            <NumberUnitDisplay
              value={this.runwayWidth}
              displayUnit={this.props.unitsSettingManager.distanceUnitsSmall}
              formatter={NumberFormatter.create({ precision: 1, nanString: '______' })}
            />
          </div>
        </div>
      </GroupBox>
    );
  }
}

/**
 * Properties on the RunwaySelector component.
 */
interface RunwaySelectorProps extends G1000UiControlProps {
  /** A callback called when a runway is selected. */
  onSelected: (runway: AirportRunway) => void;

  /** Whether or not the inner knob is the only scroll controller. */
  innerScrollOnly?: boolean;
}

/**
 * A component that allows a user to select the runway to show information for
 * on the runway group of the MFD nearest airports page.
 */
export class RunwaySelector extends G1000UiControl<RunwaySelectorProps> {
  private readonly rightArrow = FSComponent.createRef<SVGPathElement>();
  private readonly leftArrow = FSComponent.createRef<SVGPathElement>();
  private readonly nameEl = FSComponent.createRef<HTMLDivElement>();

  private runwayIndex = 0;
  private facility: AirportFacility | undefined;
  private runwayName = Subject.create<string>('');

  /**
   * Sets the currently selected facility to load runways from.
   * @param facility The airport facility to set.
   */
  public set(facility: AirportFacility | null): void {
    this.facility = facility ?? undefined;
    this.runwayIndex = 0;

    if (this.facility !== undefined) {
      this.selectRunway(this.runwayIndex);
    }
  }

  /** @inheritdoc */
  public onUpperKnobInc(): boolean {
    if (this.props.innerScrollOnly) {
      this.selectRunway(this.runwayIndex + 1);
      return true;
    }

    return false;
  }

  /** @inheritdoc */
  public onUpperKnobDec(): boolean {
    if (this.props.innerScrollOnly) {
      this.selectRunway(this.runwayIndex - 1);
      return true;
    }

    return false;
  }

  /** @inheritdoc */
  protected onScroll(direction: ScrollDirection): boolean {
    if (!this.props.innerScrollOnly) {
      switch (direction) {
        case 'backward':
          return this.selectRunway(this.runwayIndex - 1);
        case 'forward':
          return this.selectRunway(this.runwayIndex + 1);
      }
    }

    return false;
  }

  /** @inheritdoc */
  protected onFocused(source: G1000UiControl): void {
    this.nameEl.instance.classList.add('highlight-select');
    super.onFocused(source);
  }

  /** @inheritdoc */
  protected onBlurred(source: G1000UiControl): void {
    this.nameEl.instance.classList.remove('highlight-select');
    super.onBlurred(source);
  }

  /**
   * Selects a runway by the given runway index in the facility runway list.
   * @param index The index of the runway.
   * @returns True if the index was in range, false otherwise.
   */
  private selectRunway(index: number): boolean {
    if (this.facility !== undefined && index >= 0 && index < this.facility.runways.length) {

      const runway = this.facility.runways[index];
      const runwayDirections = runway.designation.split('-');

      const primaryRunway = RunwayUtils.getRunwayNameString(parseInt(runwayDirections[0]), runway.designatorCharPrimary);
      const secondaryRunway = RunwayUtils.getRunwayNameString(parseInt(runwayDirections[1]), runway.designatorCharSecondary);

      this.runwayName.set(`${primaryRunway}-${secondaryRunway}`);

      if (index === 0) {
        this.leftArrow.instance.classList.add('disabled');
      } else {
        this.leftArrow.instance.classList.remove('disabled');
      }

      if (index === this.facility.runways.length - 1) {
        this.rightArrow.instance.classList.add('disabled');
      } else {
        this.rightArrow.instance.classList.remove('disabled');
      }

      this.runwayIndex = index;
      this.props.onSelected(runway);
      return true;
    }

    return false;
  }

  /** @inheritdoc */
  public render(): VNode {
    return (
      <div class="arrow-toggle-container mfd-nearest-airport-runways-selector">
        <svg viewBox='0 0 5 10'>
          <path d='M 5 0 l 0 10 l -5 -5 z' class='disabled' ref={this.leftArrow} />
        </svg>
        <div ref={this.nameEl} class="arrow-toggle-value mfd-nearest-airport-runways-name">{this.runwayName}</div>
        <svg viewBox='0 0 5 10'>
          <path d='M 0 0 l 0 10 l 5 -5 z' class='disabled' ref={this.rightArrow} />
        </svg>
      </div>
    );
  }
}