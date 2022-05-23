import { FlightPlanner } from 'msfssdk/flightplan';
import { APConfig, APLateralModes, APValues, APVerticalModes, BottomTargetPathCalculator, PlaneDirector, VNavManager } from 'msfssdk/autopilot';
import { APAltCapDirector, APLvlDirector, APAltDirector, APFLCDirector, APGPDirector, APGSDirector, APHdgDirector, APNavDirector, APPitchDirector, APRollDirector, APVSDirector, LNavDirector, APVNavPathDirector } from 'msfssdk/autopilot/directors';
import { GarminNavToNavManager } from './GarminNavToNavManager';
import { GarminObsDirector } from './directors';
import { NavMath, UnitType } from 'msfssdk';
import { EventBus } from 'msfssdk/data/EventBus';
import { GarminVNavManager } from './GarminVNavManager';


/**
 * A Garmin Autopilot Configuration.
 */
export class GarminAPConfig implements APConfig {
  public defaultLateralMode = APLateralModes.ROLL;
  public defaultVerticalMode = APVerticalModes.PITCH;
  private obsDirector = new GarminObsDirector(this.bus);
  /**
   * Instantiates the AP Config for the Autopilot.
   * @param bus is an instance of the Event Bus.
   * @param flightPlanner is an instance of the flight planner.
   * @param verticalPathCalculator The instance of the vertical path calculator to use for the vnav director.
   */
  constructor(private readonly bus: EventBus, private readonly flightPlanner: FlightPlanner, private readonly verticalPathCalculator: BottomTargetPathCalculator) {
  }

  /** @inheritdoc */
  public createHeadingDirector(apValues: APValues): APHdgDirector {
    return new APHdgDirector(this.bus, apValues);
  }

  /** @inheritdoc */
  public createRollDirector(): APRollDirector {
    return new APRollDirector(this.bus, { minimumBankAngle: 6, maximumBankAngle: 22 });
  }

  /** @inheritdoc */
  public createWingLevelerDirector(): APLvlDirector {
    return new APLvlDirector(this.bus);
  }

  /** @inheritdoc */
  public createGpssDirector(): LNavDirector {
    return new LNavDirector(this.bus, this.flightPlanner, this.obsDirector, this.lnavInterceptCurve.bind(this));
  }

  /** @inheritdoc */
  public createVorDirector(apValues: APValues): APNavDirector {
    return new APNavDirector(this.bus, apValues, APLateralModes.VOR, this.navInterceptCurve.bind(this));
  }

  /** @inheritdoc */
  public createLocDirector(apValues: APValues): APNavDirector {
    return new APNavDirector(this.bus, apValues, APLateralModes.LOC, this.navInterceptCurve.bind(this));
  }

  /** @inheritdoc */
  public createBcDirector(): undefined {
    return undefined;
  }

  /** @inheritdoc */
  public createPitchDirector(apValues: APValues): APPitchDirector {
    return new APPitchDirector(this.bus, apValues);
  }

  /** @inheritdoc */
  public createVsDirector(apValues: APValues): APVSDirector {
    return new APVSDirector(this.bus, apValues);
  }

  /** @inheritdoc */
  public createFlcDirector(apValues: APValues): APFLCDirector {
    return new APFLCDirector(this.bus, apValues);
  }

  /** @inheritdoc */
  public createAltHoldDirector(apValues: APValues): APAltDirector {
    return new APAltDirector(this.bus, apValues);
  }

  /** @inheritdoc */
  public createAltCapDirector(apValues: APValues): APAltCapDirector {
    return new APAltCapDirector(this.bus, apValues);
  }

  private vnavManager?: VNavManager;

  /** @inheritdoc */
  public createVNavManager(apValues: APValues): VNavManager {
    return this.vnavManager ??= new GarminVNavManager(this.bus, this.flightPlanner, this.verticalPathCalculator, apValues, 0);
  }

  /** @inheritdoc */
  public createVNavPathDirector(apValues: APValues): PlaneDirector | undefined {
    return new APVNavPathDirector(this.bus, apValues);
  }

  /** @inheritdoc */
  public createGpDirector(apValues: APValues): APGPDirector {
    return new APGPDirector(this.bus, apValues);
  }

  /** @inheritdoc */
  public createGsDirector(apValues: APValues): APGSDirector {
    return new APGSDirector(this.bus, apValues);
  }

  /** @inheritdoc */
  public createNavToNavManager(apValues: APValues): GarminNavToNavManager {
    return new GarminNavToNavManager(this.bus, this.flightPlanner, apValues);
  }

