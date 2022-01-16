import { MenuSystem } from '../MenuSystem';
import { MFDRootMenu } from './MFDRootMenu';

/**
 * The MFD System Setup page root softkey menu.
 */
export class MFDSystemSetupRootMenu extends MFDRootMenu {
  /**
   * Creates an instance of the MFD System Setup page root softkey menu.
   * @param menuSystem The menu system.
   */
  constructor(menuSystem: MenuSystem) {
    super(menuSystem);

    this.addItem(5, 'Setup 1', undefined, true);
    this.addItem(6, 'Setup 2', undefined, false);
    this.addItem(9, 'Defaults');
    this.addItem(11, 'Checklist');
  }
}