import { ArraySubject, Subscribable, Subject } from 'msfssdk';
import { AirportFacility, ICAO, OneWayRunway, RunwayUtils } from 'msfssdk/navigation';

/**
 *
 */
export class SetRunwayStore {
  /** A subject which provides this store's airport. */
  public readonly airport = Subject.create<AirportFacility | null>(null);

  private readonly _airportIdent = Subject.create('');
  // eslint-disable-next-line jsdoc/require-returns
  /** The ident of this store's airport. */
  public get airportIdent(): Subscribable<string> {
    return this._airportIdent;
  }

  /** An array of runways at this store's airport. */
  public readonly oneWayRunways = ArraySubject.create<OneWayRunway>([]);

  /**
   * Constructor.
   */
  constructor() {
    this.airport.sub(this.onAirportChanged.bind(this));
  }

  /**
   * A callback which is called when this store's airport changes.
   * @param airport The new airport.
   */
  private onAirportChanged(airport: AirportFacility | null): void {
    this._airportIdent.set(airport ? ICAO.getIdent(airport.icao) : '');

    const runways = airport?.runways.reduce((acc, runway, index) => {
      acc.push(...RunwayUtils.getOneWayRunways(runway, index));
      return acc;
    }, [] as OneWayRunway[]).sort(RunwayUtils.sortRunways)
      ?? [];

    runways.unshift(RunwayUtils.createEmptyOneWayRunway());
    this.oneWayRunways.set(runways);
  }
}