import { EventBus } from 'msfssdk/data';
import { DefaultUserSettingManager } from 'msfssdk/settings';
import { RunwaySurfaceCategory } from 'msfssdk/navigation';

/**
 * Type description for NAV/COM user settings.
 */
export type NearestAirportSearchSettingTypes = {
  /** The minimum runway length, in feet. */
  runwayLength: number;
  /** A bitmap of the allowed SurfaceTypes */
  surfaceTypes: number;
}

/**
 * Utility class for retrieving PFD user setting managers.
 */
export class NearestAirportSearchSettings {
  private static INSTANCE: DefaultUserSettingManager<NearestAirportSearchSettingTypes> | undefined;

  /**
   * Retrieves a manager for airport search settings.
   * @param bus The event bus.
   * @returns a manager for airport search settings.
   */
  public static getManager(bus: EventBus): DefaultUserSettingManager<NearestAirportSearchSettingTypes> {
    return NearestAirportSearchSettings.INSTANCE ??= new DefaultUserSettingManager(bus, [
      {
        name: 'runwayLength',
        defaultValue: 3000
      },
      {
        name: 'surfaceTypes',
        defaultValue: RunwaySurfaceCategory.Hard
      }
    ]);
  }
}