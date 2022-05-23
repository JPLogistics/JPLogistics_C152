import { EventBus } from 'msfssdk/data';
import { DefaultUserSettingManager, UserSettingManager } from 'msfssdk/settings';
import { MapTrafficAlertLevelMode } from './modules/MapTrafficModule';

/**
 * Setting modes for map orientation.
 */
export enum MapOrientationSettingMode {
  NorthUp,
  TrackUp,
  HeadingUp
}

/**
 * Setting modes for map terrain display.
 */
export enum MapTerrainSettingMode {
  None,
  Absolute,
  Relative
}

/**
 * Setting modes for map declutter.
 */
export enum MapDeclutterSettingMode {
  All,
  Level3,
  Level2,
  Level1
}

/**
 * Type descriptions for map user settings.
 */
export type BaseMapUserSettingTypes = {
  /** The orientation setting. */
  mapOrientation: MapOrientationSettingMode;

  /** The auto-north-up active setting. */
  mapAutoNorthUpActive: boolean;

  /** The auto-north-up range setting. */
  mapAutoNorthUpRangeIndex: number;

  /** Declutter setting for the MFD. */
  mapMfdDeclutter: MapDeclutterSettingMode;

  /** Declutter setting for the PFD. */
  mapPfdDeclutter: MapDeclutterSettingMode;

  /** The terrain display setting for the MFD. */
  mapMfdTerrainMode: MapTerrainSettingMode;

  /** The terrain display setting for the PFD. */
  mapPfdTerrainMode: MapTerrainSettingMode;

  /** The terrain maximum range setting. */
  mapTerrainRangeIndex: number;

  /** The terrain scale show setting. */
  mapTerrainScaleShow: boolean;

  /** Large airport symbol show setting. */
  mapAirportLargeShow: boolean;

  /** Large airport maximum range setting. */
  mapAirportLargeRangeIndex: number;

  /** Medium airport symbol show setting. */
  mapAirportMediumShow: boolean;

  /** Medium airport maximum range setting. */
  mapAirportMediumRangeIndex: number;

  /** Small airport symbol show setting. */
  mapAirportSmallShow: boolean;

  /** Small airport maximum range setting. */
  mapAirportSmallRangeIndex: number;

  /** VOR symbol show setting. */
  mapVorShow: boolean;

  /** VOR maximum range setting. */
  mapVorRangeIndex: number;

  /** NDB symbol show setting. */
  mapNdbShow: boolean;

  /** NDB maximum range setting. */
  mapNdbRangeIndex: number;

  /** Intersection symbol show setting. */
  mapIntersectionShow: boolean;

  /** Intersection maximum range setting. */
  mapIntersectionRangeIndex: number;

  /** Class B airspace show setting. */
  mapAirspaceClassBShow: boolean;

  /** Class B airspace maximum range setting. */
  mapAirspaceClassBRangeIndex: number;

  /** Class C airspace show setting. */
  mapAirspaceClassCShow: boolean;

  /** Class C airspace maximum range setting. */
  mapAirspaceClassCRangeIndex: number;

  /** Class D airspace show setting. */
  mapAirspaceClassDShow: boolean;

  /** Class D airspace maximum range setting. */
  mapAirspaceClassDRangeIndex: number;

  /** Restricted airspace show setting. */
  mapAirspaceRestrictedShow: boolean;

  /** Restricted airspace maximum range setting. */
  mapAirspaceRestrictedRangeIndex: number;

  /** MOA airspace show setting. */
  mapAirspaceMoaShow: boolean;

  /** MOA airspace maximum range setting. */
  mapAirspaceMoaRangeIndex: number;

  /** Other airspace show setting. */
  mapAirspaceOtherShow: boolean;

  /** Other airspace maximum range setting. */
  mapAirspaceOtherRangeIndex: number;

  /** Whether to show traffic on the MFD. */
  mapMfdTrafficShow: boolean;

  /** Whether to show traffic on the PFD. */
  mapPfdTrafficShow: boolean;

  /** Traffic maximum range setting. */
  mapTrafficRangeIndex: number;

  /** Whether to show traffic labels. */
  mapTrafficLabelShow: boolean;

  /** Traffic label maximum range setting. */
  mapTrafficLabelRangeIndex: number;

  /** Traffic alert level mode setting. */
  mapTrafficAlertLevelMode: MapTrafficAlertLevelMode;

  /** Whether to show NEXRAD weather or not on the MFD. */
  mapMfdNexradShow: boolean;

  /** Whether to show NEXRAD weather or not on the PFD. */
  mapPfdNexradShow: boolean;

  /** NEXRAD maximum range setting. */
  mapNexradRangeIndex: number;

  /** Whether to show the track vector. */
  mapTrackVectorShow: boolean;

  /** The track vector lookahead time, in seconds. */
  mapTrackVectorLookahead: number;

  /** Whether to show the altitude intercept arc. */
  mapAltitudeArcShow: boolean;
}

