import { GeoCircle, GeoPoint, LatLonInterface, NavMath, Subject, UnitType } from 'msfssdk';
import { ControlEvents, EventBus, SimVarValueType } from 'msfssdk/data';
import { ADCEvents, APEvents, GNSSEvents } from 'msfssdk/instruments';
import { FlightPlan, FlightPlanner, FlightPathUtils, LegDefinition, FlightPathVector, VerticalData } from 'msfssdk/flightplan';
import { DirectorState, PlaneDirector, APValues, VNavMode, VNavPathMode, VNavAltCaptureType, APLateralModes, APVerticalModes, VNavSimVarEvents, VNavConstraint } from 'msfssdk/autopilot';
import { LNavData, LNavEvents, TransitionMode } from './LNavDirector';
import { VNavPathCalculator } from '../VNavPathCalculator';
import { VNavSimVars } from '../VNavSimVars';
import { ApproachDetails, Fms } from '../../FlightPlan/Fms';
import { G1000ControlEvents } from '../../G1000Events';
import { AdditionalApproachType, AltitudeRestrictionType, RnavTypeFlags } from 'msfssdk/navigation';
import { AlertMessageEvents } from '../../../PFD/Components/UI/Alerts/AlertsSubject';

/**
 * A VNAV path autopilot director.
 */
export class VNavDirector implements PlaneDirector {

  private _mode = VNavMode.Disabled;

  private _pathMode = VNavPathMode.None;

  public state = DirectorState.Inactive;

  private lnavData?: LNavData;

  public approachDetails: ApproachDetails = {
    approachLoaded: false,
    approachType: ApproachType.APPROACH_TYPE_UNKNOWN,
    approachRnavType: RnavTypeFlags.None,
    approachIsActive: false,
    approachIsCircling: false
  };

  private readonly vec3Cache = [new Float64Array(3), new Float64Array(3), new Float64Array(3), new Float64Array(3)];
  private readonly geoCircleCache = [new GeoCircle(new Float64Array(3), 0)];

  private readonly planePos = new GeoPoint(0, 0);
  private currentAltitude = 0;
  private currentGpsAltitude = 0;
  private preselectedAltitude = 0;
  private currentGroundSpeed = 0;

  private isVNavUnavailable = false;

  public onPathActivate?: () => void;

  /** A callback called when the director activates. */
  public onActivate?: () => void;

  /** A callback called when the director arms. */
  public onArm?: () => void;

  /** A callback called when the director deactivates. */
  public onDeactivate?: () => void;

  public capturedAltitude = 0;

  private isAltCaptured = false;
  private awaitingAltCap = -1;
  private awaitingRearm = -1;



  /** The leg distance from the current leg to the constraint leg, not including the distance from ppos to the current leg target. */
  private constraintDistance = -1;

  public readonly lpvDeviation = Subject.create(0);

  /**
   * Setter for pathMode that also sets the simvar
   * @param pathMode is the VNavPathMode to set.
   */
  public set pathMode(pathMode: VNavPathMode) {
    if (pathMode !== this._pathMode) {
      this._pathMode = pathMode;
      SimVar.SetSimVarValue(VNavSimVars.PathMode, SimVarValueType.Number, this._pathMode);
    }
    if (this._pathMode === VNavPathMode.PathArmed) {
      this.state = DirectorState.Armed;
      this.isAltCaptured = false;
      this.onArm && this.onArm();
    }
    if (this._pathMode === VNavPathMode.PathActive) {
      this.state = DirectorState.Active;
      this.onActivate && this.onActivate();
    }
  }

  /**
   * Getter for pathMode that also sets the simvar
   * @returns the current VNavPathMode.
   */
  public get pathMode(): VNavPathMode {
    return this._pathMode;
  }

