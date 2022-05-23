import { GeoPointInterface } from 'msfssdk';
import { MapLayerProps, MapOwnAirplanePropsModule, MapProjection, MapSyncedCanvasLayer } from 'msfssdk/components/map';
import { Waypoint } from '../../navigation/Waypoint';
import { MapWaypointHighlightModule } from '../modules/MapWaypointHighlightModule';

/**
 * Modules required by MapWaypointHighlightLayer.
 */
interface MapHighlightLineLayerModules {
  /** Waypoint highlight module. */
  waypointHighlight: MapWaypointHighlightModule;

  /** Own airplane props module. */
  ownAirplaneProps: MapOwnAirplanePropsModule;
}

/**
 * A map layer that draws a line from the plane position to the currently highlighted waypoint.
 */
export class MapHighlightLineLayer extends MapSyncedCanvasLayer<MapLayerProps<MapHighlightLineLayerModules>> {

  private waypoint: Waypoint | undefined;
  private planePos: GeoPointInterface | undefined;
  private vec = new Float64Array([0, 0]);

  private readonly lineDashStyle = [5, 3, 2, 3];
  private readonly strokeStyle = 'white';
  private updateScheduled = false;

  /** @inheritdoc */
  public onAttached(): void {
    super.onAttached();

    this.props.model.getModule('waypointHighlight').waypoint.sub(this.onWaypointChanged.bind(this));
    this.props.model.getModule('ownAirplaneProps').position.sub(this.onPositionChanged.bind(this));
  }

  /** @inheritdoc */
  public onMapProjectionChanged(mapProjection: MapProjection, changeFlags: number): void {
    super.onMapProjectionChanged(mapProjection, changeFlags);
    this.scheduleUpdate();
  }

  /**
   * Schedules the layer for a draw update.
   */
  private scheduleUpdate(): void {
    this.updateScheduled = true;
  }

  /**
   * A callback fired when the actively highlighted waypoint changes.
   * @param waypoint The waypoint that is changing.
   */
  private onWaypointChanged(waypoint: Waypoint | null): void {
    this.waypoint = waypoint ?? undefined;
    this.scheduleUpdate();
  }

  /**
   * A callback fired when the current plan position changes.
   * @param position The current plane position.
   */
  private onPositionChanged(position: GeoPointInterface): void {
    this.planePos = position;
    this.scheduleUpdate();
  }

  /** @inheritdoc */
  public onUpdated(time: number, elapsed: number): void {
    super.onUpdated(time, elapsed);

    if (this.display !== undefined && this.updateScheduled) {
      this.updateScheduled = false;
      this.display.clear();

      if (this.waypoint !== undefined && this.planePos !== undefined) {
        const context = this.display.context;

        context.beginPath();
        context.setLineDash(this.lineDashStyle);
        context.strokeStyle = this.strokeStyle;
        context.lineWidth = 1;

        this.vec = this.props.mapProjection.project(this.planePos, this.vec);
        context.moveTo(this.vec[0], this.vec[1]);

        this.vec = this.props.mapProjection.project(this.waypoint.location, this.vec);
        context.lineTo(this.vec[0], this.vec[1]);

        context.stroke();
      }
    }
  }
}