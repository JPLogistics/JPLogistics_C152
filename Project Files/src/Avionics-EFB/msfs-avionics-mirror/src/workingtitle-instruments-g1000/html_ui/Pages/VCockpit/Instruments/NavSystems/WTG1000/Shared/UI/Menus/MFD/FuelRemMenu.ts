import { MenuSystem } from '../MenuSystem';
import { SoftKeyMenu } from '../SoftKeyMenu';
import { G1000ControlPublisher } from '../../../G1000Events';
import { EISPageTypes } from '../../../../MFD/Components/EIS';
import { XMLExtendedGaugeConfig } from 'msfssdk/components/XMLGauges';

/**
 * The MFD Engine system  menu.
 */
export class FuelRemMenu extends SoftKeyMenu {
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
    this.addItem(3, '-10 GAL', () => { this.publisher.publishEvent('fuel_adjustment', { direction: 'remove', amount: 10 }); });
    this.addItem(4, '-1 GAL', () => { this.publisher.publishEvent('fuel_adjustment', { direction: 'remove', amount: 1 }); });
    this.addItem(5, '+1 GAL', () => { this.publisher.publishEvent('fuel_adjustment', { direction: 'add', amount: 1 }); });
    this.addItem(6, '+10 GAL', () => { this.publisher.publishEvent('fuel_adjustment', { direction: 'add', amount: 10 }); });
    this.addItem(7, '35 GAL', () => { this.publisher.publishEvent('fuel_adjustment', { direction: 'set', amount: 35 }); });
    this.addItem(8, '53 GAL', () => { this.publisher.publishEvent('fuel_adjustment', { direction: 'set', amount: 53 }); });
    this.addItem(10, 'Back', () => {
      this.selectPage(EISPageTypes.System);
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