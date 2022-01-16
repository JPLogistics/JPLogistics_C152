/// <reference types="msfstypes/JS/simvar" />

import { GeoCircle, GeoPoint, NavMath, UnitType, LinearServo, MagVar, BitFlags } from 'msfssdk';
import { EventBus, Publisher } from 'msfssdk/data';
import { FixTypeFlags, LegType } from 'msfssdk/navigation';
import { ADCEvents, GNSSEvents, NavEvents, NavSourceType } from 'msfssdk/instruments';
import {
  FlightPlanner, FlightPlannerEvents, CircleVector, LegCalculations, LegDefinition, ActiveLegType, PlanChangeType,
  FlightPathUtils, FlightPathVector, LegDefinitionFlags
} from 'msfssdk/flightplan';
import { DirectorState, PlaneDirector, ArcTurnController } from 'msfssdk/autopilot';

import { LNavVars } from '../LNavSimVars';
import { G1000ControlEvents } from '../../G1000Events';
import { GpsObsDirector } from './GpsObsDirector';

/**
 * The current state of the aircraft for nav calculations.
 */
export interface AircraftState {

  /** The true airspeed of the aircraft. */
  tas: number;

  /** The ambient wind speed. */
  windSpeed: number;

  /** The ambient wind direction. */
  windDirection: number;

  /** The plane track true. */
  track: number;

  /** The plane heading true. */
  hdgTrue: number;

  /** The plane magnetic variation. */
  magvar: number;

  /** The plane's current position. */
  planePos: GeoPoint;
}

/**
 * Data published by the LNAV system.
 */
export interface LNavData {
  /** The current active LNAV leg. */
  currentLegIndex: number;

  /** The next active LNAV leg. */
  nextLegIndex: number;

  /** The current vector index. */
  vectorIndex: number;

  /** The current transition mode. */
  transitionMode: TransitionMode;

  /** The current true course that LNAV is attempting to steer to. */
  courseToSteer: number;

  /** Whether sequencing is suspended. */
  isSuspended: boolean;
}

/**
 * Events published by the LNAV system.
 */
export interface LNavEvents {
  /** An event published when LNAV data changes. */
  dataChanged: LNavData;

  /** An event published when the state of SUSP changes. */
  suspChanged: boolean;
}

export enum TransitionMode {
  None,
  Ingress,
  Egress
}

/**
 * A class that handles lateral navigation.
 */
export class LNavDirector implements PlaneDirector {
  private readonly vec3Cache = [new Float64Array(3), new Float64Array(3)];
  private readonly geoPointCache = [new GeoPoint(0, 0)];
  private readonly geoCircleCache = [new GeoCircle(new Float64Array(3), 0)];

  public previousLegIndex = 0;

  /** The current active leg index. */
  public currentLegIndex = 0;

  /** The current flight path vector index. */
  public currentVectorIndex = 0;

  public state: DirectorState;

  /** A callback called when the LNAV director activates. */
  public onActivate?: () => void;

  /** A callback called when the LNAV director arms. */
  public onArm?: () => void;

  private aircraftState: AircraftState;
  private currentLeg: LegDefinition | undefined = undefined;

  private dtk = 0;

  private xtk = 0;

  private transitionMode = TransitionMode.None;

  private isSuspended = false;
  private suspendedLegIndex = 0;
  private resetVectorsOnSuspendEnd = false;
  private inhibitNextSequence = false;

  private missedApproachActive = false;

  private currentBankRef = 0;

  private readonly arcController = new ArcTurnController();

  private readonly bankServo = new LinearServo(10);

  private readonly publisher: Publisher<LNavEvents>;

  private readonly lnavData: LNavData = {
    currentLegIndex: -1,
    nextLegIndex: -1,
    vectorIndex: 0,
    transitionMode: TransitionMode.None,
    courseToSteer: 0,
    isSuspended: false
  };

  private readonly obsDirector: GpsObsDirector;

  private bearingToEnd = 0;

  private canArm = false;
  private trackAtActivation = 0;
  private isInterceptingFromArmedState = false;

