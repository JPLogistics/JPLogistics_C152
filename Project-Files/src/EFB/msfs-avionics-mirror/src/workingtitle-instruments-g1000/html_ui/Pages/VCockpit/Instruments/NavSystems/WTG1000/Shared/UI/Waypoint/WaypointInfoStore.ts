import {
  ComputedSubject, GeoPoint, GeoPointInterface, GeoPointSubject, NavAngleSubject, NavAngleUnit, NavAngleUnitReferenceNorth, NavMath, NumberUnitInterface,
  NumberUnitSubject, Subject, Subscribable, UnitFamily, UnitType
} from 'msfssdk';
import { AirportFacility, AirportWaypoint, Facility, FacilityWaypoint, ICAO, Waypoint } from 'msfssdk/navigation';

import { Regions } from 'garminsdk/navigation';

/**
 * A store for commonly used waypoint info.
 */
export class WaypointInfoStore {
  private static readonly NULL_LOCATION = new GeoPoint(NaN, NaN);

  /** This store's current waypoint. */
  public readonly waypoint = Subject.create<Waypoint | null>(null);

  private readonly _location = GeoPointSubject.createFromGeoPoint(WaypointInfoStore.NULL_LOCATION.copy());
  // eslint-disable-next-line jsdoc/require-returns
  /** The location of this store's current waypoint. */
  public get location(): Subscribable<GeoPointInterface> {
    return this._location;
  }

  private readonly _name = ComputedSubject.create<Waypoint | null, string>(null, (waypoint): string => {
    if (waypoint) {
      if (waypoint instanceof FacilityWaypoint && waypoint.facility.name !== '') {
        return Utils.Translate(waypoint.facility.name);
      }
    }

    return '__________';
  });
  // eslint-disable-next-line jsdoc/require-returns
  /** The name of this store's current waypoint. */
  public get name(): Subscribable<string> {
    return this._name;
  }

  private readonly _region = ComputedSubject.create<Waypoint | null, string>(null, (waypoint): string => {
    if (waypoint instanceof FacilityWaypoint) {
      if (waypoint instanceof AirportWaypoint) {
        // airports don't have region codes in their ICAO strings, we will try to grab the code from the first 2
        // letters of the ident. However, some airports (e.g. in the US and those w/o 4-letter idents) don't use the
        // region code for the ident, so we need a third fallback, which is to just display the city name instead.
        const airport = waypoint.facility as AirportFacility;
        const ident = ICAO.getIdent(airport.icao).trim();
        let text = ident.length === 4 ? Regions.getName(ident.substr(0, 2)) : '';
        if (text === '' && airport.city !== '') {
          text = airport.city.split(', ').map(name => Utils.Translate(name)).join(', ');
        }

        if (text) {
          return text;
        }
      } else {
        return Regions.getName(waypoint.facility.icao.substr(1, 2));
      }
    }

    return '__________';
  });
  // eslint-disable-next-line jsdoc/require-returns
  /** The region of this store's current waypoint. */
  public get region(): Subscribable<string> {
    return this._region;
  }

  private readonly _city = ComputedSubject.create<Waypoint | null, string>(null, (waypoint): string => {
    if (waypoint instanceof FacilityWaypoint && waypoint.facility.city !== '') {
      return (waypoint as FacilityWaypoint<Facility>).facility.city.split(', ').map(name => Utils.Translate(name)).join(', ');
    }

    return '__________';
  });
  // eslint-disable-next-line jsdoc/require-returns
  /** The city associated with this store's current waypoint. */
  public get city(): Subscribable<string> {
    return this._city;
  }

  private readonly _distance = NumberUnitSubject.createFromNumberUnit(UnitType.NMILE.createNumber(NaN));
  // eslint-disable-next-line jsdoc/require-returns
  /** The distance from the airplane to this store's current waypoint. */
  public get distance(): Subscribable<NumberUnitInterface<UnitFamily.Distance>> {
    return this._distance;
  }

