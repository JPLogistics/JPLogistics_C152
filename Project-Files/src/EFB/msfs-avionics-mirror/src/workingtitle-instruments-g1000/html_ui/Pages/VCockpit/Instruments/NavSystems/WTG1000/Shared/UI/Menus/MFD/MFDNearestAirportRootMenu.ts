import { NearestAirportSoftKey } from '../../../../MFD/Components/UI/Nearest/MFDNearestAirportsPage';
import { G1000ControlEvents, G1000ControlPublisher } from '../../../G1000Events';
import { MenuSystem } from '../MenuSystem';
import { MFDNavMapRootMenu } from './MFDNavMapRootMenu';

/**
 * The root menu displayed when the MFD nearest airport page is open.
 */
export class MFDNearestAirportRootMenu extends MFDNavMapRootMenu {
  private publisher: G1000ControlPublisher;

  /**
   * Creates an instance of the MFD map options menu.
   * @param menuSystem The map options menu system.
   * @param publisher A publisher to use for sending control events
   */
  constructor(menuSystem: MenuSystem, publisher: G1000ControlPublisher) {
    super(menuSystem);
    this.publisher = publisher;

    this.addItem(4, 'APT', this.publishNearestAirportKey.bind(this, NearestAirportSoftKey.APT));
    this.addItem(5, 'RNWY', this.publishNearestAirportKey.bind(this, NearestAirportSoftKey.RNWY));
    this.addItem(6, 'FREQ', this.publishNearestAirportKey.bind(this, NearestAirportSoftKey.FREQ));
    this.addItem(7, 'APR', this.publishNearestAirportKey.bind(this, NearestAirportSoftKey.APR));
    this.addItem(9, 'LD APR', this.publishNearestAirportKey.bind(this, NearestAirportSoftKey.LD_APR), undefined, true);

    this.menuSystem.bus.getSubscriber<G1000ControlEvents>().on('ld_apr_enabled').handle(enabled => {
      this.getItem(9).disabled.set(!enabled);
    });
  }

  /**
   * Handles when a button to change the focus group for the nearest airport page
   * is pressed.
   * @param category The page group to focus.
   */
  private publishNearestAirportKey(category: NearestAirportSoftKey): void {
    this.publisher.publishEvent('nearest_airports_key', category);
  }
}