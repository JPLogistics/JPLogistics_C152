import { FSComponent, VNode, ComputedSubject, UnitType, NumberUnitSubject, Subject, Subscribable, MathUtils } from 'msfssdk';
import { NumberFormatter } from 'msfssdk/graphics/text';
import { DurationDisplay, DurationDisplayDelim, DurationDisplayFormat } from 'msfssdk/components/common';
import { ConsumerSubject, EventBus } from 'msfssdk/data';
import { ADCEvents, ClockEvents, GNSSEvents } from 'msfssdk/instruments';
import { LegDefinition, FlightPlanner } from 'msfssdk/flightplan';
import { VNavControlEvents, VNavEvents, VNavState } from 'msfssdk/autopilot';
import { NumberUnitDisplay } from '../../../../Shared/UI/Common/NumberUnitDisplay';
import { G1000UiControl, G1000UiControlProps } from '../../../../Shared/UI/G1000UiControl';
import { UiControl } from '../../../../Shared/UI/UiControl';
import { G1000ControlEvents } from '../../../../Shared/G1000Events';
import { FocusPosition } from 'msfssdk/components/controls';

import './MFDFPLVNavProfile.css';

/**
 * The props on the MFDFPLVNavProfile component.
 */
interface MFDFPLVNavProfileProps extends G1000UiControlProps {
  /** The event bus to use. */
  bus: EventBus;

  /** An instance of the flight planner. */
  flightPlanner: FlightPlanner;
}

/**
 * A component that displays the active VNAV profile on the MFD flight plan page.
 */
export class MFDFPLVNavProfile extends G1000UiControl<MFDFPLVNavProfileProps> {
  private readonly waypointSubject = ComputedSubject.create<string | undefined, string>(undefined, name => {
    if (name === undefined || this.vnavState.get() === VNavState.Disabled) {
      return '_ _ _ _ _ _ _ _ _ _ _ _';
    } else {
      return name;
    }
  });
  private readonly todBodLabel = Subject.create('TOD');
  private readonly fpaSubject = Subject.create<number>(0);

  private readonly targetAltSub = NumberUnitSubject.createFromNumberUnit(UnitType.FOOT.createNumber(0));
  private readonly todTimeSub = NumberUnitSubject.createFromNumberUnit(UnitType.SECOND.createNumber(0));
  private readonly vsTargetSub = NumberUnitSubject.createFromNumberUnit(UnitType.FPM.createNumber(0));
  private readonly vsRequiredSub = NumberUnitSubject.createFromNumberUnit(UnitType.FPM.createNumber(0));
  private readonly vdevSub = NumberUnitSubject.createFromNumberUnit(UnitType.FOOT.createNumber(0));

  private readonly groundSpeed = ConsumerSubject.create(null, 0).pause();
  private readonly altitude = ConsumerSubject.create(null, 0).pause();

  private readonly todDistance = ConsumerSubject.create(null, 0).pause();
  private readonly bodDistance = ConsumerSubject.create(null, 0).pause();
  private readonly requiredVs = ConsumerSubject.create(null, 0).pause();
  private readonly targetAltitude = ConsumerSubject.create(null, 0).pause();
  private readonly verticalDeviation = ConsumerSubject.create(null, 0).pause();
  private readonly fpa = ConsumerSubject.create(null, 0).pause();
  private readonly constraintLegIndex = ConsumerSubject.create(null, -1).pause();
  private readonly vnavState = ConsumerSubject.create(null, VNavState.Disabled).pause();

  private constraint: LegDefinition | undefined;
  private showPathDetails = false;

  private isPaused = true;

  private readonly updateSub = this.props.bus.getSubscriber<ClockEvents>().on('realTime').whenChangedBy(1000).handle(this.update.bind(this), true);

  /** @inheritdoc */
  public onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    const sub = this.props.bus.getSubscriber<GNSSEvents & ADCEvents & VNavEvents & G1000ControlEvents>();

    this.groundSpeed.setConsumer(sub.on('ground_speed').withPrecision(1));
    this.altitude.setConsumer(sub.on('alt').withPrecision(0));

    this.todDistance.setConsumer(sub.on('vnav_tod_distance').withPrecision(0));
    this.bodDistance.setConsumer(sub.on('vnav_bod_distance').withPrecision(0));
    this.requiredVs.setConsumer(sub.on('vnav_required_vs').withPrecision(0));
    this.targetAltitude.setConsumer(sub.on('vnav_next_constraint_altitude').withPrecision(0));
    this.verticalDeviation.setConsumer(sub.on('vnav_vertical_deviation').withPrecision(0));
    this.fpa.setConsumer(sub.on('vnav_fpa').withPrecision(1));
    this.constraintLegIndex.setConsumer(sub.on('vnav_constraint_global_leg_index'));
    this.vnavState.setConsumer(sub.on('vnav_state'));

    this.fpa.sub(fpa => { this.fpaSubject.set(fpa); });