  /**
   * Creates an instance of the LateralDirector.
   * @param bus The event bus to use with this instance.
   * @param flightPlanner The flight planner to use with this instance.
   */
  constructor(private readonly bus: EventBus, private readonly flightPlanner: FlightPlanner) {
    this.aircraftState = {
      tas: 0,
      track: 0,
      magvar: 0,
      windSpeed: 0,
      windDirection: 0,
      planePos: new GeoPoint(0, 0),
      hdgTrue: 0
    };

    this.obsDirector = new GpsObsDirector(this.bus, this.aircraftState);
    this.obsDirector.onDeactivate = (): void => {
      this.isSuspended = false;
      SimVar.SetSimVarValue(LNavVars.DTK, 'degrees', this.dtk);
    };

    const adc = bus.getSubscriber<ADCEvents>();
    const controls = bus.getSubscriber<G1000ControlEvents>();
    const plan = bus.getSubscriber<FlightPlannerEvents>();

    this.publisher = bus.getPublisher<LNavEvents>();

    adc.on('ambient_wind_velocity').handle(w => this.aircraftState.windSpeed = w);
    adc.on('ambient_wind_direction').handle(wd => this.aircraftState.windDirection = wd);
    adc.on('tas').handle(tas => this.aircraftState.tas = tas);
    adc.on('hdg_deg_true').handle(hdg => this.aircraftState.hdgTrue = hdg);

    const nav = this.bus.getSubscriber<NavEvents>();
    nav.on('cdi_select').handle((src) => {
      if (this.state !== DirectorState.Inactive && src.type !== NavSourceType.Gps) {
        this.deactivate();
      }
    });

    controls.on('suspend').handle(() => {
      this.trySetSuspended(false);
    });

    controls.on('activate_missed_approach').handle((v) => {
      this.missedApproachActive = v;
    });

    controls.on('lnav_inhibit_next_sequence').handle(inhibit => {
      this.inhibitNextSequence = inhibit;
      if (inhibit) {
        this.suspendedLegIndex = 0;
      }
    });

    plan.on('fplActiveLegChange').handle(e => {
      if (e.type === ActiveLegType.Lateral) {
        this.currentVectorIndex = 0;
        this.transitionMode = TransitionMode.Ingress;
        this.inhibitNextSequence = false;
      }
    });

    plan.on('fplIndexChanged').handle(() => {
      this.currentVectorIndex = 0;
      this.transitionMode = TransitionMode.Ingress;
      this.inhibitNextSequence = false;
    });

    plan.on('fplSegmentChange').handle((e) => {
      if (e.type === PlanChangeType.Removed && (!this.flightPlanner.hasActiveFlightPlan() || this.flightPlanner.getActiveFlightPlan().length < 1)) {
        this.lnavData.vectorIndex = 0;
        this.lnavData.transitionMode = TransitionMode.None;
        this.lnavData.currentLegIndex = -1;
        this.lnavData.nextLegIndex = -1;
      }
    });

    const gps = bus.getSubscriber<GNSSEvents>();
    gps.on('gps-position').handle(lla => {
      this.aircraftState.planePos.set(lla.lat, lla.long);
    });
    gps.on('track_deg_true').handle(t => this.aircraftState.track = t);
    gps.on('magvar').handle(m => this.aircraftState.magvar = m);


    this.state = DirectorState.Inactive;
  }

  /**
   * Activates the LNAV director.
   */
  public activate(): void {
    this.isInterceptingFromArmedState = true;
    this.trackAtActivation = this.aircraftState.track;
    this.state = DirectorState.Active;
    if (this.onActivate !== undefined) {
      this.onActivate();
    }
    SimVar.SetSimVarValue('AUTOPILOT NAV1 LOCK', 'Bool', true);
  }

  /**
   * Arms the LNAV director.
   */
  public arm(): void {
    if (this.state === DirectorState.Inactive) {
      this.isInterceptingFromArmedState = false;
      if (this.canArm) {
        this.state = DirectorState.Armed;
        if (this.onArm !== undefined) {
          this.onArm();
        }
        SimVar.SetSimVarValue('AUTOPILOT NAV1 LOCK', 'Bool', true);
      }
    }
  }

  /**
   * Deactivates the LNAV director.
   */
  public deactivate(): void {
    this.state = DirectorState.Inactive;
    if (this.obsDirector.state !== DirectorState.Inactive) {
      this.obsDirector.deactivate();
    }
    this.isInterceptingFromArmedState = false;
    SimVar.SetSimVarValue('AUTOPILOT NAV1 LOCK', 'Bool', false);
  }

