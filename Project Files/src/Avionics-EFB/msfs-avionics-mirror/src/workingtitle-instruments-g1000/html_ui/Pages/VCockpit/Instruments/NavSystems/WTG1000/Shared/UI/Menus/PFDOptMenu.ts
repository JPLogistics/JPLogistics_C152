import { MenuSystem } from './MenuSystem';
import { SoftKeyMenu } from './SoftKeyMenu';
import { ControlPublisher, EventBus } from 'msfssdk/data';
import { G1000ControlEvents, G1000ControlPublisher } from '../../../Shared/G1000Events';

/**
 * The PFD Opt softkey menu.
 */
export class PFDOptMenu extends SoftKeyMenu {
  private stdBaroSet: boolean;
  private bus: EventBus;
  private dmeActive = false;

  /**
   * Creates an instance of the PFD Opt softkey menu.
   * @param menuSystem The menu system.
   * @param publisher A publisher to use for sending control events
   * @param g1000Publisher A G1000 control publisher local to the PFD
   * @param bus is an event bus
   */
  constructor(menuSystem: MenuSystem, publisher: ControlPublisher, g1000Publisher: G1000ControlPublisher, bus: EventBus) {
    super(menuSystem);
    this.stdBaroSet = false;
    this.bus = bus;

    this.addItem(0, 'SVT', () => menuSystem.pushMenu('svt'));
    this.addItem(2, 'Wind', () => menuSystem.pushMenu('wind'));
    this.addItem(3, 'DME', () => {
      this.dmeActive = !this.dmeActive;
      publisher.publishEvent('dme_toggle', this.dmeActive);
    });
    this.addItem(4, 'Bearing 1', () => { publisher.publishEvent('brg_src_switch', 1); });
    this.addItem(6, 'Bearing 2', () => { publisher.publishEvent('brg_src_switch', 2); });
    this.addItem(8, 'ALT Units', () => menuSystem.pushMenu('alt-units'));
    this.addItem(9, 'STD Baro', () => {
      //this.stdBaroSet = !this.stdBaroSet;
      g1000Publisher.publishEvent('std_baro_switch', !this.stdBaroSet);
      menuSystem.back();
    });
    this.addItem(10, 'Back', () => menuSystem.back());
    this.addItem(11, 'Alerts');

    this.init();
  }

  /**
   * Init the PFD Opt Menu to watch the baro std event and track the status.
   */
  private init(): void {
    this.bus.getSubscriber<G1000ControlEvents>().on('std_baro_switch')
      .handle(this.updateBaroStd.bind(this));
  }

  /**
   * Update the locally stored value for whether baro is set to standard when updated by either this menu or by adjusting the baro knob.
   * @param baroStd is whether the altimeter instrument is in std baro mode.
   */
  private updateBaroStd(baroStd: boolean): void {
    this.stdBaroSet = baroStd;
  }
}