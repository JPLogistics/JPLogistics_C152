import { TrafficMotionVectorModeSetting, TrafficUserSettings } from '../../../../Shared/Traffic/TrafficUserSettings';
import { MenuSystem } from '../../../../Shared/UI/Menus/MenuSystem';
import { SoftKeyMenu } from '../../../../Shared/UI/Menus/SoftKeyMenu';
import { MultipleSoftKeyUserSettingController } from '../../../../Shared/UI/Menus/SoftKeyUserSettingControllers';

/**
 * The traffic map motion vector softkey menu.
 */
export class MFDTrafficMapMotionMenu extends SoftKeyMenu {

  private readonly trafficSettingManager = TrafficUserSettings.getManager(this.menuSystem.bus);

  private readonly motionVectorModeController = new MultipleSoftKeyUserSettingController(
    this, this.trafficSettingManager, 'trafficMotionVectorMode',
    [
      { index: 4, label: 'Absolute', value: TrafficMotionVectorModeSetting.Absolute },
      { index: 5, label: 'Relative', value: TrafficMotionVectorModeSetting.Relative },
      { index: 6, label: 'Off', value: TrafficMotionVectorModeSetting.Off },
    ]
  );

  /** @inheritdoc */
  constructor(menuSystem: MenuSystem) {
    super(menuSystem);

    this.addItem(8, 'Duration', () => { this.menuSystem.pushMenu('traffic-motion-duration'); });

    this.addItem(10, 'Back', () => { this.menuSystem.back(); });

    this.motionVectorModeController.init();
  }
}
