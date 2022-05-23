import { NearestStore } from './NearestStore';
import { ControlPublisher } from 'msfssdk/data';
import { AirportFacility } from 'msfssdk/navigation';
import { ViewService } from '../ViewService';

/** A nearest controleer */
export class NearestController {
  private store: NearestStore;
  private publisher: ControlPublisher;

  public readonly onDirectIdentHandler = this.onDirectIdent.bind(this);
  public readonly onEnterFreqHandler = this.onEnterFreq.bind(this);

  /**
   * Creates one.
   * @param store the store
   * @param publisher A ControlPublisher for freq set events.
   * @param viewService The View Service.
   */
  constructor(store: NearestStore, publisher: ControlPublisher, private readonly viewService: ViewService) {
    this.store = store;
    this.publisher = publisher;
  }

  /**
   * A callback which is called when a DRCT input is made on a nearest airport.
   * @param airport The airport.
   * @returns Whether the event was handled.
   */
  private onDirectIdent(airport: AirportFacility | null): boolean {
    if (airport) {
      this.viewService.open('DirectTo').setInput({
        icao: airport.icao
      });
    }

    return true;
  }

  /**
   * A callback which is called when an ENTER input is made on a nearest airport frequency.
   * @param value The frequency.
   * @returns Whether the event was handled.
   */
  private onEnterFreq(value: string): boolean {
    this.publisher.publishEvent('standby_com_freq', value);
    return true;
  }
}