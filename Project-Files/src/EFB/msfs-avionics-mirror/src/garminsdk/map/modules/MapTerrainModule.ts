import { Subject } from 'msfssdk';

/**
 * Map terrain display mode.
 */
export enum MapTerrainMode {
  None,
  Absolute,
  Relative,
  Ground
}

/**
 * A module describing the display of terrain.
 */
export class MapTerrainModule {
  /** The terrain display mode. */
  public readonly terrainMode = Subject.create(MapTerrainMode.Absolute);

  /** Whether to show the terrain scale. */
  public readonly showScale = Subject.create<boolean>(false);
}