  /**
   * Updates the lateral director.
   */
  public update(): void {
    let clearInhibitNextSequence = true;

    const flightPlan = this.flightPlanner.hasActiveFlightPlan() ? this.flightPlanner.getActiveFlightPlan() : undefined;
    this.currentLegIndex = flightPlan ? flightPlan.activeLateralLeg : 0;

    if (flightPlan && this.currentLegIndex <= flightPlan.length - 1) {
      this.currentLeg = flightPlan.getLeg(this.currentLegIndex);
      let nextLeg: LegDefinition | undefined = undefined;
      try {
        nextLeg = flightPlan.getLeg(this.currentLegIndex + 1);
      } catch { /* Continue */ }

      // We don't want to clear the inhibit next sequence flag until the active leg has been calculated
      // since we never sequence through non-calculated legs.
      clearInhibitNextSequence = !!this.currentLeg.calculated;

      this.calculateTracking();
      if (this.currentLegIndex > flightPlan.length - 1) {
        return;
      }

      try {
        nextLeg = flightPlan.getLeg(this.currentLegIndex + 1);
      } catch { /* Continue */ }

      const calcs = this.currentLeg.calculated;
      this.calculateNextTracking(nextLeg?.calculated);

      this.lnavData.currentLegIndex = this.currentLegIndex;
      this.lnavData.nextLegIndex = nextLeg ? this.currentLegIndex + 1 : -1;
      this.lnavData.vectorIndex = this.currentVectorIndex;
      this.lnavData.transitionMode = this.transitionMode;
      this.lnavData.isSuspended = this.isSuspended;

      this.obsDirector.obsLeg.set(this.currentLeg);

      if (this.obsDirector.obsActive) {
        this.isSuspended = true;
        this.suspendedLegIndex = this.currentLegIndex;

        if (this.state === DirectorState.Active && this.obsDirector.state !== DirectorState.Active) {
          this.obsDirector.activate();
          SimVar.SetSimVarValue('AUTOPILOT NAV1 LOCK', 'Bool', true);
        }

        if (this.state === DirectorState.Armed && this.obsDirector.canActivate()) {
          this.obsDirector.activate();
          this.state = DirectorState.Active;
          if (this.onActivate !== undefined) {
            this.onActivate();
          }
          SimVar.SetSimVarValue('AUTOPILOT NAV1 LOCK', 'Bool', true);
        }

        if (this.currentLeg && this.currentLeg.calculated?.endLat && this.currentLeg.calculated?.endLon) {
          const planePos = this.aircraftState.planePos;
          this.bearingToEnd = MagVar.trueToMagnetic(planePos.bearingTo(this.currentLeg.calculated.endLat, this.currentLeg.calculated.endLon), planePos);
          SimVar.SetSimVarValue(LNavVars.Bearing, 'degrees', this.bearingToEnd);
          const distance = planePos.distance(this.currentLeg.calculated.endLat, this.currentLeg.calculated.endLon);
          SimVar.SetSimVarValue(LNavVars.Distance, 'meters', UnitType.GA_RADIAN.convertTo(distance, UnitType.METER));
        }

        this.obsDirector.update();
        return;
      }

      if (calcs !== undefined) {
        this.canArm = true;
      } else {
        this.canArm = false;
      }

      if (this.state !== DirectorState.Inactive && calcs !== undefined) {
        this.navigateFlightPath(calcs);
      }
    } else {
      this.currentLeg = undefined;
      this.canArm = false;
    }
    if (this.state === DirectorState.Armed) {
      this.tryActivate();
    }

    this.publisher.pub('dataChanged', this.lnavData, true);
    this.inhibitNextSequence &&= !clearInhibitNextSequence;
  }

  /**
   * Calculates the tracking information for the next leg.
   * @param calcs The leg calculations for the next leg.
   */
  private calculateNextTracking(calcs?: LegCalculations): void {
    if (calcs !== undefined) {
      const vector = calcs.flightPath[0];
      if (vector !== undefined) {
        SimVar.SetSimVarValue(LNavVars.NextDTK, 'degrees', calcs.initialDtk ?? 0);

        const circle = FlightPathUtils.setGeoCircleFromVector(vector, this.geoCircleCache[0]);
        SimVar.SetSimVarValue(LNavVars.NextXTK, 'nautical miles', UnitType.GA_RADIAN.convertTo(circle.distance(this.aircraftState.planePos), UnitType.NMILE));
      }
    }
  }

