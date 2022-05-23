
import { GeoPoint, Subject, ObjectSubject, UnitType, MathUtils } from 'msfssdk';
import {
  VNavState, VNavPathMode, GlidePathCalculator, TodBodDetails, VNavVars,
  VNavPathCalculator, APValues, LNavEvents, VNavDataEvents, VNavControlEvents, APVerticalModes,
  APLateralModes, VNavEvents, VNavUtils, VerticalFlightPlan, VerticalFlightPhase,
  VNavAltCaptureType, VNavAvailability, VNavManager
} from 'msfssdk/autopilot';
import { ConsumerSubject, EventBus, SimVarValueType } from 'msfssdk/data';
import { FlightPlanner, FlightPlan, LegDefinition } from 'msfssdk/flightplan';
import { APEvents, ADCEvents, GNSSEvents, NavEvents, NavSourceId, NavSourceType } from 'msfssdk/instruments';

/**
 * A Garmin VNAV Manager.
 */
export class GarminVNavManager implements VNavManager {

  public state = VNavState.Disabled;

  private pathMode = VNavPathMode.None;

  private gpAvailable = false;

  private readonly planePos = new GeoPoint(0, 0);
  private currentAltitude = 0;
  private currentGpsAltitude = 0;
  private preselectedAltitude = 0;
  private currentGroundSpeed = 0;
  private currentVS = 0;

  private isVNavUnavailable = false;

  private cdiSource: NavSourceId = { type: NavSourceType.Nav, index: 0 };

  /** A callback called when the manager is enabled. */
  public onEnable?: () => void;

  /** A callback called when the manager is disabled. */
  public onDisable?: () => void;

  public onActivate?: () => void;

  public onDeactivate?: () => void;

  /** A callback called by the autopilot to arm the supplied vertical mode. */
  public armMode?: (mode: APVerticalModes) => void;

  /** A callback called by the autopilot to activate the supplied vertical mode. */
  public activateMode?: (mode: APVerticalModes) => void;

  public capturedAltitude = 0;

  private isAltCaptured = false;
  private awaitingAltCap = -1;
  private awaitingRearm = -1;

  /** The leg distance from the current leg to the constraint leg, not including the distance from ppos to the current leg target. */
  private constraintDistance = -1;

  private readonly vnavNextConstraintAltitude = Subject.create<number | undefined>(undefined);

  public readonly lpvDeviation = Subject.create(0);
  public readonly glidepathCalculator = new GlidePathCalculator(this.bus, this.flightPlanner, this.primaryPlanIndex);

  private readonly todBodDetails: TodBodDetails = {
    todLegIndex: -1,
    bodLegIndex: -1,
    todLegDistance: 0,
    distanceFromTod: 0,
    distanceFromBod: 0,
    currentConstraintLegIndex: -1
  };
  private readonly todBodDetailsSub = ObjectSubject.create<TodBodDetails>(Object.assign({}, this.todBodDetails));

  private readonly lnavLegIndex: ConsumerSubject<number>;
  private readonly lnavLegDistanceAlong: ConsumerSubject<number>;

