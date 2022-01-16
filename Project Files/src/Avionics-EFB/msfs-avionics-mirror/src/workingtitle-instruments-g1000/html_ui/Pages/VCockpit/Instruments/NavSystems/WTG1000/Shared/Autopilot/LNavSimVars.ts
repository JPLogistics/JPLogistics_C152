import { SimVarPublisher } from 'msfssdk/instruments';
import { EventBus, SimVarDefinition, SimVarValueType } from 'msfssdk/data';

export enum LNavVars {
  /** The name of the LVar used to publish the current dtk (magnetic). */
  DTK = 'L:WT1000_LNav_DTK_Mag',

  /** The name of the LVar used to publish the current xtk. */
  XTK = 'L:WT1000_LNav_XTK',

  /** The name of the LVar used to publish the next dtk (magnetic). */
  NextDTK = 'L:WT1000_LNav_Next_DTK_Mag',

  /** The name of the LVar used to publish the next xtk. */
  NextXTK = 'L:WT1000_LNav_Next_XTK',

  /** The name of the LVar used to publish the bearing (magnetic) to the current waypoint. */
  Bearing = 'L:WT1000_LNav_BRG_Mag',

  /** The name of the LVar used to publish the distance to the current waypoint. */
  Distance = 'L:WT1000_LNav_DIS',

  /** The name of the LVar used to publish the distance to the current waypoint. */
  DistanceToTurn = 'L:WT1000_LNav_DIS_Turn',

  /** Whether or not the LNAV is in a leg-to-leg turn. */
  IsTurning = 'L:WT1000_LNav_IsTurning',

  /** The current max CDI deflection, in NM. */
  CDIScale = 'L:WT1000_CDI_Scale',

  /** The current value of the CDI scale label enum. */
  CDIScaleLabel = 'L:WT1000_CDI_Scale_Label',

  /** The current calculated Distance to the Destination. */
  DistanceToDestination = 'L:WT1000_LNav_Destination_Dis',

  /** Whether LNAV is tracking to a waypoint. */
  IsTrackingWaypoint = 'L:WT1000_LNav_Is_Tracking'
}

/**
 * Valid CDI scale labels for the LVar scale enum.
 */
export enum CDIScaleLabel {
  Departure,
  Terminal,
  Enroute,
  Oceanic,
  LNav,
  LNavPlusV,
  Visual,
  LNavVNav,
  LP,
  LPPlusV,
  LPV,
  MissedApproach
}

/** Simvars with data from our LNav processor. */
export interface LNavSimVars {
  /** Bearing to the next waypoint, in degrees magnetic. */
  lnavBrgMag: number,
  /** Distance to the next waypoint, in nautical miles. */
  lnavDis: number,
  /** Distance to the next turn, in nautical miles. */
  lnavDisTurn: number,
  /** Desired track, in degrees magnetic. */
  lnavDtkMag: number,
  /** Crosstrack error, in nautical miles. */
  lnavXtk: number,
  /** Desired track for the next leg, in degrees magnetic. */
  lnavNextDtkMag: number,
  /** Crosstrack error for the next leg, in nautical miles. */
  lnavNextXtkMag: number,
  /** Whether or not LNAV is in a leg-to-leg turn. */
  lnavIsTurning: boolean,
  /** The current CDI scale, in nautical miles. */
  lnavCdiScaling: number,
  /** The current CDI scale label enum value. */
  lnavCdiScalingLabel: CDIScaleLabel,
  /** The current index of the vector LNAV is tracking. */
  lnavCurrentVector: number,
  /** The total distance from present position to destination, in nautical miles. */
  lnavDistanceToDestination: number
  /** Whether LNAV is tracking to a waypoint. */
  lnavIsTracking: boolean;
}

/** A publisher to poll and publish nav/com simvars. */
export class LNavSimVarPublisher extends SimVarPublisher<LNavSimVars> {
  private static simvars = new Map<keyof LNavSimVars, SimVarDefinition>([
    ['lnavBrgMag', { name: LNavVars.Bearing, type: SimVarValueType.Degree }],
    ['lnavDis', { name: LNavVars.Distance, type: SimVarValueType.NM }],
    ['lnavDisTurn', { name: LNavVars.DistanceToTurn, type: SimVarValueType.NM }],
    ['lnavDtkMag', { name: LNavVars.DTK, type: SimVarValueType.Degree }],
    ['lnavXtk', { name: LNavVars.XTK, type: SimVarValueType.NM }],
    ['lnavNextDtkMag', { name: LNavVars.NextDTK, type: SimVarValueType.Degree }],
    ['lnavNextXtkMag', { name: LNavVars.NextXTK, type: SimVarValueType.NM }],
    ['lnavCdiScaling', { name: LNavVars.CDIScale, type: SimVarValueType.NM }],
    ['lnavCdiScalingLabel', { name: LNavVars.CDIScaleLabel, type: SimVarValueType.Number }],
    ['lnavDistanceToDestination', { name: LNavVars.DistanceToDestination, type: SimVarValueType.NM }],
    ['lnavIsTracking', { name: LNavVars.IsTrackingWaypoint, type: SimVarValueType.Bool }],
  ])

  /**
   * Create a NavComSimVarPublisher
   * @param bus The EventBus to publish to
   */
  public constructor(bus: EventBus) {
    super(LNavSimVarPublisher.simvars, bus);
  }
}