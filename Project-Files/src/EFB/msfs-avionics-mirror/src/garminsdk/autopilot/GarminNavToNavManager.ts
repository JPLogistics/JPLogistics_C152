import { NavMath, UnitType, GeoPoint } from 'msfssdk';
import { EventBus, ControlEvents, Consumer } from 'msfssdk/data';
import { Localizer, CdiDeviation, Radio, RadioType, NavSourceId, NavSourceType, RadioEvents, FrequencyBank, ADCEvents, NavEvents, GNSSEvents, NavRadioEvents, ClockEvents } from 'msfssdk/instruments';
import { FacilityFrequency, FixTypeFlags } from 'msfssdk/navigation';
import { APValues, NavToNavManager } from 'msfssdk/autopilot';
import { FlightPlanner } from 'msfssdk/flightplan';
import { LNavEvents } from 'msfssdk/autopilot';

/**
 * A Garmin nav-to-nav manager.
 */
export class GarminNavToNavManager implements NavToNavManager {

  public onTransferred = (): void => { };
  private currentHeading = 0;
  private approachFrequency: undefined | FacilityFrequency = undefined;
  private nav1Frequency = 0;
  private nav1Localizer?: Localizer;
  private nav1Cdi?: CdiDeviation;
  private nav2Frequency = 0;
  private nav2Localizer?: Localizer;
  private nav2Cdi?: CdiDeviation;
  private navToNavCdiConsumer?: Consumer<NavSourceId>;
  private activeSource?: NavSourceId;
  private isSourceChanging = false;
  /** Index of nav radio that has a localizer and frequency matches loaded approach. */
  public canArmIndex = 0;
  private navToNavCompleted = false;

  private lnavDataCurrentLegIndex = -1;

  private readonly planePos = new GeoPoint(0, 0);

  /**
   * Creates an instance of the LateralDirector.
   * @param bus The event bus to use with this instance.
   * @param flightPlanner The flight planner.
   * @param apValues are the ap state values.
   */
  constructor(private readonly bus: EventBus, private readonly flightPlanner: FlightPlanner, private readonly apValues: APValues) {
    this.monitorEvents();
  }

  /** @inheritdoc */
  public canLocArm(): boolean {
    return this.canArmIndex > 0;
  }

  /** @inheritdoc */
  public canLocActivate(): boolean {
    if (this.canArmIndex < 1) {
      return false;
    }
    const cdi = this.canArmIndex === 1 ? this.nav1Cdi : this.nav2Cdi;
    const loc = this.canArmIndex === 1 ? this.nav1Localizer : this.nav2Localizer;

    if (cdi && cdi.deviation !== null && Math.abs(cdi.deviation) < 127 && (loc?.course)) {
      const dtk = loc && loc.isValid && loc.course ? loc.course * Avionics.Utils.RAD2DEG : undefined;
      if (dtk === null || dtk === undefined) {
        return false;
      }
      const headingDiff = NavMath.diffAngle(this.currentHeading, dtk);
      if (cdi.deviation > 0 && cdi.deviation < 65 && headingDiff < 0 && headingDiff > -90) {
        return true;
      } else if (cdi.deviation < 0 && cdi.deviation > -65 && headingDiff > 0 && headingDiff < 90) {
        return true;
      } else if (Math.abs(cdi.deviation) < 35 && Math.abs(headingDiff) < 20) {
        return true;
      }
    }
    return false;
  }

  /**
   * Updates the canArmIndex after inputs from the event bus or changes in the approach frequency.
   */
  private updateState(): void {
    if (this.approachFrequency !== undefined && this.apValues.approachIsActive.get()) {
      const apprFreq = Math.round(this.approachFrequency.freqMHz * 100) / 100;
      if (apprFreq > 107) {
        if (apprFreq == this.nav1Frequency && this.nav1Localizer && this.nav1Localizer.isValid) {
          this.canArmIndex = 1;
        } else if (apprFreq == this.nav2Frequency && this.nav2Localizer && this.nav2Localizer.isValid) {
          this.canArmIndex = 2;
        } else {
          this.canArmIndex = 0;
        }
      } else {
        this.canArmIndex = 0;
      }
    } else {
      this.canArmIndex = 0;
    }
  }

  /**
   * Updates the nav 1 and nav 2 frequency from the bus.
   * @param radioState A radiostate event.
   */
  private updateRadioState(radioState: Radio): void {
    if (radioState.radioType === RadioType.Nav) {
      switch (radioState.index) {
        case 1:
          this.nav1Frequency = Math.round(radioState.activeFrequency * 100) / 100;
          break;
        case 2:
          this.nav2Frequency = Math.round(radioState.activeFrequency * 100) / 100;
          break;
      }
      this.updateState();
    }
  }