  /**
   * Setter for mode that also sets the simvar
   * @param mode is the mode to set.
   */
  public set mode(mode: VNavMode) {
    if (this._mode !== mode) {
      this._mode = mode;
      SimVar.SetSimVarValue(VNavSimVars.VNAVMode, SimVarValueType.Number, this._mode);
    }
  }

  /**
   * Getter for Vnav Mode
   * @returns the current Vnav Mode.
   */
  public get mode(): VNavMode {
    return this._mode;
  }

  /**
   * Creates an instance of the VNAV director.
   * @param bus The event bus to use with this instance.
   * @param flightPlanner The flight planner to use with this instance.
   * @param calculator The VNAV path calculator to use with this instance.
   * @param apValues are the autopilot ap values.
   */
  constructor(private readonly bus: EventBus, private readonly flightPlanner: FlightPlanner, public readonly calculator: VNavPathCalculator, private readonly apValues: APValues) {
    this.bus.getSubscriber<LNavEvents>().on('dataChanged').handle(data => this.lnavData = data);
    this.bus.getSubscriber<APEvents>().on('alt_select').handle(selected => this.preselectedAltitude = selected);
    this.bus.getSubscriber<G1000ControlEvents>().on('approach_details_set').handle(d => {
      this.approachDetails = d;
      this.apValues.approachIsActive.set(d.approachLoaded && d.approachIsActive);
    });

    this.bus.getSubscriber<ADCEvents>().on('alt').handle(alt => this.currentAltitude = alt);

    const gnss = this.bus.getSubscriber<GNSSEvents>();
    gnss.on('gps-position').handle(lla => {
      this.planePos.set(lla.lat, lla.long);
      this.currentGpsAltitude = UnitType.METER.convertTo(lla.alt, UnitType.FOOT);
    });
    gnss.on('ground_speed').handle(gs => this.currentGroundSpeed = gs);

    this.bus.getSubscriber<ControlEvents>().on('vnav_enabled').handle(d => {
      if (d) {
        this.enable();
      } else {
        this.disable();
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
        this.deactivate();
      }
    });

    SimVar.SetSimVarValue(VNavSimVars.TODDistance, SimVarValueType.Number, Number.MAX_SAFE_INTEGER);
    SimVar.SetSimVarValue(VNavSimVars.LPVVerticalDeviation, SimVarValueType.Number, Number.MAX_SAFE_INTEGER);
    SimVar.SetSimVarValue(VNavSimVars.PathMode, SimVarValueType.Number, VNavPathMode.None);
  }

  /**
   * Activates the VNAV director's calculations.
   * Does NOT enable any path following.
   */
  public enable(): void {
    this.mode = VNavMode.Enabled;
    this.pathMode = VNavPathMode.None;
    this.state = DirectorState.Inactive;
  }

  /**
   * Deactivates the VNAV director's calculations.
   */
  public disable(): void {
    this.mode = VNavMode.Disabled;
    this.deactivate();
  }

  /**
   * Activates the director.
   * We do not use this method in vnav director.
   * @throws an error if someone calls this method.
   */
  public activate(): void {
    throw new Error('Activate Method in VNAV Director not supported.');
  }

  /**
   * Arms the VNAV Director.
   * This is called by the Autopilot when the VNAV button is pressed to an on state.
   */
  public arm(): void {
    this.awaitingAltCap = -1;
    this.awaitingRearm = -1;
    if (this.mode === VNavMode.Enabled) {
      this.state = DirectorState.Armed;
      this.pathMode = VNavPathMode.None;
    }
  }

  /**
   * Deactivates the VNAV director.
   * This is called by the Autopilot when the VNAV button is pressed to an off state or when GP/GS activates.
   * This is called by the VNAV Director at the end of the path or if there is an invalid path or other error.
   */
  public deactivate(): void {
    if (this.state !== DirectorState.Inactive) {
      this.pathMode = VNavPathMode.None;
      this.state = DirectorState.Inactive;
      this.isAltCaptured = false;
      if (this.awaitingAltCap === -1 && this.awaitingRearm === -1) {
        SimVar.SetSimVarValue('L:XMLVAR_VNAVButtonValue', 'Bool', 0);
      }
    }
  }

