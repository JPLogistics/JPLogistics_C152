import { ComputedSubject, NumberUnitInterface, NumberUnitSubject, Subject, Subscribable, UnitFamily, UnitType } from 'msfssdk';
import { TCAS, TCASOperatingMode } from 'msfssdk/traffic';

/**
 * Traffic alert level modes.
 */
export enum MapTrafficAlertLevelMode {
  All,
  Advisories,
  TA_RA,
  RA
}

/**
 * Traffic motion vector modes.
 */
export enum MapTrafficMotionVectorMode {
  Off,
  Absolute,
  Relative
}

/**
 * Traffic display altitude restriction modes.
 */
export enum MapTrafficAltitudeRestrictionMode {
  Unrestricted,
  Above,
  Normal,
  Below
}

/**
 * A module describing the display of traffic.
 */
export class MapTrafficModule {
  private static readonly ALTITUDE_RESTRICTION_UNRES = UnitType.FOOT.createNumber(9900);
  private static readonly ALTITUDE_RESTRICTION_NORMAL = UnitType.FOOT.createNumber(2700);

  /** Whether to show traffic information. */
  public readonly show = Subject.create(true);

  /** The TCAS operating mode. */
  public readonly operatingMode: Subscribable<TCASOperatingMode> = Subject.create(TCASOperatingMode.Standby);

  /** Whether to show intruder labels. */
  public readonly showIntruderLabel = Subject.create(true);

  /** The index of the outer ring range. */
  public readonly outerRangeIndex = Subject.create(0);

  /** The index of the inner ring range. */
  public readonly innerRangeIndex = Subject.create(0);

  /** The alert level mode. */
  public readonly alertLevelMode = Subject.create(MapTrafficAlertLevelMode.All);

  /** The altitude restriction mode. */
  public readonly altitudeRestrictionMode = Subject.create(MapTrafficAltitudeRestrictionMode.Unrestricted);

  /** The motion vector mode. */
  public readonly altitudeRestrictionAbove: Subscribable<NumberUnitInterface<UnitFamily.Distance>>
    = ComputedSubject.create(MapTrafficAltitudeRestrictionMode.Unrestricted, mode => {
      return mode === MapTrafficAltitudeRestrictionMode.Unrestricted || mode === MapTrafficAltitudeRestrictionMode.Above
        ? MapTrafficModule.ALTITUDE_RESTRICTION_UNRES
        : MapTrafficModule.ALTITUDE_RESTRICTION_NORMAL;
    });

  /** The motion vector mode. */
  public readonly altitudeRestrictionBelow: Subscribable<NumberUnitInterface<UnitFamily.Distance>>
    = ComputedSubject.create(MapTrafficAltitudeRestrictionMode.Unrestricted, mode => {
      return mode === MapTrafficAltitudeRestrictionMode.Unrestricted || mode === MapTrafficAltitudeRestrictionMode.Below
        ? MapTrafficModule.ALTITUDE_RESTRICTION_UNRES
        : MapTrafficModule.ALTITUDE_RESTRICTION_NORMAL;
    });

  /** Whether displayed intruder altitude is relative. */
  public readonly isAltitudeRelative = Subject.create(true);

  /** The motion vector mode. */
  public readonly motionVectorMode = Subject.create(MapTrafficMotionVectorMode.Off);

  /** The motion vector mode. */
  public readonly motionVectorLookahead = NumberUnitSubject.createFromNumberUnit(UnitType.SECOND.createNumber(60));

  /**
   * Constructor.
   * @param tcas This module's associated TCAS.
   */
  constructor(public readonly tcas: TCAS) {
    this.altitudeRestrictionMode.sub(mode => {
      (this.altitudeRestrictionAbove as ComputedSubject<MapTrafficAltitudeRestrictionMode, NumberUnitInterface<UnitFamily.Distance>>).set(mode);
      (this.altitudeRestrictionBelow as ComputedSubject<MapTrafficAltitudeRestrictionMode, NumberUnitInterface<UnitFamily.Distance>>).set(mode);
    });

    tcas.getEventSubscriber().on('tcas_operating_mode').whenChanged().handle(mode => {
      (this.operatingMode as Subject<TCASOperatingMode>).set(mode);
    });
  }
}