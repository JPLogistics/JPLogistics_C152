import { Subject } from 'msfssdk';

/**
 * A module for map weather radar mode data.
 */
export class MapNexradModule {
  public readonly showNexrad = Subject.create<boolean>(false);
}