  /**
   * Navigates the provided leg flight path.
   * @param calcs The legs calculations that has the provided flight path.
   */
  private navigateFlightPath(calcs: LegCalculations): void {
    let absInterceptAngle;
    let naturalAbsInterceptAngle = Math.min(Math.pow(Math.abs(this.xtk) * 20, 1.35) + (Math.abs(this.xtk) * 50), 45);
    if (naturalAbsInterceptAngle <= 2.5) {
      naturalAbsInterceptAngle = NavMath.clamp(Math.abs(this.xtk * 150), 0, 2.5);
    }

    if (this.isInterceptingFromArmedState) {
      absInterceptAngle = Math.abs(NavMath.diffAngle(this.trackAtActivation, this.dtk));
      if (absInterceptAngle > naturalAbsInterceptAngle || absInterceptAngle < 5 || absInterceptAngle < Math.abs(NavMath.diffAngle(this.dtk, this.bearingToEnd))) {
        absInterceptAngle = naturalAbsInterceptAngle;
        this.isInterceptingFromArmedState = false;
      }
    } else {
      absInterceptAngle = naturalAbsInterceptAngle;
    }
    const interceptAngle = this.xtk < 0 ? absInterceptAngle : -1 * absInterceptAngle;
    this.lnavData.courseToSteer = NavMath.normalizeHeading(this.dtk + interceptAngle);

    let bankAngle = this.desiredBank(this.lnavData.courseToSteer);

    const vector = LNavDirector.getVectorsForTransitionMode(calcs, this.transitionMode, this.isSuspended)[this.currentVectorIndex];

    if (vector !== undefined && !FlightPathUtils.isVectorGreatCircle(vector)) {
      bankAngle = this.adjustBankAngleForArc(vector, bankAngle);
    }

    if (this.state === DirectorState.Active) {
      this.setBank(bankAngle);
    }
  }

  /**
   * Adjusts the desired bank angle for arc vectors.
   * @param vector The arc vector to adjust for.
   * @param bankAngle The current starting input desired bank angle.
   * @returns The adjusted bank angle.
   */
  private adjustBankAngleForArc(vector: CircleVector, bankAngle: number): number {
    const circle = FlightPathUtils.setGeoCircleFromVector(vector, this.geoCircleCache[0]);
    const turnDirection = FlightPathUtils.getTurnDirectionFromCircle(circle);
    const radius = UnitType.GA_RADIAN.convertTo(FlightPathUtils.getTurnRadiusFromCircle(circle), UnitType.METER);

    const relativeWindHeading = NavMath.normalizeHeading(this.aircraftState.windDirection - this.aircraftState.hdgTrue);
    const headwind = this.aircraftState.windSpeed * Math.cos(relativeWindHeading * Avionics.Utils.DEG2RAD);

    const distance = UnitType.GA_RADIAN.convertTo(circle.distance(this.aircraftState.planePos), UnitType.METER);
    const bankAdjustment = this.arcController.getOutput(distance);

    const turnBankAngle = NavMath.bankAngle(this.aircraftState.tas - headwind, radius) * (turnDirection === 'left' ? 1 : -1);
    const turnRadius = NavMath.turnRadius(this.aircraftState.tas - headwind, 25);

    const bankBlendFactor = Math.max(1 - (Math.abs(UnitType.NMILE.convertTo(this.xtk, UnitType.METER)) / turnRadius), 0);

    bankAngle = (bankAngle * (1 - bankBlendFactor)) + (turnBankAngle * bankBlendFactor) + bankAdjustment;
    bankAngle = Math.min(Math.max(bankAngle, -25), 25);

    return bankAngle;
  }

  /**
   * Sets the desired AP bank angle.
   * @param bankAngle The desired AP bank angle.
   */
  private setBank(bankAngle: number): void {
    if (isFinite(bankAngle)) {
      this.currentBankRef = this.bankServo.drive(this.currentBankRef, bankAngle);
      SimVar.SetSimVarValue('AUTOPILOT BANK HOLD REF', 'degrees', this.currentBankRef);
    }
  }

  /**
   * Gets a desired bank from a desired track.
   * @param desiredTrack The desired track.
   * @returns The desired bank angle.
   */
  private desiredBank(desiredTrack: number): number {
    const turnDirection = NavMath.getTurnDirection(this.aircraftState.track, desiredTrack);
    const headingDiff = Math.abs(NavMath.diffAngle(this.aircraftState.track, desiredTrack));

    let baseBank = Math.min(1.25 * headingDiff, 25);
    baseBank *= (turnDirection === 'left' ? 1 : -1);

    return baseBank;
  }

