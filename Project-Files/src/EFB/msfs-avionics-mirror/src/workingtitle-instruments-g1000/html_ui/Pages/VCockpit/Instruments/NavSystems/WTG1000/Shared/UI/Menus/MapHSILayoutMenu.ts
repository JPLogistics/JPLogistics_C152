import { PfdMapLayoutSettingMode, PFDUserSettings } from '../../../PFD/PFDUserSettings';
import { MenuSystem } from './MenuSystem';
import { SoftKeyMenu } from './SoftKeyMenu';

/**
 * The Map/HSI softkey menu.
 */
export class MapHSILayoutMenu extends SoftKeyMenu {

  /**
   * Creates an instance of the Layout menu inside the Map/HSI menu.
   * @param menuSystem The menu system.
   */
  constructor(menuSystem: MenuSystem) {
    super(menuSystem);
    this.addItem(0, 'Map Off', () => this.pressMapMode(PfdMapLayoutSettingMode.Off), false);
    this.addItem(1, 'Inset Map', () => this.pressMapMode(PfdMapLayoutSettingMode.Inset), false);
    this.addItem(2, 'HSI Map', () => this.pressMapMode(PfdMapLayoutSettingMode.HSI), false);
    this.addItem(3, 'TFC Map', () => this.pressMapMode(PfdMapLayoutSettingMode.TFC), false, true);
    this.addItem(7, 'WX LGND');
    this.addItem(10, 'Back', () => menuSystem.back());
    this.addItem(11, 'Alerts');

    PFDUserSettings.getManager(menuSystem.bus).whenSettingChanged('mapLayout').handle(this.onMapOptionSettingChanged.bind(this));
  }

  /**
   * Callback for when the map option setting changes.
   * @param mode the map option mode.
   */
  private onMapOptionSettingChanged(mode: PfdMapLayoutSettingMode): void {
    for (let i = 0; i < 4; i++) {
      const item = this.getItem(i);
      item.value.set(i === mode);
    }
  }

  /**
   * Handles when a map mode button is pressed.
   * @param mode the mode to be set.
   */
  private pressMapMode(mode: PfdMapLayoutSettingMode): void {
    PFDUserSettings.getManager(this.menuSystem.bus).getSetting('mapLayout').value = mode;
  }
}