  /**
   * Creates an instance of the Garmin VNAV Manager.
   * @param bus The event bus to use with this instance.
   * @param flightPlanner The flight planner to use with this instance.
   * @param calculator The VNAV path calculator to use with this instance.
   * @param apValues are the autopilot ap values.
   * @param primaryPlanIndex The index of the flightplan to follow vertical guidance from.
   * @param hasNonPathVnav Whether this VNav Director provides non-path climb and descent restriction adherence (false by default).
   * @param guidanceEndsAtFaf Whether this VNav Director terminates vertical guidance at the FAF (true by default).
   */
  constructor(private readonly bus: EventBus, private readonly flightPlanner: FlightPlanner, public readonly calculator: VNavPathCalculator,
    private readonly apValues: APValues, private readonly primaryPlanIndex: number,
    private readonly hasNonPathVnav = false, private readonly guidanceEndsAtFaf = true) {

    const lnav = this.bus.getSubscriber<LNavEvents>();
    this.lnavLegIndex = ConsumerSubject.create(lnav.on('lnav_tracked_leg_index'), 0);
    this.lnavLegDistanceAlong = ConsumerSubject.create(lnav.on('lnav_leg_distance_along'), 0);

    this.bus.getSubscriber<APEvents>().on('ap_altitude_selected').handle(selected => this.preselectedAltitude = selected);
    this.bus.getSubscriber<ADCEvents>().on('alt').whenChangedBy(1).handle(alt => this.currentAltitude = alt);
    this.bus.getSubscriber<ADCEvents>().on('vs').whenChangedBy(1).handle(vs => this.currentVS = vs);

    const gnss = this.bus.getSubscriber<GNSSEvents>();
    gnss.on('gps-position').handle(lla => {
      this.planePos.set(lla.lat, lla.long);
      this.currentGpsAltitude = UnitType.METER.convertTo(lla.alt, UnitType.FOOT);
    });
    gnss.on('ground_speed').handle(gs => this.currentGroundSpeed = gs);

    this.bus.getSubscriber<VNavDataEvents>().on('gp_available').handle(available => this.gpAvailable = available);
    this.bus.getSubscriber<VNavControlEvents>().on('vnav_set_state').handle(d => {
      if (d) {
        this.setState(VNavState.Enabled_Inactive);
      } else {
        this.setState(VNavState.Disabled);
      }
    });

    this.apValues.verticalActive.sub(mode => {
      if (mode === APVerticalModes.ALT && this.awaitingAltCap !== -1) {
        this.awaitingRearm = this.awaitingAltCap;
        this.awaitingAltCap = -1;
      }
      if (this.awaitingRearm > -1 && mode !== APVerticalModes.ALT && mode !== APVerticalModes.CAP) {
        this.awaitingRearm = -1;
        this.awaitingAltCap = -1;
      }
    });

    this.apValues.lateralActive.sub(mode => {
      if (mode === APLateralModes.LOC && this.pathMode === VNavPathMode.PathArmed) {
        this.awaitingAltCap = -1;
        this.awaitingRearm = -1;
        this.tryDeactivate(APVerticalModes.NONE);
      }
    });

    this.vnavNextConstraintAltitude.sub((v) => {
      SimVar.SetSimVarValue(VNavVars.NextConstraintAltitude, SimVarValueType.Feet, v === undefined ? -1 : UnitType.METER.convertTo(v, UnitType.FOOT));
    });

    this.calculator.vnavCalculated.on((sender: VNavPathCalculator, data: number) => {
      if (data === this.primaryPlanIndex) {
        this.bus.getPublisher<VNavEvents>().pub('vnav_path_calculated', data, true, false);
      }
    });

    const nav = this.bus.getSubscriber<NavEvents>();
    nav.on('cdi_select').handle((src) => {
      this.cdiSource = src;
    });

    SimVar.SetSimVarValue(VNavVars.GPVerticalDeviation, SimVarValueType.Feet, Number.MAX_SAFE_INTEGER);
    SimVar.SetSimVarValue(VNavVars.PathMode, SimVarValueType.Number, VNavPathMode.None);

    this.todBodDetailsSub.sub(this.publishTODBODDetails.bind(this), true);

    this.setState(VNavState.Enabled_Active);
  }

  /** @inheritdoc */
  public setState(vnavState: VNavState): void {
    if (vnavState !== this.state) {

      this.state = vnavState;

      switch (this.state) {
        case VNavState.Disabled:
          this.pathMode = VNavPathMode.None;
          this.awaitingAltCap = -1;
          this.awaitingRearm = -1;
          break;
        case VNavState.Enabled_Active:
          this.tryActivate();
          break;
        case VNavState.Enabled_Inactive:
          this.tryDeactivate();
          break;
      }

      SimVar.SetSimVarValue(VNavVars.VNAVState, SimVarValueType.Number, this.state);
    }
  }

