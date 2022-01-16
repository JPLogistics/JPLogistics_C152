import { FSComponent, VNode, ComputedSubject, UnitType, NumberUnitSubject, Subject, NumberFormatter, Subscribable, MathUtils } from 'msfssdk';
import { DurationDisplay, DurationDisplayDelim, DurationDisplayFormat } from 'msfssdk/components/common';
import { EventBus } from 'msfssdk/data';
import { ADCEvents, ClockEvents, GNSSEvents } from 'msfssdk/instruments';
import { LegDefinition, FlightPlanner } from 'msfssdk/flightplan';
import { VNavMode, VNavSimVarEvents } from 'msfssdk/autopilot';
import { NumberUnitDisplay } from '../../../../Shared/UI/Common/NumberUnitDisplay';
import { FocusPosition, UiControl2, UiControl2Props } from '../../../../Shared/UI/UiControl2';
import { UiControl } from '../../../../Shared/UI/UiControl';

import './MFDFPLVNavProfile.css';
import { G1000ControlEvents } from '../../../../Shared/G1000Events';

/**
 * The props on the MFDFPLVNavProfile component.
 */
interface MFDFPLVNavProfileProps extends UiControl2Props {
  /** The event bus to use. */
  bus: EventBus;

  /** An instance of the flight planner. */
  flightPlanner: FlightPlanner;
}

/**
 * A component that displays the active VNAV profile on the MFD flight plan page.
 */
export class MFDFPLVNavProfile extends UiControl2<MFDFPLVNavProfileProps> {
  private readonly waypointSubject = ComputedSubject.create<string | undefined, string>(undefined, this.renderWaypoint.bind(this));
  private readonly todBodLabel = Subject.create('TOD');
  private readonly fpaSubject = Subject.create<number>(0);

  private readonly targetAltSub = NumberUnitSubject.createFromNumberUnit(UnitType.FOOT.createNumber(0));
  private readonly todTimeSub = NumberUnitSubject.createFromNumberUnit(UnitType.SECOND.createNumber(0));
  private readonly vsTargetSub = NumberUnitSubject.createFromNumberUnit(UnitType.FPM.createNumber(0));
  private readonly vsRequiredSub = NumberUnitSubject.createFromNumberUnit(UnitType.FPM.createNumber(0));
  private readonly vdevSub = NumberUnitSubject.createFromNumberUnit(UnitType.FOOT.createNumber(0));

  private currentGroundSpeed = 30;
  private currentAltitude = 0;
  private todDistance = -1;
  private bodDistance = -1;
  private requiredVs = 0;
  private targetAltitude = 0;
  private deviation = 0;
  private constraint: LegDefinition | undefined;
  private showPathDetails = false;
  private vnavMode = VNavMode.Enabled;

  /** @inheritdoc */
  public onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    const vnav = this.props.bus.getSubscriber<VNavSimVarEvents>();
    this.props.bus.getSubscriber<GNSSEvents>().on('ground_speed').withPrecision(1).handle(gs => this.currentGroundSpeed = gs);
    this.props.bus.getSubscriber<ADCEvents>().on('alt').withPrecision(0).handle(alt => this.currentAltitude = alt);

    vnav.on('vnavFpa').whenChanged().handle(fpa => {
      fpa = Math.round(fpa * 10) / 10;
      this.fpaSubject.set(fpa);
    });

    vnav.on('vnavConstraintLegIndex').whenChanged().handle(legIndex => {
      let leg: LegDefinition | undefined;
      try {
        leg = this.props.flightPlanner.getFlightPlan(0).getLeg(legIndex);
      } catch { /* Continue */ }
      if (leg !== undefined) {
        this.constraint = leg;
      } else {
        this.constraint = undefined;
      }
    });

    vnav.on('vnavNextConstraintAltitude').whenChangedBy(1).handle(alt => {
      this.targetAltitude = alt;
    });

    vnav.on('vnavRequiredVs').whenChangedBy(1).handle(reqVs => {
      this.requiredVs = reqVs;
    });

    vnav.on('vnavTodDistance').whenChangedBy(1).handle(distance => {
      this.todDistance = distance;
    });

    vnav.on('vnavBodDistance').whenChangedBy(1).handle(distance => {
      this.bodDistance = distance;
    });

    vnav.on('vnavVDev').whenChangedBy(1).handle(deviation => {
      this.deviation = deviation;
    });

    vnav.on('vnavMode').whenChanged().handle(state => {
      this.vnavMode = state;
      this.update();
    });

