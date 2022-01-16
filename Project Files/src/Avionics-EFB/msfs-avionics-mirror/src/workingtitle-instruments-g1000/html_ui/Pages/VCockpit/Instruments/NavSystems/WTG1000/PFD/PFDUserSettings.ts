import { EventBus } from 'msfssdk/data';
import { DefaultUserSettingManager } from 'msfssdk/settings';

/**
 * The wind overlay options.
 */
export enum WindOverlaySettingMode {
  Off,
  Opt1,
  Opt2,
  Opt3
}

/**
 * Setting modes for the pfd map layout option.
 */
export enum PfdMapLayoutSettingMode {
  Off,
  Inset,
  HSI,
  TFC
}

/**
 * Type description for pfd user settings
 */
export type PFDUserSettingTypes = {
  /** The wind option setting. */
  windOption: WindOverlaySettingMode;
  /** The pfd map layout setting. */
  mapLayout: PfdMapLayoutSettingMode;
  /** The SVT toggle setting. */
  svtToggle: boolean;
  /** The baro unit setting. */
  baroHpa: boolean;
  /** The metric alt unit setting. */
  altMetric: boolean;
  /** The setting to toggle the heading labels on the horizon compass. */
  svtHdgLabelToggle: boolean;
}

/**
 * Utility class for retrieving PFD user setting managers.
 */
export class PFDUserSettings {
  private static INSTANCE: DefaultUserSettingManager<PFDUserSettingTypes> | undefined;

  /**
   * Retrieves a manager for map user settings.
   * @param bus The event bus.
   * @returns a manager for map user settings.
   */
  public static getManager(bus: EventBus): DefaultUserSettingManager<PFDUserSettingTypes> {
    return PFDUserSettings.INSTANCE ??= new DefaultUserSettingManager(bus, [
      {
        name: 'windOption',
        defaultValue: WindOverlaySettingMode.Off
      },
      {
        name: 'mapLayout',
        defaultValue: PfdMapLayoutSettingMode.Off
      },
      {
        name: 'svtToggle',
        defaultValue: true
      },
      {
        name: 'baroHpa',
        defaultValue: false
      },
      {
        name: 'altMetric',
        defaultValue: false
      },
      {
        name: 'svtHdgLabelToggle',
        defaultValue: true
      }
    ]);
  }
}