  /** @inheritdoc */
  public tryActivate(): void {
    if (this.state !== VNavState.Disabled && this.cdiSource.type === NavSourceType.Gps) {
      this.state = VNavState.Enabled_Active;
      SimVar.SetSimVarValue(VNavVars.VNAVState, SimVarValueType.Number, this.state);
      this.pathMode = VNavPathMode.None;
      this.awaitingAltCap = -1;
      this.awaitingRearm = -1;
    }
  }

  /** @inheritdoc */
  public tryDeactivate(newMode?: APVerticalModes): void {
    if (this.state !== VNavState.Disabled) {

      if (this.state !== VNavState.Enabled_Inactive) {
        this.state = VNavState.Enabled_Inactive;
        SimVar.SetSimVarValue(VNavVars.VNAVState, SimVarValueType.Number, this.state);
        if (this.pathMode !== VNavPathMode.None) {
          this.disarmPath(newMode);
        }
        this.isAltCaptured = false;
        if (this.awaitingAltCap === -1 && this.awaitingRearm === -1) {
          SimVar.SetSimVarValue('L:XMLVAR_VNAVButtonValue', 'Bool', false);
        }
      }
    }
  }

  /** @inheritdoc */
  public canVerticalModeActivate(): boolean {
    // Method not required for Garmin VNav Manager.
    return true;
  }

  /** @inheritdoc */
  public onPathDirectorDeactivated(): void {
    // noop
    // if (this.pathMode === VNavPathMode.PathActive) {
    //   this.armPath();
    // }
  }

  /**
   * Method to call when VNAV Encounters a failed state.
   */
  private failed(): void {
    if (this.pathMode === VNavPathMode.PathActive && !this.isAltCaptured) {
      this.apValues.capturedAltitude.set(this.currentAltitude);
    }
    this.tryDeactivate(APVerticalModes.CAP);
  }

  /**
   * Method called to delegate altitude capture to the Alt Cap Director.
   * @param newPathMode The new path mode to set on delegating.
   */
  private onDelegateAltCap(newPathMode: VNavPathMode): void {


    switch (newPathMode) {
      case VNavPathMode.PathArmed:
        this.armPath();
        break;
      default:

    }
    this.activateMode && this.activateMode(APVerticalModes.CAP);
  }

  /** Method called to arm Path Mode. */
  private armPath(): void {
    if (this.pathMode !== VNavPathMode.PathArmed) {
      this.pathMode = VNavPathMode.PathArmed;
      SimVar.SetSimVarValue(VNavVars.PathMode, SimVarValueType.Number, this.pathMode);
    }
    if (this.pathMode === VNavPathMode.PathArmed) {
      this.isAltCaptured = false;
      this.armMode && this.armMode(APVerticalModes.PATH);
    }
    this.awaitingRearm = -1;
  }

  /** Method called to activate Path Mode. */
  private activatePath(): void {
    if (this.pathMode !== VNavPathMode.PathActive) {
      this.pathMode = VNavPathMode.PathActive;
      SimVar.SetSimVarValue(VNavVars.PathMode, SimVarValueType.Number, this.pathMode);
    }
    if (this.pathMode === VNavPathMode.PathActive) {
      this.activateMode && this.activateMode(APVerticalModes.PATH);
    }
  }

  /**
   * Method to call when VNAV needs to disarm the path, without deactivating VNAV entirely.
   * @param newMode is the vertical mode to set the Autopilot to if Path is currently active.
   */
  private disarmPath(newMode = APVerticalModes.PITCH): void {
    if (this.pathMode !== VNavPathMode.None) {

      if (this.pathMode === VNavPathMode.PathActive && newMode !== APVerticalModes.NONE) {
        this.activateMode && this.activateMode(newMode);
      }

      if (this.pathMode === VNavPathMode.PathArmed) {
        this.armMode && this.armMode(APVerticalModes.NONE);
      }

      this.pathMode = VNavPathMode.None;
      this.isAltCaptured = false;
      SimVar.SetSimVarValue(VNavVars.PathMode, SimVarValueType.Number, this.pathMode);
    }
  }

