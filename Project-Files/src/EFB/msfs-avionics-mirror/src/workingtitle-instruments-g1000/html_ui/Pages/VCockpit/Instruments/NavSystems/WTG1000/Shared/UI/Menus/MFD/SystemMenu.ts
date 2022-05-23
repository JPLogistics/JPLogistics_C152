import { MenuSystem } from '../MenuSystem';
import { SoftKeyMenu } from '../SoftKeyMenu';
import { G1000ControlPublisher } from '../../../G1000Events';
import { EISPageTypes } from '../../../../MFD/Components/EIS';
import { XMLExtendedGaugeConfig } from 'msfssdk/components/XMLGauges';

/**
 * The MFD Engine system  menu.
 */
export class SystemMenu extends SoftKeyMenu {
  private publisher: G1000ControlPublisher;

  /**
   * Creates an instance of the MFD engine lean menu.
   * @param menuSystem The engine lean menu system.
   * @param config The EIS gauge configuration.
   * @param publisher A publisher to use for sending control events
   */
  constructor(menuSystem: MenuSystem, config: XMLExtendedGaugeConfig, publisher: G1000ControlPublisher) {
    super(menuSystem);
    this.publisher = publisher;

    this.addItem(0, 'Engine', () => this.selectPage(EISPageTypes.Engine), false);
    this.addItem(1, 'Lean', () => this.selectPage(EISPageTypes.Lean), false, config.leanPage ? false : true);
    this.addItem(2, 'System', () => { }, true);
    this.addItem(6, 'RST Fuel', () => { this.publisher.publishEvent('fuel_comp_reset', true); });
    this.addItem(7, 'GAL REM', () => { this.menuSystem.pushMenu('fuel-rem-menu'); });
    this.addItem(10, 'Back', () => {
      this.selectPage(EISPageTypes.Engine);
      menuSystem.back();
    });
  }

  /**
   * Handle a menu item being selected.
   * @param selectedPage The selected item.
   */
  private selectPage(selectedPage: EISPageTypes): void {
    this.publisher.publishEvent('eis_page_select', selectedPage);

    switch (selectedPage) {
      case EISPageTypes.Engine:
        this.menuSystem.replaceMenu('engine-menu'); break;
      case EISPageTypes.Lean:
        this.menuSystem.replaceMenu('lean-menu'); break;
    }
  }
}