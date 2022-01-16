import { PFDUserSettings, WindOverlaySettingMode } from '../../../PFD/PFDUserSettings';
import { MenuSystem } from './MenuSystem';
import { SoftKeyMenu } from './SoftKeyMenu';

/**
 * The PFD Opt wind menu.
 */
export class WindMenu extends SoftKeyMenu {
  private readonly settingMap = new Map<WindOverlaySettingMode, number>([
    [WindOverlaySettingMode.Off, 1],
    [WindOverlaySettingMode.Opt1, 2],
    [WindOverlaySettingMode.Opt2, 3],
    [WindOverlaySettingMode.Opt3, 4],
  ]);

  /**
   * Creates an instance of the PFD Opt Wind menu.
   * @param menuSystem The menu system.
   */
  constructor(menuSystem: MenuSystem) {
    super(menuSystem);

    this.addItem(1, 'Off', () => {
      this.onWindOptionSelected(WindOverlaySettingMode.Off);
    }, false);
    this.addItem(2, 'Option 1', () => {
      this.onWindOptionSelected(WindOverlaySettingMode.Opt1);
    }, false);
    this.addItem(3, 'Option 2', () => {
      this.onWindOptionSelected(WindOverlaySettingMode.Opt2);
    }, false);
    this.addItem(4, 'Option 3', () => {
      this.onWindOptionSelected(WindOverlaySettingMode.Opt3);
    }, false);
    this.addItem(10, 'Back', () => menuSystem.back());
    this.addItem(11, 'Alerts');

    PFDUserSettings.getManager(menuSystem.bus).whenSettingChanged('windOption').handle(this.onWindOptionSettingChanged.bind(this));
  }

  /**
   * Callback when wind option setting changed.
   * @param mode the selected wind option
   */
  private onWindOptionSettingChanged(mode: WindOverlaySettingMode): void {
    const softkeyIndex = this.settingMap.get(mode);
    for (let i = 1; i < 5; i++) {
      const item = this.getItem(i);
      item.value.set(i === softkeyIndex);
    }
  }

  /**
   * Callback fired when a wind option is selected.
   * @param mode the selected wind option
   */
  private onWindOptionSelected(mode: WindOverlaySettingMode): void {
    PFDUserSettings.getManager(this.menuSystem.bus).getSetting('windOption').value = mode;
  }
}