    this.constraintLegIndex.sub(legIndex => {
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

    this.vnavState.sub(this.update.bind(this));

    sub.on('vnv_prof_key').handle(() => this.focus(FocusPosition.First));
  }

  /**
   * Pauses updates for this component. While paused, this component will not update its displayed values.
   */
  public pause(): void {
    if (this.isPaused) {
      return;
    }

    this.updateSub.pause();

    this.groundSpeed.pause();
    this.altitude.pause();

    this.todDistance.pause();
    this.bodDistance.pause();
    this.requiredVs.pause();
    this.targetAltitude.pause();
    this.verticalDeviation.pause();
    this.fpa.pause();
    this.constraintLegIndex.pause();
    this.vnavState.pause();

    this.isPaused = true;
  }

  /**
   * Resumes updates for this component. When resumed, this component will periodically update its displayed values.
   */
  public resume(): void {
    if (!this.isPaused) {
      return;
    }

    this.groundSpeed.resume();
    this.altitude.resume();

    this.todDistance.resume();
    this.bodDistance.resume();
    this.requiredVs.resume();
    this.targetAltitude.resume();
    this.verticalDeviation.resume();
    this.fpa.resume();
    this.constraintLegIndex.resume();
    this.vnavState.resume();

    this.isPaused = false;

    this.updateSub.resume(true);
  }

  /**
   * Updates this component's displayed values.
   */
  private update(): void {
    this.updateShowPathDetails();
    this.updateVerticalDeviation();
    this.updateTodBod();
    this.updateVsTarget();
    this.updateVsRequired();
    this.updateTargetAltitude();
    this.updateTargetWaypoint();
  }

  /**
   * Sets whether to display vertical path details. Vertical path details include vertical deviation, vertical speed
   * target, and vertical speed required.
   */
  private updateShowPathDetails(): void {
    const alt = this.altitude.get();
    const gs = this.groundSpeed.get();
    const todDistance = this.todDistance.get();
    const bodDistance = this.bodDistance.get();
    const constraintAlt = this.targetAltSub.get().asUnit(UnitType.FOOT);

    let showPathDetails = false;
    if (this.vnavState.get() !== VNavState.Disabled && !isNaN(constraintAlt) && alt > constraintAlt - 100 && gs > 30) {
      showPathDetails = (todDistance > 0 && todDistance < 999999 && UnitType.METER.convertTo(todDistance, UnitType.NMILE) / (gs / 60) <= 1)
        || (bodDistance > 0 && todDistance <= 0);
    }
    this.showPathDetails = showPathDetails;
  }

  /**
   * Updates the vertical deviation field.
   */
  private updateVerticalDeviation(): void {
    const vDev = this.verticalDeviation.get();

    if (!this.showPathDetails || Math.abs(vDev) > 10000) {
      this.vdevSub.set(NaN);
    } else {
      this.vdevSub.set(-vDev);
    }
  }

  /**
   * Updates the TOD/BOD fields.
   */
  private updateTodBod(): void {
    const gs = this.groundSpeed.get();
    const todDistance = this.todDistance.get();
    const bodDistance = this.bodDistance.get();

    let label = 'TOD';
    let distance = NaN;

    if (this.vnavState.get() !== VNavState.Disabled) {
      if (this.showPathDetails) {
        if (todDistance > 100) {
          distance = todDistance;
        } else {
          label = 'BOD';
          distance = bodDistance;
        }
      } else if (todDistance > 100 && gs > 30) {
        distance = todDistance;
      }
    }

    this.todBodLabel.set(label);
    this.todTimeSub.set(UnitType.METER.convertTo(distance, UnitType.NMILE) / gs, UnitType.HOUR);
  }

  /**
   * Updates the vertical speed target field.
   */
  private updateVsTarget(): void {
    if (this.showPathDetails) {
      this.vsTargetSub.set(this.groundSpeed.get() * Math.tan(UnitType.DEGREE.convertTo(-this.fpaSubject.get(), UnitType.RADIAN)), UnitType.KNOT);
    } else {
      this.vsTargetSub.set(NaN);
    }
  }

  /**
   * Updates the vertical speed required field.
   */
  private updateVsRequired(): void {
    const vsr = this.requiredVs.get();

    if (vsr < 0 && this.showPathDetails) {
      this.vsRequiredSub.set(vsr, UnitType.FPM);
    } else {
      this.vsRequiredSub.set(NaN);
    }
  }

  /**
   * Updates the target altitude field.
   */
  private updateTargetAltitude(): void {
    if (this.vnavState.get() !== VNavState.Disabled) {
      const alt = this.targetAltitude.get();
      this.targetAltSub.set(alt > 0 ? alt : NaN);
    } else {
      this.targetAltSub.set(NaN);
    }
  }

  /**
   * Updates the target waypoint field.
   */
  private updateTargetWaypoint(): void {
    if (this.vnavState.get() !== VNavState.Disabled && this.constraint !== undefined) {
      this.waypointSubject.set(this.constraint.name);
    } else {
      this.waypointSubject.set(undefined);
    }
  }

  /**
   * Sets a vnav segment FPA manually.
   * @param fpa The FPA Value to set.
   */
  private setFpa = (fpa: number): void => {
    const publisher = this.props.bus.getPublisher<VNavControlEvents>();
    fpa = Math.round(fpa * 10) / 10;
    publisher.pub('vnav_set_current_fpa', fpa);
  };

  /** @inheritdoc */
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
interface FpaSelectorProps extends G1000UiControlProps {
  /** The current FPA. */
  fpa: Subscribable<number>

  /** A callback called when the FPA is changed by the user. */
  onChanged: (fpa: number) => void;
}

/**
 * A component that allows a user to change the FPA.
 */
class FpaSelector extends G1000UiControl<FpaSelectorProps> {

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
  public onUpperKnobInc(): boolean {
    return this.setValue(this.value.get() - 0.1);
  }

  /** @inheritdoc */
  public onUpperKnobDec(): boolean {
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