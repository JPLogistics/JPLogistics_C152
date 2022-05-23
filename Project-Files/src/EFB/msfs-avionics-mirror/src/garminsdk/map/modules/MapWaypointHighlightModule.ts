import { Subject } from 'msfssdk';
import { Waypoint } from '../../navigation/Waypoint';

/**
 * A module which defines a highlighted waypoint.
 */
export class MapWaypointHighlightModule {
  /** The highlighted waypoint. */
  public readonly waypoint = Subject.create<Waypoint | null>(null);
}