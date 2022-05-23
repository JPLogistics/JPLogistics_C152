import { EventBus } from 'msfssdk/data';
import { DefaultUserSettingManager } from 'msfssdk/settings';

/**
 * Setting modes for backlighting.
 */
export enum BacklightMode {
  Auto,
  Manual
}

/**
 * Type descriptions for backlight user settings.
 */
export interface BacklightUserSettingTypes extends Record<any, boolean | number | string> {
  /** The PFD screen backlight mode setting. */
  pfdScreenBacklightMode: BacklightMode;

  /** The PFD screen backlight intensity setting. */
  pfdScreenBacklightIntensity: number;

  /** The PFD softkey backlight mode setting. */
  pfdKeyBacklightMode: BacklightMode;

  /** The PFD softkey backlight intensity setting. */
  pfdKeyBacklightIntensity: number;

  /** The MFD screen backlight mode setting. */
  mfdScreenBacklightMode: BacklightMode;

  /** The MFD screen backlight intensity setting. */
  mfdScreenBacklightIntensity: number;

  /** The MFD softkey backlight mode setting. */
  mfdKeyBacklightMode: BacklightMode;

  /** The MFD softkey backlight intensity setting. */
  mfdKeyBacklightIntensity: number;
}

/**
 * A name for a backlight mode setting.
 */
export type BacklightModeSettingName = 'pfdScreenBacklightMode' | 'pfdKeyBacklightMode' | 'mfdScreenBacklightMode' | 'mfdKeyBacklightMode';

/**
 * A name for a backlight intensity setting.
 */
export type BacklightIntensitySettingName = 'pfdScreenBacklightIntensity' | 'pfdKeyBacklightIntensity' | 'mfdScreenBacklightIntensity' | 'mfdKeyBacklightIntensity';

/**
 * Utility class for retrieving backlight user setting managers.
 */
export class BacklightUserSettings {
  private static INSTANCE: DefaultUserSettingManager<BacklightUserSettingTypes> | undefined;

  /**
   * Retrieves a manager for backlight user settings.
   * @param bus The event bus.
   * @returns a manager for backlight user settings.
   */
  public static getManager(bus: EventBus): DefaultUserSettingManager<BacklightUserSettingTypes> {
    return BacklightUserSettings.INSTANCE ??= new DefaultUserSettingManager(bus, [
      {
        name: 'pfdScreenBacklightMode',
        defaultValue: BacklightMode.Auto
      },
      {
        name: 'pfdScreenBacklightIntensity',
        defaultValue: 100
      },
      {
        name: 'pfdKeyBacklightMode',
        defaultValue: BacklightMode.Auto
      },
      {
        name: 'pfdKeyBacklightIntensity',
        defaultValue: 100
      },
      {
        name: 'mfdScreenBacklightMode',
        defaultValue: BacklightMode.Auto
      },
      {
        name: 'mfdScreenBacklightIntensity',
        defaultValue: 100
      },
      {
        name: 'mfdKeyBacklightMode',
        defaultValue: BacklightMode.Auto
      },
      {
        name: 'mfdKeyBacklightIntensity',
        defaultValue: 100
      },
    ]);
  }
}