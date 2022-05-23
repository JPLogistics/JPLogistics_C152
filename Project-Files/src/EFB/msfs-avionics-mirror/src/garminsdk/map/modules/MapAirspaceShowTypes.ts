/**
 * Airspace show types for Garmin maps.
 */
export enum AirspaceShowType {
  ClassB = 'ClassB',
  ClassC = 'ClassC',
  ClassD = 'ClassD',
  Restricted = 'Restricted',
  MOA = 'MOA',
  Other = 'Other'
}

/**
 * A map of Garmin map airspace show types to their associated boundary filters.
 */
export type MapAirspaceShowTypes = Record<AirspaceShowType, number>;