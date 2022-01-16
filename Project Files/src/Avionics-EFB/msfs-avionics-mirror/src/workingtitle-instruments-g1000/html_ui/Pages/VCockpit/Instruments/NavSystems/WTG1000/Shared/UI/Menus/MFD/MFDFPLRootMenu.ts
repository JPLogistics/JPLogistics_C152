import { MenuSystem } from '../MenuSystem';
import { SoftKeyMenu } from '../SoftKeyMenu';
import { ControlEvents, ControlPublisher } from 'msfssdk/data';
import { ComputedSubject } from 'msfssdk';
import { G1000ControlEvents } from '../../../G1000Events';

/**
 * The MFD flight plan options menu when the popout is opened.
 */
export class MFDFPLRootMenu extends SoftKeyMenu {
  private publisher: ControlPublisher;

  private vnavState = true;
  private readonly vnavLabel = ComputedSubject.create(true, (v): string => {
    return v === true ? 'Cncl VNV' : 'ENBL VNV';
  });

  /**
   * Creates an instance of the MFD flight plan options menu.
   * @param menuSystem The map options menu system.
   * @param publisher A publisher to use for sending control events
   */
  constructor(menuSystem: MenuSystem, publisher: ControlPublisher) {
    super(menuSystem);
    this.publisher = publisher;
    const g1000Publisher = menuSystem.bus.getPublisher<G1000ControlEvents>();

    this.addItem(0, 'Engine', () => menuSystem.pushMenu('engine-menu'));
    this.addItem(2, 'Map Opt', () => menuSystem.pushMenu('map-opt'));
    this.addItem(3, 'New WPT', () => { }, undefined, true);
    this.addItem(4, 'View', () => menuSystem.pushMenu('view-opt'), undefined, true);
    this.addItem(5, 'VNV Prof', () => g1000Publisher.pub('vnv_prof_key', true), undefined, false);
    this.addItem(6, this.vnavLabel.get() as string, () => {
      if (this.vnavState) {
        publisher.publishEvent('vnav_enabled', false);
      } else {
        publisher.publishEvent('vnav_enabled', true);
      }
    });
    this.addItem(7, 'VNV Ð', () => {
      g1000Publisher.pub('activate_vertical_direct', true);
    }, undefined, !this.vnavState);
    this.addItem(8, 'ATK OFS', () => { }, undefined, true);
    this.addItem(9, 'ACT Leg', () => { }, undefined, true);
    this.addItem(10, 'Charts', () => { }, undefined, true);
    this.addItem(11, 'Checklist', () => { }, undefined, true);

    menuSystem.bus.getSubscriber<ControlEvents>().on('vnav_enabled').handle(d => {
      this.vnavState = d;
      this.vnavLabel.set(this.vnavState);
      this.getItem(6).label.set(this.vnavLabel.get());
      this.getItem(7).disabled.set(!this.vnavState);
    });
  }
}