  /**
   * Method to call when VNAV Encounters a failed state.
   */
  private failed(): void {
    if (this.state === DirectorState.Active) {
      this.state = DirectorState.Inactive;
      if (!this.isAltCaptured) {
        this.apValues.capturedAltitude.set(this.currentAltitude);
      }
      this.onDeactivate && this.onDeactivate();
    } else {
      this.deactivate();
    }
  }
  /**
   * Method called to delegate altitude capture to the Alt Cap Director.
   */
  private onDelegateAltCap(): void {
    this.onDeactivate && this.onDeactivate();
  }

  /**
   * Updates the VNAV director.
   */
  public update(): void {
    let alongLegDistance = -1;
    if (this.lnavData !== undefined && this.flightPlanner.hasFlightPlan(Fms.PRIMARY_PLAN_INDEX)) {
      const plan = this.flightPlanner.getFlightPlan(Fms.PRIMARY_PLAN_INDEX);

      let desiredAltFeet = Number.POSITIVE_INFINITY;
      let targetAltitudeFeet: number | undefined;
      let verticalDeviation = Number.MAX_SAFE_INTEGER;
      let requiredVs = 0;

      alongLegDistance = this.getAlongLegDistance(this.lnavData);

      const nextLeg = this.lnavData.nextLegIndex >= 0 && this.lnavData.nextLegIndex < plan.length ? plan.getLeg(this.lnavData.nextLegIndex) : undefined;

      if (nextLeg && plan.activeLateralLeg < plan.length) {

        const todBodDetails = this.calculator.todBodDetails(plan.activeLateralLeg, alongLegDistance);
        SimVar.SetSimVarValue(VNavSimVars.TODDistance, SimVarValueType.Number, todBodDetails.distanceFromTod);
        SimVar.SetSimVarValue(VNavSimVars.TODLegIndex, SimVarValueType.Number, todBodDetails.todLegIndex);
        SimVar.SetSimVarValue(VNavSimVars.TODDistanceInLeg, SimVarValueType.Number, todBodDetails.distanceFromLegEnd);
        SimVar.SetSimVarValue(VNavSimVars.BODLegIndex, SimVarValueType.Number, todBodDetails.bodLegIndex);
        SimVar.SetSimVarValue(VNavSimVars.BODDistance, SimVarValueType.Number, todBodDetails.distanceFromBod);
        SimVar.SetSimVarValue(VNavSimVars.CurrentConstraintLegIndex, SimVarValueType.Number, todBodDetails.currentConstraintIndex);

        const nextConstraintAltitude = this.calculator.getNextConstraintAltitude(plan.activeLateralLeg);
        if (nextConstraintAltitude === undefined) {
          this.bus.getPublisher<VNavSimVarEvents>().pub('vnavNextConstraintAltitude', -1);
        } else {
          this.bus.getPublisher<VNavSimVarEvents>().pub('vnavNextConstraintAltitude', UnitType.METER.convertTo(nextConstraintAltitude, UnitType.FOOT));
        }

        const constraintAltitude = this.calculator.getCurrentConstraintAltitude(plan.activeLateralLeg);

        if (nextConstraintAltitude !== constraintAltitude) {
          this.setVNavUnavailable(true);
        } else {
          this.setVNavUnavailable(false);
        }

        const simvarAltitudeSet = constraintAltitude !== undefined ? UnitType.METER.convertTo(constraintAltitude, UnitType.FOOT) : -1;
        SimVar.SetSimVarValue(VNavSimVars.CurrentConstraintAltitude, SimVarValueType.Feet, simvarAltitudeSet);

        const desiredAltitude = this.calculator.getDesiredAltitude(plan.activeLateralLeg, alongLegDistance);
        desiredAltFeet = UnitType.METER.convertTo(desiredAltitude, UnitType.FOOT);

        this.setConstraintDistance(plan, todBodDetails.currentConstraintIndex);

        const currentLeg = this.lnavData.currentLegIndex >= 0 && this.lnavData.currentLegIndex < plan.length ? plan.getLeg(this.lnavData.currentLegIndex) : undefined;

        if (currentLeg?.calculated?.distanceWithTransitions && constraintAltitude !== undefined) {
          const distance = this.constraintDistance +
            UnitType.METER.convertTo(currentLeg.calculated.distanceWithTransitions - alongLegDistance, UnitType.NMILE);
          requiredVs = this.getRequiredVs(distance, constraintAltitude);
        }

      } else {
        this.failed();
      }


      if (plan.length > 0) {
        const finalLeg = plan.getLeg(plan.length - 1);

        const lpvDistance = this.manageGP(finalLeg, plan, alongLegDistance);

        verticalDeviation = desiredAltFeet - this.currentAltitude;
        SimVar.SetSimVarValue(VNavSimVars.VerticalDeviation, SimVarValueType.Feet, verticalDeviation);

        const targetAltitude = this.calculator.getTargetAltitude(plan.activeLateralLeg);

        if (targetAltitude !== undefined) {
          targetAltitudeFeet = UnitType.METER.convertTo(targetAltitude, UnitType.FOOT);
          SimVar.SetSimVarValue(VNavSimVars.TargetAltitude, SimVarValueType.Feet, targetAltitudeFeet);
        } else {
          SimVar.SetSimVarValue(VNavSimVars.TargetAltitude, SimVarValueType.Feet, -1);
        }

        if (this.apValues.verticalActive.get() === APVerticalModes.GP ||
          (this.apValues.approachHasGP.get() && this.state === DirectorState.Inactive && plan.activeLateralLeg >= this.calculator.getFafLegIndex())) {
          requiredVs = this.getRequiredVs(UnitType.METER.convertTo(lpvDistance, UnitType.NMILE), this.calculator.getLpvRunwayAltitude(), this.currentGpsAltitude);
        }
        SimVar.SetSimVarValue(VNavSimVars.RequiredVS, SimVarValueType.Number, requiredVs);

        if (plan.activeLateralLeg === this.awaitingRearm) {
          this.arm();
        }

        if (this.state !== DirectorState.Inactive && this.awaitingAltCap === -1 && this.awaitingRearm === -1) {
          this.manageAltHold(targetAltitudeFeet);
          this.trackVerticalPath(targetAltitudeFeet, verticalDeviation, plan);
        } else if (plan.activeLateralLeg < plan.length) {
          const fpa = this.calculator.getLeg(plan.activeLateralLeg).fpa;
          SimVar.SetSimVarValue(VNavSimVars.FPA, SimVarValueType.FPM, fpa);
        } else {
          SimVar.SetSimVarValue(VNavSimVars.FPA, SimVarValueType.FPM, 0);
        }

      } else {
        // TODO: remove this once we have a better way to get LPV state - does an LPV exist or not
        SimVar.SetSimVarValue(VNavSimVars.LPVDistance, SimVarValueType.Number, Number.MAX_SAFE_INTEGER);
        this.lpvDeviation.set(-1001);
      }
    } else {
      this.failed();
    }
    this.calculator.currentAlongLegDistance = alongLegDistance;
  }