  /**
   * Calculates intercept angles for radio nav.
   * @param distanceToSource The distance from the plane to the source of the navigation signal, in nautical miles.
   * @param deflection The lateral deflection of the desired track relative to the plane, normalized from `-1` to `1`.
   * Negative values indicate that the desired track is to the left of the plane.
   * @param tas The true airspeed of the plane, in knots.
   * @param isLoc Whether the source of the navigation signal is a localizer. Defaults to `false`.
   * @returns The intercept angle, in degrees, to capture the desired track from the navigation signal.
   */
  private navInterceptCurve(distanceToSource: number, deflection: number, tas: number, isLoc?: boolean): number {
    if (isLoc) {
      return this.localizerInterceptCurve(distanceToSource, deflection, tas);
    } else {
      // max deflection is 2.5 degrees or 0.0436332 radians
      const fullScaleDeflectionInRadians = 0.0436332;
      return this.defaultInterceptCurve(Math.sin(fullScaleDeflectionInRadians * -deflection) * distanceToSource, tas);
    }
  }

  /**
   * Calculates intercept angles for LNAV.
   * @param dtk The desired track, in degrees true.
   * @param xtk The cross-track error, in nautical miles. Negative values indicate that the plane is to the left of the
   * desired track.
   * @param tas The true airspeed of the plane, in knots.
   * @returns The intercept angle, in degrees, to capture the desired track from the navigation signal.
   */
  private lnavInterceptCurve(dtk: number, xtk: number, tas: number): number {
    return this.defaultInterceptCurve(xtk, tas);
  }

  /**
   * Calculates intercept angles for localizers.
   * @param distanceToSource The distance from the plane to the localizer, in nautical miles.
   * @param deflection The lateral deflection of the desired track relative to the plane, normalized from `-1` to `1`.
   * Negative values indicate that the desired track is to the left of the plane.
   * @param tas The true airspeed of the plane, in knots.
   * @returns The intercept angle, in degrees, to capture the localizer course.
   */
  private localizerInterceptCurve(distanceToSource: number, deflection: number, tas: number): number {
    // max deflection is 2.5 degrees or 0.0436332 radians
    const fullScaleDeflectionInRadians = 0.0436332;

    const xtkNM = Math.sin(fullScaleDeflectionInRadians * -deflection) * distanceToSource;
    const xtkMeters = UnitType.NMILE.convertTo(xtkNM, UnitType.METER);
    const xtkMetersAbs = Math.abs(xtkMeters);

    if (xtkMetersAbs < 4) {
      return 0;
    } else if (xtkMetersAbs < 250) {
      return NavMath.clamp(Math.abs(xtkNM * 75), 1, 5);
    }

    const turnRadiusMeters = NavMath.turnRadius(tas, 22.5);
    const interceptAngle = this.calculateTurnBasedInterceptAngle(turnRadiusMeters, xtkMeters);

    return NavMath.clamp(interceptAngle, 0, 20);
  }

  /**
   * Calculates non-localizer intercept angles.
   * @param xtk The cross-track error, in nautical miles. Negative values indicate that the plane is to the left of the
   * desired track.
   * @param tas The true airspeed of the plane, in knots.
   * @returns The intercept angle, in degrees, to capture the desired track.
   */
  private defaultInterceptCurve(xtk: number, tas: number): number {
    const xtkMeters = UnitType.NMILE.convertTo(xtk, UnitType.METER);
    const xtkMetersAbs = Math.abs(xtkMeters);

    if (xtkMetersAbs < 250) {
      return NavMath.clamp(Math.abs(xtk * 75), 0, 5);
    }

    const turnRadiusMeters = NavMath.turnRadius(tas, 22.5);
    const interceptAngle = this.calculateTurnBasedInterceptAngle(turnRadiusMeters, xtkMeters);

    return NavMath.clamp(interceptAngle, 0, 45);
  }

  /**
   * Calculates an intercept angle to a track such that the intercept course, projected forward from the plane's
   * position, intercepts the desired track at the same point as a constant-radius turn overlapping the plane's
   * position configured to be tangent to the desired track. This has the effect of producing an intercept angle which
   * guarantees a no-overshoot intercept for all initial ground tracks for which a no-overshoot intercept is possible
   * given the specified turn radius and cross-track error.
   *
   * If the magnitude of the cross-track error is greater than twice the turn radius, no constant-radius turn
   * overlapping the plane's position will be tangent to the desired track; in this case the maximum possible intercept
   * angle of 90 degrees is returned.
   * @param turnRadius The turn radius, in the same units as `xtk`.
   * @param xtk The cross-track error, in the same units as `turnRadius`.
   * @returns The calculated intercept angle, in degrees.
   */
  private calculateTurnBasedInterceptAngle(turnRadius: number, xtk: number): number {
    return UnitType.RADIAN.convertTo(Math.acos(NavMath.clamp((turnRadius - Math.abs(xtk)) / turnRadius, -1, 1)), UnitType.DEGREE) / 2;
  }
}

