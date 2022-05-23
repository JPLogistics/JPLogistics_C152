import { TrafficUserSettings } from '../../../../Shared/Traffic/TrafficUserSettings';
import { MenuSystem } from '../../../../Shared/UI/Menus/MenuSystem';
import { SoftKeyMenu } from '../../../../Shared/UI/Menus/SoftKeyMenu';
import { MultipleSoftKeyUserSettingController } from '../../../../Shared/UI/Menus/SoftKeyUserSettingControllers';

/**
 * The traffic map motion vector duration softkey menu.
 */
export class MFDTrafficMapMotionDurationMenu extends SoftKeyMenu {

  private readonly trafficSettingManager = TrafficUserSettings.getManager(this.menuSystem.bus);

  private readonly motionVectorLookaheadController = new MultipleSoftKeyUserSettingController(
    this, this.trafficSettingManager, 'trafficMotionVectorLookahead',
    [
      { index: 4, label: '30 SEC', value: 30 },
      { index: 5, label: '1 MIN', value: 60 },
      { index: 6, label: '2 MIN', value: 120 },
      { index: 7, label: '5 MIN', value: 300 },
    ]
  );

  /** @inheritdoc */
  constructor(menuSystem: MenuSystem) {
    super(menuSystem);

    this.addItem(10, 'Back', () => { this.menuSystem.back(); });

    this.motionVectorLookaheadController.init();
  }
}
