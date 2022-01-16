import { MenuSystem } from '../MenuSystem';
import { SoftKeyMenu } from '../SoftKeyMenu';
import { G1000ControlPublisher } from '../../../G1000Events';
import { EISPageTypes } from '../../../../MFD/Components/EIS';
import { XMLExtendedGaugeConfig } from 'msfssdk/components/XMLGauges';

/**
 * The MFD Engine lean  menu.
 */
export class LeanMenu extends SoftKeyMenu {
  private publisher: G1000ControlPublisher;
  private leanAssistActive = false;
  private cylSlctActive = false;

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
    this.addItem(1, 'Lean', () => { }, true);
    this.addItem(2, 'System', () => this.selectPage(EISPageTypes.System), false, config.systemPage ? false : true);
    this.addItem(4, 'CYL SLCT', () => { this.toggleLeanCylSlct(); });
    this.addItem(5, 'Assist', () => { this.toggleLeanAssist(); }, false);
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
      case EISPageTypes.System:
        this.menuSystem.replaceMenu('system-menu'); break;
    }
  }

  /**
   * Turn lean assist mode on and off.
   */
  private toggleLeanAssist(): void {
    this.leanAssistActive = !this.leanAssistActive;
    this.publisher.publishEvent('eis_lean_assist', this.leanAssistActive);
    this.getItem(5).value.set(this.leanAssistActive);
    this.getItem(4).disabled.set(this.leanAssistActive);
  }

  /**
   * Cycles cylinder select.
   */
  private toggleLeanCylSlct(): void {
    if (this.leanAssistActive) {
      return;
    }
    this.publisher.publishEvent('eis_cyl_slct', true);
  }
}