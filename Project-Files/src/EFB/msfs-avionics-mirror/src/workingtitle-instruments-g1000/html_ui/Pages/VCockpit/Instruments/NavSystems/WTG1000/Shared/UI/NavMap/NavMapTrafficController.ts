import { MapIndexedRangeModule, MapModel } from 'msfssdk/components/map';
import { Consumer } from 'msfssdk/data';
import { UserSetting, UserSettingManager } from 'msfssdk/settings';

import { MapTrafficAlertLevelMode } from '../../Map/Modules/MapTrafficModule';
import { MapTrafficController, MapTrafficModules } from '../../Map/Controllers/MapTrafficController';
import { MapUserSettingTypes } from '../../Map/MapUserSettings';
import { TrafficUserSettingTypes } from '../../Traffic/TrafficUserSettings';

/**
 * Modules required for NavMapTrafficController.
 */
export interface NavMapTrafficModules extends MapTrafficModules {
  /** Range module. */
  range: MapIndexedRangeModule;
}

/**
 * Controls the display of traffic on a navigation map.
 */
export class NavMapTrafficController extends MapTrafficController {
  private readonly rangeModule: MapIndexedRangeModule;

  private readonly showSetting: UserSetting<'mapTrafficShow', boolean>;
  private readonly rangeIndexSetting: UserSetting<'mapTrafficRangeIndex', number>;
  private readonly labelShowSetting: UserSetting<'mapTrafficLabelShow', boolean>;
  private readonly labelRangeIndexSetting: UserSetting<'mapTrafficLabelRangeIndex', number>;
  private readonly alertLevelModeSetting: UserSetting<'mapTrafficAlertLevelMode', number>;

  private showSettingConsumer: Consumer<boolean> | null = null;
  private rangeIndexSettingConsumer: Consumer<number> | null = null;
  private labelShowSettingConsumer: Consumer<boolean> | null = null;
  private labelRangeIndexSettingConsumer: Consumer<number> | null = null;
  private alertLevelModeSettingConsumer: Consumer<MapTrafficAlertLevelMode> | null = null;

  private readonly showHandler = this.updateShow.bind(this);
  private readonly showLabelHandler = this.updateShowLabel.bind(this);
  private readonly alertLevelModeHandler = this.updateAlertLevelMode.bind(this);

  /**
   * Constructor.
   * @param mapModel The model of the map associated with this controller.
   * @param trafficSettingManager This controller's traffic settings manager.
   * @param mapSettingManager This controller's map settings manager.
   */
  constructor(
    mapModel: MapModel<NavMapTrafficModules>,
    trafficSettingManager: UserSettingManager<TrafficUserSettingTypes>,
    private readonly mapSettingManager: UserSettingManager<MapUserSettingTypes>
  ) {
    super(mapModel, trafficSettingManager);

    this.rangeModule = mapModel.getModule('range');

    this.showSetting = mapSettingManager.getSetting('mapTrafficShow');
    this.rangeIndexSetting = mapSettingManager.getSetting('mapTrafficRangeIndex');
    this.labelShowSetting = mapSettingManager.getSetting('mapTrafficLabelShow');
    this.labelRangeIndexSetting = mapSettingManager.getSetting('mapTrafficLabelRangeIndex');
    this.alertLevelModeSetting = mapSettingManager.getSetting('mapTrafficAlertLevelMode');
  }

  /**
   * Initializes this controller. Once initialized, this controller will automatically update the map traffic module.
   */
  public init(): void {
    if (this.isInit) {
      return;
    }

    super.init();

    this.showSettingConsumer = this.mapSettingManager.whenSettingChanged(this.showSetting.definition.name);
    this.rangeIndexSettingConsumer = this.mapSettingManager.whenSettingChanged(this.rangeIndexSetting.definition.name);
    this.labelShowSettingConsumer = this.mapSettingManager.whenSettingChanged(this.labelShowSetting.definition.name);
    this.labelRangeIndexSettingConsumer = this.mapSettingManager.whenSettingChanged(this.labelRangeIndexSetting.definition.name);
    this.alertLevelModeSettingConsumer = this.mapSettingManager.whenSettingChanged(this.alertLevelModeSetting.definition.name);

    this.showSettingConsumer.handle(this.showHandler);
    this.rangeIndexSettingConsumer.handle(this.showHandler);
    this.rangeModule.nominalRangeIndex.sub(this.showHandler, true);

    this.labelShowSettingConsumer.handle(this.showLabelHandler);
    this.labelRangeIndexSettingConsumer.handle(this.showLabelHandler);
    this.rangeModule.nominalRangeIndex.sub(this.showLabelHandler, true);

    this.alertLevelModeSettingConsumer.handle(this.alertLevelModeHandler);
  }

  /**
   * Updates whether to show traffic.
   */
  private updateShow(): void {
    this.trafficModule.show.set(this.showSetting.value && this.rangeModule.nominalRangeIndex.get() <= this.rangeIndexSetting.value);
  }

  /**
   * Updates whether to show traffic intruder labels.
   */
  private updateShowLabel(): void {
    this.trafficModule.showIntruderLabel.set(this.labelShowSetting.value && this.rangeModule.nominalRangeIndex.get() <= this.labelRangeIndexSetting.value);
  }

  /**
   * Updates the traffic alert level mode.
   * @param mode The new alert level mode.
   */
  private updateAlertLevelMode(mode: MapTrafficAlertLevelMode): void {
    this.trafficModule.alertLevelMode.set(mode);
  }

  /**
   * Destroys this controller, freeing up resources associated with it. Once destroyed, this controller will no longer
   * automatically update the map traffic module.
   */
  public destroy(): void {
    super.destroy();

    this.showSettingConsumer?.handle(this.showHandler);
    this.rangeIndexSettingConsumer?.handle(this.showHandler);
    this.rangeModule.nominalRangeIndex.unsub(this.showHandler);

    this.labelShowSettingConsumer?.handle(this.showLabelHandler);
    this.labelRangeIndexSettingConsumer?.handle(this.showLabelHandler);
    this.rangeModule.nominalRangeIndex.unsub(this.showLabelHandler);

    this.alertLevelModeSettingConsumer?.handle(this.alertLevelModeHandler);

    this.showSettingConsumer = null;
    this.rangeIndexSettingConsumer = null;
    this.labelShowSettingConsumer = null;
    this.labelRangeIndexSettingConsumer = null;
    this.alertLevelModeSettingConsumer = null;
  }
}