  /**
   * Tracks the vertical path.
   * @param targetAltitude The current VNAV target altitude, if any.
   * @param verticalDeviation The current vertical deviation.
   * @param plan The active flight plan.
   */
  private trackVerticalPath(targetAltitude: number | undefined, verticalDeviation: number, plan: FlightPlan): void {
    if (targetAltitude === undefined) {
      targetAltitude = Number.NEGATIVE_INFINITY;
    }

    if (plan.activeLateralLeg >= plan.length) {
      this.isAltCaptured = false;
      this.failed();
      return;
    }

    const targetIsSelectedAltitude = this.preselectedAltitude > targetAltitude;
    targetAltitude = Math.max(targetAltitude, this.preselectedAltitude);
    const deviationFromTarget = targetAltitude - this.currentAltitude;

    const fpaPercentage = Math.max(verticalDeviation / -100, -1) + 1;
    const fpa = this.calculator.getLeg(plan.activeLateralLeg).fpa;
    const desiredPitch = (fpa * fpaPercentage) * -1;

    SimVar.SetSimVarValue(VNavSimVars.FPA, SimVarValueType.FPM, fpa);

    if (this.pathMode === VNavPathMode.None) {
      if (this.preselectedAltitude + 75 < this.currentAltitude) {
        this.pathMode = VNavPathMode.PathArmed;
      } else {
        this.deactivate();
      }
    }

    if (!this.isAltCaptured && this.pathMode === VNavPathMode.PathActive && fpa === 0) {
      this.apValues.capturedAltitude.set(100 * Math.round(targetAltitude / 100));
      this.pathMode = VNavPathMode.PathArmed;
      this.onDelegateAltCap();
      if (UnitType.METER.convertTo(this.calculator.getFafAltitude(), UnitType.FOOT) === targetAltitude) {
        this.deactivate();
      }
    }

    if (this.pathMode === VNavPathMode.PathArmed || this.pathMode == VNavPathMode.PathActive) {

      if (verticalDeviation <= 100 && verticalDeviation >= -15 && this.pathMode === VNavPathMode.PathArmed) {
        if (Math.abs(deviationFromTarget) > 75 && (!this.isAltCaptured && fpa !== 0)) {
          SimVar.SetSimVarValue('AUTOPILOT PITCH HOLD', 'Bool', 0);
          this.pathMode = VNavPathMode.PathActive;
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
          if (!targetIsSelectedAltitude && !this.calculator.getIsPathEnd(plan.activeLateralLeg)) {
            this.awaitingAltCap = plan.activeLateralLeg + 1;
          }
          this.onDelegateAltCap();
          return;
        }
      }

      if (this.pathMode === VNavPathMode.PathActive) {
        //We need the instant AOA here so we're avoiding the bus
        const aoa = SimVar.GetSimVarValue('INCIDENCE ALPHA', SimVarValueType.Degree);

        const maximumPitch = this.isAltCaptured ? 6 : 0;
        const targetPitch = aoa + NavMath.clamp(desiredPitch, -6, maximumPitch);

        SimVar.SetSimVarValue('AUTOPILOT PITCH HOLD REF', SimVarValueType.Degree, -targetPitch);
      }
    }
  }

