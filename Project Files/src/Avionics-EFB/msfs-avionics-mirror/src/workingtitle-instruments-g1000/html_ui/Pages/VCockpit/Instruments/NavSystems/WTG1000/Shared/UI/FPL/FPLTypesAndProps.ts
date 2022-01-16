import { AirportFacility } from 'msfssdk/navigation';
import { FlightPlanSegment, LegDefinition } from 'msfssdk/flightplan';
import { LatLonInterface } from 'msfssdk';

/** Facility and runway information for the flight. */
export type FacilityInfo = {
  /** Facility info for the origin airport. */
  originFacility: AirportFacility | undefined;
  /** Facility info for the destination airport. */
  destinationFacility: AirportFacility | undefined;
  /** Facility info for the arrival procedure. */
  arrivalFacility: AirportFacility | undefined;
}

/**
 * Data needed for a FixInfoComonent to draw itself, incuding the index of the active leg.
 */
export type FixLegInfo = {
  /** The leg definition from the flight plan. */
  legDefinition: LegDefinition,

  /** Whether or not this is the active leg. */
  isActive: boolean,

  /** Whether or not this is an active DTO leg. */
  isDirectTo: boolean,

  /** The VNAV target altitude for this leg */
  targetAltitude?: number,

  /** Whether this VNAV target altitude is advisory. */
  isAdvisory?: boolean,

  /** Whether this leg is collapsed and hidden. */
  isCollapsed?: boolean,

  /** Whether this leg is an enroute airway fix that is NOT an entry or an exit. */
  isAirwayFix?: boolean,

  /** Whether this leg is an enroute airway exit fix. */
  isAirwayExitFix?: boolean,

  /** The distance from entry to exit of this airway segment. */
  airwayDistance?: number,

  /** Whether this leg is behind the active leg. */
  legIsBehind?: boolean,

  /** The constrant altitude assigned to this leg that is invalid, if one exists. */
  invalidConstraintAltitude?: number,

  /** Whether or not the altitude constraint is a user constraint. */
  isUserConstraint?: boolean
}

/**
 * A selected flight plan element.
 */
export type FlightPlanSelection = LegDefinition | FlightPlanSegment | null;

/**
 * A flight plan focus.
 */
export type FlightPlanFocus = readonly LegDefinition[] | LatLonInterface | null;