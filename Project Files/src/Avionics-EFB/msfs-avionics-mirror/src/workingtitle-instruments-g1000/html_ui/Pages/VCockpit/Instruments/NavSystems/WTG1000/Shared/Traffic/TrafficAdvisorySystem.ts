import { NumberUnitInterface, UnitFamily, UnitType } from 'msfssdk';
import { ADCEvents, TrafficContact } from 'msfssdk/instruments';
import { AbstractTCASIntruder, AbstractTCASSensitivity, TCAS, TCASAlertLevel, TCASOperatingMode } from 'msfssdk/traffic';

import { CDIScaleLabel, LNavSimVars } from '../Autopilot/LNavSimVars';
import { TrafficOperatingModeSetting, TrafficUserSettings, TrafficUserSettingTypes } from './TrafficUserSettings';

/**
 * Traffic Advisory System for the G1000.
 */
export class TrafficAdvisorySystem extends TCAS<TASIntruder, TASSensitivity> {
  private static readonly TAKEOFF_OPER_DELAY = 8000; // milliseconds
  private static readonly LANDING_STANDBY_DELAY = 24000; // milliseconds

  private readonly operatingModeSetting = TrafficUserSettings.getManager(this.bus).getSetting('trafficOperatingMode');

  private cdiScalingLabel: CDIScaleLabel = CDIScaleLabel.Enroute;

  private operatingModeChangeTimer: NodeJS.Timeout | null = null;

  // eslint-disable-next-line jsdoc/require-jsdoc
  protected createSensitivity(): TASSensitivity {
    return new TASSensitivity();
  }

  // eslint-disable-next-line jsdoc/require-jsdoc
  public init(): void {
    super.init();

    this.bus.getSubscriber<LNavSimVars>().on('lnavCdiScalingLabel').whenChanged().handle(label => { this.cdiScalingLabel = label; });

    this.bus.getSubscriber<TrafficUserSettingTypes>().on('trafficOperatingMode').whenChanged().handle((value) => {
      this.operatingModeSub.set(value === TrafficOperatingModeSetting.Operating ? TCASOperatingMode.TAOnly : TCASOperatingMode.Standby);
    });

    this.operatingModeSub.sub(() => this.cancelOperatingModeChange());
    this.bus.getSubscriber<ADCEvents>().on('on_ground').whenChanged().handle(this.onGroundChanged.bind(this));
  }

  // eslint-disable-next-line jsdoc/require-jsdoc
  protected createIntruderEntry(contact: TrafficContact): TASIntruder {
    return new TASIntruder(contact);
  }

  // eslint-disable-next-line jsdoc/require-jsdoc
  protected updateIntruderAlertLevel(simTime: number, intruder: TASIntruder): void {
    intruder.updateAlertLevel(simTime, this.isOwnAirplaneOnGround);
  }

  // eslint-disable-next-line jsdoc/require-jsdoc
  protected updateSensitivity(): void {
    // TODO: Add radar alt data for planes that have it
    this.sensitivity.update(this.ownAirplaneSubs.altitude.get(), this.cdiScalingLabel);
  }

  /**
   * A callback which is called when whether own airplane is on the ground changes.
   * @param isOnGround Whether own airplane is on the ground.
   */
  private onGroundChanged(isOnGround: boolean): void {
    this.cancelOperatingModeChange();

    if (isOnGround) {
      if (this.operatingModeSetting.value === TrafficOperatingModeSetting.Operating) {
        this.scheduleOperatingModeChange(TrafficOperatingModeSetting.Standby, TrafficAdvisorySystem.LANDING_STANDBY_DELAY);
      }
    } else {
      if (this.operatingModeSetting.value === TrafficOperatingModeSetting.Standby) {
        this.scheduleOperatingModeChange(TrafficOperatingModeSetting.Operating, TrafficAdvisorySystem.TAKEOFF_OPER_DELAY);
      }
    }
  }

  /**
   * Schedules a delayed operating mode change.
   * @param toMode The target operating mode.
   * @param delay The delay, in milliseconds.
   */
  private scheduleOperatingModeChange(toMode: TrafficOperatingModeSetting, delay: number): void {
    this.cancelOperatingModeChange();

    this.operatingModeChangeTimer = setTimeout(() => {
      this.operatingModeSetting.value = toMode;
      this.operatingModeChangeTimer = null;
    }, delay);
  }

  /**
   * Cancels the currently scheduled operating mode change, if one exists.
   */
  private cancelOperatingModeChange(): void {
    if (this.operatingModeChangeTimer === null) {
      return;
    }

    clearTimeout(this.operatingModeChangeTimer);
    this.operatingModeChangeTimer = null;
  }
}

/**
 * An intruder tracked by the the G1000 TAS.
 */
class TASIntruder extends AbstractTCASIntruder {
  private static readonly TA_ON_HYSTERESIS = 2000; // ms
  private static readonly TA_OFF_HYSTERESIS = 8000; // ms

  private readonly lastHorizontalSep = UnitType.NMILE.createNumber(0);
  private readonly lastVerticalSep = UnitType.FOOT.createNumber(0);

