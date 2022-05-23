import { MenuSystem } from '../MenuSystem';
import { SoftKeyMenu } from '../SoftKeyMenu';
import { ControlPublisher } from 'msfssdk/data';

/**
 * The MFD flight plan view options menu.
 */
export class ViewMenu extends SoftKeyMenu {
  private publisher: ControlPublisher;

  /**
   * Creates an instance of the MFD view options menu.
   * @param menuSystem The map options menu system.
   * @param publisher A publisher to use for sending control events
   */
  constructor(menuSystem: MenuSystem, publisher: ControlPublisher) {
    super(menuSystem);
    this.publisher = publisher;

    this.addItem(4, 'Wide', () => { }, false);
    this.addItem(5, 'Narrow', () => { }, false);
    this.addItem(7, 'Leg-Leg', () => { }, false);
    this.addItem(8, 'CUM', () => { }, false);
    this.addItem(10, 'Back', () => menuSystem.back());
  }
}