import { Subject } from 'msfssdk';

/**
 * A module describing the map range compass.
 */
export class MapRangeCompassModule {
  /** Whether to show the range compass. */
  public readonly show = Subject.create(true);
}