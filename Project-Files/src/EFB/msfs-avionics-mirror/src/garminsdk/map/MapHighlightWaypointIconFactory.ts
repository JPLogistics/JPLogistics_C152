import { AbstractMapWaypointIcon, MapBlankWaypointIcon, MapWaypointIcon, MapWaypointRendererIconFactory } from 'msfssdk/components/map';
import { FacilityType, ICAO } from 'msfssdk/navigation';
import { AirportWaypoint, FacilityWaypoint, Waypoint } from '../navigation/Waypoint';
import { MapAirportIcon, MapIntersectionIcon, MapNdbIcon, MapUserWaypointIcon, MapVorIcon, MapWaypointHighlightIcon, MapWaypointHighlightIconOptions } from './MapWaypointIcon';
import { MapWaypointHighlightStyles } from './MapWaypointStyles';

/**
 * A waypoint icon factory for highlighted waypoints.
 */
export class MapHighlightWaypointIconFactory implements MapWaypointRendererIconFactory<Waypoint> {
  private readonly cache = new Map<string, MapWaypointIcon<Waypoint>>();

  private readonly highlightStyles: MapWaypointHighlightIconOptions;

  /**
   * Constructor.
   * @param styles Icon styling options used by this factory.
   */
  constructor(private readonly styles: MapWaypointHighlightStyles) {
    this.highlightStyles = {
      ringRadiusBuffer: 0,
      strokeWidth: styles.highlightRingStrokeWidth,
      strokeColor: styles.highlightRingStrokeColor,
      outlineWidth: styles.highlightRingOutlineWidth,
      outlineColor: styles.highlightRingOutlineColor,
      bgColor: styles.highlightBgColor
    };
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
   * @returns A waypoint icon.
   */
  private createIcon<T extends Waypoint>(waypoint: T): MapWaypointIcon<T> {
    const baseIcon = this.createBaseIcon(waypoint);

    if (baseIcon) {
      this.highlightStyles.ringRadiusBuffer = 0;
      if (waypoint instanceof FacilityWaypoint) {
        switch (ICAO.getFacilityType(waypoint.facility.icao)) {
          case FacilityType.Airport:
            this.highlightStyles.ringRadiusBuffer = this.styles.airportHighlightRingRadiusBuffer;
            break;
          case FacilityType.VOR:
            this.highlightStyles.ringRadiusBuffer = this.styles.vorHighlightRingRadiusBuffer;
            break;
          case FacilityType.NDB:
            this.highlightStyles.ringRadiusBuffer = this.styles.ndbHighlightRingRadiusBuffer;
            break;
          case FacilityType.Intersection:
            this.highlightStyles.ringRadiusBuffer = this.styles.intHighlightRingRadiusBuffer;
            break;
          case FacilityType.USR:
            this.highlightStyles.ringRadiusBuffer = this.styles.userHighlightRingRadiusBuffer;
            break;
        }
      }
      return new MapWaypointHighlightIcon(baseIcon, baseIcon.priority, this.highlightStyles);
    }

    return new MapBlankWaypointIcon(waypoint, 0);
  }

  /**
   * Creates a new base icon for a waypoint.
   * @param waypoint The waypoint for which to create a base icon.
   * @returns A waypoint base icon.
   */
  private createBaseIcon<T extends Waypoint>(waypoint: T): AbstractMapWaypointIcon<T> | null {
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
      }
    }

    return null;
  }
}