    this.props.bus.getSubscriber<ClockEvents>().on('realTime').whenChangedBy(1000).handle(this.update.bind(this));
    this.props.bus.getSubscriber<G1000ControlEvents>().on('vnv_prof_key').handle(() => this.focus(FocusPosition.First));
  }

  /**
   * Updates the display every second.
   */
  private update(): void {
    if (this.vnavMode === VNavMode.Enabled) {
      if (!this.showPathDetails || Math.abs(this.deviation) > 10000) {
        this.vdevSub.set(NaN);
      } else {
        this.vdevSub.set(-this.deviation);
      }
      this.setTodBod();
      this.setVsRequired(this.requiredVs);
      this.targetAltSub.set(this.targetAltitude > 0 ? this.targetAltitude : NaN);

      if (this.constraint !== undefined) {
        this.waypointSubject.set(this.constraint.name);
      } else {
        this.waypointSubject.set(undefined);
      }

      this.setVsTarget(this.fpaSubject.get());
    } else {
      this.vdevSub.set(NaN);
      this.setTodBod();
      this.setVsRequired(0);
      this.targetAltSub.set(NaN);
      this.waypointSubject.set(undefined);
      this.fpaSubject.set(0);
      this.setVsTarget(undefined);
    }

  }

  /**
   * Sets whether to display the path details in the window or blank them.
   */
  private setShowPathDetails(): void {
    const constraintAlt = this.targetAltSub.get().asUnit(UnitType.FOOT);
    let showPathDetails = false;
    if (this.vnavMode === VNavMode.Enabled && !isNaN(constraintAlt) && this.currentAltitude > constraintAlt - 100 && this.currentGroundSpeed > 30) {
      if ((this.todDistance > 0 && this.todDistance < 999999 && UnitType.METER.convertTo(this.todDistance, UnitType.NMILE) / (this.currentGroundSpeed / 60) <= 1)
        || (this.bodDistance > 0 && this.todDistance <= 0)) {
        showPathDetails = true;
      }
    }
    this.showPathDetails = showPathDetails;
  }

  /**
   * Sets the TodBod fields.
   */
  private setTodBod(): void {
    let distance = NaN;
    let label = 'TOD';
    this.setShowPathDetails();

    if (this.showPathDetails && this.vnavMode === VNavMode.Enabled) {
      if (this.todDistance > 100) {
        label = 'TOD';
        distance = this.todDistance;
      } else {
        label = 'BOD';
        distance = this.bodDistance;
      }
    } else if (this.vnavMode === VNavMode.Enabled && this.todDistance < 999999 && this.todDistance > 0) {
      label = 'TOD';
      distance = this.todDistance;
    }
    this.todBodLabel.set(label);
    this.todTimeSub.set(isNaN(distance) ? distance : UnitType.METER.convertTo(distance, UnitType.NMILE) / this.currentGroundSpeed, UnitType.HOUR);
  }

  /**
   * Renders the waypoint field.
   * @param name The ICAO to render.
   * @returns The rendered field.
   */
  private renderWaypoint(name: string | undefined): string {
    if (name !== undefined && this.vnavMode === VNavMode.Enabled) {
      return name;
    } else {
      return '_ _ _ _ _ _ _ _ _ _ _ _';
    }
  }

  /**
   * Sets the current vertical speed target.
   * @param fpa The current flight path angle.
   */
  private setVsTarget(fpa: number | undefined): void {
    if (fpa === undefined || (this.todDistance <= 0 && this.bodDistance <= 0) || this.currentGroundSpeed < 30) {
      this.vsTargetSub.set(NaN);
    } else {
      this.vsTargetSub.set(this.currentGroundSpeed * Math.tan(UnitType.DEGREE.convertTo(-fpa, UnitType.RADIAN)), UnitType.KNOT);
    }
  }

  /**
   * Sets the current required vertical speed.
   * @param vs is the vs required value in fpm.
   */
  private setVsRequired(vs: number): void {
    if (vs < 0 && this.showPathDetails) {
      this.vsRequiredSub.set(vs, UnitType.FPM);
    } else {
      this.vsRequiredSub.set(NaN);
    }
  }

  /**
   * Sets a vnav segment FPA manually.
   * @param fpa The FPA Value to set.
   */
  private setFpa = (fpa: number): void => {
    const publisher = this.props.bus.getPublisher<G1000ControlEvents>();
    fpa = Math.round(fpa * 10) / 10;
    publisher.pub('vnav_fpa_set', fpa);
  }

  /**
   * Renders the component.
   * @returns The rendered VNode.
   */
  public render(): VNode {
    return (
      <div>
        <div class="mfd-fpl-vnav row-1">
          <div class='mfd-fpl-vnav-wpt'>
            <label>WPT</label><span>{this.waypointSubject}</span>
          </div>
          <NumberUnitDisplay
            value={this.targetAltSub} displayUnit={Subject.create(UnitType.FOOT)}
            formatter={NumberFormatter.create({ precision: 1, nanString: '_ _ _ _ _' })}
            class='mfd-fpl-vnav-tgtalt'
          />
          <div class='mfd-fpl-vnav-tod'>
            <label>{this.todBodLabel}</label>
            <DurationDisplay
              value={this.todTimeSub}
              options={{ format: DurationDisplayFormat.hh_mm_or_mm_ss, delim: DurationDisplayDelim.ColonOrCross, nanString: '_ _ : _ _' }}
              class='mfd-fpl-vnav-value'
            />
          </div>
        </div>
        <div class="mfd-fpl-vnav row-2">
          <div class='mfd-fpl-vnav-tgtvs'>
            <label>VS TGT</label>
            <NumberUnitDisplay
              value={this.vsTargetSub} displayUnit={Subject.create(UnitType.FPM)}
              formatter={NumberFormatter.create({ precision: 1, nanString: '_ _ _ _ _' })}
              class='mfd-fpl-vnav-value supplied-value'
            />
          </div>
          <div class='mfd-fpl-vnav-fpa'>
            <label>FPA</label>
            <FpaSelector fpa={this.fpaSubject} onChanged={this.setFpa} />
          </div>
        </div>
        <div class="mfd-fpl-vnav row-3">
          <div class='mfd-fpl-vnav-vsreq'>
            <label>VS REQ</label>
            <NumberUnitDisplay
              value={this.vsRequiredSub} displayUnit={Subject.create(UnitType.FPM)}
              formatter={NumberFormatter.create({ precision: 1, nanString: '_ _ _ _ _' })}
              class='mfd-fpl-vnav-value'
            />
          </div>
          <div class='mfd-fpl-vnav-vdev'>
            <label>V DEV</label>
            <NumberUnitDisplay
              value={this.vdevSub} displayUnit={Subject.create(UnitType.FOOT)}
              formatter={NumberFormatter.create({ precision: 1, nanString: '_ _ _ _ _' })}
              class='mfd-fpl-vnav-value'
            />
          </div>
        </div>
      </div>
    );
  }
}