  /**
   * Updates the VNAV director.
   */
  public update(): void {
    let alongLegDistance = -1;
    let gpManaged = false;
    let needResetTodBodVars = true;

    if (this.flightPlanner.hasFlightPlan(this.primaryPlanIndex)) {
      const lateralPlan = this.flightPlanner.getFlightPlan(this.primaryPlanIndex);
      const verticalPlan = this.calculator.getVerticalFlightPlan(this.primaryPlanIndex);

      let desiredAltFeet = Number.POSITIVE_INFINITY;
      let targetAltitudeFeet: number | undefined;
      let verticalDeviation = Number.MAX_SAFE_INTEGER;
      let requiredVs = 0;

      alongLegDistance = UnitType.NMILE.convertTo(this.lnavLegDistanceAlong.get(), UnitType.METER);
      this.calculator.setCurrentAlongLegDistance(this.primaryPlanIndex, alongLegDistance);

      const currentLegIndex = this.lnavLegIndex.get();
      const nextLegIndex = currentLegIndex + 1;
      const nextLeg = nextLegIndex >= 0 && nextLegIndex < lateralPlan.length ? lateralPlan.getLeg(nextLegIndex) : undefined;

      if (nextLeg && lateralPlan.activeLateralLeg < lateralPlan.length && verticalPlan.constraints.length > 0) {

        const currentAltitudeMetric = UnitType.FOOT.convertTo(this.currentAltitude, UnitType.METER);
        const currentVSMetric = UnitType.FPM.convertTo(this.currentVS, UnitType.MPM);

        const todBodDetails = VNavUtils.getTodBodDetails(verticalPlan, lateralPlan.activeLateralLeg, alongLegDistance, currentAltitudeMetric, currentVSMetric, this.todBodDetails);
        this.todBodDetailsSub.set('bodLegIndex', todBodDetails.bodLegIndex);
        this.todBodDetailsSub.set('todLegIndex', todBodDetails.todLegIndex);
        this.todBodDetailsSub.set('todLegDistance', todBodDetails.todLegDistance);
        this.todBodDetailsSub.set('distanceFromBod', todBodDetails.distanceFromBod);
        this.todBodDetailsSub.set('distanceFromTod', todBodDetails.distanceFromTod);
        this.todBodDetailsSub.set('currentConstraintLegIndex', todBodDetails.currentConstraintLegIndex);
        needResetTodBodVars = false;

        this.vnavNextConstraintAltitude.set(this.calculator.getNextConstraintAltitude(this.primaryPlanIndex, lateralPlan.activeLateralLeg));

        const constraintAltitude = this.calculator.getCurrentConstraintAltitude(this.primaryPlanIndex, lateralPlan.activeLateralLeg);

        if (this.vnavNextConstraintAltitude.get() !== constraintAltitude) {
          this.setVNavUnavailable(true);
        } else {
          this.setVNavUnavailable(false);
        }

        const simvarAltitudeSet = constraintAltitude !== undefined ? UnitType.METER.convertTo(constraintAltitude, UnitType.FOOT) : -1;
        SimVar.SetSimVarValue(VNavVars.CurrentConstraintAltitude, SimVarValueType.Feet, simvarAltitudeSet);

        const desiredAltitude = VNavUtils.getDesiredAltitude(verticalPlan, lateralPlan.activeLateralLeg, alongLegDistance);
        desiredAltFeet = UnitType.METER.convertTo(desiredAltitude, UnitType.FOOT);

        this.setConstraintDistance(lateralPlan, todBodDetails.currentConstraintLegIndex);

        const currentLeg = currentLegIndex >= 0 && currentLegIndex < lateralPlan.length ? lateralPlan.getLeg(currentLegIndex) : undefined;

        if (currentLeg?.calculated?.distanceWithTransitions && constraintAltitude !== undefined) {
          const distance = this.constraintDistance +
            UnitType.METER.convertTo(currentLeg.calculated.distanceWithTransitions - alongLegDistance, UnitType.NMILE);
          requiredVs = this.getRequiredVs(distance, constraintAltitude);
        }

      } else {
        this.failed();
      }


      if (lateralPlan.length > 0) {
        const finalLeg = lateralPlan.getLeg(lateralPlan.length - 1);

        const lpvDistance = this.manageGP(finalLeg, lateralPlan, alongLegDistance);
        gpManaged = true;

        verticalDeviation = desiredAltFeet - this.currentAltitude;
        SimVar.SetSimVarValue(VNavVars.VerticalDeviation, SimVarValueType.Feet, verticalDeviation);

        const targetAltitude = this.calculator.getTargetAltitude(this.primaryPlanIndex, lateralPlan.activeLateralLeg);

        if (targetAltitude !== undefined) {
          targetAltitudeFeet = UnitType.METER.convertTo(targetAltitude, UnitType.FOOT);
          SimVar.SetSimVarValue(VNavVars.TargetAltitude, SimVarValueType.Feet, targetAltitudeFeet);
        } else {
          SimVar.SetSimVarValue(VNavVars.TargetAltitude, SimVarValueType.Feet, -1);
        }

        const fafLegIndex = verticalPlan.fafLegIndex;

        if (this.apValues.verticalActive.get() === APVerticalModes.GP ||
          (fafLegIndex !== undefined && this.apValues.approachHasGP.get() && this.state !== VNavState.Enabled_Active && lateralPlan.activeLateralLeg >= fafLegIndex)) {
          requiredVs = this.getRequiredVs(UnitType.METER.convertTo(lpvDistance, UnitType.NMILE), this.glidepathCalculator.getRunwayAltitude(), this.currentGpsAltitude);
        }
        SimVar.SetSimVarValue(VNavVars.RequiredVS, SimVarValueType.FPM, requiredVs);

        if (lateralPlan.activeLateralLeg === this.awaitingRearm && this.pathMode !== VNavPathMode.None) {
          this.armPath();
        }

        if (this.state === VNavState.Enabled_Active && this.awaitingAltCap === -1 && this.awaitingRearm === -1) {
          const flightPhase = this.calculator.getFlightPhase(this.primaryPlanIndex);
          this.manageAltHold(targetAltitudeFeet, flightPhase);
          this.trackVerticalPath(verticalPlan, lateralPlan, targetAltitudeFeet, verticalDeviation, flightPhase);
        } else if (lateralPlan.activeLateralLeg < lateralPlan.length && verticalPlan.constraints.length > 0) {
          const fpa = VNavUtils.getVerticalLegFromPlan(verticalPlan, lateralPlan.activeLateralLeg).fpa;
          SimVar.SetSimVarValue(VNavVars.FPA, SimVarValueType.Degree, fpa);
        } else {
          SimVar.SetSimVarValue(VNavVars.FPA, SimVarValueType.Degree, 0);
        }

      } else {
        // TODO: remove this once we have a better way to get LPV state - does an LPV exist or not
        SimVar.SetSimVarValue(VNavVars.GPDistance, SimVarValueType.Meters, Number.MAX_SAFE_INTEGER);
        this.lpvDeviation.set(-1001);
      }
    } else {
      this.calculator.setCurrentAlongLegDistance(this.primaryPlanIndex, alongLegDistance);
      this.failed();
    }

    if (!gpManaged) {
      this.manageGP(undefined, undefined, alongLegDistance);
    }

    if (needResetTodBodVars) {
      this.todBodDetailsSub.set('bodLegIndex', -1);
      this.todBodDetailsSub.set('todLegIndex', -1);
      this.todBodDetailsSub.set('todLegDistance', 0);
      this.todBodDetailsSub.set('distanceFromBod', 0);
      this.todBodDetailsSub.set('distanceFromTod', 0);
      this.todBodDetailsSub.set('currentConstraintLegIndex', -1);
    }
  }

