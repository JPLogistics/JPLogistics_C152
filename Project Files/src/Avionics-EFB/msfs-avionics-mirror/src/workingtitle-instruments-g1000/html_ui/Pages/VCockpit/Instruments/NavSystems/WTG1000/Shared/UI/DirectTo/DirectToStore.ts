import { GeoPointInterface, Subject, Subscribable } from 'msfssdk';
import { Facility } from 'msfssdk/navigation';
import { FacilityWaypoint, Waypoint } from '../../Navigation/Waypoint';
import { WaypointInfoStore } from '../Waypoint/WaypointInfoStore';

/** The store for the DTO view */
export class DirectToStore {
  public readonly waypointInfoStore: WaypointInfoStore;
  public readonly courseTens = Subject.create(0);
  public readonly courseOnes = Subject.create(0);
  public readonly course = Subject.create<number | undefined>(undefined);

  // eslint-disable-next-line jsdoc/require-returns
  /** A subject which provides this store's selected waypoint. */
  public get waypoint(): Subject<Waypoint | null> {
    return this.waypointInfoStore.waypoint;
  }

  private _matchedWaypoints: FacilityWaypoint<Facility>[] = [];
  // eslint-disable-next-line jsdoc/require-returns
  /** An array of waypoints which have matched the input. */
  public get matchedWaypoints(): readonly FacilityWaypoint<Facility>[] {
    return this._matchedWaypoints;
  }

  /**
   * Constructor.
   * @param planePos A subscribable which provides the current airplane position for this store.
   */
  constructor(public readonly planePos: Subscribable<GeoPointInterface>) {
    this.waypointInfoStore = new WaypointInfoStore(undefined, planePos);
  }

  /**
   * Set the list of matched waypoints.
   * @param waypoints An array of matched waypoints.
   */
  public setMatchedWaypoints(waypoints: readonly FacilityWaypoint<Facility>[]): void {
    this._matchedWaypoints = [...waypoints];
  }
}