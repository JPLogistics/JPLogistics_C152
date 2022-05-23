import { MapBlankWaypointIcon, MapWaypointIcon, MapWaypointRendererIconFactory } from 'msfssdk/components/map';
import { FacilityType, ICAO } from 'msfssdk/navigation';
import { AirportWaypoint, FacilityWaypoint, FlightPathWaypoint, Waypoint } from '../navigation/Waypoint';
import { MapAirportIcon, MapFlightPathWaypointIcon, MapIntersectionIcon, MapNdbIcon, MapRunwayWaypointIcon, MapUserWaypointIcon, MapVorIcon } from './MapWaypointIcon';
import { MapWaypointFlightPlanStyles } from './MapWaypointStyles';

/**
 * A waypoint icon factory for flight plan waypoints.
 */
export class MapFlightPlanWaypointIconFactory implements MapWaypointRendererIconFactory<Waypoint> {
  private readonly cache = new Map<string, MapWaypointIcon<Waypoint>>();

  /**
   * Constructor.
   * @param styles Styling options used by this factory.
   */
  constructor(private readonly styles: MapWaypointFlightPlanStyles) {
  }

  /** @inheritdoc */
  public getIcon<T extends Waypoint>(waypoint: T): MapWaypointIcon<T> {
    let existing = this.cache.get(waypoint.uid);
    if (!existing) {
      existing = this.createIcon(waypoint);
      this.cache.set(waypoint.uid, existing);
    }

    return existing as MapWaypointIcon<T>;
  }

  /**
   * Creates a new icon for a waypoint.
   * @param waypoint The waypoint for which to create an icon.
   * @returns a waypoint icon.
   */
  private createIcon<T extends Waypoint>(waypoint: T): MapWaypointIcon<T> {
    if (waypoint instanceof AirportWaypoint) {
      return new MapAirportIcon(
        waypoint,
        this.styles.airportIconPriority[waypoint.size],
        this.styles.airportIconSize[waypoint.size],
        this.styles.airportIconSize[waypoint.size]
      );
    } else if (waypoint instanceof FacilityWaypoint) {
      switch (ICAO.getFacilityType(waypoint.facility.icao)) {
        case FacilityType.VOR:
          return new MapVorIcon(waypoint, this.styles.vorIconPriority, this.styles.vorIconSize, this.styles.vorIconSize);
        case FacilityType.NDB:
          return new MapNdbIcon(waypoint, this.styles.ndbIconPriority, this.styles.ndbIconSize, this.styles.ndbIconSize);
        case FacilityType.Intersection:
          return new MapIntersectionIcon(waypoint, this.styles.intIconPriority, this.styles.intIconSize, this.styles.intIconSize);
        case FacilityType.USR:
          return new MapUserWaypointIcon(waypoint, this.styles.userIconPriority, this.styles.userIconSize, this.styles.userIconSize);
        case FacilityType.RWY:
          return new MapRunwayWaypointIcon(waypoint, this.styles.rwyIconPriority, this.styles.rwyIconSize, this.styles.rwyIconSize);
        case FacilityType.VIS:
          return new MapFlightPathWaypointIcon(waypoint, this.styles.fpIconPriority, this.styles.fpIconSize, this.styles.fpIconSize);

      }
    } else if (waypoint instanceof FlightPathWaypoint) {
      return new MapFlightPathWaypointIcon(waypoint, this.styles.fpIconPriority, this.styles.fpIconSize, this.styles.fpIconSize);
    }

    return new MapBlankWaypointIcon(waypoint, 0);
  }
}