  /**
   * Tracks the vertical path.
   * @param verticalPlan The Vertical Flight Plan.
   * @param lateralPlan The Lateral Flight Plan.
   * @param targetAltitude The current VNAV target altitude, if any.
   * @param verticalDeviation The current vertical deviation.
   * @param flightPhase The current flight phase
   */
  private trackVerticalPath(verticalPlan: VerticalFlightPlan,
    lateralPlan: FlightPlan,
    targetAltitude: number | undefined,
    verticalDeviation: number,
    flightPhase = VerticalFlightPhase.Descent): void {

    if (targetAltitude === undefined) {
      targetAltitude = Number.NEGATIVE_INFINITY;
    }

    if (lateralPlan.activeLateralLeg >= lateralPlan.length) {
      this.isAltCaptured = false;
      this.failed();
      return;
    }

    if (this.isVNavUnavailable && (this.pathMode !== VNavPathMode.None || this.state === VNavState.Enabled_Active)) {
      this.tryDeactivate();
      return;
    }

    const targetIsSelectedAltitude = this.preselectedAltitude > targetAltitude;
    targetAltitude = Math.max(targetAltitude, this.preselectedAltitude);
    const deviationFromTarget = targetAltitude - this.currentAltitude;

    const fpa = VNavUtils.getVerticalLegFromPlan(verticalPlan, lateralPlan.activeLateralLeg).fpa;

    SimVar.SetSimVarValue(VNavVars.FPA, SimVarValueType.Degree, fpa);

    if (this.pathMode === VNavPathMode.None && flightPhase === VerticalFlightPhase.Descent) {
      if (this.preselectedAltitude + 75 < this.currentAltitude) {
        this.armPath();
      } else if (!this.hasNonPathVnav) {
        this.tryDeactivate();
      }
    }

    if (!this.isAltCaptured && this.pathMode === VNavPathMode.PathActive && fpa === 0) {
      this.apValues.capturedAltitude.set(100 * Math.round(targetAltitude / 100));
      // this.armPath();
      // this.onDelegateAltCap();
      const fafAltitude = VNavUtils.getFafAltitude(verticalPlan);
      if (this.guidanceEndsAtFaf && fafAltitude !== undefined && UnitType.METER.convertTo(fafAltitude, UnitType.FOOT) === targetAltitude) {
        this.onDelegateAltCap(VNavPathMode.None);
        this.tryDeactivate();
      } else {
        this.onDelegateAltCap(VNavPathMode.PathArmed);
      }
    }

    const destLegIndex = verticalPlan.destLegIndex;
    const fafLegIndex = verticalPlan.fafLegIndex;

    if ((destLegIndex !== undefined && lateralPlan.activeLateralLeg > destLegIndex) || fafLegIndex !== undefined && lateralPlan.activeLateralLeg > fafLegIndex) {
      this.tryDeactivate();
      return;
    }

    if (this.pathMode === VNavPathMode.PathArmed || this.pathMode == VNavPathMode.PathActive) {

      if (verticalDeviation <= 100 && verticalDeviation >= -50 && this.pathMode === VNavPathMode.PathArmed) {
        if (Math.abs(deviationFromTarget) > 75 && (!this.isAltCaptured && fpa !== 0)) {
          this.activatePath();
        }
      }

      if (!this.isAltCaptured && Math.abs(deviationFromTarget) <= 250 && this.pathMode == VNavPathMode.PathActive) {
        this.capturedAltitude = targetAltitude;
        this.apValues.capturedAltitude.set(Math.round(this.capturedAltitude));
        this.isAltCaptured = true;
      }

      if (this.isAltCaptured && this.pathMode === VNavPathMode.PathActive) {
        const altCapDeviation = Math.abs(this.capturedAltitude - this.currentAltitude);
        const captureActivationValue = Math.tan(UnitType.DEGREE.convertTo(fpa, UnitType.RADIAN)) * UnitType.NMILE.convertTo(this.currentGroundSpeed / 360, UnitType.FOOT);

        if (altCapDeviation < Math.abs(captureActivationValue)) {
          if (!targetIsSelectedAltitude && !VNavUtils.getIsPathEnd(verticalPlan, lateralPlan.activeLateralLeg)) {
            this.awaitingAltCap = lateralPlan.activeLateralLeg + 1;
          }
          this.onDelegateAltCap(VNavPathMode.None);
          return;
        }
      }

      if (this.pathMode === VNavPathMode.PathActive) {
        // noop
      } else if (this.hasNonPathVnav) {

        const constraint = VNavUtils.getConstraintFromLegIndex(verticalPlan, lateralPlan.activeLateralLeg);

        if (constraint && !this.isAltCaptured) {
          const constraintAltitudeFeet = UnitType.METER.convertTo(flightPhase === VerticalFlightPhase.Descent ? constraint.minAltitude : constraint.maxAltitude, UnitType.FOOT);
          const nonPathTargetAlt = flightPhase === VerticalFlightPhase.Descent ? Math.max(constraintAltitudeFeet, this.apValues.selectedAltitude.get())
            : Math.min(constraintAltitudeFeet, this.apValues.selectedAltitude.get());
          const nonPathDeviation = nonPathTargetAlt - this.currentAltitude;

          if (Math.abs(nonPathDeviation) <= 250) {
            this.capturedAltitude = Math.round(nonPathTargetAlt);
            this.apValues.capturedAltitude.set(this.capturedAltitude);
            this.isAltCaptured = true;
            this.onDelegateAltCap(VNavPathMode.PathArmed);
          }
        }
      }
    }
  }

