import { MapCullableLocationTextLabel, MapCullableTextLabel, MapWaypointRendererLabelFactory } from 'msfssdk/components/map';
import { FacilityType, ICAO } from 'msfssdk/navigation';
import { AirportWaypoint, FacilityWaypoint, FlightPathWaypoint, Waypoint } from '../navigation/Waypoint';
import { ProcedureTurnLegWaypoint } from './MapFlightPlanWaypointRecord';
import { MapWaypointFlightPlanStyles } from './MapWaypointStyles';

/**
 * A waypoint label factory for flight plan waypoints.
 */
export class MapFlightPlanWaypointLabelFactory implements MapWaypointRendererLabelFactory<Waypoint> {
  private readonly cache = new Map<string, MapCullableTextLabel>();

  /**
   * Constructor.
   * @param styles Styling options used by this factory.
   */
  constructor(private readonly styles: MapWaypointFlightPlanStyles) {
  }

  /** @inheritdoc */
  public getLabel<T extends Waypoint>(waypoint: T): MapCullableTextLabel {
    let existing = this.cache.get(waypoint.uid);
    if (!existing) {
      existing = this.createLabel(waypoint);
      this.cache.set(waypoint.uid, existing);
    }

    return existing;
  }

  /**
   * Creates a new icon for a waypoint.
   * @param waypoint The waypoint for which to create an icon.
   * @returns a waypoint icon.
   */
  private createLabel<T extends Waypoint>(waypoint: T): MapCullableTextLabel {
    let text = '';
    let priority = 0;
    let options;

    if (waypoint instanceof FacilityWaypoint) {
      text = ICAO.getIdent(waypoint.facility.icao);
      switch (ICAO.getFacilityType(waypoint.facility.icao)) {
        case FacilityType.Airport:
          priority = this.styles.airportLabelPriority[(waypoint as unknown as AirportWaypoint<any>).size];
          options = this.styles.airportLabelOptions[(waypoint as unknown as AirportWaypoint<any>).size];
          break;
        case FacilityType.VOR:
          priority = this.styles.vorLabelPriority;
          options = this.styles.vorLabelOptions;
          break;
        case FacilityType.NDB:
          priority = this.styles.ndbLabelPriority;
          options = this.styles.ndbLabelOptions;
          break;
        case FacilityType.Intersection:
          priority = this.styles.intLabelPriority;
          options = this.styles.intLabelOptions;
          break;
        case FacilityType.USR:
          priority = this.styles.userLabelPriority;
          options = this.styles.userLabelOptions;
          break;
        case FacilityType.RWY:
          priority = this.styles.rwyLabelPriority;
          options = this.styles.rwyLabelOptions;
          break;
        case FacilityType.VIS:
          priority = this.styles.intLabelPriority;
          options = this.styles.intLabelOptions;
          break;
      }
    } else if (waypoint instanceof FlightPathWaypoint || waypoint instanceof ProcedureTurnLegWaypoint) {
      text = waypoint.ident;
      priority = this.styles.fpLabelPriority;
      options = this.styles.fpLabelOptions;
    }

    return new MapCullableLocationTextLabel(text, priority, waypoint.location, true, options);
  }
}