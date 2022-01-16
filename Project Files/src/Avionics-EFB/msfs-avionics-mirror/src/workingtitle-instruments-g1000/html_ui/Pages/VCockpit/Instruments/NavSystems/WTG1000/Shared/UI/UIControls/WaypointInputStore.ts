import { ComputedSubject, Subject } from 'msfssdk';
import { EventBus } from 'msfssdk/data';
import { Facility, ICAO, FacilityLoader, FacilityRespository, FacilitySearchType } from 'msfssdk/navigation';

import { FacilityWaypoint, Waypoint } from '../../Navigation/Waypoint';
import { FacilityWaypointCache } from '../../Navigation/FacilityWaypointCache';

/**
 * Waypoint input store
 */
export class WaypointInputStore {
  private readonly nameEmptyStr = '_______________';
  private readonly cityEmptyStr = '________________';

  public displayWaypoint = {
    icao: '',
    name: ComputedSubject.create<string, string>(this.nameEmptyStr, (v) => {
      return (v === '') ? this.nameEmptyStr : Utils.Translate(v);
    }),
    city: ComputedSubject.create('', (v) => {
      if (v === '') {
        return this.cityEmptyStr;
      }
      const separatedCity = v.split(', ');
      return separatedCity.length > 1 ? Utils.Translate(separatedCity[0]) + ' ' + Utils.Translate(separatedCity[1]).substr(0, 2).toUpperCase() : Utils.Translate(v);
    }),
  };

  private readonly facRepo;
  private readonly facLoader;
  private readonly facWaypointCache;

  /** A subject which provides the currently selected waypoint. */
  public readonly selectedWaypoint = Subject.create<FacilityWaypoint<Facility> | null>(null);

  /** A subject which provides the input text value which should be displayed. */
  public readonly inputValue = Subject.create('');

  private _matchedIcaos: string[] = [];
  // eslint-disable-next-line jsdoc/require-returns
  /** An array of ICAO strings which have matched the input. */
  public get matchedIcaos(): readonly string[] {
    return this._matchedIcaos;
  }

  private _matchedWaypoints: FacilityWaypoint<Facility>[] = [];
  // eslint-disable-next-line jsdoc/require-returns
  /** An array of facilities which have matched the input. */
  public get matchedWaypoints(): readonly FacilityWaypoint<Facility>[] {
    return this._matchedWaypoints;
  }

  private loadIcaosOpId = 0;

  /**
   * Creates an instance of waypoint input store.
   * @param bus The event bus.
   * @param searchFilter This store's search filter for ICAOSearch.
   * @param onWaypointChanged A function which is called when this store's selected waypoint changes.
   * @param onFacilityChanged A function which is called when this store's selected facility changes.
   * @param onMatchedWaypointsChanged A function which is called when this store's matched waypoints changes.
   */
  constructor(
    bus: EventBus,
    private readonly searchFilter: FacilitySearchType,
    private readonly onWaypointChanged?: (waypoint: Waypoint | null) => void,
    private readonly onFacilityChanged?: (fac: Facility | undefined) => void,
    private readonly onMatchedWaypointsChanged?: (waypoints: readonly FacilityWaypoint<Facility>[]) => void
  ) {
    this.facRepo = FacilityRespository.getRepository(bus);
    this.facLoader = new FacilityLoader(this.facRepo);
    this.facWaypointCache = FacilityWaypointCache.getCache();
    this.selectedWaypoint.sub(waypoint => {
      this.onWaypointChanged && this.onWaypointChanged(waypoint);
      this.onFacilityChanged && this.onFacilityChanged(waypoint?.facility);
    });
  }

  /**
   * Executes the icao search.
   * @param searchStr The search string.
   * @returns An array of the found ICAOs.
   */
  public doSearch(searchStr: string): Promise<string[]> {
    return this.facLoader.searchByIdent(this.searchFilter, searchStr);
  }

  /**
   * Loads and display the facility data for the currently found ICAO
   * @param icaos The ICAO to load.
   * @returns a Promise which fulfills with whether the ICAO data was successfully loaded.
   */
  public async loadIcaoData(icaos: readonly string[]): Promise<boolean> {
    if (icaos.length === this._matchedIcaos.length && icaos.every((icao, index) => icao === this._matchedIcaos[index])) {
      return false;
    }

    const opId = ++this.loadIcaosOpId;
    let matchedWaypoints;
    try {
      matchedWaypoints = await Promise.all(
        icaos.map(
          async icao => this.facWaypointCache.get(await this.facLoader.getFacility(ICAO.getFacilityType(icao), icao))
        )
      );
    } catch (e) {
      icaos = [];
    }

    if (opId !== this.loadIcaosOpId) {
      return false;
    }

    this._matchedIcaos = [...icaos];
    this._matchedWaypoints = matchedWaypoints ?? [];

    this.onMatchedWaypointsChanged && this.onMatchedWaypointsChanged(this.matchedWaypoints);

    if (this._matchedWaypoints.length > 0) {
      this.setWaypoint(this._matchedWaypoints[0]);
    } else {
      this.clearWaypoint();
    }

    return true;
  }

  /**
   * Sets the selected and displayed waypoint.
   * @param waypoint A facility waypoint.
   */
  public setWaypoint(waypoint: FacilityWaypoint<Facility>): void {
    this.selectedWaypoint.set(waypoint);
    this.displayWaypoint.icao = waypoint.facility.icao;
    this.displayWaypoint.city.set(waypoint.facility.city);
    this.displayWaypoint.name.set(waypoint.facility.name);
  }

  /**
   * Clears the selected and displayed waypoint.
   */
  public clearWaypoint(): void {
    this.selectedWaypoint.set(null);
    if (this.displayWaypoint.icao !== '') {
      this.displayWaypoint.icao = '';
      this.displayWaypoint.city.set('');
      this.displayWaypoint.name.set('');
    }
  }
}