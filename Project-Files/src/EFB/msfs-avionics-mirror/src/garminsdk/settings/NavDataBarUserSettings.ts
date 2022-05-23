import { EventBus } from 'msfssdk/data';
import { DefaultUserSettingManager } from 'msfssdk/settings';
import { NavDataFieldType } from '../components/navdatafield/NavDataFieldType';

/**
 * A navigation data bar user setting name.
 */
export type NavDataBarSettingName = `navDataBarField${number}`;

/**
 * Type descriptions for navigation data bar user settings.
 */
export type NavDataBarSettingTypes = Record<NavDataBarSettingName, NavDataFieldType>;

/**
 * Utility class for retrieving navigation data bar user setting managers.
 */
export class NavDataBarUserSettings {
  /**
   * Creates a manager for navigation data bar user settings.
   * @param bus The event bus.
   * @param defaultValues The default values for the settings. One indexed setting will be created for each default
   * value, in order.
   * @returns A new manager for navigation data bar user settings.
   */
  public static createManager(bus: EventBus, defaultValues: NavDataFieldType[]): DefaultUserSettingManager<NavDataBarSettingTypes> {
    return new DefaultUserSettingManager<NavDataBarSettingTypes>(
      bus,
      defaultValues.map((defaultValue, index) => {
        return { name: `navDataBarField${index}`, defaultValue };
      })
    );
  }
}