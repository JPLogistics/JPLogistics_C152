import { Subject } from 'msfssdk';

/**
 * A module for the map crosshair.
 */
export class MapCrosshairModule {
  public readonly show = Subject.create<boolean>(false);
}