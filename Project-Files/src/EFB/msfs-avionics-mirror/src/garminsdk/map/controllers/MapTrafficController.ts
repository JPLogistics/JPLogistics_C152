import { UnitType } from 'msfssdk';
import { MapModel } from 'msfssdk/components/map';
import { Consumer } from 'msfssdk/data';
import { UserSetting, UserSettingManager } from 'msfssdk/settings';

import { MapTrafficAltitudeRestrictionMode, MapTrafficModule, MapTrafficMotionVectorMode } from '../modules/MapTrafficModule';
import { TrafficAltitudeModeSetting, TrafficMotionVectorModeSetting, TrafficUserSettingTypes } from '../../Traffic/TrafficUserSettings';

/**
 * Modules required for MapTrafficController.
 */
export interface MapTrafficModules {
  /** Traffic module. */
  traffic: MapTrafficModule;
}

/**
 * Controls the display of traffic on a map.
 */
export class MapTrafficController {
  private static readonly ALT_MODE_MAP = {
    [TrafficAltitudeModeSetting.Above]: MapTrafficAltitudeRestrictionMode.Above,
    [TrafficAltitudeModeSetting.Below]: MapTrafficAltitudeRestrictionMode.Below,
    [TrafficAltitudeModeSetting.Normal]: MapTrafficAltitudeRestrictionMode.Normal,
    [TrafficAltitudeModeSetting.Unrestricted]: MapTrafficAltitudeRestrictionMode.Unrestricted
  };
  private static readonly MOTION_VECTOR_MODE_MAP = {
    [TrafficMotionVectorModeSetting.Off]: MapTrafficMotionVectorMode.Off,
    [TrafficMotionVectorModeSetting.Absolute]: MapTrafficMotionVectorMode.Absolute,
    [TrafficMotionVectorModeSetting.Relative]: MapTrafficMotionVectorMode.Relative
  };

  protected readonly trafficModule: MapTrafficModule;

  private readonly altitudeModeSetting: UserSetting<'trafficAltitudeMode', TrafficAltitudeModeSetting>;
  private readonly motionVectorModeSetting: UserSetting<'trafficMotionVectorMode', TrafficMotionVectorModeSetting>;
  private readonly motionVectorLookaheadSetting: UserSetting<'trafficMotionVectorLookahead', number>;

  private altitudeModeSettingConsumer: Consumer<TrafficAltitudeModeSetting> | null = null;
  private motionVectorModeSettingConsumer: Consumer<TrafficMotionVectorModeSetting> | null = null;
  private motionVectorLookaheadSettingConsumer: Consumer<number> | null = null;

  private readonly altitudeModeHandler = this.updateAltitudeMode.bind(this);
  private readonly motionVectorModeHandler = this.updateMotionVectorMode.bind(this);
  private readonly motionVectorLookaheadHandler = this.updateMotionVectorLookahead.bind(this);

  protected isInit = false;

  /**
   * Constructor.
   * @param mapModel The model of the map associated with this controller.
   * @param settingManager This controller's traffic settings manager.
   */
  constructor(
    mapModel: MapModel<MapTrafficModules>,
    protected readonly settingManager: UserSettingManager<TrafficUserSettingTypes>
  ) {
    this.trafficModule = mapModel.getModule('traffic');

    this.altitudeModeSetting = settingManager.getSetting('trafficAltitudeMode');
    this.motionVectorModeSetting = settingManager.getSetting('trafficMotionVectorMode');
    this.motionVectorLookaheadSetting = settingManager.getSetting('trafficMotionVectorLookahead');
  }

  /**
   * Initializes this controller. Once initialized, this controller will automatically update the map traffic module.
   */
  public init(): void {
    if (this.isInit) {
      return;
    }

    this.altitudeModeSettingConsumer = this.settingManager.whenSettingChanged(this.altitudeModeSetting.definition.name);
    this.motionVectorModeSettingConsumer = this.settingManager.whenSettingChanged(this.motionVectorModeSetting.definition.name);
    this.motionVectorLookaheadSettingConsumer = this.settingManager.whenSettingChanged(this.motionVectorLookaheadSetting.definition.name);

    this.altitudeModeSettingConsumer.handle(this.altitudeModeHandler);
    this.motionVectorModeSettingConsumer.handle(this.motionVectorModeHandler);
    this.motionVectorLookaheadSettingConsumer.handle(this.motionVectorLookaheadHandler);
  }

  /**
   * Updates the traffic altitude restriction mode.
   */
  private updateAltitudeMode(): void {
    this.trafficModule.altitudeRestrictionMode.set(MapTrafficController.ALT_MODE_MAP[this.altitudeModeSetting.value]);
  }

  /**
   * Updates the traffic motion vector mode.
   */
  private updateMotionVectorMode(): void {
    this.trafficModule.motionVectorMode.set(MapTrafficController.MOTION_VECTOR_MODE_MAP[this.motionVectorModeSetting.value]);
  }

  /**
   * Updates the traffic motion vector lookahead time.
   */
  private updateMotionVectorLookahead(): void {
    this.trafficModule.motionVectorLookahead.set(this.motionVectorLookaheadSetting.value, UnitType.SECOND);
  }

  /**
   * Destroys this controller, freeing up resources associated with it. Once destroyed, this controller will no longer
   * automatically update the map traffic module.
   */
  public destroy(): void {
    this.altitudeModeSettingConsumer?.off(this.altitudeModeHandler);
    this.motionVectorModeSettingConsumer?.off(this.altitudeModeHandler);
    this.motionVectorLookaheadSettingConsumer?.off(this.motionVectorLookaheadHandler);

    this.altitudeModeSettingConsumer = null;
    this.motionVectorModeSettingConsumer = null;
    this.motionVectorLookaheadSettingConsumer = null;
  }
}