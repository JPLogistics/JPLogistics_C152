import { Subject } from 'msfssdk';

/**
 * Orientation types for a map.
 */
export enum MapOrientation {
  NorthUp,
  TrackUp,
  HeadingUp
}

/**
 * A module describing the map orientation.
 */
export class MapOrientationModule {
  /** The orientation of the map. */
  public readonly orientation = Subject.create(MapOrientation.HeadingUp);

  /** Whether auto-north-up is active. */
  public readonly autoNorthUpActive = Subject.create(true);
}