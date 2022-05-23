import { MapIndexedRangeModule, MapModel, MapOwnAirplanePropsModule } from 'msfssdk/components/map';
import { Consumer } from 'msfssdk/data';
import { UserSetting, UserSettingManager } from 'msfssdk/settings';

import { MapTerrainMode, MapTerrainModule } from '../modules/MapTerrainModule';
import { MapTerrainSettingMode, MapUserSettingTypes } from '../MapUserSettings';

/**
 * Modules required for MapTerrainController.
 */
export interface MapTerrainModules {
  /** Range module. */
  range: MapIndexedRangeModule;

  /** Own airplane properties module. */
  ownAirplaneProps: MapOwnAirplanePropsModule;

  /** Terrain module. */
  terrain: MapTerrainModule;
}

/**
 * Controls the terrain mode and terrain scale of a map.
 */
export class MapTerrainController {
  private readonly rangeModule: MapIndexedRangeModule;
  private readonly ownAirplaneModule: MapOwnAirplanePropsModule;
  private readonly terrainModule: MapTerrainModule;

  private readonly modeSetting: UserSetting<'mapTerrainMode', MapTerrainSettingMode>;
  private readonly rangeIndexSetting: UserSetting<'mapTerrainRangeIndex', number>;
  private readonly showScaleSetting: UserSetting<'mapTerrainScaleShow', boolean>;

  private modeSettingConsumer: Consumer<MapTerrainSettingMode> | null = null;
  private rangeIndexSettingConsumer: Consumer<number> | null = null;
  private showScaleSettingConsumer: Consumer<boolean> | null = null;

  private readonly colorsHandler = this.updateColors.bind(this);
  private readonly showScaleHandler = this.updateShowScale.bind(this);

  private isInit = false;

  /**
   * Constructor.
   * @param mapModel The model of the map associated with this controller.
   * @param settingManager This controller's map settings manager.
   * @param allowRelative Whether this controller allows relative terrain colors to be displayed.
   */
  constructor(
    mapModel: MapModel<MapTerrainModules>,
    private readonly settingManager: UserSettingManager<MapUserSettingTypes>,
    private readonly allowRelative = true
  ) {
    this.rangeModule = mapModel.getModule('range');
    this.ownAirplaneModule = mapModel.getModule('ownAirplaneProps');
    this.terrainModule = mapModel.getModule('terrain');

    this.modeSetting = settingManager.getSetting('mapTerrainMode');
    this.rangeIndexSetting = settingManager.getSetting('mapTerrainRangeIndex');
    this.showScaleSetting = settingManager.getSetting('mapTerrainScaleShow');
  }

  /**
   * Initializes this controller. Once initialized, this controller will automatically update the map terrain mode and scale.
   */
  public init(): void {
    if (this.isInit) {
      return;
    }

    this.modeSettingConsumer = this.settingManager.whenSettingChanged(this.modeSetting.definition.name);
    this.rangeIndexSettingConsumer = this.settingManager.whenSettingChanged(this.rangeIndexSetting.definition.name);
    this.showScaleSettingConsumer = this.settingManager.whenSettingChanged(this.showScaleSetting.definition.name);

    this.modeSettingConsumer.handle(this.colorsHandler);
    this.rangeIndexSettingConsumer.handle(this.colorsHandler);
    this.rangeModule.nominalRangeIndex.sub(this.colorsHandler, true);
    this.ownAirplaneModule.isOnGround.sub(this.colorsHandler, true);

    this.showScaleSettingConsumer.handle(this.showScaleHandler);

    this.isInit = true;
  }

  /**
   * Updates the terrain mode.
   */
  private updateColors(): void {
    let mode = MapTerrainMode.None;
    if (this.rangeModule.nominalRangeIndex.get() <= this.rangeIndexSetting.value) {
      switch (this.modeSetting.value) {
        case MapTerrainSettingMode.Absolute:
          mode = MapTerrainMode.Absolute;
          break;
        case MapTerrainSettingMode.Relative:
          if (this.allowRelative && !this.ownAirplaneModule.isOnGround.get()) {
            mode = MapTerrainMode.Relative;
          }
          break;
      }
    }

    this.terrainModule.terrainMode.set(mode);
  }

  /**
   * Updates whether to show the terrain scale.
   * @param show Whether to show the terrain scale.
   */
  private updateShowScale(show: boolean): void {
    this.terrainModule.showScale.set(show);
  }

  /**
   * Destroys this controller, freeing up resources associated with it. Once destroyed, this controller will no longer
   * automatically update the map terrain mode and scale.
   */
  public destroy(): void {
    this.modeSettingConsumer?.off(this.colorsHandler);
    this.rangeIndexSettingConsumer?.off(this.colorsHandler);
    this.rangeModule.nominalRangeIndex.unsub(this.colorsHandler);
    this.ownAirplaneModule.isOnGround.unsub(this.colorsHandler);

    this.showScaleSettingConsumer?.off(this.showScaleHandler);

    this.modeSettingConsumer = null;
    this.rangeIndexSettingConsumer = null;
    this.showScaleSettingConsumer = null;
  }
}