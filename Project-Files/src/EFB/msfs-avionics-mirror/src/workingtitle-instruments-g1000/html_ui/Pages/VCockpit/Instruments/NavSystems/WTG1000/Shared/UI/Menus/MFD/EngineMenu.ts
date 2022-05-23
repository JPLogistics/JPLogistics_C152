import { MenuSystem } from '../MenuSystem';
import { SoftKeyMenu } from '../SoftKeyMenu';
import { G1000ControlPublisher } from '../../../G1000Events';
import { EISPageTypes } from '../../../../MFD/Components/EIS';
import { XMLExtendedGaugeConfig } from 'msfssdk/components/XMLGauges';

/**
 * The MFD Engine softkey menu.
 */
export class EngineMenu extends SoftKeyMenu {
  private publisher: G1000ControlPublisher;

  /**
   * Creates an instance of the MFD engine menu.
   * @param menuSystem The engine menu system.
   * @param config The EIS gauge configuration.
   * @param publisher A publisher to use for sending control events
   */
  constructor(menuSystem: MenuSystem, config: XMLExtendedGaugeConfig, publisher: G1000ControlPublisher) {
    super(menuSystem);
    this.publisher = publisher;

    this.addItem(0, 'Engine', () => { }, true);
    this.addItem(1, 'Lean', () => this.selectPage(EISPageTypes.Lean), false, config.leanPage ? false : true);
    this.addItem(2, 'System', () => this.selectPage(EISPageTypes.System), false, config.systemPage ? false : true);
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
      case EISPageTypes.Lean:
        this.menuSystem.replaceMenu('lean-menu'); break;
      case EISPageTypes.System:
        this.menuSystem.replaceMenu('system-menu'); break;
    }
  }
}