  /**
   * Manages the sim ALT hold.
   * @param targetAltitude The current VNAV target altitude, if any.
   */
  private manageAltHold(targetAltitude: number | undefined): void {
    if (targetAltitude !== undefined) {

      const targetAltFeet = targetAltitude;
      if (this.preselectedAltitude >= targetAltFeet) {
        SimVar.SetSimVarValue(VNavSimVars.CaptureType, SimVarValueType.Number, VNavAltCaptureType.Selected);
      } else {
        SimVar.SetSimVarValue(VNavSimVars.CaptureType, SimVarValueType.Number, VNavAltCaptureType.VNAV);
      }
    } else {
      SimVar.SetSimVarValue(VNavSimVars.TargetAltitude, SimVarValueType.Feet, -1);
      SimVar.SetSimVarValue(VNavSimVars.CaptureType, SimVarValueType.Number, VNavAltCaptureType.None);
    }
  }

  /**
   * Gets the distance along the current leg.
   * @param lnavData The current LNAV data.
   * @returns The distance along the current leg, in meters.
   */
  private getAlongLegDistance(lnavData: LNavData): number {
    const plan = this.flightPlanner.getFlightPlan(Fms.PRIMARY_PLAN_INDEX);
    const leg = lnavData.currentLegIndex >= 0 && lnavData.currentLegIndex < plan.length ? plan.getLeg(lnavData.currentLegIndex) : undefined;

    let distance = 0;
    if (leg?.calculated) {
      const calcs = leg.calculated;
      const ingress = calcs.ingress;

      for (let i = 0; i < ingress.length; i++) {
        const vector = ingress[i];

        if (lnavData.transitionMode === TransitionMode.Ingress && lnavData.vectorIndex === i) {
          return distance + this.getAlongVectorDistance(vector, this.planePos);
        }

        distance += vector.distance;
      }

      let vectors, startIndex, endIndex;
      if (lnavData.isSuspended && lnavData.transitionMode === TransitionMode.None) {
        vectors = calcs.flightPath;
        startIndex = Math.max(0, calcs.ingressJoinIndex);
        endIndex = vectors.length;
      } else {
        vectors = calcs.ingressToEgress;
        startIndex = 0;
        endIndex = vectors.length;
      }

      for (let i = startIndex; i < endIndex; i++) {
        const vector = vectors[i];

        if (lnavData.transitionMode === TransitionMode.None && lnavData.vectorIndex === i) {
          return distance + this.getAlongVectorDistance(vector, this.planePos);
        }

        distance += vector.distance;
      }

      const egress = calcs.egress;
      for (let i = 0; i < egress.length; i++) {
        const vector = egress[i];

        if (lnavData.transitionMode === TransitionMode.Egress && lnavData.vectorIndex === i) {
          return distance + this.getAlongVectorDistance(vector, this.planePos);
        }

        distance += vector.distance;
      }
    }

    return distance;
  }

