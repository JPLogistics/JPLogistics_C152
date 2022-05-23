import { PFDUserSettings } from '../../../PFD/PFDUserSettings';
import { MenuSystem } from './MenuSystem';
import { SoftKeyMenu } from './SoftKeyMenu';

/**
 * The PFD Opt ALT units menu.
 */
export class ALTUnitsMenu extends SoftKeyMenu {

  /**
   * Creates an instance of the PFD Opt ALT units menu.
   * @param menuSystem The menu system.
   */
  constructor(menuSystem: MenuSystem) {
    super(menuSystem);

    this.addItem(5, 'Meters', () => {
      this.onAltMetricSettingSelected();
    }, false);
    this.addItem(7, 'IN', () => {
      this.onBaroHpaSettingSelected(false);
    }, false);
    this.addItem(8, 'HPA', () => {
      this.onBaroHpaSettingSelected(true);
    }, false);
    this.addItem(10, 'Back', () => menuSystem.back());
    this.addItem(11, 'Alerts');

    PFDUserSettings.getManager(menuSystem.bus).whenSettingChanged('altMetric').handle(this.onAltMetricSettingChanged.bind(this));
    PFDUserSettings.getManager(menuSystem.bus).whenSettingChanged('baroHpa').handle(this.onBaroHpaSettingChanged.bind(this));
  }

  /**
   * Callback fired when a alt unit metric option is selected.
  //  * @param isHpa true if HPA, false if IN.
   */
  private onAltMetricSettingSelected(): void {
    PFDUserSettings.getManager(this.menuSystem.bus).getSetting('altMetric').value = !PFDUserSettings.getManager(this.menuSystem.bus).getSetting('altMetric').value;
  }

  /**
   * Callback fired when a baro unit option is selected.
   * @param isHpa true if HPA, false if IN.
   */
  private onBaroHpaSettingSelected(isHpa: boolean): void {
    PFDUserSettings.getManager(this.menuSystem.bus).getSetting('baroHpa').value = isHpa;
  }

  /**
   * Callback fired when a baro unit setting is changed.
   * @param isHpa true if HPA, false if IN.
   */
  private onBaroHpaSettingChanged(isHpa: boolean): void {
    this.getItem(7).value.set(!isHpa);
    this.getItem(8).value.set(isHpa);
  }

  /**
   * Callback fired when a alt unit setting is changed.
   * @param isMetric true if metric is on, false if metric is off.
   */
  private onAltMetricSettingChanged(isMetric: boolean): void {
    this.getItem(5).value.set(isMetric);
  }
}