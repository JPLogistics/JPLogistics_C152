import { NavAngleUnit, NumberUnitInterface, UnitFamily } from 'msfssdk';
import { NavDataFieldModel } from './NavDataFieldModel';

/**
 * The different types of navigation data fields.
 */
export enum NavDataFieldType {
  BearingToWaypoint = 'BRG',
  Destination = 'DEST',
  DistanceToWaypoint = 'DIS',
  DistanceToDestination = 'DTG',
  DesiredTrack = 'DTK',
  Endurance = 'END',
  TimeToDestination = 'ENR',
  TimeOfWaypointArrival = 'ETA',
  TimeToWaypoint = 'ETE',
  //FlightTimer = 'FLT', <-- Disabling this for now
  FuelOnBoard = 'FOB',
  FuelOverDestination = 'FOD',
  GroundSpeed = 'GS',
  ISA = 'ISA',
  TimeOfDestinationArrival = 'LDG',
  TrueAirspeed = 'TAS',
  TrackAngleError = 'TKE',
  GroundTrack = 'TRK',
  VerticalSpeedRequired = 'VSR',
  CrossTrack = 'XTK'
}

/**
 * A map from navigation data field type to data model type.
 */
export type NavDataFieldTypeModelMap = {
  /** Bearing to next waypoint. */
  [NavDataFieldType.BearingToWaypoint]: NavDataFieldModel<NumberUnitInterface<typeof NavAngleUnit.FAMILY>>,
  /** Destination ident. */
  [NavDataFieldType.Destination]: NavDataFieldModel<string>,
  /** Distance to next waypoint. */
  [NavDataFieldType.DistanceToWaypoint]: NavDataFieldModel<NumberUnitInterface<UnitFamily.Distance>>,
  /** Distance to destination. */
  [NavDataFieldType.DistanceToDestination]: NavDataFieldModel<NumberUnitInterface<UnitFamily.Distance>>,
  /** Desired track. */
  [NavDataFieldType.DesiredTrack]: NavDataFieldModel<NumberUnitInterface<typeof NavAngleUnit.FAMILY>>,
  /** Endurance (time to zero fuel). */
  [NavDataFieldType.Endurance]: NavDataFieldModel<NumberUnitInterface<UnitFamily.Duration>>,
  /** Estimated time enroute to destination. */
  [NavDataFieldType.TimeToDestination]: NavDataFieldModel<NumberUnitInterface<UnitFamily.Duration>>,
  /** Estimated time of arrival at next waypoint. */
  [NavDataFieldType.TimeOfWaypointArrival]: NavDataFieldModel<number>,
  /** Estimated time enroute to next waypoint. */
  [NavDataFieldType.TimeToWaypoint]: NavDataFieldModel<NumberUnitInterface<UnitFamily.Duration>>,
  /** Total fuel remaining. */
  [NavDataFieldType.FuelOnBoard]: NavDataFieldModel<NumberUnitInterface<UnitFamily.Weight>>,
  /** Estimated fuel remaining at destination. */
  [NavDataFieldType.FuelOverDestination]: NavDataFieldModel<NumberUnitInterface<UnitFamily.Weight>>,
  /** Ground speed. */
  [NavDataFieldType.GroundSpeed]: NavDataFieldModel<NumberUnitInterface<UnitFamily.Speed>>,
  /** International standard atmosphere. */
  [NavDataFieldType.ISA]: NavDataFieldModel<NumberUnitInterface<UnitFamily.Temperature>>,
  /** Estimated time of arrival at destination. */
  [NavDataFieldType.TimeOfDestinationArrival]: NavDataFieldModel<number>,
  /** True airspeed. */
  [NavDataFieldType.TrueAirspeed]: NavDataFieldModel<NumberUnitInterface<UnitFamily.Speed>>,
  /** Track angle error. */
  [NavDataFieldType.TrackAngleError]: NavDataFieldModel<NumberUnitInterface<UnitFamily.Angle>>,
  /** Ground track. */
  [NavDataFieldType.GroundTrack]: NavDataFieldModel<NumberUnitInterface<typeof NavAngleUnit.FAMILY>>,
  /** Vertical speed required to meet next VNAV restriction. */
  [NavDataFieldType.VerticalSpeedRequired]: NavDataFieldModel<NumberUnitInterface<UnitFamily.Speed>>,
  /** Cross-track error. */
  [NavDataFieldType.CrossTrack]: NavDataFieldModel<NumberUnitInterface<UnitFamily.Distance>>,
}