import { Subject } from 'msfssdk';

export enum MapDeclutterMode {
  All,
  Level3,
  Level2,
  Level1
}

/**
 * A module describing the declutter mode.
 */
export class MapDeclutterModule {
  public readonly mode = Subject.create(MapDeclutterMode.All);
}