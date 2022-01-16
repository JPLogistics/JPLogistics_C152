/// <reference types="msfstypes/JS/simvar" />

import { MathUtils, UnitType, PidController } from 'msfssdk';
import { EventBus, SimVarValueType } from 'msfssdk/data';
import { ADCEvents } from 'msfssdk/instruments';
import { PlaneDirector, DirectorState, APValues } from 'msfssdk/autopilot';

/**
 * A Flight Level Change autopilot director.
 */
export class APFLCDirector implements PlaneDirector {

  public state: DirectorState;

  /** A callback called when the director activates. */
  public onActivate?: () => void;

  /** A callback called when the director arms. */
  public onArm?: () => void;

  private _lastTime = 0;
  private currentIas = 0;
  private selectedIas = 0;
  private selectedAltitude = 0;
  private currentAltitude = 0;
  private currentPitch = 0;
  private accelerationController = new PidController(.3, 0, 0.5, 10, -10);
  private pitchController = new PidController(1.5, 0, 0, 15, -15);

  /**
   * Creates an instance of the LateralDirector.
   * @param bus The event bus to use with this instance.
   * @param apValues is the AP selected values subject.
   */
  constructor(private readonly bus: EventBus, apValues: APValues) {
    this.state = DirectorState.Inactive;

    const adc = this.bus.getSubscriber<ADCEvents>();
    adc.on('alt').withPrecision(0).handle((alt) => {
      this.currentAltitude = alt;
    });
    adc.on('ias').withPrecision(2).handle((ias) => {
      this.currentIas = ias;
    });
    adc.on('pitch_deg').withPrecision(1).handle((pitch) => {
      this.currentPitch = -pitch;
    });

    apValues.selectedIas.sub((ias) => {
      this.selectedIas = ias;
    });
    apValues.selectedAltitude.sub((alt) => {
      this.selectedAltitude = alt;
    });
  }

  /**
   * Activates this director.
   */
  public activate(): void {
    this.state = DirectorState.Active;
    this.initialize();
    if (this.onActivate !== undefined) {
      this.onActivate();
    }
    SimVar.SetSimVarValue('AUTOPILOT FLIGHT LEVEL CHANGE', 'Bool', true);
    // Make sure we sync the selected IAS when FLC activates.
    SimVar.SetSimVarValue('K:AP_SPD_VAR_SET', 'number', this.currentIas);
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
    SimVar.SetSimVarValue('AUTOPILOT FLIGHT LEVEL CHANGE', 'Bool', false);
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
   * Initializes this director on activation.
   */
  private initialize(): void {
    this._lastTime = 0;
    this.accelerationController.reset();
    this.pitchController.reset();
  }

  /**
   * Gets a desired pitch from the selected vs value.
   * @returns The desired pitch angle.
   */
  private getDesiredPitch(): number {
    const time = performance.now() / 1000;
    let dt = time - this._lastTime;
    if (this._lastTime === 0) {
      dt = 0;
    }

    //step 1 - we want to find the IAS error from target and set a target acceleration
    const iasError = this.currentIas - this.selectedIas;
    const targetAcceleration = this.accelerationController.getOutput(dt, -iasError);

    //step 2 - we want to find the current acceleration, feed that to the pid to manage to the target acceleration
    const acceleration = UnitType.FOOT.convertTo(SimVar.GetSimVarValue('ACCELERATION BODY Z', 'feet per second squared'), UnitType.NMILE) * 3600;
    const accelerationError = acceleration - targetAcceleration;
    const pitchCorrection = this.pitchController.getOutput(dt, accelerationError);

    const aoa = SimVar.GetSimVarValue('INCIDENCE ALPHA', SimVarValueType.Degree);
    this._lastTime = time;
    const targetPitch = isNaN(pitchCorrection) ? this.currentPitch - aoa : (this.currentPitch - aoa) + pitchCorrection;

    if (this.selectedAltitude > this.currentAltitude) {
      return MathUtils.clamp(targetPitch + aoa, aoa, 15);
    } else {
      return MathUtils.clamp(targetPitch + aoa, -15, aoa);
    }
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