  private readonly _bearing = NavAngleSubject.createFromNavAngle(new NavAngleUnit(NavAngleUnitReferenceNorth.True, 0, 0).createNumber(NaN));
  // eslint-disable-next-line jsdoc/require-returns
  /** The true bearing from the airplane to this store's current waypoint. */
  public get bearing(): Subscribable<NumberUnitInterface<typeof NavAngleUnit.FAMILY, NavAngleUnit>> {
    return this._bearing;
  }

  /**
   * Constructor.
   * @param waypoint A subscribable which provides this store's waypoint. If not defined, this store's waypoint can
   * still be set via its .waypoint Subject.
   * @param planePos A subscribable which provides the current airplane position for this store. If not defined, then
   * this store will not provide distance- or bearing-to-waypoint information.
   */
  constructor(
    waypoint?: Subscribable<Waypoint | null>,
    private readonly planePos?: Subscribable<GeoPointInterface>
  ) {
    waypoint && waypoint.sub(wpt => { this.waypoint.set(wpt); }, true);
    this.waypoint.sub(this.onWaypointChanged.bind(this), true);
    planePos && planePos.sub(this.onPlanePosChanged.bind(this), true);
  }

  /**
   * A callback which is called when this store's waypoint changes.
   * @param waypoint The new waypoint.
   */
  private onWaypointChanged(waypoint: Waypoint | null): void {
    const planePos = this.planePos?.get() ?? WaypointInfoStore.NULL_LOCATION;
    this.updateLocation(waypoint);
    this.updateName(waypoint);
    this.updateRegion(waypoint);
    this.updateCity(waypoint);
    this.updateDistance(waypoint, planePos);
    this.updateBearing(waypoint, planePos);
  }

  /**
   * A callback which is called when this store's plane position changes.
   * @param planePos The new plane position.
   */
  private onPlanePosChanged(planePos: GeoPointInterface): void {
    const waypoint = this.waypoint.get();
    if (waypoint) {
      this.updateDistance(waypoint, planePos);
      this.updateBearing(waypoint, planePos);
    }
  }

  /**
   * Updates this store's location information.
   * @param waypoint The store's current waypoint.
   */
  private updateLocation(waypoint: Waypoint | null): void {
    this._location.set(waypoint?.location ?? WaypointInfoStore.NULL_LOCATION);
  }

  /**
   * Updates this store's name information.
   * @param waypoint The store's current waypoint.
   */
  private updateName(waypoint: Waypoint | null): void {
    this._name.set(waypoint);
  }

  /**
   * Updates this store's region information.
   * @param waypoint The store's current waypoint.
   */
  private updateRegion(waypoint: Waypoint | null): void {
    this._region.set(waypoint);
  }

  /**
   * Updates this store's city information.
   * @param waypoint The store's current waypoint.
   */
  private updateCity(waypoint: Waypoint | null): void {
    this._city.set(waypoint);
  }

  /**
   * Updates this store's distance-to-waypoint information.
   * @param waypoint The store's current waypoint.
   * @param planePos The current position of the airplane.
   */
  private updateDistance(waypoint: Waypoint | null, planePos: GeoPointInterface): void {
    if (!waypoint || isNaN(planePos.lat) || isNaN(planePos.lon)) {
      this._distance.set(NaN);
      return;
    }

    this._distance.set(waypoint.location.distance(planePos), UnitType.GA_RADIAN);
  }

  /**
   * Updates this store's bearing-to-waypoint information.
   * @param waypoint The store's current waypoint.
   * @param planePos The current position of the airplane.
   */
  private updateBearing(waypoint: Waypoint | null, planePos: GeoPointInterface): void {
    if (!waypoint || isNaN(planePos.lat) || isNaN(planePos.lon)) {
      this._bearing.set(NaN);
      return;
    }

    const brg = NavMath.normalizeHeading(planePos.bearingTo(waypoint.location));
    this._bearing.set(brg, planePos.lat, planePos.lon);
  }
}