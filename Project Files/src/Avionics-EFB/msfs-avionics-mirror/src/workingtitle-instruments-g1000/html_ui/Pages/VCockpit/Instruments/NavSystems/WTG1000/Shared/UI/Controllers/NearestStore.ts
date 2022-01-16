import { ArraySubject, GeoPoint, GeoPointSubject, MagVar, Subject, Subscribable, UnitType } from 'msfssdk';
import { AirportFacility, AirportRunway, FacilityFrequency, FacilityFrequencyType, FacilityType, FacilitySearchType, NearestSearchResults, RunwaySurfaceType, FacilityLoader, NearestSearchSession, RunwayUtils } from 'msfssdk/navigation';

import { AirportSize } from '../../Navigation/Waypoint';

/**
 * The kind of runways we can filter on for nearest display.  This is meant to be used
 * as a bitfield.  For the Soft/Hard combo, use SurfaceType.Soft | SurfaceType.Hard.
 **/
export enum SurfaceType {
  Any = 1,
  Hard = 2,
  Soft = 4,
  Water = 8
}

/** Shorthand for a collection of SurfaceTypes in a byte. */
export type SurfaceTypeOptions = number;

/** The data for an airport relevant to a nearest record. */
export type NearbyAirport = {
  /** The airport facility. */
  facility: AirportFacility | null,
  /** The distance to the airport in meters. */
  distance: number,
  /** The bearing to the airport */
  bearing: number,
  /** Best approach to the best runway. */
  bestApproach?: string,
  /** Heading of the best runway */
  bestHdg: number,
  /** Length of the best runway in meters. */
  bestLength: number,
  /** The best contact frequency. */
  frequency?: FacilityFrequency | undefined,
  /** Airport size */
  size?: AirportSize
}

/**
 * A filter to be injected into a NearestStore.  This will allow the filtering
 * of a list of airports based upon their longest runway and its surface type.
 * This includes result cacheing to optimize performance of repeated filters.
 * Search parameters may be tweaked, and doing so will automatically invalidate
 * the cache.
 */
export class AirportFilter {
  // These are best guesses as to the proper categorization.   They may need to
  // be tweaked.
  public static surfacesHard = [
    RunwaySurfaceType.Asphalt,
    RunwaySurfaceType.Bituminous,
    RunwaySurfaceType.Brick,
    RunwaySurfaceType.Concrete,
    RunwaySurfaceType.Ice,
    RunwaySurfaceType.Macadam,
    RunwaySurfaceType.Paint,
    RunwaySurfaceType.Planks,
    RunwaySurfaceType.SteelMats,
    RunwaySurfaceType.Tarmac,
    RunwaySurfaceType.Urban,
  ];

  public static surfacesSoft = [
    RunwaySurfaceType.Coral,
    RunwaySurfaceType.Dirt,
    RunwaySurfaceType.Forest,
    RunwaySurfaceType.Grass,
    RunwaySurfaceType.GrassBumpy,
    RunwaySurfaceType.Gravel,
    RunwaySurfaceType.HardTurf,
    RunwaySurfaceType.LongGrass,
    RunwaySurfaceType.OilTreated,
    RunwaySurfaceType.Sand,
    RunwaySurfaceType.Shale,
    RunwaySurfaceType.ShortGrass,
    RunwaySurfaceType.Snow,
    RunwaySurfaceType.WrightFlyerTrack
  ];

  public static surfacesWater = [
    RunwaySurfaceType.WaterFSX,
    RunwaySurfaceType.Lake,
    RunwaySurfaceType.Ocean,
    RunwaySurfaceType.Pond,
    RunwaySurfaceType.River,
    RunwaySurfaceType.WasteWater,
    RunwaySurfaceType.Water
  ];

  public _minLength: number;
  public _surfaceType: SurfaceTypeOptions;
  private cache = new Map<string, boolean>();

