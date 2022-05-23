import { BitFlags } from 'msfssdk';
import { BoundaryType } from 'msfssdk/navigation';
import { MapModel, MapIndexedRangeModule, MapOwnAirplaneIconModule, MapOwnAirplanePropsModule, MapAutopilotModule, MapAirspaceModule, MapDataIntegrityModule } from 'msfssdk/components/map';
import { TCAS } from 'msfssdk/traffic';

import { MapOrientationModule } from '../../Map/Modules/MapOrientationModule';
import { MapRangeCompassModule } from '../../Map/Modules/MapRangeCompassModule';
import { MapRangeRingModule } from '../../Map/Modules/MapRangeRingModule';
import { MapTerrainModule } from '../../Map/Modules/MapTerrainModule';
import { MapTrafficModule } from '../../Map/Modules/MapTrafficModule';
import { MapWaypointsModule } from '../../Map/Modules/MapWaypointsModule';
import { MapNexradModule } from '../../Map/Modules/MapNexradModule';
import { MapDeclutterModule } from '../../Map/Modules/MapDeclutterModule';
import { MapPointerModule } from '../../Map/Modules/MapPointerModule';
import { MapCrosshairModule } from '../../Map/Modules/MapCrosshairModule';
import { MapWaypointHighlightModule } from '../../Map/Modules/MapWaypointHighlightModule';
import { MapTrackVectorModule } from '../../Map/Modules/MapTrackVectorModule';
import { MapAltitudeArcModule } from '../../Map/Modules/MapAltitudeArcModule';
import { AirspaceShowType, MapAirspaceShowTypes } from '../../Map/Modules/MapAirspaceShowTypes';
import { MapRangeSettings } from '../../Map/MapRangeSettings';
import { UnitsDistanceSettingMode, UnitsUserSettings } from '../../Units/UnitsUserSettings';
import { MapUnitsModule } from '../../Map/Modules/MapUnitsModule';
import { EventBus } from 'msfssdk/data';

/**
 * Modules available in a NavMapModel.
 */
export interface NavMapModelModules {
  /** Display units module. */
  units: MapUnitsModule;

  /** Range module. */
  range: MapIndexedRangeModule;

  /** Orientation module. */
  orientation: MapOrientationModule;

  /** Declutter module. */
  declutter: MapDeclutterModule;

  /** Terrain module. */
  terrain: MapTerrainModule;

  /** Own airplane properties module. */
  ownAirplaneProps: MapOwnAirplanePropsModule;

  /** Own airplane icon module. */
  ownAirplaneIcon: MapOwnAirplaneIconModule;

  /** Autopilot module. */
  autopilot: MapAutopilotModule;

  /** Range ring module. */
  rangeRing: MapRangeRingModule;

  /** Range compass module. */
  rangeCompass: MapRangeCompassModule;

  /** Waypoints module. */
  waypoints: MapWaypointsModule;

  /** Airspace module. */
  airspace: MapAirspaceModule<MapAirspaceShowTypes>;

  /** Airspace module. */
  traffic: MapTrafficModule;

  /** Weather radar module. */
  nexrad: MapNexradModule;

  /** Pointer module. */
  pointer: MapPointerModule;

  /** Crosshair module. */
  crosshair: MapCrosshairModule;

  /** Waypoint highlight module. */
  waypointHighlight: MapWaypointHighlightModule;

  /** Track vector module. */
  trackVector: MapTrackVectorModule;

  /** Altitude intercept arc module. */
  altitudeArc: MapAltitudeArcModule;

  /** Data integrity module. */
  dataIntegrity: MapDataIntegrityModule;
}

/**
 * Initialization options for a navmap model.
 */
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface NavMapModelOptions {

}

/**
 * Class for creating navmap models.
 */
export class NavMapModel {
  private static readonly AIRSPACE_SHOW_TYPES = {
    [AirspaceShowType.ClassB]: 1 << BoundaryType.ClassB,
    [AirspaceShowType.ClassC]: 1 << BoundaryType.ClassC,
    [AirspaceShowType.ClassD]: 1 << BoundaryType.ClassD,
    [AirspaceShowType.Restricted]: BitFlags.union(1 << BoundaryType.Restricted, 1 << BoundaryType.Prohibited),
    [AirspaceShowType.MOA]: 1 << BoundaryType.MOA,
    [AirspaceShowType.Other]: BitFlags.union(
      1 << BoundaryType.ClassE,
      1 << BoundaryType.Warning,
      1 << BoundaryType.Alert,
      1 << BoundaryType.Danger,
      1 << BoundaryType.Training
    )
  };

  /**
   * Creates an instance of a navmap model.
   * @param bus The event bus.
   * @param tcas A TCAS to use to get traffic avoidance information.
   * @param options Initialization options for the new model.
   * @returns a navmap model instance.
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public static createModel(bus: EventBus, tcas: TCAS, options?: NavMapModelOptions): MapModel<NavMapModelModules> {
    const model = new MapModel<NavMapModelModules>();

    model.addModule('units', new MapUnitsModule(UnitsUserSettings.getManager(bus)));
    model.addModule('range', new MapIndexedRangeModule());
    model.addModule('orientation', new MapOrientationModule());
    model.addModule('declutter', new MapDeclutterModule());
    model.addModule('terrain', new MapTerrainModule());
    model.addModule('ownAirplaneProps', new MapOwnAirplanePropsModule());
    model.addModule('ownAirplaneIcon', new MapOwnAirplaneIconModule());
    model.addModule('autopilot', new MapAutopilotModule());
    model.addModule('rangeRing', new MapRangeRingModule());
    model.addModule('rangeCompass', new MapRangeCompassModule());
    model.addModule('waypoints', new MapWaypointsModule());
    model.addModule('airspace', new MapAirspaceModule(NavMapModel.AIRSPACE_SHOW_TYPES));
    model.addModule('traffic', new MapTrafficModule(tcas));
    model.addModule('nexrad', new MapNexradModule());
    model.addModule('pointer', new MapPointerModule());
    model.addModule('crosshair', new MapCrosshairModule());
    model.addModule('waypointHighlight', new MapWaypointHighlightModule());
    model.addModule('trackVector', new MapTrackVectorModule());
    model.addModule('altitudeArc', new MapAltitudeArcModule());
    model.addModule('dataIntegrity', new MapDataIntegrityModule());

    model.getModule('range').nominalRanges.set(MapRangeSettings.DEFAULT_RANGES[UnitsDistanceSettingMode.Nautical]);

    return model;
  }
}