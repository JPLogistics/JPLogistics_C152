import { UnitType } from 'msfssdk';
import { MapModel } from 'msfssdk/components/map';
import { Consumer } from 'msfssdk/data';
import { UserSetting, UserSettingManager } from 'msfssdk/settings';

import { MapTrackVectorModule } from '../Modules/MapTrackVectorModule';
import { MapUserSettingTypes } from '../MapUserSettings';

/**
 * Modules required for MapTrackVectorController.
 */
export interface MapTrackVectorControllerModules {
  /** Track vector module. */
  trackVector: MapTrackVectorModule;
}

/**
 * Controls the display of the track vector on a map.
 */
export class MapTrackVectorController {
  private readonly trackVectorModule: MapTrackVectorModule;

  private readonly showSetting: UserSetting<'mapTrackVectorShow', boolean>;
  private readonly lookaheadTimeSetting: UserSetting<'mapTrackVectorLookahead', number>;

  private showSettingConsumer: Consumer<boolean> | null = null;
  private lookaheadTimeSettingConsumer: Consumer<number> | null = null;

  private readonly showHandler = this.updateShow.bind(this);
  private readonly lookaheadTimeHandler = this.updateLookaheadTime.bind(this);

  protected isInit = false;

  /**
   * Constructor.
   * @param mapModel The model of the map associated with this controller.
   * @param settingManager This controller's map settings manager.
   */
  constructor(
    mapModel: MapModel<MapTrackVectorControllerModules>,
    protected readonly settingManager: UserSettingManager<MapUserSettingTypes>
  ) {
    this.trackVectorModule = mapModel.getModule('trackVector');

    this.showSetting = settingManager.getSetting('mapTrackVectorShow');
    this.lookaheadTimeSetting = settingManager.getSetting('mapTrackVectorLookahead');
  }

  /**
   * Initializes this controller. Once initialized, this controller will automatically update the map track vector module.
   */
  public init(): void {
    if (this.isInit) {
      return;
    }

    this.showSettingConsumer = this.settingManager.whenSettingChanged(this.showSetting.definition.name);
    this.lookaheadTimeSettingConsumer = this.settingManager.whenSettingChanged(this.lookaheadTimeSetting.definition.name);

    this.showSettingConsumer.handle(this.showHandler);
    this.lookaheadTimeSettingConsumer.handle(this.lookaheadTimeHandler);
  }

  /**
   * Updates whether to show the track vector.
   */
  private updateShow(): void {
    this.trackVectorModule.show.set(this.showSetting.value);
  }

  /**
   * Updates the track vector lookahead time.
   */
  private updateLookaheadTime(): void {
    this.trackVectorModule.lookaheadTime.set(this.lookaheadTimeSetting.value, UnitType.SECOND);
  }

  /**
   * Destroys this controller, freeing up resources associated with it. Once destroyed, this controller will no longer
   * automatically update the map track vector module.
   */
  public destroy(): void {
    this.showSettingConsumer?.off(this.showHandler);
    this.lookaheadTimeSettingConsumer?.off(this.lookaheadTimeHandler);

    this.showSettingConsumer = null;
    this.lookaheadTimeSettingConsumer = null;
  }
}