/**
 * Props on the FpaSelector component.
 */
interface FpaSelectorProps extends UiControl2Props {
  /** The current FPA. */
  fpa: Subscribable<number>

  /** A callback called when the FPA is changed by the user. */
  onChanged: (fpa: number) => void;
}

/**
 * A component that allows a user to change the FPA.
 */
class FpaSelector extends UiControl2<FpaSelectorProps> {

  private readonly el = FSComponent.createRef<HTMLElement>();
  private readonly value = Subject.create<number>(0);

  /** @inheritdoc */
  public onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    this.props.fpa.sub(fpa => {
      if (!this.isFocused) {
        this.value.set(fpa);
      }
    }, true);
  }

  /** @inheritdoc */
  protected onFocused(): void {
    this.el.instance.classList.add(UiControl.FOCUS_CLASS);
  }

  /** @inheritdoc */
  protected onBlurred(): void {
    this.el.instance.classList.remove(UiControl.FOCUS_CLASS);
    this.value.set(this.props.fpa.get());
  }

  /** @inheritdoc */
  protected onUpperKnobInc(): boolean {
    return this.setValue(this.value.get() - 0.1);
  }

  /** @inheritdoc */
  protected onUpperKnobDec(): boolean {
    return this.setValue(this.value.get() + 0.1);
  }

  /**
   * Sets a new edited FPA value.
   * @param value The value to set.
   * @returns True as the event is handled.
   */
  protected setValue(value: number): boolean {
    const newValue = MathUtils.clamp(value, 0, 6);
    this.value.set(newValue);
    this.props.onChanged(newValue);

    return true;
  }

  /** @inheritdoc */
  public render(): VNode {
    return (
      <span class='supplied-value' ref={this.el}>
        {this.value.map(fpa => fpa !== 0 ? `-${fpa.toFixed(1)}°` : '_ _ _ _°')}
      </span>
    );
  }
}