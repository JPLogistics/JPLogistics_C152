import { MapCullableTextLabelManager, MapWaypointRenderer as BaseMapWaypointRenderer } from 'msfssdk/components/map';
import { Waypoint } from 'msfssdk/navigation';

/**
 * Render roles for MapWaypointRenderer.
 */
export enum MapWaypointRenderRole {
  /** A highlighted waypoint. */
  Highlight = 1,

  /** A waypoint which is the active waypoint in a flight plan. */
  FlightPlanActive = 1 << 1,

  /** A waypoint in a flight plan which is not the active waypoint. */
  FlightPlanInactive = 1 << 2,

  /** A normally displayed waypoint. */
  Normal = 1 << 3,

  /** A waypoint in an airway. */
  Airway = 1 << 4,

  /** A VNAV waypoint. */
  VNav = 1 << 5
}

/**
 * A renderer which draws waypoints to a Garmin-style map.
 */
export class MapWaypointRenderer extends BaseMapWaypointRenderer<Waypoint> {
  /**
   * Constructor.
   * @param textManager The text manager to use for waypoint labels.
   */
  constructor(
    textManager: MapCullableTextLabelManager,
  ) {
    super(textManager);

    this.addRenderRole(MapWaypointRenderRole.Highlight);
    this.addRenderRole(MapWaypointRenderRole.FlightPlanActive);
    this.addRenderRole(MapWaypointRenderRole.FlightPlanInactive);
    this.addRenderRole(MapWaypointRenderRole.Normal);
    this.addRenderRole(MapWaypointRenderRole.Airway);
    this.addRenderRole(MapWaypointRenderRole.VNav);
  }
}