  /**
   * Calculates the tracking from the current leg.
   */
  private calculateTracking(): void {
    const plan = this.flightPlanner.getActiveFlightPlan();

    let didAdvance;
    do {
      didAdvance = false;

      if (!this.currentLeg) {
        break;
      }

      //Don't really need to fly the intial leg?
      if (this.currentLeg.leg.type === LegType.IF && this.currentLegIndex === 0 && plan.length > 1) {
        this.currentLeg = plan.getLeg(++this.currentLegIndex);
        plan.setLateralLeg(this.currentLegIndex);
        plan.setCalculatingLeg(this.currentLegIndex);

        didAdvance = true;
        continue;
      }

      const calcs = this.currentLeg.calculated;

      if (calcs) {
        const vectors = LNavDirector.getVectorsForTransitionMode(calcs, this.transitionMode, this.isSuspended);
        const vector = vectors[this.currentVectorIndex];

        if (vector && vector.radius > 0) {
          const planePos = this.aircraftState.planePos;

          const circle = FlightPathUtils.setGeoCircleFromVector(vector, this.geoCircleCache[0]);
          const start = GeoPoint.sphericalToCartesian(vector.startLat, vector.startLon, this.vec3Cache[0]);
          const end = GeoPoint.sphericalToCartesian(vector.endLat, vector.endLon, this.vec3Cache[1]);

          this.xtk = UnitType.GA_RADIAN.convertTo(circle.distance(planePos), UnitType.NMILE);
          this.dtk = circle.bearingAt(planePos, Math.PI);

          this.bearingToEnd = MagVar.trueToMagnetic(planePos.bearingTo(vector.endLat, vector.endLon), planePos);
          SimVar.SetSimVarValue(LNavVars.Bearing, 'degrees', this.bearingToEnd);

          if (FlightPathUtils.getAlongArcNormalizedDistance(circle, start, end, planePos) > 1) {
            didAdvance = this.advanceVector(this.currentLeg);
          }
        } else {
          didAdvance = this.advanceVector(this.currentLeg);
        }
      }
    } while (didAdvance && this.currentLegIndex <= plan.length - 1);

    this.lnavData.courseToSteer = this.dtk;
  }

  /**
   * Applies suspends that apply at the end of a leg.
   */
  private applyEndOfLegSuspends(): void {
    const plan = this.flightPlanner.getActiveFlightPlan();
    const leg = plan.getLeg(plan.activeLateralLeg);

    if (leg.leg.type === LegType.FM || leg.leg.type === LegType.VM || this.inhibitNextSequence) {
      this.trySetSuspended(true, this.inhibitNextSequence);
    } else if (plan.activeLateralLeg < plan.length - 1) {
      const nextLeg = plan.getLeg(plan.activeLateralLeg + 1);
      if (
        !this.missedApproachActive
        && (
          leg.leg.fixTypeFlags === FixTypeFlags.MAP
          || (!BitFlags.isAll(leg.flags, LegDefinitionFlags.MissedApproach) && BitFlags.isAll(nextLeg.flags, LegDefinitionFlags.MissedApproach))
        )
      ) {
        this.trySetSuspended(true);
      }
    }
  }

  /**
   * Applies suspends that apply at the beginning of a leg.
   */
  private applyStartOfLegSuspends(): void {
    const plan = this.flightPlanner.getActiveFlightPlan();
    const leg = plan.getLeg(plan.activeLateralLeg);

    if (leg.leg.type === LegType.HM || plan.activeLateralLeg === plan.length - 1) {
      this.trySetSuspended(true);
    }
  }

  /**
   * Advances the current flight path vector along the flight path.
   * @param leg The definition of the leg being flown.
   * @returns Whether the current flight path vector was advanced.
   */
  private advanceVector(leg: LegDefinition): boolean {
    let didAdvance = false;

    const plan = this.flightPlanner.getActiveFlightPlan();

    this.currentVectorIndex++;

    const calcs = leg.calculated;
    let vectors = calcs ? LNavDirector.getVectorsForTransitionMode(calcs, this.transitionMode, this.isSuspended) : undefined;

    while (!vectors || this.currentVectorIndex >= vectors.length) {
      switch (this.transitionMode) {
        case TransitionMode.Ingress:
          this.arcController.reset();
          this.transitionMode = TransitionMode.None;
          vectors = calcs ? LNavDirector.getVectorsForTransitionMode(calcs, this.transitionMode, this.isSuspended) : undefined;
          this.currentVectorIndex = Math.max(0, this.isSuspended ? calcs?.ingressJoinIndex ?? 0 : 0);
          didAdvance = true;
          break;
        case TransitionMode.None:
          if (!this.isSuspended) {
            plan.setCalculatingLeg(this.currentLegIndex + 1);
            this.transitionMode = TransitionMode.Egress;
            vectors = calcs ? LNavDirector.getVectorsForTransitionMode(calcs, this.transitionMode, this.isSuspended) : undefined;
            this.currentVectorIndex = 0;
            didAdvance = true;
          } else if (leg.leg.type === LegType.HM) {
            vectors = calcs?.flightPath;
            this.currentVectorIndex = 0;
            didAdvance = true;
          } else {
            return didAdvance;
          }
          break;
        case TransitionMode.Egress:
          return this.advanceEgressToIngress();
      }
    }

    return didAdvance;
  }

