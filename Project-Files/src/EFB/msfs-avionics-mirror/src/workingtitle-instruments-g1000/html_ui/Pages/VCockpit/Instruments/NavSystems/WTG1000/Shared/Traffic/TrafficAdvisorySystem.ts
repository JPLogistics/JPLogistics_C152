import { NumberUnitInterface, Subscribable, UnitFamily, UnitType } from 'msfssdk';
import { TrafficContact } from 'msfssdk/instruments';
import { AbstractTCASIntruder, AbstractTCASSensitivity, TCAS, TCASAlertLevel, TCASOperatingMode } from 'msfssdk/traffic';
import { CDIScaleLabel, LNavDataEvents } from 'garminsdk/navigation';
import { TrafficOperatingModeSetting, TrafficUserSettings, TrafficUserSettingTypes } from './TrafficUserSettings';

/**
 * Traffic Advisory System for the G1000.
 */
export class TrafficAdvisorySystem extends TCAS<TASIntruder, TASSensitivity> {
  private static readonly TA_ON_HYSTERESIS = 2000; // ms
  private static readonly TA_OFF_HYSTERESIS = 8000; // ms
  private static readonly TAKEOFF_OPER_DELAY = 8000; // milliseconds
  private static readonly LANDING_STANDBY_DELAY = 24000; // milliseconds

  private readonly operatingModeSetting = TrafficUserSettings.getManager(this.bus).getSetting('trafficOperatingMode');

  private cdiScalingLabel: CDIScaleLabel = CDIScaleLabel.Enroute;

  private operatingModeChangeTimer: NodeJS.Timeout | null = null;

  /** @inheritdoc */
  protected createSensitivity(): TASSensitivity {
    return new TASSensitivity();
  }

  /** @inheritdoc */
  public init(): void {
    super.init();

    this.bus.getSubscriber<LNavDataEvents>().on('lnavdata_cdi_scale_label').whenChanged().handle(label => { this.cdiScalingLabel = label; });

    this.bus.getSubscriber<TrafficUserSettingTypes>().on('trafficOperatingMode').whenChanged().handle((value) => {
      this.operatingModeSub.set(value === TrafficOperatingModeSetting.Operating ? TCASOperatingMode.TAOnly : TCASOperatingMode.Standby);
    });

    this.operatingModeSub.sub(this.cancelOperatingModeChange.bind(this));
    this.ownAirplaneSubs.isOnGround.sub(this.onGroundChanged.bind(this));
  }

  /** @inheritdoc */
  protected createIntruderEntry(contact: TrafficContact): TASIntruder {
    return new TASIntruder(contact, this.simTime);
  }

  /** @inheritdoc */
  protected updateSensitivity(): void {
    // TODO: Add radar alt data for planes that have it
    this.sensitivity.update(this.ownAirplaneSubs.altitude.get(), this.cdiScalingLabel);
  }

  /** @inheritdoc */
  protected canIssueTrafficAdvisory(simTime: number, intruder: TASIntruder): boolean {
    if (this.ownAirplaneSubs.isOnGround.get()) {
      return false;
    }

    if (intruder.alertLevel.get() !== TCASAlertLevel.TrafficAdvisory) {
      const dt = simTime - intruder.taOffTime;
      return dt < 0 || dt >= TrafficAdvisorySystem.TA_ON_HYSTERESIS;
    }

    return true;
  }

  /** @inheritdoc */
  protected canCancelTrafficAdvisory(simTime: number, intruder: TASIntruder): boolean {
    if (this.ownAirplaneSubs.isOnGround.get()) {
      return true;
    }

    const dt = simTime - intruder.taOnTime;
    return dt < 0 || dt >= TrafficAdvisorySystem.TA_OFF_HYSTERESIS;
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
  public taOnTime = 0;
  public taOffTime = 0;

  /**
   * Constructor.
   * @param contact The traffic contact associated with this intruder.
   * @param simTime A subscribable which provides the current sim time, as a UNIX timestamp in milliseconds.
   */
  constructor(contact: TrafficContact, private readonly simTime: Subscribable<number>) {
    super(contact);

    this.alertLevel.sub(this.onAlertLevelChanged.bind(this));
  }

  /**
   * Responds to changes in this intruder's alert level.
   * @param alertLevel The new alert level.
   */
  private onAlertLevelChanged(alertLevel: TCASAlertLevel): void {
    if (alertLevel === TCASAlertLevel.TrafficAdvisory) {
      this.taOnTime = this.simTime.get();
    } else {
      this.taOffTime = this.simTime.get();
    }
  }
}

/**
 * Sensitivity settings for the the G1000 TAS.
 */
class TASSensitivity extends AbstractTCASSensitivity {
  // TA sensitivity levels (seconds/NM/feet).
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
  ];

  /** @inheritdoc */
  constructor() {
    super();

    this.parametersPA.protectedRadius.set(6, UnitType.NMILE);
    this.parametersPA.protectedHeight.set(1200, UnitType.FOOT);
  }

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
    this.parametersTA.lookaheadTime.set(parameters.lookaheadTime, UnitType.SECOND);
    this.parametersTA.protectedRadius.set(parameters.protectedRadius, UnitType.NMILE);
    this.parametersTA.protectedHeight.set(parameters.protectedHeight, UnitType.FOOT);
  }
}
