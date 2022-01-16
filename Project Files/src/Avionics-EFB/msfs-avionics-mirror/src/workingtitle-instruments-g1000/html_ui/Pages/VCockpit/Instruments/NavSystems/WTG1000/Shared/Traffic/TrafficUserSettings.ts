import { EventBus } from 'msfssdk/data';
import { DefaultUserSettingManager } from 'msfssdk/settings';

export enum TrafficOperatingModeSetting {
  Standby,
  Operating,
  Test
}

export enum TrafficAltitudeModeSetting {
  Below,
  Normal,
  Above,
  Unrestricted,
}

export enum TrafficMotionVectorModeSetting {
  Off,
  Absolute,
  Relative
}

/**
 *
 */
export type TrafficUserSettingTypes = {
  /** The traffic system operating mode setting. */
  trafficOperatingMode: TrafficOperatingModeSetting;

  /** The traffic system altitude mode setting. */
  trafficAltitudeMode: TrafficAltitudeModeSetting;

  /** The traffic system motion vector mode setting. */
  trafficMotionVectorMode: TrafficMotionVectorModeSetting;

  /** The traffic system motion vector lookahead setting. */
  trafficMotionVectorLookahead: number;
}

/**
 *
 */
export class TrafficUserSettings extends DefaultUserSettingManager<TrafficUserSettingTypes> {
  private static INSTANCE: DefaultUserSettingManager<TrafficUserSettingTypes> | undefined;

  /**
   * Gets an instance of the traffic user settings manager.
   * @param bus The event bus.
   * @returns An instance of the traffic user settings manager.
   */
  public static getManager(bus: EventBus): DefaultUserSettingManager<TrafficUserSettingTypes> {
    return TrafficUserSettings.INSTANCE ??= new DefaultUserSettingManager(bus, [
      {
        name: 'trafficOperatingMode',
        defaultValue: TrafficOperatingModeSetting.Standby
      },
      {
        name: 'trafficAltitudeMode',
        defaultValue: TrafficAltitudeModeSetting.Unrestricted
      },
      {
        name: 'trafficMotionVectorMode',
        defaultValue: TrafficMotionVectorModeSetting.Off
      },
      {
        name: 'trafficMotionVectorLookahead',
        defaultValue: 60
      }
    ]);
  }
}
