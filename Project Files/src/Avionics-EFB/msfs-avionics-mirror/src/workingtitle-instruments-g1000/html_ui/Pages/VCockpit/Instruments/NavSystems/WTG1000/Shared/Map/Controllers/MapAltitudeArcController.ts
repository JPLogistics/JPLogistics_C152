import { MapModel } from 'msfssdk/components/map';
import { Consumer } from 'msfssdk/data';
import { UserSetting, UserSettingManager } from 'msfssdk/settings';

import { MapAltitudeArcModule } from '../Modules/MapAltitudeArcModule';
import { MapUserSettingTypes } from '../MapUserSettings';

/**
 * Modules required for MapAltitudeArcController.
 */
export interface MapAltitudeArcControllerModules {
  /** Altitude intercept arc module. */
  altitudeArc: MapAltitudeArcModule;
}

/**
 * Controls the display of the altitude intercept arc on a map.
 */
export class MapAltitudeArcController {
  private readonly altitudeArcModule: MapAltitudeArcModule;

  private readonly showSetting: UserSetting<'mapAltitudeArcShow', boolean>;

  private showSettingConsumer: Consumer<boolean> | null = null;
  private readonly showHandler = this.updateShow.bind(this);

  protected isInit = false;

  /**
   * Constructor.
   * @param mapModel The model of the map associated with this controller.
   * @param settingManager This controller's map settings manager.
   */
  constructor(
    mapModel: MapModel<MapAltitudeArcControllerModules>,
    protected readonly settingManager: UserSettingManager<MapUserSettingTypes>
  ) {
    this.altitudeArcModule = mapModel.getModule('altitudeArc');
    this.showSetting = settingManager.getSetting('mapAltitudeArcShow');
  }

  /**
   * Initializes this controller. Once initialized, this controller will automatically update the map altitude intercept arc module.
   */
  public init(): void {
    if (this.isInit) {
      return;
    }

    this.showSettingConsumer = this.settingManager.whenSettingChanged(this.showSetting.definition.name);
    this.showSettingConsumer.handle(this.showHandler);
  }

  /**
   * Updates whether to show the altitude intercept arc.
   */
  private updateShow(): void {
    this.altitudeArcModule.show.set(this.showSetting.value);
  }

  /**
   * Destroys this controller, freeing up resources associated with it. Once destroyed, this controller will no longer
   * automatically update the map altitude intercept arc module.
   */
  public destroy(): void {
    this.showSettingConsumer?.off(this.showHandler);
    this.showSettingConsumer = null;
  }
}