  /**
   * Manages Altitude Hold Target.
   * @param targetAltitude The current VNAV target altitude, if any.
   * @param flightPhase The current vertical flight phase (defaults to descent).
   */
  private manageAltHold(targetAltitude: number | undefined, flightPhase = VerticalFlightPhase.Descent): void {
    if (targetAltitude !== undefined) {
      const targetAltFeet = targetAltitude;

      if (flightPhase === VerticalFlightPhase.Descent) {
        if (this.preselectedAltitude >= targetAltFeet) {
          SimVar.SetSimVarValue(VNavVars.CaptureType, SimVarValueType.Number, VNavAltCaptureType.Selected);
        } else {
          SimVar.SetSimVarValue(VNavVars.CaptureType, SimVarValueType.Number, VNavAltCaptureType.VNAV);
        }
      } else {
        if (this.preselectedAltitude <= targetAltFeet) {
          SimVar.SetSimVarValue(VNavVars.CaptureType, SimVarValueType.Number, VNavAltCaptureType.Selected);
        } else {
          SimVar.SetSimVarValue(VNavVars.CaptureType, SimVarValueType.Number, VNavAltCaptureType.VNAV);
        }
      }

    } else {
      SimVar.SetSimVarValue(VNavVars.TargetAltitude, SimVarValueType.Feet, -1);
      SimVar.SetSimVarValue(VNavVars.CaptureType, SimVarValueType.Number, VNavAltCaptureType.None);
    }
  }