  /**
   * Advances the current flight plan leg to the next leg.
   * @returns Whether the leg was advanced.
   */
  private advanceEgressToIngress(): boolean {
    const plan = this.flightPlanner.getActiveFlightPlan();
    this.applyEndOfLegSuspends();

    if (!this.isSuspended) {
      if (this.currentLegIndex + 1 >= plan.length) {
        this.transitionMode = TransitionMode.None;
        return false;
      }

      this.currentLeg = plan.getLeg(++this.currentLegIndex);
      this.transitionMode = TransitionMode.Ingress;
      this.currentVectorIndex = 0;
      this.suspendedLegIndex = 0;

      plan.setLateralLeg(this.currentLegIndex);
      plan.setCalculatingLeg(this.currentLegIndex);

      this.applyStartOfLegSuspends();

      return true;
    } else {
      return false;
    }
  }

  /**
   * Sets flight plan advance in or out of SUSP.
   * @param isSuspended Whether or not advance is suspended.
   * @param resetVectorsOnSuspendEnd Whether to reset the tracked vector to the beginning of the leg when the applied
   * suspend ends. Ignored if `isSuspended` is false. Defaults to false.
   */
  private trySetSuspended(isSuspended: boolean, resetVectorsOnSuspendEnd?: boolean): void {
    if (isSuspended && this.currentLegIndex === this.suspendedLegIndex) {
      return;
    }

    if (isSuspended) {
      this.suspendedLegIndex = this.currentLegIndex;
      this.resetVectorsOnSuspendEnd = resetVectorsOnSuspendEnd ?? false;
    }

    if (this.isSuspended !== isSuspended) {
      this.publisher.pub('suspChanged', isSuspended, true, true);
      this.isSuspended = isSuspended;

      if (!isSuspended && this.resetVectorsOnSuspendEnd) {
        this.transitionMode = TransitionMode.Ingress;
        this.currentVectorIndex = 0;
        this.resetVectorsOnSuspendEnd = false;
      } else {
        const legCalc = this.currentLeg?.calculated;
        const ingressJoinVector = legCalc?.flightPath[legCalc.ingressJoinIndex];
        if (legCalc && this.transitionMode === TransitionMode.None && legCalc.ingressJoinIndex >= 0 && ingressJoinVector && legCalc.ingress.length > 0) {
          // reconcile vector indexes

          const vectors = isSuspended ? legCalc.flightPath : legCalc.ingressToEgress;
          const lastIngressVector = legCalc.ingress[legCalc.ingress.length - 1];
          const offset = (this.geoPointCache[0].set(lastIngressVector.endLat, lastIngressVector.endLon).equals(ingressJoinVector.endLat, ingressJoinVector.endLon)
            ? 2
            : 1
          ) * (isSuspended ? 1 : -1);

          // Not using Utils.Clamp() because I need it to clamp to >=0 last.
          this.currentVectorIndex = Math.max(0, Math.min(this.currentVectorIndex + offset, vectors.length - 1));
        }
      }
    }
  }

  /**
   * Tries to activate when armed.
   */
  private tryActivate(): void {
    const headingDiff = NavMath.diffAngle(this.aircraftState.track, this.dtk);
    if (Math.abs(this.xtk) < 0.6 && Math.abs(headingDiff) < 110) {
      this.activate();
    }
  }

  /**
   * Gets the flight path vectors to navigate for a leg and a given transition mode.
   * @param calc The calculations for a flight plan leg.
   * @param mode A transition mode.
   * @param isSuspended Whether sequencing is suspended.
   * @returns The flight path vectors to navigate for the given leg and transition mode.
   */
  public static getVectorsForTransitionMode(calc: LegCalculations, mode: TransitionMode, isSuspended: boolean): FlightPathVector[] {
    switch (mode) {
      case TransitionMode.None:
        return isSuspended ? calc.flightPath : calc.ingressToEgress;
      case TransitionMode.Ingress:
        return calc.ingress;
      case TransitionMode.Egress:
        return calc.egress;
    }
  }
}