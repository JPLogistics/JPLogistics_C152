import { MapIndexedRangeModule, MapModel } from 'msfssdk/components/map';
import { UserSettingManager } from 'msfssdk/settings';
import { MapDeclutterMode, MapDeclutterModule } from '../Modules/MapDeclutterModule';
import { MapNexradModule } from '../Modules/MapNexradModule';
import { MapSymbolVisController } from './MapSymbolVisController';
import { MapUserSettingTypes } from '../MapUserSettings';

/** Modules for the Nexrad map controller. */
export interface MapNexradModules {
  /** The Nexrad module. */
  nexrad: MapNexradModule;

  /** The map range module. */
  range: MapIndexedRangeModule;

  /** Declutter module. */
  declutter: MapDeclutterModule;
}

/** A controller for displaying NEXRAD. */
export class MapNexradController {
  private readonly nexradVisController: MapSymbolVisController;

  /**
   * Creates an instance of the MapNexradController.
   * @param mapModel The nav map data model.
   * @param settingManager The user settings manager for map settings.
   */
  constructor(mapModel: MapModel<MapNexradModules>, private readonly settingManager: UserSettingManager<MapUserSettingTypes>) {
    const nexradModule = mapModel.getModule('nexrad');
    const rangeModule = mapModel.getModule('range');
    const declutterModule = mapModel.getModule('declutter');

    this.nexradVisController = new MapSymbolVisController(
      rangeModule, declutterModule, settingManager,
      'mapNexradShow', 'mapNexradRangeIndex',
      MapDeclutterMode.Level2,
      visibility => { nexradModule.showNexrad.set(visibility); }
    );
  }

  /**
   * Initializes the NEXRAD controller.
   */
  public init(): void {
    this.nexradVisController.init();
  }

  /**
   * Destroys this controller, freeing up resources associated with it. Once destroyed, this controller will no longer
   * automatically update the map terrain mode and scale.
   */
  public destroy(): void {
    this.nexradVisController.destroy();
  }
}