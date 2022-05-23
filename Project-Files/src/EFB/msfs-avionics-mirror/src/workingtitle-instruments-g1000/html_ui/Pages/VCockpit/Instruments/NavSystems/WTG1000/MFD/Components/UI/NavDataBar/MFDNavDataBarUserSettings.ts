import { EventBus } from 'msfssdk/data';
import { DefaultUserSettingManager } from 'msfssdk/settings';
import { NavDataBarSettingTypes, NavDataBarUserSettings } from 'garminsdk/settings';
import { NavDataFieldType } from 'garminsdk/components/navdatafield';

/**
 * Utility class for retrieving MFD navigation data bar user setting managers.
 */
export class MFDNavDataBarUserSettings {
  private static INSTANCE: DefaultUserSettingManager<NavDataBarSettingTypes> | undefined;

  /**
   * Retrieves a manager for MFD navigation data bar user settings.
   * @param bus The event bus.
   * @returns a manager for MFD navigation data bar user settings.
   */
  public static getManager(bus: EventBus): DefaultUserSettingManager<NavDataBarSettingTypes> {
    return MFDNavDataBarUserSettings.INSTANCE ??= NavDataBarUserSettings.createManager(bus, [
      NavDataFieldType.GroundSpeed,
      NavDataFieldType.DesiredTrack,
      NavDataFieldType.GroundTrack,
      NavDataFieldType.TimeToWaypoint
    ]);
  }
}