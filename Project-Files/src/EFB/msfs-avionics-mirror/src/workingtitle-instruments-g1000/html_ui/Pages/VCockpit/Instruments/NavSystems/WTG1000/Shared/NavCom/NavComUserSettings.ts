import { EventBus } from 'msfssdk/data';
import { ComSpacing } from 'msfssdk/instruments';
import { DefaultUserSettingManager } from 'msfssdk/settings';

/**
 * Type description for NAV/COM user settings.
 */
export type NavComUserSettingTypes = {
  /** The COM spacing setting. */
  comSpacing: ComSpacing;
}

/**
 * Utility class for retrieving PFD user setting managers.
 */
export class NavComUserSettings {
  private static INSTANCE: DefaultUserSettingManager<NavComUserSettingTypes> | undefined;

  /**
   * Retrieves a manager for nav/com settings.
   * @param bus The event bus.
   * @returns a manager for nav/com settings.
   */
  public static getManager(bus: EventBus): DefaultUserSettingManager<NavComUserSettingTypes> {
    return NavComUserSettings.INSTANCE ??= new DefaultUserSettingManager(bus, [
      {
        name: 'comSpacing',
        defaultValue: ComSpacing.Spacing833Khz
      }
    ]);
  }
}