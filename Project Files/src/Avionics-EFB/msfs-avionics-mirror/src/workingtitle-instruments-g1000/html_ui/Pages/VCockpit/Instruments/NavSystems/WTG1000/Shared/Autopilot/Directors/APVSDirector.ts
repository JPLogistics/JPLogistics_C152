/// <reference types="msfstypes/JS/simvar" />

import { MathUtils, UnitType } from 'msfssdk';
import { EventBus, SimVarValueType } from 'msfssdk/data';
import { GNSSEvents } from 'msfssdk/instruments';
import { PlaneDirector, DirectorState, APValues } from 'msfssdk/autopilot';

/**
 * A vertical speed autopilot director.
 */
export class APVSDirector implements PlaneDirector {

  public state: DirectorState;

  /** A callback called when the director activates. */
  public onActivate?: () => void;

  /** A callback called when the director arms. */
  public onArm?: () => void;

  private groundSpeed = 0;
  private selectedVS = 0;

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

    apValues.selectedVerticalSpeed.sub((vs) => {
      this.selectedVS = vs;
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
    Coherent.call('AP_VS_VAR_SET_ENGLISH', 1, Simplane.getVerticalSpeed());
    SimVar.SetSimVarValue('AUTOPILOT VERTICAL HOLD', 'Bool', true);
  }

  /**
   * Arms this director.
   * This director has no armed mode, so it activates immediately.
   */
  public arm(): void {
    if (this.state == DirectorState.Inactive) {
      this.activate();
    }
  }

  /**
   * Deactivates this director.
   */
  public deactivate(): void {
    this.state = DirectorState.Inactive;
    SimVar.SetSimVarValue('AUTOPILOT VERTICAL HOLD', 'Bool', false);
  }

  /**
   * Updates this director.
   */
  public update(): void {
    if (this.state === DirectorState.Active) {
      this.setPitch(this.getDesiredPitch());
    }
  }

  /**
   * Gets a desired pitch from the selected vs value.
   * @returns The desired pitch angle.
   */
  private getDesiredPitch(): number {
    //We need the instant AOA and VS here so we're avoiding the bus
    const aoa = SimVar.GetSimVarValue('INCIDENCE ALPHA', SimVarValueType.Degree);
    // const vs = SimVar.GetSimVarValue('VERTICAL SPEED', SimVarValueType.FPM);

    // const currentfpa = this.getFpa(this.groundSpeed / 60, vs);
    const desiredPitch = this.getFpa(UnitType.NMILE.convertTo(this.groundSpeed / 60, UnitType.FOOT), this.selectedVS);
    return MathUtils.clamp(aoa + (isNaN(desiredPitch) ? 10 : desiredPitch), -10, 10);
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