  /**
   * Construct an airport filter.
   * @param minLength The minimum length in meters.
   * @param surfaceType The type of surfaces to look for.
   */
  constructor(minLength?: number, surfaceType?: SurfaceTypeOptions) {
    this._minLength = minLength || UnitType.FOOT.convertTo(3000, UnitType.METER);
    this._surfaceType = surfaceType || SurfaceType.Hard;
  }

  /**
   * Perform the filter on a given list of airports.
   * @param airports An array of AirportFacilities.
   * @returns A list of airports meeting the filter criteria.
   */
  public filter(airports: Array<AirportFacility | undefined>): Array<AirportFacility> {
    const filtered = [];
    for (const airport of airports) {
      if (!airport) {
        continue;
      }
      let good = this.cache.get(airport.icao);
      if (good === undefined) {
        this.cache.set(airport.icao, good = this.filterAirport(airport));
      }

      if (good) {
        filtered.push(airport);
      }
    }
    return filtered;
  }

  /**
   * Filter a given airport using the current criteria.
   * @param airport The airport to filter.
   * @returns True if the filter is passed, else false.
   */
  private filterAirport(airport: AirportFacility): boolean {
    const longest = airport.runways.sort((a, b) => b.length - a.length)[0];
    if (longest) {
      if (longest.length < this._minLength) {
        return false;
      }

      if (this.filterRunway(longest, this._surfaceType)) {
        return true;
      }
    }
    return false;
  }

  /**
   * See if a runway matches a given surface type.
   * @param runway The runway to check.
   * @param filter A bitfield of the surface types to allow.
   * @returns True if the runway passes the filter, else false.
   */
  private filterRunway(runway: AirportRunway, filter: SurfaceTypeOptions): boolean {
    if (filter & SurfaceType.Any) {
      return true;
    }

    if (filter & SurfaceType.Soft && AirportFilter.surfacesSoft.includes(runway.surface)) {
      return true;
    }

    if (filter & SurfaceType.Hard && AirportFilter.surfacesHard.includes(runway.surface)) {
      return true;
    }

    if (filter & SurfaceType.Water && AirportFilter.surfacesWater.includes(runway.surface)) {
      return true;
    }

    return false;
  }

  /**
   * Set a new minimum length and clear the cache.
   * @param minLength The new minimum length in meters.
   */
  public set minLength(minLength: number) {
    this._minLength = minLength;
    this.cache.clear();
  }

  /**
   * Get the current minimum length.
   * @returns The minimum length in meters.
   */
  public get minLength(): number {
    return this._minLength;
  }

  /**
   * Set a new surface type filter and clear the cache.
   * @param surfaceType The new surface type options.
   */
  public set surfaceType(surfaceType: SurfaceTypeOptions) {
    this._surfaceType = surfaceType;
    this.cache.clear();
  }

  /**
   * Get the current surface type filter.
   * @returns A bitfield of the surface types to allow.
   */
  public get surfaceType(): SurfaceTypeOptions {
    return this._surfaceType;
  }
}

/** A nearest store. */
export class NearestStore {
  public readonly planePos = GeoPointSubject.createFromGeoPoint(new GeoPoint(NaN, NaN));
  public readonly planeHeading = Subject.create(0);

  public loader?: FacilityLoader;
  private session?: NearestSearchSession<string, string>;
  private filter: AirportFilter;
  public nearestFacilities = new Map<string, AirportFacility>();
  public nearestAirports = new Map<string, NearbyAirport>();
  public nearestSubjects = new Array<Subject<NearbyAirport>>();
  public readonly nearestSubjectList = ArraySubject.create<Subject<NearbyAirport>>();

  private readonly airportCountSub = Subject.create(0);
  public readonly airportCount = this.airportCountSub as Subscribable<number>;

  // G1000 has a 200nm search radius.
  private static searchRange = UnitType.NMILE.convertTo(200, UnitType.METER);
  private static maxFound = 200;
  private static maxReturned = 25;

