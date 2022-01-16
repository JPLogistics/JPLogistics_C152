/// <reference types="msfstypes/JS/simvar" />

import { MathUtils, NavMath, UnitType } from 'msfssdk';
import { EventBus, SimVarValueType } from 'msfssdk/data';
import { ADCEvents, GNSSEvents } from 'msfssdk/instruments';
import { PlaneDirector, DirectorState, APValues } from 'msfssdk/autopilot';

/**
 * An altitude hold autopilot director.
 */
export class APAltDirector implements PlaneDirector {

  public state: DirectorState;

  /** A callback called when the director activates. */
  public onActivate?: () => void;

  /** A callback called when the director arms. */
  public onArm?: () => void;

  private groundSpeed = 0;
  private capturedAltitude = 0;
  private indicatedAltitude = 0;

  /**
   * Creates an instance of the LateralDirector.
   * @param bus The event bus to use with this instance.
   * @param apValues are the ap selected values for the autopilot.
   */
  constructor(private readonly bus: EventBus, apValues: APValues) {
    this.state = DirectorState.Inactive;

    this.bus.getSubscriber<GNSSEvents>().on('ground_speed').withPrecision(0).handle((g) => {
      this.groundSpeed = g;
    });

    this.bus.getSubscriber<ADCEvents>().on('alt').withPrecision(0).handle((alt) => {
      this.indicatedAltitude = alt;
    });

    apValues.capturedAltitude.sub((cap) => {
      this.capturedAltitude = Math.round(cap);
    });
  }

  /**
   * Activates this director.
   */
  public activate(): void {
    this.state = DirectorState.Active;
    if (this.onActivate !== undefined) {
      this.onActivate();
    }
    SimVar.SetSimVarValue('AUTOPILOT ALTITUDE LOCK', 'Bool', true);
  }

  /**
   * Arms this director.
   * This director has no armed mode, so it activates immediately.
   */
  public arm(): void {
    this.state = DirectorState.Armed;
    if (this.onArm !== undefined) {
      this.onArm();
    }
  }

  /**
   * Deactivates this director.
   */
  public deactivate(): void {
    this.state = DirectorState.Inactive;
    SimVar.SetSimVarValue('AUTOPILOT ALTITUDE LOCK', 'Bool', false);
  }

  /**
   * Updates this director.
   */
  public update(): void {
    if (this.state === DirectorState.Active) {
      this.holdAltitude(this.capturedAltitude);
    }
    if (this.state === DirectorState.Armed) {
      this.tryActivate();
    }
  }

  /**
   * Attempts to activate altitude capture.
   */
  private tryActivate(): void {
    const deviationFromTarget = Math.abs(this.capturedAltitude - this.indicatedAltitude);

    if (deviationFromTarget <= 20) {
      this.activate();
    }
  }

  /**
   * Holds a captured altitude.
   * @param targetAltitude is the captured targed altitude
   */
  private holdAltitude(targetAltitude: number): void {
    const deltaAlt = this.indicatedAltitude - targetAltitude;
    let setVerticalSpeed = 0;
    const correction = MathUtils.clamp(10 * Math.abs(deltaAlt), 100, 500);
    if (deltaAlt > 10) {
      setVerticalSpeed = 0 - correction;
    } else if (deltaAlt < -10) {
      setVerticalSpeed = correction;
    }
    this.setPitch(this.getDesiredPitch(setVerticalSpeed));
  }

  /**
   * Gets a desired pitch from the selected vs value.
   * @param vs target vertical speed.
   * @returns The desired pitch angle.
   */
  private getDesiredPitch(vs: number): number {
    //We need the instant AOA and VS here so we're avoiding the bus
    const aoa = SimVar.GetSimVarValue('INCIDENCE ALPHA', SimVarValueType.Degree);
    const desiredPitch = this.getFpa(UnitType.NMILE.convertTo(this.groundSpeed / 60, UnitType.FOOT), vs);
    return NavMath.clamp(aoa + desiredPitch, -10, 10);
  }

  /**
   * Gets a desired fpa.
   * @param distance is the distance traveled per minute.
   * @param altitude is the vertical speed per minute.
   * @returns The desired pitch angle.
   */
  private getFpa(distance: number, altitude: number): number {
    return UnitType.RADIAN.convertTo(Math.atan(altitude / distance), UnitType.DEGREE);
  }

  /**
   * Sets the desired AP pitch angle.
   * @param targetPitch The desired AP pitch angle.
   */
  private setPitch(targetPitch: number): void {
    if (isFinite(targetPitch)) {
      SimVar.SetSimVarValue('AUTOPILOT PITCH HOLD REF', SimVarValueType.Degree, -targetPitch);
    }
  }
}