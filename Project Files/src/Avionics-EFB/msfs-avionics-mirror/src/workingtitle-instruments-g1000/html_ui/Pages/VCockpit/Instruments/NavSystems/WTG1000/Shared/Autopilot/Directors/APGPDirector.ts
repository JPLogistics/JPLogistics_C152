/// <reference types="msfstypes/JS/simvar" />

import { MathUtils } from 'msfssdk';
import { EventBus, SimVarValueType } from 'msfssdk/data';
import { PlaneDirector, DirectorState, APValues, APLateralModes, VNavApproachGuidanceMode } from 'msfssdk/autopilot';

import { VNavDirector } from './VNavDirector';
import { VNavSimVars } from '../VNavSimVars';

/**
 * An RNAV LPV glidepath autopilot director.
 */
export class APGPDirector implements PlaneDirector {

  public state: DirectorState;

  /** A callback called when the director activates. */
  public onActivate?: () => void;

  /** A callback called when the director arms. */
  public onArm?: () => void;

  private lpvDeviation = 0;

  /**
   * Creates an instance of the LateralDirector.
   * @param bus The event bus to use with this instance.
   * @param apValues are the ap selected values for the autopilot.
   * @param vnavDirector is the vnav director (required to fly LPV approaches)
   */
  constructor(private readonly bus: EventBus, private readonly apValues: APValues, private readonly vnavDirector: VNavDirector) {
    this.state = DirectorState.Inactive;
    vnavDirector.lpvDeviation.sub((dev) => {
      this.lpvDeviation = dev;
    });
    apValues.approachHasGP.sub(v => {
      if (this.state !== DirectorState.Inactive && !v) {
        this.deactivate();
      }
    });
  }

  /**
   * Activates this director.
   */
  public activate(): void {
    this.state = DirectorState.Active;
    SimVar.SetSimVarValue(VNavSimVars.ApproachMode, SimVarValueType.Number, VNavApproachGuidanceMode.GPActive);
    if (this.onActivate !== undefined) {
      this.onActivate();
    }
    SimVar.SetSimVarValue('AUTOPILOT GLIDESLOPE ACTIVE', 'Bool', true);
    SimVar.SetSimVarValue('AUTOPILOT APPROACH ACTIVE', 'Bool', true);
    SimVar.SetSimVarValue('AUTOPILOT GLIDESLOPE ARM', 'Bool', false);
  }

  /**
   * Arms this director.
   */
  public arm(): void {
    if (this.state === DirectorState.Inactive) {
      this.state = DirectorState.Armed;
      SimVar.SetSimVarValue(VNavSimVars.ApproachMode, SimVarValueType.Number, VNavApproachGuidanceMode.GPArmed);
      if (this.onArm !== undefined) {
        this.onArm();
      }
      SimVar.SetSimVarValue('AUTOPILOT GLIDESLOPE ARM', 'Bool', true);
      SimVar.SetSimVarValue('AUTOPILOT GLIDESLOPE ACTIVE', 'Bool', false);
      SimVar.SetSimVarValue('AUTOPILOT APPROACH ACTIVE', 'Bool', true);
    }
  }

  /**
   * Deactivates this director.
   */
  public deactivate(): void {
    this.state = DirectorState.Inactive;
    SimVar.SetSimVarValue(VNavSimVars.ApproachMode, SimVarValueType.Number, VNavApproachGuidanceMode.None);
    SimVar.SetSimVarValue('AUTOPILOT GLIDESLOPE ARM', 'Bool', false);
    SimVar.SetSimVarValue('AUTOPILOT GLIDESLOPE ACTIVE', 'Bool', false);
    SimVar.SetSimVarValue('AUTOPILOT APPROACH ACTIVE', 'Bool', false);
  }

  /**
   * Updates this director.
   */
  public update(): void {
    if (this.state === DirectorState.Armed) {
      if (this.apValues.lateralActive.get() === APLateralModes.GPSS && this.lpvDeviation <= 100 && this.lpvDeviation >= -15 && this.vnavDirector.calculator.lpvFpa !== 0) {
        this.activate();
      }
    }
    if (this.state === DirectorState.Active) {
      if (this.apValues.lateralActive.get() !== APLateralModes.GPSS) {
        this.deactivate();
      }
      this.setPitch(this.getDesiredPitch());
    }
  }

  /**
   * Gets a desired pitch from the selected vs value.
   * @returns The desired pitch angle.
   */
  private getDesiredPitch(): number {
    const fpaPercentage = Math.max(this.lpvDeviation / -100, -1) + 1;
    const desiredPitch = (this.vnavDirector.calculator.lpvFpa * fpaPercentage) * -1;

    //We need the instant AOA here so we're avoiding the bus
    const aoa = SimVar.GetSimVarValue('INCIDENCE ALPHA', SimVarValueType.Degree);
    return aoa + MathUtils.clamp(desiredPitch, -6, 2);
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