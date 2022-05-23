import { MenuSystem } from '../MenuSystem';
import { SoftKeyMenu } from '../SoftKeyMenu';
import { ControlPublisher } from 'msfssdk/data';

/**
 * The MFD Map options system  menu.
 */
export class InsetMenu extends SoftKeyMenu {
  private publisher: ControlPublisher;

  /**
   * Creates an instance of the MFD map options menu.
   * @param menuSystem The map options menu system.
   * @param publisher A publisher to use for sending control events
   */
  constructor(menuSystem: MenuSystem, publisher: ControlPublisher) {
    super(menuSystem);
    this.publisher = publisher;

    this.addItem(0, 'Off', () => { }, false, true);
    this.addItem(2, 'VSD', () => { }, false, true);
    this.addItem(4, 'VSD Auto', () => { }, false, true);
    this.addItem(10, 'Back', () => menuSystem.back());
  }
}