  /**
   * Manages the GP State and sets required data for GP guidance.
   * @param finalLeg The LegDefinition for the last flight lateralPlan leg.
   * @param lateralPlan The FlightPlan.
   * @param alongLegDistance The Along Leg Distance
   * @returns The LPV Distance
   */
  private manageGP(finalLeg: LegDefinition | undefined, lateralPlan: FlightPlan | undefined, alongLegDistance: number): number {
    let lpvDeviation = -1001;
    let lpvDistance = -1;
    let gpCalculated = false;

    if (lateralPlan && this.gpAvailable && finalLeg?.calculated !== undefined) {
      lpvDistance = this.glidepathCalculator.getGlidepathDistance(lateralPlan.activeLateralLeg, alongLegDistance);
      const desiredLPVAltitude = this.glidepathCalculator.getDesiredGlidepathAltitude(lpvDistance);
      const desiredLPVAltitudeFeet = UnitType.METER.convertTo(desiredLPVAltitude, UnitType.FOOT);

      lpvDeviation = MathUtils.clamp(desiredLPVAltitudeFeet - this.currentGpsAltitude, -1000, 1000);
      gpCalculated = true;
    }

    SimVar.SetSimVarValue(VNavVars.GPVerticalDeviation, SimVarValueType.Feet, lpvDeviation);
    SimVar.SetSimVarValue(VNavVars.GPDistance, SimVarValueType.Meters, lpvDistance);
    SimVar.SetSimVarValue(VNavVars.GPFpa, SimVarValueType.Degree, this.glidepathCalculator.glidepathFpa);
    this.apValues.approachHasGP.set(gpCalculated);
    return lpvDistance;
  }

