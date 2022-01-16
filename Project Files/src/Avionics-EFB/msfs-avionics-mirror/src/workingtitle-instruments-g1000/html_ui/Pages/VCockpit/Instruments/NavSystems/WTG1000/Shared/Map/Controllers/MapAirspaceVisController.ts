import { MapAirspaceModule, MapIndexedRangeModule, MapModel } from 'msfssdk/components/map';
import { UserSettingManager } from 'msfssdk/settings';

import { MapDeclutterMode, MapDeclutterModule } from '../Modules/MapDeclutterModule';
import { AirspaceShowType, MapAirspaceShowTypes } from '../Modules/MapAirspaceShowTypes';
import { MapSymbolVisController } from './MapSymbolVisController';
import { MapUserSettingTypes } from '../MapUserSettings';

/**
 * Modules required for MapAirspaceVisController.
 */
export interface MapAirspaceVisControllerModules {
  /** Range module. */
  range: MapIndexedRangeModule;

  /** Declutter module. */
  declutter: MapDeclutterModule;

  /** Airspace module. */
  airspace: MapAirspaceModule<MapAirspaceShowTypes>;
}

/**
 * Controls the visibility of map airspace boundaries.
 */
export class MapAirspaceVisController {
  private readonly controllers: Record<AirspaceShowType, MapSymbolVisController>;

  /**
   * Constructor.
   * @param mapModel The model of the map associated with this controller.
   * @param settingManager This controller's map settings manager.
   */
  constructor(
    mapModel: MapModel<MapAirspaceVisControllerModules>,
    settingManager: UserSettingManager<MapUserSettingTypes>
  ) {
    const rangeModule = mapModel.getModule('range');
    const declutterModule = mapModel.getModule('declutter');
    const airspaceModule = mapModel.getModule('airspace');

    this.controllers = {
      [AirspaceShowType.ClassB]: new MapSymbolVisController(
        rangeModule, declutterModule, settingManager,
        'mapAirspaceClassBShow', 'mapAirspaceClassBRangeIndex',
        MapDeclutterMode.Level3,
        visibility => { airspaceModule.show[AirspaceShowType.ClassB].set(visibility); }
      ),
      [AirspaceShowType.ClassC]: new MapSymbolVisController(
        rangeModule, declutterModule, settingManager,
        'mapAirspaceClassCShow', 'mapAirspaceClassCRangeIndex',
        MapDeclutterMode.Level3,
        visibility => { airspaceModule.show[AirspaceShowType.ClassC].set(visibility); }
      ),
      [AirspaceShowType.ClassD]: new MapSymbolVisController(
        rangeModule, declutterModule, settingManager,
        'mapAirspaceClassDShow', 'mapAirspaceClassDRangeIndex',
        MapDeclutterMode.Level3,
        visibility => { airspaceModule.show[AirspaceShowType.ClassD].set(visibility); }
      ),
      [AirspaceShowType.Restricted]: new MapSymbolVisController(
        rangeModule, declutterModule, settingManager,
        'mapAirspaceRestrictedShow', 'mapAirspaceRestrictedRangeIndex',
        MapDeclutterMode.Level2,
        visibility => { airspaceModule.show[AirspaceShowType.Restricted].set(visibility); }
      ),
      [AirspaceShowType.MOA]: new MapSymbolVisController(
        rangeModule, declutterModule, settingManager,
        'mapAirspaceMoaShow', 'mapAirspaceMoaRangeIndex',
        MapDeclutterMode.Level2,
        visibility => { airspaceModule.show[AirspaceShowType.MOA].set(visibility); }
      ),
      [AirspaceShowType.Other]: new MapSymbolVisController(
        rangeModule, declutterModule, settingManager,
        'mapAirspaceOtherShow', 'mapAirspaceOtherRangeIndex',
        MapDeclutterMode.Level3,
        visibility => { airspaceModule.show[AirspaceShowType.Other].set(visibility); }
      ),
    };
  }

  /**
   * Initializes this controller. Once initialized, this controller will automatically adjust the visibility of the map
   * airspace boundaries.
   */
  public init(): void {
    for (const controller of Object.values(this.controllers)) {
      controller.init();
    }
  }

  /**
   * Destroys this controller, freeing up resources associated with it. Once destroyed, this controller will no longer
   * automatically adjust the visibility of the map airspace boundaries.
   */
  public destroy(): void {
    for (const controller of Object.values(this.controllers)) {
      controller.destroy();
    }
  }
}