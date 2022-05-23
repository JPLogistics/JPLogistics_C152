import { MapIndexedRangeModule, MapModel, MapOwnAirplaneIconModule, MapOwnAirplanePropsModule } from 'msfssdk/components/map';
import { EventBus } from 'msfssdk/data';
import { MapRangeSettings } from '../../Map/MapRangeSettings';

import { MapCrosshairModule } from '../../Map/Modules/MapCrosshairModule';
import { MapDeclutterModule } from '../../Map/Modules/MapDeclutterModule';
import { MapNexradModule } from '../../Map/Modules/MapNexradModule';
import { MapOrientation, MapOrientationModule } from '../../Map/Modules/MapOrientationModule';
import { MapPointerModule } from '../../Map/Modules/MapPointerModule';
import { MapRangeRingModule } from '../../Map/Modules/MapRangeRingModule';
import { MapTerrainModule } from '../../Map/Modules/MapTerrainModule';
import { MapUnitsModule } from '../../Map/Modules/MapUnitsModule';
import { MapWaypointHighlightModule } from '../../Map/Modules/MapWaypointHighlightModule';
import { MapWaypointsModule } from '../../Map/Modules/MapWaypointsModule';
import { UnitsDistanceSettingMode, UnitsUserSettings } from '../../Units/UnitsUserSettings';

/**
 * Modules available in a waypoint map model.
 */
export interface WaypointMapModelModules {
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

  /** Range ring module. */
  rangeRing: MapRangeRingModule;

  /** Waypoints module. */
  waypoints: MapWaypointsModule;

  /** Waypoint info module. */
  waypointHighlight: MapWaypointHighlightModule;

  /** NEXRAD display module. */
  nexrad: MapNexradModule;

  /** Pointer module. */
  pointer: MapPointerModule;

  /** Crosshair module. */
  crosshair: MapCrosshairModule;
}

/**
 * Class for creating waypoint map models.
 */
export class WaypointMapModel {
  /**
   * Creates an instance of a waypoint map model.
   * @param bus The event bus.
   * @returns A waypoint map model instance.
   */
  public static createModel(bus: EventBus): MapModel<WaypointMapModelModules> {
    const model = new MapModel<WaypointMapModelModules>();

    model.addModule('units', new MapUnitsModule(UnitsUserSettings.getManager(bus)));
    model.addModule('range', new MapIndexedRangeModule());
    model.addModule('orientation', new MapOrientationModule());
    model.addModule('declutter', new MapDeclutterModule());
    model.addModule('terrain', new MapTerrainModule());
    model.addModule('ownAirplaneProps', new MapOwnAirplanePropsModule());
    model.addModule('ownAirplaneIcon', new MapOwnAirplaneIconModule());
    model.addModule('rangeRing', new MapRangeRingModule());
    model.addModule('waypoints', new MapWaypointsModule());
    model.addModule('waypointHighlight', new MapWaypointHighlightModule());
    model.addModule('nexrad', new MapNexradModule());
    model.addModule('pointer', new MapPointerModule());
    model.addModule('crosshair', new MapCrosshairModule());

    model.getModule('range').nominalRanges.set(MapRangeSettings.DEFAULT_RANGES[UnitsDistanceSettingMode.Nautical]);
    model.getModule('orientation').orientation.set(MapOrientation.NorthUp);

    return model;
  }
}