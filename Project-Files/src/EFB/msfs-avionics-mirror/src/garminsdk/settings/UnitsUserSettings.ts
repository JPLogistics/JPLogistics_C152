import { NavAngleUnit, Subject, Subscribable, Unit, UnitFamily, UnitType } from 'msfssdk';
import { EventBus } from 'msfssdk/data';
import { DefaultUserSettingManager, UserSettingDefinition, UserSettingManagerEntry, UserSettingManagerSyncData } from 'msfssdk/settings';

/**
 * Setting modes for nav angle units.
 */
export enum UnitsNavAngleSettingMode {
  Magnetic = 'magnetic',
  True = 'true'
}

/**
 * Setting modes for distance/speed units.
 */
export enum UnitsDistanceSettingMode {
  Metric = 'metric',
  Nautical = 'nautical'
}

/**
 * Setting modes for altitude/vertical speed units.
 */
export enum UnitsAltitudeSettingMode {
  Feet = 'feet',
  Meters = 'meters'
}

/**
 * Setting modes for temperature units.
 */
export enum UnitsTemperatureSettingMode {
  Celsius = 'celsius',
  Fahrenheit = 'fahrenheit'
}

/**
 * Setting modes for weight units.
 */
export enum UnitsWeightSettingMode {
  Kilograms = 'kilograms',
  Pounds = 'pounds'
}

/**
 * Type descriptions for display units user settings.
 */
export type UnitsUserSettingTypes = {
  /** The nav angle units setting. */
  unitsNavAngle: UnitsNavAngleSettingMode;

  /** The distance/speed units setting. */
  unitsDistance: UnitsDistanceSettingMode;

  /** The altitude/vertical speed units setting. */
  unitsAltitude: UnitsAltitudeSettingMode;

  /** The temperature units setting. */
  unitsTemperature: UnitsTemperatureSettingMode;

  /** The weight units setting. */
  unitsWeight: UnitsWeightSettingMode;
}

/**
 * A user setting manager for display units. In addition to syncing settings across instruments and managing event
 * bus events related to the settings, this manager also provides subscribables for the unit types controlled by its
 * settings.
 */
export class UnitsUserSettingManager extends DefaultUserSettingManager<UnitsUserSettingTypes> {
  private static readonly TRUE_BEARING = NavAngleUnit.create(false);
  private static readonly MAGNETIC_BEARING = NavAngleUnit.create(true);

  private readonly navAngleUnitsSub = Subject.create(UnitsUserSettingManager.MAGNETIC_BEARING);
  public readonly navAngleUnits = this.navAngleUnitsSub as Subscribable<NavAngleUnit>;

  private readonly distanceUnitsLargeSub = Subject.create(UnitType.NMILE);
  public readonly distanceUnitsLarge = this.distanceUnitsLargeSub as Subscribable<Unit<UnitFamily.Distance>>;

  private readonly distanceUnitsSmallSub = Subject.create(UnitType.FOOT);
  public readonly distanceUnitsSmall = this.distanceUnitsSmallSub as Subscribable<Unit<UnitFamily.Distance>>;

  private readonly speedUnitsSub = Subject.create(UnitType.KNOT);
  public readonly speedUnits = this.speedUnitsSub as Subscribable<Unit<UnitFamily.Speed>>;

  private readonly altitudeUnitsSub = Subject.create(UnitType.FOOT);
  public readonly altitudeUnits = this.altitudeUnitsSub as Subscribable<Unit<UnitFamily.Distance>>;

  private readonly verticalSpeedUnitsSub = Subject.create(UnitType.FPM);
  public readonly verticalSpeedUnits = this.verticalSpeedUnitsSub as Subscribable<Unit<UnitFamily.Speed>>;

  private readonly temperatureUnitsSub = Subject.create(UnitType.CELSIUS);
  public readonly temperatureUnits = this.temperatureUnitsSub as Subscribable<Unit<UnitFamily.Temperature>>;

  private readonly weightUnitsSub = Subject.create(UnitType.POUND);
  public readonly weightUnits = this.weightUnitsSub as Subscribable<Unit<UnitFamily.Weight>>;

