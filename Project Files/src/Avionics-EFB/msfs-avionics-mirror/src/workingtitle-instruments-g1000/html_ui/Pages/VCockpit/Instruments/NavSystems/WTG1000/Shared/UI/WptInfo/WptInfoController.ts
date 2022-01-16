import { Subject } from 'msfssdk';
import { Facility } from 'msfssdk/navigation';

import { FacilityWaypoint, Waypoint } from '../../Navigation/Waypoint';
import { WptInfoStore } from './WptInfoStore';

/**
 * Wpt info controller
 */
export class WptInfoController {
  /**
   * A function which handles changes in waypoint input's matched waypoints.
   * @param waypoints The matched waypoints.
   */
  public readonly matchedWaypointsChangedHandler = this.onMatchedWaypointsChanged.bind(this);

  /**
   * A function which handles changes in waypoint input's selected waypoint.
   * @param waypoint The selected waypoint.
   */
  public readonly selectedWaypointChangedHandler = this.onSelectedWaypointChanged.bind(this);


  /**
   * Creates an instance of wpt info controller.
   * @param store The store.
   * @param selectedWaypoint The subject which provides the waypoint info component's selected waypoint.
   */
  constructor(
    private readonly store: WptInfoStore,
    private readonly selectedWaypoint: Subject<Waypoint | null>
  ) {
    this.onMatchedWaypointsChanged([]);
  }

  /**
   * A callback which is called when the waypoint input's matched waypoints change.
   * @param waypoints The matched waypoints.
   */
  private onMatchedWaypointsChanged(waypoints: readonly FacilityWaypoint<Facility>[]): void {
    this.store.setMatchedWaypoints(waypoints);
    if (waypoints.length > 1) {
      this.store.prompt.set('Press "ENT" for dups');
    } else {
      this.store.prompt.set('Press "ENT" to accept');
    }
  }

  /**
   * A callback which is called when the waypoint input's selected waypoint changes.
   * @param waypoint The selected waypoint.
   */
  private onSelectedWaypointChanged(waypoint: Waypoint | null): void {
    this.selectedWaypoint.set(waypoint);
  }
}