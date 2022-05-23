import { UnitsUserSettingManager } from '../../units/UnitsUserSettings';

/**
 * A module which defines display units.
 */
export class MapUnitsModule {
  /** Distance units. */
  public readonly navAngle = this.unitsSettingManager.navAngleUnits;

  /** Large distance units. */
  public readonly distanceLarge = this.unitsSettingManager.distanceUnitsLarge;

  /** Small distance units. */
  public readonly distanceSmall = this.unitsSettingManager.distanceUnitsSmall;

  /**
   * Constructor.
   * @param unitsSettingManager A display units user setting manager.
   */
  constructor(private readonly unitsSettingManager: UnitsUserSettingManager) {
  }
}