/**
 * Additional mapped settings types.
 */
export type AgnosticMapUserSettingTypes = {
  /** Declutter setting. */
  mapDeclutter: MapDeclutterSettingMode;

  /** The terrain display setting. */
  mapTerrainMode: MapTerrainSettingMode;

  /** Whether to show traffic. */
  mapTrafficShow: boolean;

  /** Whether to show NEXRAD weather or not. */
  mapNexradShow: boolean;
}

/**
 * Both PFD/MFD agnostic setting types and base setting types.
 */
export type MapUserSettingTypes = BaseMapUserSettingTypes & AgnosticMapUserSettingTypes;

/**
 * Utility class for retrieving map user setting managers.
 */
export class MapUserSettings {
  private static INSTANCE: DefaultUserSettingManager<BaseMapUserSettingTypes> | undefined;
  private static PFD_INSTANCE: UserSettingManager<MapUserSettingTypes> | undefined;
  private static MFD_INSTANCE: UserSettingManager<MapUserSettingTypes> | undefined;

  /**
   * Retrieves a manager for map user settings.
   * @param bus The event bus.
   * @returns a manager for map user settings.
   */
  public static getManager(bus: EventBus): DefaultUserSettingManager<BaseMapUserSettingTypes> {
    return MapUserSettings.INSTANCE ??= new DefaultUserSettingManager<BaseMapUserSettingTypes>(bus, [
      {
        name: 'mapOrientation',
        defaultValue: MapOrientationSettingMode.HeadingUp
      },
      {
        name: 'mapAutoNorthUpActive',
        defaultValue: true
      },
      {
        name: 'mapAutoNorthUpRangeIndex',
        defaultValue: 27
      },
      {
        name: 'mapPfdDeclutter',
        defaultValue: MapDeclutterSettingMode.All
      },
      {
        name: 'mapMfdDeclutter',
        defaultValue: MapDeclutterSettingMode.All
      },
      {
        name: 'mapPfdTerrainMode',
        defaultValue: MapTerrainSettingMode.Absolute
      },
      {
        name: 'mapMfdTerrainMode',
        defaultValue: MapTerrainSettingMode.Absolute
      },
      {
        name: 'mapTerrainRangeIndex',
        defaultValue: 27
      },
      {
        name: 'mapTerrainScaleShow',
        defaultValue: false
      },
      {
        name: 'mapAirportLargeShow',
        defaultValue: true
      },
      {
        name: 'mapAirportLargeRangeIndex',
        defaultValue: 21
      },
      {
        name: 'mapAirportMediumShow',
        defaultValue: true
      },
      {
        name: 'mapAirportMediumRangeIndex',
        defaultValue: 19
      },
      {
        name: 'mapAirportSmallShow',
        defaultValue: true
      },
      {
        name: 'mapAirportSmallRangeIndex',
        defaultValue: 17
      },
      {
        name: 'mapVorShow',
        defaultValue: true
      },
      {
        name: 'mapVorRangeIndex',
        defaultValue: 19
      },
      {
        name: 'mapNdbShow',
        defaultValue: true
      },
      {
        name: 'mapNdbRangeIndex',
        defaultValue: 17
      },
      {
        name: 'mapIntersectionShow',
        defaultValue: true
      },
      {
        name: 'mapIntersectionRangeIndex',
        defaultValue: 17
      },
      {
        name: 'mapAirspaceClassBShow',
        defaultValue: true
      },
      {
        name: 'mapAirspaceClassBRangeIndex',
        defaultValue: 19
      },
      {
        name: 'mapAirspaceClassCShow',
        defaultValue: true
      },
      {
        name: 'mapAirspaceClassCRangeIndex',
        defaultValue: 19
      },
      {
        name: 'mapAirspaceClassDShow',
        defaultValue: true
      },
      {
        name: 'mapAirspaceClassDRangeIndex',
        defaultValue: 15
      },
      {
        name: 'mapAirspaceRestrictedShow',
        defaultValue: true
      },
      {
        name: 'mapAirspaceRestrictedRangeIndex',
        defaultValue: 19
      },
      {
        name: 'mapAirspaceMoaShow',
        defaultValue: true
      },
      {
        name: 'mapAirspaceMoaRangeIndex',
        defaultValue: 19
      },
      {
        name: 'mapAirspaceOtherShow',
        defaultValue: true
      },
      {
        name: 'mapAirspaceOtherRangeIndex',
        defaultValue: 19
      },
      {
        name: 'mapPfdTrafficShow',
        defaultValue: false
      },
      {
        name: 'mapMfdTrafficShow',
        defaultValue: false
      },
      {
        name: 'mapTrafficRangeIndex',
        defaultValue: 17
      },
      {
        name: 'mapTrafficLabelShow',
        defaultValue: true
      },
      {
        name: 'mapTrafficLabelRangeIndex',
        defaultValue: 17
      },
      {
        name: 'mapTrafficAlertLevelMode',
        defaultValue: MapTrafficAlertLevelMode.All
      },
      {
        name: 'mapPfdNexradShow',
        defaultValue: false
      },
      {
        name: 'mapMfdNexradShow',
        defaultValue: false
      },
      {
        name: 'mapNexradRangeIndex',
        defaultValue: 27
      },
      {
        name: 'mapTrackVectorShow',
        defaultValue: false
      },
      {
        name: 'mapTrackVectorLookahead',
        defaultValue: 60
      },
      {
        name: 'mapAltitudeArcShow',
        defaultValue: false
      }
    ]);
  }

