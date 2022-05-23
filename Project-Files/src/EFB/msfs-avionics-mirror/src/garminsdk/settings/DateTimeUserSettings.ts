import { EventBus } from 'msfssdk/data';
import { DefaultUserSettingManager } from 'msfssdk/settings';

/**
 * Setting modes for date/time format.
 */
export enum DateTimeFormatSettingMode {
  UTC = 'UTC',
  Local24 = 'Local24',
  Local12 = 'Local12'
}

/**
 * Type descriptions for date/time user settings.
 */
export type DateTimeUserSettingTypes = {
  /** Date/time format. */
  dateTimeFormat: DateTimeFormatSettingMode;

  /** Local time offset, in milliseconds. */
  dateTimeLocalOffset: number;
}

/**
 * Utility class for retrieving date/time user setting managers.
 */
export class DateTimeUserSettings {
  private static INSTANCE: DefaultUserSettingManager<DateTimeUserSettingTypes> | undefined;

  /**
   * Retrieves a manager for date/time user settings.
   * @param bus The event bus.
   * @returns A manager for date/time user settings.
   */
  public static getManager(bus: EventBus): DefaultUserSettingManager<DateTimeUserSettingTypes> {
    return DateTimeUserSettings.INSTANCE ??= new DefaultUserSettingManager(bus, [
      {
        name: 'dateTimeFormat',
        defaultValue: DateTimeFormatSettingMode.UTC
      },
      {
        name: 'dateTimeLocalOffset',
        defaultValue: 0
      }
    ]);
  }
}