import { FSComponent, Subject, UnitType, VNode } from 'msfssdk';
import { AirportFacility, AirportRunway, RunwayUtils } from 'msfssdk/navigation';
import { AirportFilter } from '../../../../../Shared/UI/Controllers/NearestStore';
import { ScrollDirection, UiControl2, UiControl2Props } from '../../../../../Shared/UI/UiControl2';
import { GroupBox } from '../../GroupBox';

import './RunwaysGroup.css';

/** Props on the RunwaysGroup control. */
interface RunwaysGroupProps extends UiControl2Props {
  /** Whether or not the inner knob is the only scroll controller. */
  innerScrollOnly?: boolean;
}

/**
 * A component that displays runway information on the MFD nearest
 * airports page.
 */
export class RunwaysGroup extends UiControl2<RunwaysGroupProps> {
  private readonly content = FSComponent.createRef<HTMLDivElement>();
  private readonly runwaySelector = FSComponent.createRef<RunwaySelector>();

  private surface = Subject.create<string>('');
  private runwayWidth = Subject.create<string>('');
  private runwayLength = Subject.create<string>('');

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
    this.runwayLength.set(UnitType.METER.convertTo(runway.length - runway.primaryThresholdLength - runway.secondaryThresholdLength, UnitType.FOOT).toFixed(0));
    this.runwayWidth.set(UnitType.METER.convertTo(runway.width, UnitType.FOOT).toFixed(0));

    if (AirportFilter.surfacesHard.includes(runway.surface)) {
      this.surface.set('HARD SURFACE');
    } else if (AirportFilter.surfacesSoft.includes(runway.surface)) {
      this.surface.set('TURF SURFACE');
    } else {
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
            <span>{this.runwayLength}</span><span class='smaller'>FT</span> x <span>{this.runwayWidth}</span><span class='smaller'>FT</span>
          </div>
        </div>
      </GroupBox>
    );
  }
}

/**
 * Properties on the RunwaySelector component.
 */
interface RunwaySelectorProps extends UiControl2Props {
  /** A callback called when a runway is selected. */
  onSelected: (runway: AirportRunway) => void;

  /** Whether or not the inner knob is the only scroll controller. */
  innerScrollOnly?: boolean;
}

/**
 * A component that allows a user to select the runway to show information for
 * on the runway group of the MFD nearest airports page.
 */
export class RunwaySelector extends UiControl2<RunwaySelectorProps> {
  private readonly rightArrow = FSComponent.createRef<SVGPathElement>();
  private readonly leftArrow = FSComponent.createRef<SVGPathElement>();
  private readonly nameEl = FSComponent.createRef<HTMLDivElement>();

  private runwayIndex = 0;
  private facility: AirportFacility | undefined
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
  protected onUpperKnobInc(source: UiControl2): boolean {
    if (this.props.innerScrollOnly) {
      this.selectRunway(this.runwayIndex + 1);
      return true;
    }

    return super.onUpperKnobInc(source);
  }

  /** @inheritdoc */
  protected onUpperKnobDec(source: UiControl2): boolean {
    if (this.props.innerScrollOnly) {
      this.selectRunway(this.runwayIndex - 1);
      return true;
    }

    return super.onUpperKnobDec(source);
  }

  /** @inheritdoc */
  public onScroll(direction: ScrollDirection): boolean {
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
  public onFocused(source: UiControl2): void {
    this.nameEl.instance.classList.add('highlight-select');
    super.onFocused(source);
  }

  /** @inheritdoc */
  public onBlurred(source: UiControl2): void {
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