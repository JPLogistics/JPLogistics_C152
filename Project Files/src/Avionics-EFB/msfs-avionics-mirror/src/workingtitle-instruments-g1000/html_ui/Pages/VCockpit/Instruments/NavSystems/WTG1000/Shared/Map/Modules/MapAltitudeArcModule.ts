import { Subject } from 'msfssdk';

/**
 * A module describing the display of the altitude intercept arc.
 */
export class MapAltitudeArcModule {
  /** Whether to show the altitude intercept arc. */
  public readonly show = Subject.create(false);
}