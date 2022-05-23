import { NearestVorSoftKey } from '../../../../MFD/Components/UI/Nearest/MFDNearestVORsPage';
import { G1000ControlPublisher } from '../../../G1000Events';
import { MenuSystem } from '../MenuSystem';
import { MFDNavMapRootMenu } from './MFDNavMapRootMenu';

/**
 * The root menu displayed when the MFD nearest VOR page is open.
 */
export class MFDNearestVorRootMenu extends MFDNavMapRootMenu {
  private publisher: G1000ControlPublisher;

  /**
   * Creates an instance of the MFD map options menu.
   * @param menuSystem The map options menu system.
   * @param publisher A publisher to use for sending control events
   */
  constructor(menuSystem: MenuSystem, publisher: G1000ControlPublisher) {
    super(menuSystem);
    this.publisher = publisher;

    this.addItem(4, 'VOR', this.publishNearestAirportKey.bind(this, NearestVorSoftKey.VOR));
    this.addItem(5, 'FREQ', this.publishNearestAirportKey.bind(this, NearestVorSoftKey.FREQ));
  }

  /**
   * Handles when a button to change the focus group for the nearest airport page
   * is pressed.
   * @param category The page group to focus.
   */
  private publishNearestAirportKey(category: NearestVorSoftKey): void {
    this.publisher.publishEvent('nearest_vors_key', category);
  }
}