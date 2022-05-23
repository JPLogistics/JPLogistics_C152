import { NumberUnitReadOnly, Subject, Subscribable, UnitFamily, UnitType } from 'msfssdk';
import { EventBus } from 'msfssdk/data';
import { DefaultUserSettingManager } from 'msfssdk/settings';
import { UnitsDistanceSettingMode, UnitsUserSettingTypes } from '../Units/UnitsUserSettings';

/**
 * Type descriptions for map range settings.
 */
export type MapRangeSettingTypes = {
  /** The PFD range index setting. */
  pfdMapRangeIndex: number;

  /** The MFD range index setting. */
  mfdMapRangeIndex: number;
}

/**
 * Utility class for retrieving map range setting managers.
 */
export class MapRangeSettings {
  public static readonly DEFAULT_RANGES: Record<UnitsDistanceSettingMode, readonly NumberUnitReadOnly<UnitFamily.Distance>[]> = {
    [UnitsDistanceSettingMode.Nautical]: [
      ...[
        250,
        400,
        500,
        750,
        1000,
        1500,
        2500
      ].map(value => UnitType.FOOT.createNumber(value).readonly),
      ...[
        0.5,
        0.75,
        1,
        1.5,
        2.5,
        4,
        5,
        7.5,
        10,
        15,
        25,
        40,
        50,
        75,
        100,
        150,
        250,
        400,
        500,
        750,
        1000
      ].map(value => UnitType.NMILE.createNumber(value).readonly)
    ],
    [UnitsDistanceSettingMode.Metric]: [
      ...[
        75,
        100,
        150,
        250,
        400,
        500,
        750
      ].map(value => UnitType.METER.createNumber(value).readonly),
      ...[
        1,
        1.5,
        2.5,
        4,
        5,
        8,
        10,
        15,
        20,
        40,
        50,
        75,
        100,
        150,
        250,
        350,
        500,
        800,
        1000,
        1500,
        2000
      ].map(value => UnitType.KILOMETER.createNumber(value).readonly)
    ]
  };

  private static INSTANCE: DefaultUserSettingManager<MapRangeSettingTypes> | undefined;
  private static RANGE_ARRAY_SUB: Subject<readonly NumberUnitReadOnly<UnitFamily.Distance>[]> | undefined;

  /**
   * Retrieves a manager for map range setting.
   * @param bus The event bus.
   * @returns a manager for map range setting.
   */
  public static getManager(bus: EventBus): DefaultUserSettingManager<MapRangeSettingTypes> {
    return MapRangeSettings.INSTANCE ??= new DefaultUserSettingManager(bus, [
      {
        name: 'pfdMapRangeIndex',
        defaultValue: 11
      },
      {
        name: 'mfdMapRangeIndex',
        defaultValue: 11
      },
    ]);
  }

  /**
   * Gets a subscribable which provides the map range values associated with the current distance display units
   * setting.
   * @param bus The event bus.
   * @returns A subscribable which provides the map range values associated with the current distance display units
   * setting.
   */
  public static getRangeArraySubscribable(bus: EventBus): Subscribable<readonly NumberUnitReadOnly<UnitFamily.Distance>[]> {
    if (!MapRangeSettings.RANGE_ARRAY_SUB) {
      MapRangeSettings.RANGE_ARRAY_SUB = Subject.create(MapRangeSettings.DEFAULT_RANGES[UnitsDistanceSettingMode.Nautical]);

      bus.getSubscriber<UnitsUserSettingTypes>().on('unitsDistance').whenChanged().handle(
        mode => {
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          MapRangeSettings.RANGE_ARRAY_SUB!.set(MapRangeSettings.DEFAULT_RANGES[mode]);
        }
      );
    }

    return MapRangeSettings.RANGE_ARRAY_SUB;
  }
}