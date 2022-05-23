import { Consumer } from 'msfssdk/data';
import { UserSetting, UserSettingManager } from 'msfssdk/settings';

import { MapDeclutterMode, MapDeclutterModule } from '../Modules/MapDeclutterModule';
import { MapDeclutterSettingMode, MapUserSettingTypes } from '../MapUserSettings';

/**
 * Controls the declutter mode of a map.
 */
export class MapDeclutterController {
  private static readonly MODE_MAP = {
    [MapDeclutterSettingMode.All]: MapDeclutterMode.All,
    [MapDeclutterSettingMode.Level3]: MapDeclutterMode.Level3,
    [MapDeclutterSettingMode.Level2]: MapDeclutterMode.Level2,
    [MapDeclutterSettingMode.Level1]: MapDeclutterMode.Level1,
  };

  private readonly declutterSetting: UserSetting<any, MapDeclutterSettingMode>;

  private declutterSettingConsumer: Consumer<MapDeclutterSettingMode> | null = null;

  private readonly handler = this.onSettingChanged.bind(this);

  private isInit = false;

  /**
   * Creates an instance of the MapDeclutterController.
   * @param declutterModule The declutter module of the map associated with this controller.
   * @param settingManager The user settings manager for map settings.
   */
  constructor(private readonly declutterModule: MapDeclutterModule, private readonly settingManager: UserSettingManager<MapUserSettingTypes>) {
    this.declutterSetting = settingManager.getSetting('mapDeclutter');
  }

  /**
   * Initializes this controller. Once initialized, this controller will automatically update the map declutter mode.
   */
  public init(): void {
    if (this.isInit) {
      return;
    }

    this.declutterSettingConsumer = this.settingManager.whenSettingChanged(this.declutterSetting.definition.name) as Consumer<MapDeclutterSettingMode>;
    this.declutterSettingConsumer.handle(this.handler);

    this.isInit = true;
  }

  /**
   * A callback which is called when the map declutter setting value changes.
   * @param mode The new mp declutter setting mode.
   */
  private onSettingChanged(mode: MapDeclutterSettingMode): void {
    this.declutterModule.mode.set(MapDeclutterController.MODE_MAP[mode]);
  }

  /**
   * Destroys this controller, freeing up resources associated with it. Once destroyed, this controller will no longer
   * automatically update the map declutter mode.
   */
  public destroy(): void {
    this.declutterSettingConsumer?.off(this.handler);

    this.declutterSettingConsumer = null;
  }
}