  /**
   * Gets the distance along a flight path vector from the start of the vector to a specified point.
   * @param vector A flight path vector.
   * @param point A point.
   * @returns The distance along the flight path vector, in meters, from the start of the vector to the specified
   * point.
   */
  private getAlongVectorDistance(vector: FlightPathVector, point: LatLonInterface | Float64Array): number {
    const circle = FlightPathUtils.setGeoCircleFromVector(vector, this.geoCircleCache[0]);
    return UnitType.GA_RADIAN.convertTo(FlightPathUtils.getAlongArcSignedDistance(
      circle,
      GeoPoint.sphericalToCartesian(vector.startLat, vector.startLon, this.vec3Cache[0]),
      GeoPoint.sphericalToCartesian(vector.endLat, vector.endLon, this.vec3Cache[1]),
      circle.closest(point, this.vec3Cache[2])
    ), UnitType.METER);
  }

  /**
   * Manages the GP State and sets required data for GP guidance.
   * @param finalLeg The LegDefinition for the last flight plan leg.
   * @param plan The FlightPlan.
   * @param alongLegDistance The Along Leg Distance
   * @returns The LPV Distance
   */
  private manageGP(finalLeg: LegDefinition | undefined, plan: FlightPlan, alongLegDistance: number): number {
    let lpvDeviation = Number.POSITIVE_INFINITY;
    let lpvDistance = -1;
    let gpExists = false;
    let gpCalculated = false;

    if (this.approachDetails.approachLoaded && this.approachDetails.approachIsActive && !this.approachDetails.approachIsCircling) {
      switch (this.approachDetails.approachType) {
        case ApproachType.APPROACH_TYPE_GPS:
        case ApproachType.APPROACH_TYPE_RNAV:
        case AdditionalApproachType.APPROACH_TYPE_VISUAL:
          gpExists = true;
      }
    }

    if (gpExists && finalLeg?.calculated !== undefined) {
      lpvDistance = this.calculator.getLpvDistance(plan.activeLateralLeg, alongLegDistance, this.planePos);
      const desiredLPVAltitude = this.calculator.getDesiredLpvAltitude(lpvDistance);
      const desiredLPVAltitudeFeet = UnitType.METER.convertTo(desiredLPVAltitude, UnitType.FOOT);

      lpvDeviation = desiredLPVAltitudeFeet - this.currentGpsAltitude;
      this.lpvDeviation.set(lpvDeviation);
      gpCalculated = true;

    } else {
      this.lpvDeviation.set(-1001);
    }

    SimVar.SetSimVarValue(VNavSimVars.LPVVerticalDeviation, SimVarValueType.Feet, lpvDeviation);
    SimVar.SetSimVarValue(VNavSimVars.LPVDistance, SimVarValueType.Number, lpvDistance);
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
      const deviation = currentAltitude - UnitType.METER.convertTo(targetAltitude, UnitType.FOOT);
      if (deviation > 0 && distance > 0) {
        const fpaRequired = UnitType.RADIAN.convertTo(Math.atan((deviation / UnitType.NMILE.convertTo(distance, UnitType.FOOT))), UnitType.DEGREE);
        return UnitType.NMILE.convertTo(this.currentGroundSpeed / 60, UnitType.FOOT) * Math.tan(UnitType.DEGREE.convertTo(-fpaRequired, UnitType.RADIAN));
      }
    }
    return 0;
  }

  /**
   * Sets the leg distance from the current leg to the constraint leg, not include the distance to the current active leg.
   * @param plan is the flight plan.
   * @param constraintLegIndex is the leg index of the current constraint.
   */
  private setConstraintDistance(plan: FlightPlan, constraintLegIndex: number | undefined): void {
    if (constraintLegIndex !== undefined && constraintLegIndex > -1) {
      const currentLeg = plan.getLeg(plan.activeLateralLeg);
      const constraintLeg = plan.getLeg(constraintLegIndex);
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
   * Gets the constraint index for a vertical direct based on an input global leg index.
   * @param legIndex The input global leg index selected.
   * @returns The constraint index for the vertical direct
   */
  public getVerticalDirectConstraint(legIndex: number): VNavConstraint | undefined {
    if (this.flightPlanner.hasFlightPlan(0)) {
      const plan = this.flightPlanner.getFlightPlan(0);
      return this.calculator.getVerticalDirectConstraintFromIndex(legIndex, plan.activeLateralLeg);
    }
    return undefined;
  }

  /**
   * Activates a vertical direct to a selected constraint.
   * @param constraint The constraint to go direct to.
   * @returns Whether the vertical direct was activated or not.
   */
  public activateVerticalDirect(constraint: VNavConstraint): boolean {
    if (this.flightPlanner.hasFlightPlan(0)) {
      const plan = this.flightPlanner.getFlightPlan(0);
      const verticalData: VerticalData = {
        altDesc: AltitudeRestrictionType.Unused,
        altitude1: 0,
        altitude2: 0
      };
      if (plan.length > constraint.index) {
        for (let i = 0; i < constraint.index; i++) {
          plan.setLegVerticalData(i, verticalData);
        }
        this.calculator.activateVerticalDirect(constraint.index);
        return true;
      }
    }
    return false;
  }

  /**
   * Sets whether VNAV is unavailable due to invalid legs between the plane and the next target.
   * @param isUnavailable Whether or not VNAV is unavailable.
   */
  private setVNavUnavailable(isUnavailable: boolean): void {
    if (this.isVNavUnavailable !== isUnavailable) {
      if (isUnavailable) {
        this.bus.getPublisher<AlertMessageEvents>().pub('alerts_push', {
          key: 'vnv-unavailable-legs',
          title: 'VNV UNAVAILABLE',
          message: 'Unsupported leg type in flight plan.'
        }, true, false);
      } else {
        this.bus.getPublisher<AlertMessageEvents>().pub('alerts_remove', 'vnv-unavailable-legs', true, false);
      }

      this.isVNavUnavailable = isUnavailable;
    }
  }
}