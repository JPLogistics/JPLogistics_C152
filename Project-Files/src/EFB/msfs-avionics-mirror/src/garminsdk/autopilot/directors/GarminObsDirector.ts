/// <reference types="msfstypes/JS/simvar" />

import { GeoCircle, GeoPoint, MagVar, MathUtils, NavMath, ObjectSubject, SubscribableType, UnitType } from 'msfssdk';
import { EventBus, HEvent, SimVarValueType } from 'msfssdk/data';
import { GNSSEvents, NavEvents, NavSourceType } from 'msfssdk/instruments';
import { DirectorState, LNavEvents, LNavTransitionMode, LNavVars, ObsDirector } from 'msfssdk/autopilot';
import { FlightPathUtils, LegDefinition } from 'msfssdk/flightplan';
import { LinearServo } from 'msfssdk/utils/controllers';

/**
 * A director that handles OBS Lateral Navigation.
 */
export class GarminObsDirector implements ObsDirector {
  private readonly geoPointCache = [new GeoPoint(0, 0)];
  private readonly geoCircleCache = [new GeoCircle(new Float64Array(3), 0)];

  public state: DirectorState;

  /** @inheritdoc */
  public onArm?: () => void;

  /** @inheritdoc */
  public onActivate?: () => void;

  /** @inheritdoc */
  public onDeactivate?: () => void;

  private obsSetting = 0;
  public obsActive = false;
  private dtk: number | undefined = undefined;
  private xtk: number | undefined = undefined;
  private magvar = 0;

  private legIndex = 0;
  private leg: LegDefinition | null = null;

  private currentBankRef = 0;
  private readonly bankServo = new LinearServo(10);

  private planePos = new GeoPoint(0, 0);
  private groundTrack = 0;

  private isTracking = false;
  private needSubLNavData = false;

  private readonly lnavData = ObjectSubject.create({
    dtk: 0,
    xtk: 0,
    isTracking: false,
    legIndex: 0,
    transitionMode: LNavTransitionMode.None,
    vectorIndex: 0,
    courseToSteer: 0,
    isSuspended: true,
    alongLegDistance: 0,
    legDistanceRemaining: 0,
    alongVectorDistance: 0,
    vectorDistanceRemaining: 0
  });

  private readonly lnavDataHandler = (
    obj: SubscribableType<typeof this.lnavData>,
    key: keyof SubscribableType<typeof this.lnavData>,
    value: SubscribableType<typeof this.lnavData>[keyof SubscribableType<typeof this.lnavData>]
  ): void => {
    switch (key) {
      case 'dtk': SimVar.SetSimVarValue(LNavVars.DTK, SimVarValueType.Degree, value); break;
      case 'xtk': SimVar.SetSimVarValue(LNavVars.XTK, SimVarValueType.NM, value); break;
      case 'isTracking': SimVar.SetSimVarValue(LNavVars.IsTracking, SimVarValueType.Bool, value); break;
      case 'legIndex': SimVar.SetSimVarValue(LNavVars.TrackedLegIndex, SimVarValueType.Number, value); break;
      case 'transitionMode': SimVar.SetSimVarValue(LNavVars.TransitionMode, SimVarValueType.Number, value); break;
      case 'vectorIndex': SimVar.SetSimVarValue(LNavVars.TrackedVectorIndex, SimVarValueType.Number, value); break;
      case 'courseToSteer': SimVar.SetSimVarValue(LNavVars.CourseToSteer, SimVarValueType.Degree, value); break;
      case 'isSuspended': SimVar.SetSimVarValue(LNavVars.IsSuspended, SimVarValueType.Bool, value); break;
      case 'alongLegDistance': SimVar.SetSimVarValue(LNavVars.LegDistanceAlong, SimVarValueType.NM, value); break;
      case 'legDistanceRemaining': SimVar.SetSimVarValue(LNavVars.LegDistanceRemaining, SimVarValueType.NM, value); break;
      case 'alongVectorDistance': SimVar.SetSimVarValue(LNavVars.VectorDistanceAlong, SimVarValueType.NM, value); break;
      case 'vectorDistanceRemaining': SimVar.SetSimVarValue(LNavVars.VectorDistanceRemaining, SimVarValueType.NM, value); break;
    }
  };