  private taOnTime = 0;
  private taOffTime = 0;

  /**
   * Updates this intruder's assigned alert level.
   * @param simTime The current sim time.
   * @param isOnGround Whether the own airplane is on the ground.
   */
  public updateAlertLevel(simTime: number, isOnGround: boolean): void {
    if (!this.isPredictionValid) {
      this.alertLevel.set(TCASAlertLevel.None);
    }

    let isTA = false;
    const currentTime = simTime;
    const currentAlertLevel = this.alertLevel.get();
    if (isOnGround) {
      // suppress traffic advisories while own aircraft is on the ground
      if (currentAlertLevel === TCASAlertLevel.TrafficAdvisory) {
        this.taOffTime = currentTime;
      }
    } else if (this.tcaNorm <= 1) {
      if (currentAlertLevel !== TCASAlertLevel.TrafficAdvisory) {
        const dt = currentTime - this.taOffTime;
        if (dt >= TASIntruder.TA_ON_HYSTERESIS) {
          isTA = true;
          this.taOnTime = currentTime;
        }
      } else {
        isTA = true;
      }
    } else if (currentAlertLevel === TCASAlertLevel.TrafficAdvisory) {
      const dt = currentTime - this.taOnTime;
      if (dt >= TASIntruder.TA_OFF_HYSTERESIS) {
        this.taOffTime = currentTime;
      } else {
        isTA = true;
      }
    }

    if (isTA) {
      this.alertLevel.set(TCASAlertLevel.TrafficAdvisory);
    } else {
      this.updateNonTAAlertLevel(simTime);
    }
  }

  /**
   * Updates this intruder's assigned alert level, assuming it does not quality for a traffic advisory.
   * @param simTime The current sim time.
   */
  private updateNonTAAlertLevel(simTime: number): void {
    this.predictSeparation(simTime, this.lastHorizontalSep, this.lastVerticalSep);
    if (
      this.lastHorizontalSep.number <= 6 // 6 nm
      && this.lastVerticalSep.number <= 1200 // 1200 ft
    ) {
      this.alertLevel.set(TCASAlertLevel.ProximityAdvisory);
    } else {
      this.alertLevel.set(TCASAlertLevel.None);
    }
  }
}

/**
 * Sensitivity settings for the the G1000 TAS.
 */
class TASSensitivity extends AbstractTCASSensitivity {
  private static readonly LEVELS = [
    {
      lookaheadTime: 20,
      protectedRadius: 0.2,
      protectedHeight: 850
    },
    {
      lookaheadTime: 25,
      protectedRadius: 0.2,
      protectedHeight: 850
    },
    {
      lookaheadTime: 30,
      protectedRadius: 0.35,
      protectedHeight: 850
    },
    {
      lookaheadTime: 40,
      protectedRadius: 0.55,
      protectedHeight: 850
    },
    {
      lookaheadTime: 45,
      protectedRadius: 0.8,
      protectedHeight: 850
    },
    {
      lookaheadTime: 48,
      protectedRadius: 1.1,
      protectedHeight: 850
    },
    {
      lookaheadTime: 48,
      protectedRadius: 1.1,
      protectedHeight: 1200
    }
  ]

  /**
   * Updates the sensitivity level.
   * @param altitude The indicated altitude of the own airplane.
   * @param cdiScalingLabel The CDI scaling sensitivity of the own airplane.
   * @param radarAltitude The radar altitude of the own airplane.
   */
  public update(altitude: NumberUnitInterface<UnitFamily.Distance>, cdiScalingLabel: CDIScaleLabel, radarAltitude?: NumberUnitInterface<UnitFamily.Distance>): void {
    const altFeet = altitude.asUnit(UnitType.FOOT);
    const radarAltFeet = radarAltitude?.asUnit(UnitType.FOOT);

    let isApproach = false;
    switch (cdiScalingLabel) {
      case CDIScaleLabel.LNav:
      case CDIScaleLabel.LNavPlusV:
      case CDIScaleLabel.LNavVNav:
      case CDIScaleLabel.LP:
      case CDIScaleLabel.LPPlusV:
      case CDIScaleLabel.LPV:
      case CDIScaleLabel.MissedApproach:
        isApproach = true;
    }

    let level: number;
    if (
      (radarAltFeet === undefined || radarAltFeet > 2350)
      && (!isApproach && cdiScalingLabel !== CDIScaleLabel.Terminal)
    ) {
      if (altFeet > 42000) {
        level = 6;
      } else if (altFeet > 20000) {
        level = 5;
      } else if (altFeet > 10000) {
        level = 4;
      } else if (altFeet > 5000) {
        level = 3;
      } else {
        level = 2;
      }
    } else if (
      cdiScalingLabel === CDIScaleLabel.Terminal
      || (radarAltFeet !== undefined && radarAltFeet > 1000)
    ) {
      level = 1;
    } else {
      level = 0;
    }

    const parameters = TASSensitivity.LEVELS[level];
    this.lookaheadTime.set(parameters.lookaheadTime);
    this.protectedRadius.set(parameters.protectedRadius);
    this.protectedHeight.set(parameters.protectedHeight);
  }
}