  /**
   * Create a NearestStore.
   * @param loader A facility loader.
   * @param filter An instance of AirportFilter to use for filtration.
   */
  constructor(loader: FacilityLoader, filter?: AirportFilter) {
    this.loader = loader;
    this.filter = filter || new AirportFilter();
    for (let i = 0; i < NearestStore.maxReturned; i++) {
      this.nearestSubjects.push(Subject.create({
        facility: null,
        distance: -1,
        bearing: -1,
        bestHdg: -1,
        bestLength: -1
      } as NearbyAirport));
      this.nearestSubjectList.insert(this.nearestSubjects[i]);
    }

    this.planePos.sub(pos => {
      if (isNaN(pos.lat) || isNaN(pos.lon)) {
        return;
      }

      this.searchNearest();
    });
  }

  /**
   * Update our nearest airport list.
   */
  public searchNearest(): void {
    if (!this.session) {
      this.loader?.startNearestSearchSession(FacilitySearchType.Airport)
        .then(session => {
          this.session = session;
          this.searchNearest();
        });
    } else {
      const planePos = this.planePos.get();
      this.session.searchNearest(planePos.lat, planePos.lon, NearestStore.searchRange, NearestStore.maxFound)
        .then(results => { return this.updateNearestFacilities(results); })
        .then(() => {
          this.updateNearestAirports();
          this.updateNearestSubjectList();
        });
    }
  }

  /**
   * Update our nearest list with the latest search results.
   * @param results The results from a nearest search.
   * @returns A promise that resolves when the nearest list is updated.
   */
  private updateNearestFacilities(results: NearestSearchResults<string, string>): Promise<void> {
    // The results of a search contains only the elements added or removed from the last
    // search in the session.   So we need to keep track of everythign that's been returned
    // in this session and add and delete as needed.
    for (const icao of results.removed) {
      this.nearestFacilities.delete(icao);
      this.nearestAirports.delete(icao);
    }

    // Get facility information for all the newly added airports.  The facility loader
    // caches search results internally, so we're not going to worry about optimizing
    // that here as well.
    const searches = new Array<Promise<AirportFacility> | undefined>();
    for (const icao of results.added) {
      searches.push(this.loader?.getFacility(FacilityType.Airport, icao));
    }
    return new Promise((resolve) => {
      Promise.all(searches).then(facilities => {
        for (const facility of this.filter.filter(facilities)) {
          if (facility) {
            this.nearestFacilities.set(facility.icao, facility);
          }
        }
        resolve();
      });
    });
  }

  /**
   * Onces the nearby facilities have been updated, we need to update our
   * set of NearbyAirports to account for distance/bearing changes.
   */
  private updateNearestAirports(): void {
    for (const [icao, facility] of this.nearestFacilities.entries()) {
      const nearest = this.nearestAirports.get(icao);
      if (nearest) {
        this.nearestAirports.set(icao, this.updateNearbyAirport(nearest) || this.createNearbyAirport(facility));
      } else {
        this.nearestAirports.set(icao, this.createNearbyAirport(facility));
      }
    }
  }


  /**
   * Update our array of nearest airports sorted by distance.
   * @returns An array of nearby airports sorted by distance.
   */
  private get nearestByDistance(): Array<NearbyAirport> {
    return [...this.nearestAirports.values()].sort(
      (a, b) => {
        return a.distance - b.distance;
      }
    ).slice(0, NearestStore.maxReturned);
  }

  /**
   * Get the contact frequency for an aiport.  Since this really isn't defined
   * in the scenery details, we implement a pretty simple algorithm for determining
   * it:  iterate through al the frequencies and return the first of a) tower,
   * b) unicom, c) mulicom, d) ctaf that is found.
   * @param airport An airport.
   * @returns frequency The best frequency to use.
   */
  private getContactFrequency(airport: AirportFacility): FacilityFrequency | undefined {
    const priority = new Map<FacilityFrequencyType, number>(
      [[FacilityFrequencyType.Tower, 1],
      [FacilityFrequencyType.Unicom, 2],
      [FacilityFrequencyType.Multicom, 3],
      [FacilityFrequencyType.CTAF, 4]]
    );
    const foundFreqs = new Array<FacilityFrequency>();
    const usableTypes = [FacilityFrequencyType.Tower, FacilityFrequencyType.Unicom, FacilityFrequencyType.Multicom, FacilityFrequencyType.CTAF];
    for (const freq of airport.frequencies) {
      if (usableTypes.includes(freq.type)) {
        foundFreqs.push(freq);
      }
    }

    if (foundFreqs.length === 0) {
      return undefined;
    } else {
      return foundFreqs.sort((a, b) => {
        return (priority.get(a.type) || 5) - (priority.get(b.type) || 5);
      })[0];
    }
  }