  /**
   * Creates an instance of the GPS OBS Director.
   * @param bus The event bus to use with this instance.
   */
  constructor(private readonly bus: EventBus) {
    const sub = bus.getSubscriber<HEvent & NavEvents & LNavEvents & GNSSEvents>();

    const adjustCourseSub = sub.on('hEvent').handle((e: string) => {
      if (e === 'AS1000_PFD_CRS_INC' || e === 'AS1000_MFD_CRS_INC') {
        this.incrementObs(true);
      } else if (e === 'AS1000_PFD_CRS_DEC' || e === 'AS1000_MFD_CRS_DEC') {
        this.incrementObs(false);
      }
    }, true);

    sub.on('cdi_select').handle(source => {
      if (source.type === NavSourceType.Gps) {
        adjustCourseSub.resume();
      } else {
        adjustCourseSub.pause();
      }
    });

    sub.on('gps_obs_active').whenChanged().handle((state) => {
      this.obsActive = state;
      if (this.obsActive) {
        const calc = this.leg?.calculated;
        let courseMag: number | undefined = undefined;

        if (calc && calc.endLat !== undefined && calc.endLon !== undefined) {
          const courseTrue = FlightPathUtils.getLegFinalCourse(calc);
          if (courseTrue !== undefined) {
            courseMag = MagVar.trueToMagnetic(courseTrue, calc.endLat, calc.endLon);
          }
        }

        if (courseMag !== undefined) {
          this.obsSetting = courseMag;
        } else if (this.obsSetting < 0 || this.obsSetting > 360) {
          this.obsSetting = 0;
        }
        SimVar.SetSimVarValue('K:GPS_OBS_SET', SimVarValueType.Degree, this.obsSetting);
      } else {
        this.deactivate();
      }
    });

    sub.on('lnav_is_suspended').whenChanged().handle(isSuspended => {
      if (this.obsActive && !isSuspended) {
        SimVar.SetSimVarValue('K:GPS_OBS_OFF', 'number', 0);
      }
    });

    sub.on('gps_obs_value').whenChanged().handle((value) => {
      this.obsSetting = value;
    });

    sub.on('magvar').whenChanged().handle((v) => {
      this.magvar = v;
    });
    sub.on('track_deg_magnetic').whenChanged().handle((v) => {
      this.groundTrack = v;
    });
    sub.on('gps-position').whenChanged().handle((v) => {
      this.planePos.set(v.lat, v.long);
    });

    this.state = DirectorState.Inactive;
  }

  /** @inheritdoc */
  public activate(): void {
    this.state = DirectorState.Active;
    if (this.onActivate !== undefined) {
      this.onActivate();
    }
  }

  /** @inheritdoc */
  public arm(): void {
    this.state = DirectorState.Armed;
    if (this.onArm !== undefined) {
      this.onArm();
    }
  }

  /** @inheritdoc */
  public deactivate(): void {
    this.state = DirectorState.Inactive;
    if (this.onDeactivate !== undefined) {
      this.onDeactivate();
    }
  }

  /** @inheritdoc */
  public setLeg(index: number, leg: LegDefinition | null): void {
    this.legIndex = index;
    this.leg = leg;
  }

  /** @inheritdoc */
  public startTracking(): void {
    if (this.isTracking) {
      return;
    }

    this.needSubLNavData = true;
    this.isTracking = true;
  }

  /** @inheritdoc */
  public stopTracking(): void {
    if (!this.isTracking) {
      return;
    }

    this.lnavData.unsub(this.lnavDataHandler);

    this.needSubLNavData = false;
    this.isTracking = false;

    SimVar.SetSimVarValue('K:GPS_OBS_OFF', SimVarValueType.Number, 0);
  }

