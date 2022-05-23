import { Subject } from 'msfssdk';
import { Facility, FacilityWaypoint } from 'msfssdk/navigation';

import { WaypointInfoStore } from '../Waypoint/WaypointInfoStore';

/**
 * Wpt info store
 */
export class WptInfoStore extends WaypointInfoStore {
  public readonly prompt = Subject.create('');

  private _matchedWaypoints: FacilityWaypoint<Facility>[] = [];
  // eslint-disable-next-line jsdoc/require-returns
  /** An array of waypoints which have matched the input. */
  public get matchedWaypoints(): readonly FacilityWaypoint<Facility>[] {
    return this._matchedWaypoints;
  }

  /**
   * Set the list of matched waypoints.
   * @param waypoints An array of matched waypoints.
   */
  public setMatchedWaypoints(waypoints: readonly FacilityWaypoint<Facility>[]): void {
    this._matchedWaypoints = [...waypoints];
  }
}