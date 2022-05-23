import { Subject } from 'msfssdk';
import { AirportSize } from 'msfssdk/navigation';

/**
 * A module describing the display of waypoints.
 */
export class MapWaypointsModule {
  /** Whether to show airports. */
  public readonly airportShow: Record<AirportSize, Subject<boolean>> = {
    [AirportSize.Large]: Subject.create<boolean>(true),
    [AirportSize.Medium]: Subject.create<boolean>(true),
    [AirportSize.Small]: Subject.create<boolean>(true)
  };

  /** Whether to show VORs. */
  public readonly vorShow = Subject.create(true);

  /** Whether to show NDBs. */
  public readonly ndbShow = Subject.create(true);

  /** Whether to show intersections. */
  public readonly intShow = Subject.create(true);
}