  /**
   * Gets the current required vertical speed.
   * @param distance is the distance to the constraint.
   * @param targetAltitude is the target altitude for the constraint.
   * @param currentAltitude is the current altitude (defaults to baro alt)
   * @returns the required vs in fpm.
   */
  private getRequiredVs(distance: number, targetAltitude: number, currentAltitude = this.currentAltitude): number {
    if (targetAltitude > 0) {
      return VNavUtils.getRequiredVs(distance, targetAltitude, currentAltitude, this.currentGroundSpeed);
    }
    return 0;
  }

  /**
   * Sets the leg distance from the current leg to the constraint leg, not include the distance to the current active leg.
   * @param lateralPlan is the flight lateralPlan.
   * @param constraintLegIndex is the leg index of the current constraint.
   */
  private setConstraintDistance(lateralPlan: FlightPlan, constraintLegIndex: number | undefined): void {
    if (constraintLegIndex !== undefined && constraintLegIndex > -1) {
      const currentLeg = lateralPlan.getLeg(lateralPlan.activeLateralLeg);
      const constraintLeg = lateralPlan.getLeg(constraintLegIndex);
      if (constraintLeg.calculated?.cumulativeDistanceWithTransitions && currentLeg.calculated?.cumulativeDistanceWithTransitions) {
        const currentLegCumulativeNM = UnitType.METER.convertTo(currentLeg.calculated.cumulativeDistanceWithTransitions, UnitType.NMILE);
        const bodCumulativeNM = UnitType.METER.convertTo(constraintLeg.calculated.cumulativeDistanceWithTransitions, UnitType.NMILE);
        this.constraintDistance = (bodCumulativeNM - currentLegCumulativeNM);
        return;
      }
    }
    this.constraintDistance = -1;
  }

  /**
   * Sets whether VNAV is unavailable due to invalid legs between the plane and the next target.
   * @param isUnavailable Whether or not VNAV is unavailable.
   */
  private setVNavUnavailable(isUnavailable: boolean): void {
    if (this.isVNavUnavailable !== isUnavailable) {
      if (isUnavailable) {
        this.bus.getPublisher<VNavEvents>().pub('vnav_availability', VNavAvailability.InvalidLegs, true, false);
      } else {
        this.bus.getPublisher<VNavEvents>().pub('vnav_availability', VNavAvailability.Available, true, false);
      }

      this.isVNavUnavailable = isUnavailable;
    }
  }

  /**
   * Publishes TOD/BOD details to simvars.
   * @param details The TOD/BOD details object.
   * @param key The key to publish.
   * @param value The value to publish.
   */
  private publishTODBODDetails(details: TodBodDetails, key: keyof TodBodDetails, value: number): void {
    switch (key) {
      case 'bodLegIndex':
        SimVar.SetSimVarValue(VNavVars.BODLegIndex, SimVarValueType.Number, value);
        break;
      case 'todLegIndex':
        SimVar.SetSimVarValue(VNavVars.TODLegIndex, SimVarValueType.Number, value);
        break;
      case 'todLegDistance':
        SimVar.SetSimVarValue(VNavVars.TODDistanceInLeg, SimVarValueType.Meters, value);
        break;
      case 'distanceFromBod':
        SimVar.SetSimVarValue(VNavVars.BODDistance, SimVarValueType.Meters, value);
        break;
      case 'distanceFromTod':
        SimVar.SetSimVarValue(VNavVars.TODDistance, SimVarValueType.Meters, value);
        break;
      case 'currentConstraintLegIndex':
        SimVar.SetSimVarValue(VNavVars.CurrentConstraintLegIndex, SimVarValueType.Number, value);
        break;
    }
  }
}