  /**
   * Tries to auto switch the source if criteria are met.
   */
  private tryAutoSwitchSource(): void {
    const plan = this.flightPlanner.hasActiveFlightPlan() && this.flightPlanner.getActiveFlightPlan();
    const currentLeg = plan && this.lnavDataCurrentLegIndex >= 0 && this.lnavDataCurrentLegIndex < plan.length ? plan.getLeg(this.lnavDataCurrentLegIndex) : undefined;

    if (
      !this.navToNavCompleted
      && !this.isSourceChanging
      && currentLeg?.calculated?.endLat !== undefined
      && currentLeg?.calculated?.endLon !== undefined
    ) {
      const fafIsActive = (currentLeg.leg.fixTypeFlags & FixTypeFlags.FAF) !== 0;
      const fafDistance = UnitType.GA_RADIAN.convertTo(this.planePos.distance(currentLeg.calculated.endLat, currentLeg.calculated.endLon), UnitType.NMILE);

      if (fafIsActive && fafDistance < 15 && this.canArmIndex > 0 && this.canLocActivate() && this.activeSource?.type === NavSourceType.Gps) {
        this.changeSource();
        this.navToNavCdiConsumer = this.bus.getSubscriber<NavEvents>().on('cdi_select');
        this.navToNavCdiConsumer.handle(this.handleNavToNavSourceChanged);
      }
    }
  }

  /**
   * Method to set the HSI/NAV Source to the Can Arm Index.
   */
  public changeSource(): void {
    const controlPublisher = this.bus.getPublisher<ControlEvents>();
    const navSource: NavSourceId = {
      type: NavSourceType.Nav,
      index: this.canArmIndex
    };
    this.isSourceChanging = true;
    controlPublisher.pub('cdi_src_set', navSource, true);
  }

  /**
   * Callback to handle the nav source changed event when received.
   * @param e is the NavSourceId event
   */
  private handleNavToNavSourceChanged = (e: NavSourceId): void => {
    if (e.type === NavSourceType.Nav && e.index === this.canArmIndex) {
      this.onTransferred();
      this.isSourceChanging = false;
      if (this.navToNavCdiConsumer !== undefined) {
        this.navToNavCdiConsumer.off(this.handleNavToNavSourceChanged);
        this.navToNavCdiConsumer = undefined;
        this.navToNavCompleted = true;
        return;
      }
    }
  };

  /**
   * Method to monitor nav events to keep track of NAV related data needed for guidance.
   */
  private monitorEvents(): void {
    const sub = this.bus.getSubscriber<RadioEvents & NavEvents & NavRadioEvents & ADCEvents & GNSSEvents & LNavEvents & ControlEvents & ClockEvents>();

    sub.on('set_radio_state').handle((state) => {
      this.updateRadioState(state);
    });
    sub.on('set_frequency').handle((frequency) => {
      if (frequency.bank == FrequencyBank.Active && frequency.radio.radioType === RadioType.Nav) {
        switch (frequency.radio.index) {
          case 1:
            this.nav1Frequency = Math.round(frequency.frequency * 100) / 100;
            break;
          case 2:
            this.nav2Frequency = Math.round(frequency.frequency * 100) / 100;
        }
        this.updateState();
      }
    });

    sub.on('nav_radio_localizer_1').handle((loc) => {
      this.nav1Localizer = loc;
      this.updateState();
    });
    sub.on('nav_radio_localizer_2').handle((loc) => {
      this.nav2Localizer = loc;
      this.updateState();
    });
    sub.on('nav_radio_cdi_1').handle((cdi) => {
      this.nav1Cdi = cdi;
    });
    sub.on('nav_radio_cdi_2').handle((cdi) => {
      this.nav2Cdi = cdi;
    });
    sub.on('cdi_select').handle((source) => this.activeSource = source);
    sub.on('hdg_deg').withPrecision(0).handle((h) => {
      this.currentHeading = h;
    });

    sub.on('gps-position').handle(lla => { this.planePos.set(lla.lat, lla.long); });

    sub.on('approach_freq_set').handle((v) => {
      this.approachFrequency = v;
      this.navToNavCompleted = false;
      this.updateState();
    });

    sub.on('lnav_tracked_leg_index').handle(index => {
      this.lnavDataCurrentLegIndex = index;
    });

    sub.on('realTime').atFrequency(1).handle(() => {
      if (!this.navToNavCompleted && !this.isSourceChanging && this.canArmIndex > 0) {
        this.tryAutoSwitchSource();
      }
    });

    this.apValues.approachIsActive.sub((v) => {
      this.updateState();
      if (v) {
        this.navToNavCompleted = false;
      }
    });
  }
}