import { GeoPoint, GeoPointSubject, Subject, Vec2Subject } from 'msfssdk';

/**
 * A module describing the map pointer.
 */
export class MapPointerModule {
  /** Whether the pointer is active. */
  public readonly isActive = Subject.create(false);

  /** The position of the pointer on the projected map, in pixel coordinates. */
  public readonly position = Vec2Subject.createFromVector(new Float64Array(2));

  /** The desired map target. */
  public readonly target = GeoPointSubject.createFromGeoPoint(new GeoPoint(0, 0));
}