  /**
   * Create a NearbyAirport from an AirportFacility.
   * @param facility The AirportFacility record.
   * @returns The populated NearbyAirport
   */
  public createNearbyAirport(facility: AirportFacility): NearbyAirport {
    const bestRunway = facility.runways.sort((a, b) => b.length - a.length)[0];
    const bestRwyApps = RunwayUtils.getProceduresForRunway(facility.approaches, bestRunway);
    let bestApproach = 'VFR';
    for (const approach of bestRwyApps) {
      switch (approach.name.substring(0, 3)) {
        case 'ILS':
          bestApproach = 'ILS';
          break;
        case 'LOC':
          if (bestApproach !== 'ILS') {
            bestApproach = 'LOC';
          }
          break;
        case 'RNA':
          if (bestApproach != 'ILS' && bestApproach !== 'LOC') {
            bestApproach = 'RNA';
          }
          break;
        case 'VOR':
          if (bestApproach !== 'ILS' && bestApproach !== 'LOC' && bestApproach !== 'RNA') {
            bestApproach = 'VOR';
          }
          break;
        case 'NDB':
          if (bestApproach !== 'ILS' && bestApproach !== 'LOC' && bestApproach !== 'RNA' && bestApproach !== 'VOR') {
            bestApproach = 'NDB';
          }
          break;
      }
    }

    const planePos = this.planePos.get();

    return {
      facility: facility,
      distance: UnitType.GA_RADIAN.convertTo(planePos.distance(facility.lat, facility.lon), UnitType.METER),
      bearing: MagVar.trueToMagnetic(planePos.bearingTo(facility), planePos),
      bestHdg: bestRunway.direction,
      bestLength: bestRunway.length,
      frequency: this.getContactFrequency(facility),
      bestApproach: bestApproach,
    };
  }

  /**
   * Update the dynamic data on a nearby airport.
   * @param airport The airport to update.
   * @returns An updated airport or undefined.
   */
  public updateNearbyAirport(airport: NearbyAirport): NearbyAirport | undefined {
    const facility = airport.facility && this.nearestFacilities.get(airport.facility.icao);
    if (facility) {
      const newAirport = {
        facility: {} as AirportFacility,
        distance: -1,
        bearing: -1,
        bestHdg: -1,
        bestLength: -1,
      };

      const planePos = this.planePos.get();

      Object.assign(newAirport as NearbyAirport, airport);
      newAirport.distance = UnitType.GA_RADIAN.convertTo(planePos.distance(facility.lat, facility.lon), UnitType.METER);
      newAirport.bearing = MagVar.trueToMagnetic(planePos.bearingTo(facility), planePos);
      return newAirport;
    } else {
      return undefined;
    }
  }


  /**
   * Update the nearest list with the current nearby airports.
   */
  private updateNearestSubjectList(): void {
    let airportCount = 0;

    const nearestSorted = this.nearestByDistance;
    for (let i = 0; i < NearestStore.maxReturned; i++) {
      if (i < nearestSorted.length) {
        this.nearestSubjects[i].set(nearestSorted[i]);
        airportCount++;
      } else {
        this.nearestSubjects[i].set({
          facility: null,
          distance: -1,
          bearing: -1,
          bestHdg: -1,
          bestLength: -1
        });
      }
    }

    this.airportCountSub.set(airportCount);
  }
}