  /**
   * Increments or Decrements the OBS Setting for GPS if in GPS OBS MODE.
   * @param increment is whether to increment (or decrement) the value.
   */
  private incrementObs(increment: boolean): void {
    if (this.obsActive) {
      if (increment) {
        SimVar.SetSimVarValue('K:GPS_OBS_INC', SimVarValueType.Number, 0);
      } else {
        SimVar.SetSimVarValue('K:GPS_OBS_DEC', SimVarValueType.Number, 0);
      }
    }
  }

  /**
   * Updates the lateral director.
   */
  public update(): void {
    this.lnavData.set('legIndex', this.legIndex);

    if (this.isTracking) {
      this.calculateTracking();
    }

    if (this.dtk === undefined || this.xtk === undefined) {
      SimVar.SetSimVarValue('K:GPS_OBS_OFF', SimVarValueType.Number, 0);
    }

    if (this.state === DirectorState.Active) {
      this.navigateFlightPath();
    }

    if (this.needSubLNavData) {
      this.lnavData.sub(this.lnavDataHandler, true);
      this.needSubLNavData = false;
    }
  }

  /**
   * Gets the current obs xtk.
   */
  private calculateTracking(): void {
    let distanceRemaining = 0;

    if (this.leg?.calculated?.endLat !== undefined && this.leg?.calculated?.endLon !== undefined) {
      const end = this.geoPointCache[0].set(this.leg.calculated.endLat, this.leg.calculated.endLon);
      const obsTrue = NavMath.normalizeHeading(this.obsSetting + this.magvar);
      const path = this.geoCircleCache[0].setAsGreatCircle(end, obsTrue);

      this.dtk = path.bearingAt(this.planePos, Math.PI);
      this.xtk = UnitType.GA_RADIAN.convertTo(path.distance(this.planePos), UnitType.NMILE);

      const angleRemaining = (path.angleAlong(this.planePos, end, Math.PI) + Math.PI) % MathUtils.TWO_PI - Math.PI;
      distanceRemaining = UnitType.GA_RADIAN.convertTo(angleRemaining, UnitType.NMILE);
    } else {
      this.dtk = undefined;
      this.xtk = undefined;
    }

    this.lnavData.set('isTracking', this.dtk !== undefined && this.xtk !== undefined);
    this.lnavData.set('dtk', this.dtk ?? 0);
    this.lnavData.set('xtk', this.xtk ?? 0);
    this.lnavData.set('legDistanceRemaining', distanceRemaining);
    this.lnavData.set('vectorDistanceRemaining', distanceRemaining);
  }

  /**
   * Navigates the provided leg flight path.
   */
  private navigateFlightPath(): void {
    if (this.xtk === undefined || this.dtk === undefined) {
      return;
    }

    const absInterceptAngle = Math.min(Math.pow(Math.abs(this.xtk) * 20, 1.35) + (Math.abs(this.xtk) * 50), 45);
    const interceptAngle = this.xtk < 0 ? absInterceptAngle : -1 * absInterceptAngle;
    const courseToSteer = NavMath.normalizeHeading(this.dtk + interceptAngle);
    const bankAngle = this.desiredBank(courseToSteer, this.xtk);

    if (this.state === DirectorState.Active) {
      this.setBank(bankAngle);
    }

    this.lnavData.set('courseToSteer', courseToSteer);
  }

  /**
   * Tries to activate when armed.
   * @returns whether OBS can activate
   */
  public canActivate(): boolean {
    if (this.xtk !== undefined && Math.abs(this.xtk) < 1) {
      return true;
    }
    return false;
  }

  /**
   * Gets a desired bank from a desired track.
   * @param desiredTrack The desired track.
   * @param xtk The cross track.
   * @returns The desired bank angle.
   */
  private desiredBank(desiredTrack: number, xtk: number): number {
    const turnDirection = NavMath.getTurnDirection(this.groundTrack, desiredTrack);
    const headingDiff = Math.abs(NavMath.diffAngle(this.groundTrack, desiredTrack));

    let baseBank = Math.min(1.25 * headingDiff, 25);
    if (baseBank <= 2.5) {
      baseBank = NavMath.clamp(xtk * 100, -2.5, 2.5);
    } else {
      baseBank *= (turnDirection === 'left' ? 1 : -1);
    }

    return baseBank;
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
}