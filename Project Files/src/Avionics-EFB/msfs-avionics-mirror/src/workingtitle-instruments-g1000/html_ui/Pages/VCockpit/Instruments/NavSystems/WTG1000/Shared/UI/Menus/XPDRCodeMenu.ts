import { ControlEvents, EventBus } from 'msfssdk/data';
import { G1000ControlPublisher } from '../../G1000Events';
import { MenuSystem } from './MenuSystem';
import { SoftKeyMenu } from './SoftKeyMenu';

/**
 * The XPDR softkey menu.
 */
export class XPDRCodeMenu extends SoftKeyMenu {


  /**
   * Creates an instance of the transponder code menu.
   * @param menuSystem The menu system.
   * @param bus is the event bus
   * @param g1000Publisher the G1000 control events publisher
   */
  constructor(menuSystem: MenuSystem, bus: EventBus, g1000Publisher: G1000ControlPublisher) {
    super(menuSystem);

    this.addItem(0, '0', () => {
      g1000Publisher.publishEvent('xpdr_code_digit', 0);
    });
    this.addItem(1, '1', () => {
      g1000Publisher.publishEvent('xpdr_code_digit', 1);
    });
    this.addItem(2, '2', () => {
      g1000Publisher.publishEvent('xpdr_code_digit', 2);
    });
    this.addItem(3, '3', () => {
      g1000Publisher.publishEvent('xpdr_code_digit', 3);
    });
    this.addItem(4, '4', () => {
      g1000Publisher.publishEvent('xpdr_code_digit', 4);
    });
    this.addItem(5, '5', () => {
      g1000Publisher.publishEvent('xpdr_code_digit', 5);
    });
    this.addItem(6, '6', () => {
      g1000Publisher.publishEvent('xpdr_code_digit', 6);
    });
    this.addItem(7, '7', () => {
      g1000Publisher.publishEvent('xpdr_code_digit', 7);
    });
    this.addItem(8, 'Ident');
    this.addItem(9, 'BKSP', () => {
      g1000Publisher.publishEvent('xpdr_code_digit', -1);
    });
    this.addItem(10, 'Back', () => {
      g1000Publisher.publishEvent('xpdr_code_push', false);
      menuSystem.back();
    });
    this.addItem(11, 'Alerts');

    this.onNewCodeFromSim(bus, menuSystem);
  }

  /**
   * Method to close menu when a new code is published from the xpdr component.
   * @param bus is the event bus
   * @param menuSystem The menu system.
   */
  private onNewCodeFromSim(bus: EventBus, menuSystem: MenuSystem): void {
    const controlPublisher = bus.getSubscriber<ControlEvents>();
    controlPublisher.on('publish_xpdr_code').handle(() => {
      menuSystem.back();
    });
  }
}