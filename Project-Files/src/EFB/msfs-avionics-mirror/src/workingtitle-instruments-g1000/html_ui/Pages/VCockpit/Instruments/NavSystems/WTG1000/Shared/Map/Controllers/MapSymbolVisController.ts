import { MapIndexedRangeModule } from 'msfssdk/components/map';
import { Consumer } from 'msfssdk/data';
import { UserSetting, UserSettingManager } from 'msfssdk/settings';

import { MapDeclutterMode, MapDeclutterModule } from '../Modules/MapDeclutterModule';
import { MapUserSettingTypes } from '../MapUserSettings';

/**
 * Controls the visibility of a specific type of map symbol whose visibility is dependent on its own show and maximum
 * range index settings as well as the global map declutter setting.
 */
export class MapSymbolVisController {
  private readonly showSetting: UserSetting<keyof MapUserSettingTypes, boolean>;
  private readonly rangeIndexSetting: UserSetting<keyof MapUserSettingTypes, number>;

  private showSettingConsumer: Consumer<boolean> | null = null;
  private rangeIndexSettingConsumer: Consumer<number> | null = null;

  private readonly handler = this.updateVisibility.bind(this);

  private isInit = false;

  /**
   * Constructor.
   * @param rangeModule The range module of the map associated with this controller.
   * @param declutterModule The declutter module of the map associated with this controller.
   * @param settingManager This controller's map settings manager.
   * @param showSettingName The name of the show setting associated with this controller.
   * @param rangeIndexSettingName The name of the range index setting associated with this controller.
   * @param declutterLevel The highest global declutter level at which the symbol controlled by this controller remains
   * visible.
   * @param setVisibilityFunc A function which sets the visibility of the symbol controlled by this controller.
   */
  constructor(
    private readonly rangeModule: MapIndexedRangeModule,
    private readonly declutterModule: MapDeclutterModule,
    private readonly settingManager: UserSettingManager<MapUserSettingTypes>,
    showSettingName: keyof MapUserSettingTypes,
    rangeIndexSettingName: keyof MapUserSettingTypes,
    private readonly declutterLevel: MapDeclutterMode,
    private readonly setVisibilityFunc: (visibility: boolean) => void
  ) {
    this.showSetting = settingManager.getSetting(showSettingName) as UserSetting<keyof MapUserSettingTypes, boolean>;
    this.rangeIndexSetting = settingManager.getSetting(rangeIndexSettingName) as UserSetting<keyof MapUserSettingTypes, number>;
  }

  /**
   * Initializes this controller. Once initialized, this controller will automatically adjust the visibility of its
   * associated map symbol.
   */
  public init(): void {
    if (this.isInit) {
      return;
    }

    this.showSettingConsumer = this.settingManager.whenSettingChanged(this.showSetting.definition.name) as Consumer<boolean>;
    this.rangeIndexSettingConsumer = this.settingManager.whenSettingChanged(this.rangeIndexSetting.definition.name) as Consumer<number>;

    this.showSettingConsumer.handle(this.handler);
    this.rangeIndexSettingConsumer.handle(this.handler);
    this.rangeModule.nominalRangeIndex.sub(this.handler);
    this.declutterModule.mode.sub(this.handler, true);

    this.isInit = true;
  }

  /**
   * Updates the visibility of this controller's associated map symbol.
   */
  private updateVisibility(): void {
    let show = false;
    if (this.showSetting.value && this.declutterModule.mode.get() <= this.declutterLevel) {
      show = this.rangeModule.nominalRangeIndex.get() <= this.rangeIndexSetting.value;
    }

    this.setVisibilityFunc(show);
  }

  /**
   * Destroys this controller, freeing up resources associated with it. Once destroyed, this controller will no longer
   * automatically adjust the visibility of its associated map symbol.
   */
  public destroy(): void {
    this.showSettingConsumer?.off(this.handler);
    this.rangeIndexSettingConsumer?.off(this.handler);
    this.rangeModule.nominalRangeIndex.unsub(this.handler);
    this.declutterModule.mode.unsub(this.handler);

    this.showSettingConsumer = null;
    this.rangeIndexSettingConsumer = null;
  }
}