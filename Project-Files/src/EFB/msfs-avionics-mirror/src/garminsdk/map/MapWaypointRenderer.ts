import { MapAbstractWaypointRenderer, MapWaypointRenderRoleDef } from 'msfssdk/components/map';
import { Waypoint } from '../navigation/Waypoint';

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
export class MapWaypointRenderer extends MapAbstractWaypointRenderer<Waypoint> {
  protected readonly roleDefinitions: Record<number, MapWaypointRenderRoleDef<Waypoint>> = {
    [MapWaypointRenderRole.Highlight]: Object.assign({}, MapAbstractWaypointRenderer.NULL_ROLE_DEF),
    [MapWaypointRenderRole.FlightPlanActive]: Object.assign({}, MapAbstractWaypointRenderer.NULL_ROLE_DEF),
    [MapWaypointRenderRole.FlightPlanInactive]: Object.assign({}, MapAbstractWaypointRenderer.NULL_ROLE_DEF),
    [MapWaypointRenderRole.Normal]: Object.assign({}, MapAbstractWaypointRenderer.NULL_ROLE_DEF),
    [MapWaypointRenderRole.Airway]: Object.assign({}, MapAbstractWaypointRenderer.NULL_ROLE_DEF),
    [MapWaypointRenderRole.VNav]: Object.assign({}, MapAbstractWaypointRenderer.NULL_ROLE_DEF)
  };

  protected readonly allRoles = [
    MapWaypointRenderRole.Highlight,
    MapWaypointRenderRole.FlightPlanActive,
    MapWaypointRenderRole.FlightPlanInactive,
    MapWaypointRenderRole.Normal,
    MapWaypointRenderRole.Airway,
    MapWaypointRenderRole.VNav
  ];

  /** @inheritdoc */
  protected selectRoleToRender(entry: MapAbstractWaypointRenderer.Entry<Waypoint>): number {
    if (
      entry.isAnyRole(MapWaypointRenderRole.Highlight)
      && this.roleDefinitions[MapWaypointRenderRole.Highlight].visibilityHandler(entry.waypoint)
    ) {
      return MapWaypointRenderRole.Highlight;
    } else if (
      entry.isAnyRole(MapWaypointRenderRole.FlightPlanActive)
      && this.roleDefinitions[MapWaypointRenderRole.FlightPlanActive].visibilityHandler(entry.waypoint)
    ) {
      return MapWaypointRenderRole.FlightPlanActive;
    } else if (
      entry.isAnyRole(MapWaypointRenderRole.FlightPlanInactive)
      && this.roleDefinitions[MapWaypointRenderRole.FlightPlanInactive].visibilityHandler(entry.waypoint)
    ) {
      return MapWaypointRenderRole.FlightPlanInactive;
    } else if (
      entry.isAnyRole(MapWaypointRenderRole.Normal)
      && this.roleDefinitions[MapWaypointRenderRole.Normal].visibilityHandler(entry.waypoint)
    ) {
      return MapWaypointRenderRole.Normal;
    } else if (
      entry.isAnyRole(MapWaypointRenderRole.Airway)
      && this.roleDefinitions[MapWaypointRenderRole.Airway].visibilityHandler(entry.waypoint)
    ) {
      return MapWaypointRenderRole.Airway;
    } else if (
      entry.isAnyRole(MapWaypointRenderRole.VNav)
      && this.roleDefinitions[MapWaypointRenderRole.VNav].visibilityHandler(entry.waypoint)
    ) {
      return MapWaypointRenderRole.VNav;
    }

    return 0;
  }
}