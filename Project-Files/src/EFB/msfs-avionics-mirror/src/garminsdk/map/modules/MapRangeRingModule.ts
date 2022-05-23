import { Subject } from 'msfssdk';

/**
 * A module describing the map range ring.
 */
export class MapRangeRingModule {
  /** Whether to show the range ring. */
  public readonly show = Subject.create(true);
}