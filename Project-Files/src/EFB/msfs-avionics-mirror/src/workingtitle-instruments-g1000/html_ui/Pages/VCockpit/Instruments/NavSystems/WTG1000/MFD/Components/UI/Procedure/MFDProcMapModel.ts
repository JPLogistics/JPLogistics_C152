import { MapIndexedRangeModule, MapModel, MapOwnAirplaneIconModule, MapOwnAirplanePropsModule } from 'msfssdk/components/map';
import { EventBus } from 'msfssdk/data';
import { MapRangeSettings } from '../../../../Shared/Map/MapRangeSettings';
import { MapCrosshairModule } from '../../../../Shared/Map/Modules/MapCrosshairModule';
import { MapDeclutterModule } from '../../../../Shared/Map/Modules/MapDeclutterModule';
import { MapFlightPlanFocusModule } from '../../../../Shared/Map/Modules/MapFlightPlanFocusModule';
import { MapNexradModule } from '../../../../Shared/Map/Modules/MapNexradModule';
import { MapOrientation, MapOrientationModule } from '../../../../Shared/Map/Modules/MapOrientationModule';
import { MapPointerModule } from '../../../../Shared/Map/Modules/MapPointerModule';
import { MapRangeRingModule } from '../../../../Shared/Map/Modules/MapRangeRingModule';
import { MapTerrainMode, MapTerrainModule } from '../../../../Shared/Map/Modules/MapTerrainModule';
import { MapUnitsModule } from '../../../../Shared/Map/Modules/MapUnitsModule';
import { MapWaypointHighlightModule } from '../../../../Shared/Map/Modules/MapWaypointHighlightModule';
import { MapWaypointsModule } from '../../../../Shared/Map/Modules/MapWaypointsModule';
import { UnitsDistanceSettingMode, UnitsUserSettings } from '../../../../Shared/Units/UnitsUserSettings';

/**
 * Modules available in an MFD procedure preview map model.
 */
export interface MFDProcMapModelModules {
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

  /** Focus module. */
  focus: MapFlightPlanFocusModule;
}

/**
 * Class for creating MFD procedure preview map models.
 */
export class MFDProcMapModel {
  /**
   * Creates an instance of a waypoint map model.
   * @param bus The event bus.
   * @returns A waypoint map model instance.
   */
  public static createModel(bus: EventBus): MapModel<MFDProcMapModelModules> {
    const model = new MapModel<MFDProcMapModelModules>();

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
    model.addModule('focus', new MapFlightPlanFocusModule());

    model.getModule('range').nominalRanges.set(MapRangeSettings.DEFAULT_RANGES[UnitsDistanceSettingMode.Nautical]);
    model.getModule('orientation').orientation.set(MapOrientation.NorthUp);
    model.getModule('terrain').terrainMode.set(MapTerrainMode.None);
    model.getModule('focus').isFocused.set(true);

    return model;
  }
}