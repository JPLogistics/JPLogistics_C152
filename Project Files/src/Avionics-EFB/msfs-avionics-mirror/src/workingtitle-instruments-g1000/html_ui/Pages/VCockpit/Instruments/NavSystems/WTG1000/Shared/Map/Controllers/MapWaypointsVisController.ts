import { MapModel } from 'msfssdk/components/map';
import { UserSettingManager } from 'msfssdk/settings';
import { AirportSize } from '../../Navigation/Waypoint';

import { MapWaypointsLayerModules } from '../Layers/MapWaypointsLayer';
import { MapDeclutterMode, MapDeclutterModule } from '../Modules/MapDeclutterModule';
import { MapSymbolVisController } from './MapSymbolVisController';
import { MapUserSettingTypes } from '../MapUserSettings';

/**
 * Modules required for MapTerrainController.
 */
export interface MapWaypointsVisModules extends MapWaypointsLayerModules {
  /** Declutter module. */
  declutter: MapDeclutterModule;
}

/**
 * Controls the visibility of map waypoint symbols.
 */
export class MapWaypointsVisController {
  private readonly airportVisControllers: Record<AirportSize, MapSymbolVisController>;
  private readonly vorVisController: MapSymbolVisController;
  private readonly ndbVisController: MapSymbolVisController;
  private readonly intersectionVisController: MapSymbolVisController;

  /**
   * Constructor.
   * @param mapModel The model of the map associated with this controller.
   * @param settingManager This controller's map settings manager.
   */
  constructor(
    mapModel: MapModel<MapWaypointsVisModules>,
    settingManager: UserSettingManager<MapUserSettingTypes>
  ) {
    const rangeModule = mapModel.getModule('range');
    const declutterModule = mapModel.getModule('declutter');
    const waypointsModule = mapModel.getModule('waypoints');

    this.airportVisControllers = {
      [AirportSize.Large]: new MapSymbolVisController(
        rangeModule, declutterModule, settingManager,
        'mapAirportLargeShow', 'mapAirportLargeRangeIndex',
        MapDeclutterMode.Level2,
        visibility => { waypointsModule.airportShow[AirportSize.Large].set(visibility); }
      ),
      [AirportSize.Medium]: new MapSymbolVisController(
        rangeModule, declutterModule, settingManager,
        'mapAirportMediumShow', 'mapAirportMediumRangeIndex',
        MapDeclutterMode.Level2,
        visibility => { waypointsModule.airportShow[AirportSize.Medium].set(visibility); }
      ),
      [AirportSize.Small]: new MapSymbolVisController(
        rangeModule, declutterModule, settingManager,
        'mapAirportSmallShow', 'mapAirportSmallRangeIndex',
        MapDeclutterMode.Level2,
        visibility => { waypointsModule.airportShow[AirportSize.Small].set(visibility); }
      )
    };

    this.vorVisController = new MapSymbolVisController(
      rangeModule, declutterModule, settingManager,
      'mapVorShow', 'mapVorRangeIndex',
      MapDeclutterMode.Level3,
      visibility => { waypointsModule.vorShow.set(visibility); }
    );

    this.ndbVisController = new MapSymbolVisController(
      rangeModule, declutterModule, settingManager,
      'mapNdbShow', 'mapNdbRangeIndex',
      MapDeclutterMode.Level3,
      visibility => { waypointsModule.ndbShow.set(visibility); }
    );

    this.intersectionVisController = new MapSymbolVisController(
      rangeModule, declutterModule, settingManager,
      'mapIntersectionShow', 'mapIntersectionRangeIndex',
      MapDeclutterMode.Level3,
      visibility => { waypointsModule.intShow.set(visibility); }
    );
  }

  /**
   * Initializes this controller. Once initialized, this controller will automatically adjust the visibility of the map
   * waypoint symbols.
   */
  public init(): void {
    this.airportVisControllers[AirportSize.Large].init();
    this.airportVisControllers[AirportSize.Medium].init();
    this.airportVisControllers[AirportSize.Small].init();

    this.vorVisController.init();
    this.ndbVisController.init();
    this.intersectionVisController.init();
  }

  /**
   * Destroys this controller, freeing up resources associated with it. Once destroyed, this controller will no longer
   * automatically adjust the visibility of the map waypoint symbols.
   */
  public destroy(): void {
    this.airportVisControllers[AirportSize.Large].destroy();
    this.airportVisControllers[AirportSize.Medium].destroy();
    this.airportVisControllers[AirportSize.Small].destroy();

    this.vorVisController.destroy();
    this.ndbVisController.destroy();
    this.intersectionVisController.destroy();
  }
}