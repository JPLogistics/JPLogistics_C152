import { Subject, UnitType } from 'msfssdk';
import { APAltitudeModes, APLateralModes, APVerticalModes, Autopilot } from 'msfssdk/autopilot';
import { APEvents } from 'msfssdk/instruments';
import { Fms } from '../FlightPlan/Fms';
import { G1000ControlEvents } from '../G1000Events';
import { AltitudeSelectManager } from './AltitudeSelectManager';
import { FmaData } from './FmaData';

/**
 * A G1000 NXi autopilot.
 */
export class G1000Autopilot extends Autopilot {
  private static readonly MIN_ALT_SELECT = UnitType.FOOT.createNumber(-1000);
  private static readonly MAX_ALT_SELECT = UnitType.FOOT.createNumber(50000);

  public readonly externalAutopilotInstalled = Subject.create<boolean>(false);
  protected readonly lateralArmedModeSubject = Subject.create<APLateralModes>(APLateralModes.NONE);
  protected readonly altArmedSubject = Subject.create<boolean>(false);

  protected readonly altSelectManager = new AltitudeSelectManager(this.bus, G1000Autopilot.MIN_ALT_SELECT, G1000Autopilot.MAX_ALT_SELECT);


  /** @inheritdoc */
  protected onAfterUpdate(): void {
    if (!this.externalAutopilotInstalled.get()) {
      this.updateFma();
    } else {
      this.lateralArmedModeSubject.set(this.lateralArmed);
      this.altArmedSubject.set(this.altCapArmed);
    }
    //this.updateFma();

  }

  /** @inheritdoc */
  protected onInitialized(): void {
    this.bus.pub('vnav_enabled', true);

    this.monitorAdditionalEvents();
  }

  /** @inheritdoc */
  protected monitorAdditionalEvents(): void {
    //check for KAP140 installed
    this.bus.getSubscriber<APEvents>().on('kap_140_installed').handle(v => {
      this.externalAutopilotInstalled.set(v);
      if (v) {
        this.config.defaultVerticalMode = APVerticalModes.VS;
        this.config.defaultLateralMode = APLateralModes.LEVEL;
        this.altSelectManager.setEnabled(false);
        this.handleApFdStateChange();
        this.updateFma(true);
        Fms.g1000EvtPub.publishEvent('fd_not_installed', true);
      }
    });
  }

  /**
   * Publishes data for the FMA.
   * @param clear Is to clear the FMA
   */
  private updateFma(clear = false): void {
    const publisher = this.bus.getPublisher<G1000ControlEvents>();
    const data: FmaData = {
      verticalActive: clear ? APVerticalModes.NONE : this.verticalActive,
      verticalArmed: clear ? APVerticalModes.NONE : this.verticalArmed,
      verticalApproachArmed: clear ? APVerticalModes.NONE : this.verticalApproachArmed,
      verticalAltitudeArmed: clear ? APAltitudeModes.NONE : this.verticalAltitudeArmed,
      altitideCaptureArmed: clear ? false : this.altCapArmed,
      altitideCaptureValue: clear ? -1 : this.apValues.capturedAltitude.get(),
      lateralActive: clear ? APLateralModes.NONE : this.lateralActive,
      lateralArmed: clear ? APLateralModes.NONE : this.lateralArmed,
      lateralModeFailed: clear ? false : this.lateralModeFailed
    };
    publisher.pub('fma_modes', data, true);
  }
}