  /** @inheritdoc */
  constructor(bus: EventBus, settingDefs: UserSettingDefinition<keyof UnitsUserSettingTypes, UnitsUserSettingTypes[keyof UnitsUserSettingTypes]>[]) {
    super(bus, settingDefs);

    for (const entry of this.settings.values()) {
      this.updateUnitsSubjects(entry.setting.definition.name, entry.setting.value);
    }
  }

  /** @inheritdoc */
  protected onSettingValueChanged<K extends keyof UnitsUserSettingTypes>(
    entry: UserSettingManagerEntry<K, UnitsUserSettingTypes[K]>,
    value: UnitsUserSettingTypes[K]
  ): void {
    this.updateUnitsSubjects(entry.setting.definition.name, value);

    super.onSettingValueChanged(entry, value);
  }

  /** @inheritdoc */
  protected onSettingValueSynced<K extends keyof UnitsUserSettingTypes>(
    entry: UserSettingManagerEntry<K, UnitsUserSettingTypes[K]>,
    data: UserSettingManagerSyncData<UnitsUserSettingTypes[K]>
  ): void {
    // protect against race conditions by not responding to sync events older than the last time this manager synced
    // the setting
    if (data.syncTime < entry.syncTime) {
      return;
    }

    this.updateUnitsSubjects(entry.setting.definition.name, data.value);

    super.onSettingValueSynced(entry, data);
  }

  /**
   * Updates this manager's units subjects in response to a setting value change.
   * @param settingName The name of the setting that was changed.
   * @param value The new value of the changed setting.
   */
  protected updateUnitsSubjects<K extends keyof UnitsUserSettingTypes>(settingName: K, value: UnitsUserSettingTypes[K]): void {
    switch (settingName) {
      case 'unitsNavAngle':
        this.navAngleUnitsSub?.set(value === UnitsNavAngleSettingMode.Magnetic ? UnitsUserSettingManager.MAGNETIC_BEARING : UnitsUserSettingManager.TRUE_BEARING);
        break;
      case 'unitsDistance':
        if (value === UnitsDistanceSettingMode.Nautical) {
          this.distanceUnitsLargeSub?.set(UnitType.NMILE);
          this.distanceUnitsSmallSub?.set(UnitType.FOOT);
          this.speedUnitsSub?.set(UnitType.KNOT);
        } else {
          this.distanceUnitsLargeSub?.set(UnitType.KILOMETER);
          this.distanceUnitsSmallSub?.set(UnitType.METER);
          this.speedUnitsSub?.set(UnitType.KPH);
        }
        break;
      case 'unitsAltitude':
        if (value === UnitsAltitudeSettingMode.Feet) {
          this.altitudeUnitsSub?.set(UnitType.FOOT);
          this.verticalSpeedUnitsSub?.set(UnitType.FPM);
        } else {
          this.altitudeUnitsSub?.set(UnitType.METER);
          this.verticalSpeedUnitsSub?.set(UnitType.MPM);
        }
        break;
      case 'unitsTemperature':
        this.temperatureUnitsSub?.set(value === UnitsTemperatureSettingMode.Celsius ? UnitType.CELSIUS : UnitType.FAHRENHEIT);
        break;
      case 'unitsWeight':
        this.weightUnitsSub?.set(value === UnitsWeightSettingMode.Pounds ? UnitType.POUND : UnitType.KILOGRAM);
        break;
    }
  }
}

/**
 * Utility class for retrieving display units user setting managers.
 */
export class UnitsUserSettings {
  private static INSTANCE: UnitsUserSettingManager | undefined;

  /**
   * Retrieves a manager for display units user settings.
   * @param bus The event bus.
   * @returns a manager for display units user settings.
   */
  public static getManager(bus: EventBus): UnitsUserSettingManager {
    return UnitsUserSettings.INSTANCE ??= new UnitsUserSettingManager(bus, [
      {
        name: 'unitsNavAngle',
        defaultValue: UnitsNavAngleSettingMode.Magnetic
      },
      {
        name: 'unitsDistance',
        defaultValue: UnitsDistanceSettingMode.Nautical
      },
      {
        name: 'unitsAltitude',
        defaultValue: UnitsAltitudeSettingMode.Feet
      },
      {
        name: 'unitsTemperature',
        defaultValue: UnitsTemperatureSettingMode.Celsius
      },
      {
        name: 'unitsWeight',
        defaultValue: UnitsWeightSettingMode.Pounds
      }
    ]);
  }
}