  /**
   * Retrieves a manager for PFD map user settings.
   * @param bus The event bus.
   * @returns a manager for PFD map user settings.
   */
  public static getPfdManager(bus: EventBus): UserSettingManager<MapUserSettingTypes> {
    return MapUserSettings.PFD_INSTANCE ?? MapUserSettings.getManager(bus).mapTo<AgnosticMapUserSettingTypes>({
      mapDeclutter: 'mapPfdDeclutter',
      mapNexradShow: 'mapPfdNexradShow',
      mapTerrainMode: 'mapPfdTerrainMode',
      mapTrafficShow: 'mapPfdTrafficShow'
    });
  }

  /**
   * Retrieves a manager for MFD map user settings.
   * @param bus The event bus.
   * @returns a manager for PFD map user settings.
   */
  public static getMfdManager(bus: EventBus): UserSettingManager<MapUserSettingTypes> {
    return MapUserSettings.MFD_INSTANCE ?? MapUserSettings.getManager(bus).mapTo<AgnosticMapUserSettingTypes>({
      mapDeclutter: 'mapMfdDeclutter',
      mapNexradShow: 'mapMfdNexradShow',
      mapTerrainMode: 'mapMfdTerrainMode',
      mapTrafficShow: 'mapMfdTrafficShow'
    });
  }
}