import { EventBus } from 'msfssdk/data';
import { DefaultUserSettingManager } from 'msfssdk/settings';
import { NavDataFieldType } from '../../../../Shared/UI/NavDataField/NavDataFieldType';

/**
 * An MFD navigation data bar user setting name.
 */
export type MFDNavDataBarSettingName = `navDataBarField${0 | 1 | 2 | 3}`;

/**
 * Type descriptions for MFD navigation data bar user settings.
 */
export type MFDNavDataBarSettingTypes = Record<MFDNavDataBarSettingName, NavDataFieldType>;

/**
 * Utility class for retrieving MFD navigation data bar user setting managers.
 */
export class MFDNavDataBarUserSettings {
  private static INSTANCE: DefaultUserSettingManager<MFDNavDataBarSettingTypes> | undefined;

  /**
   * Retrieves a manager for MFD navigation data bar user settings.
   * @param bus The event bus.
   * @returns a manager for MFD navigation data bar user settings.
   */
  public static getManager(bus: EventBus): DefaultUserSettingManager<MFDNavDataBarSettingTypes> {
    return MFDNavDataBarUserSettings.INSTANCE ??= new DefaultUserSettingManager<MFDNavDataBarSettingTypes>(bus, [
      {
        name: 'navDataBarField0',
        defaultValue: NavDataFieldType.GroundSpeed
      },
      {
        name: 'navDataBarField1',
        defaultValue: NavDataFieldType.DesiredTrack
      },
      {
        name: 'navDataBarField2',
        defaultValue: NavDataFieldType.GroundTrack
      },
      {
        name: 'navDataBarField3',
        defaultValue: NavDataFieldType.TimeToWaypoint
      }
    ]);
  }
}