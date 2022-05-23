import { MapCullableTextLabelManager, MapLayerProps, MapSyncedCanvasLayer } from 'msfssdk/components/map';
import { MapWaypointRenderer, MapWaypointRenderRole } from '../MapWaypointRenderer';
import { Waypoint } from '../../navigation/Waypoint';
import { MapWaypointHighlightStyles } from '../MapWaypointStyles';
import { MapWaypointHighlightModule } from '../modules/MapWaypointHighlightModule';
import { MapHighlightWaypointIconFactory } from '../MapHighlightWaypointIconFactory';
import { MapHighlightWaypointLabelFactory } from '../MapHighlightWaypointLabelFactory';

/**
 * Modules required by MapWaypointHighlightLayer.
 */
interface MapWaypointHighlightLayerModules {
  /** Waypoint highlight module. */
  waypointHighlight: MapWaypointHighlightModule;
}

/**
 * Component props for MapWaypointHighlightLayer
 */
export interface MapWaypointHighlightLayerProps extends MapLayerProps<MapWaypointHighlightLayerModules> {
  /** The waypoint renderer to use. */
  waypointRenderer: MapWaypointRenderer;

  /** The text manager to use to manage the waypoint labels. */
  textManager: MapCullableTextLabelManager;

  /** Styling options. */
  styles: MapWaypointHighlightStyles;
}

/**
 * The map layer showing highlighted waypoints.
 */
export class MapWaypointHighlightLayer extends MapSyncedCanvasLayer<MapWaypointHighlightLayerProps> {
  private readonly iconFactory: MapHighlightWaypointIconFactory;
  private readonly labelFactory: MapHighlightWaypointLabelFactory;

  private registeredWaypoint: Waypoint | null = null;

  /** @inheritdoc */
  constructor(props: MapWaypointHighlightLayerProps) {
    super(props);

    this.iconFactory = new MapHighlightWaypointIconFactory(this.props.styles);

    this.labelFactory = new MapHighlightWaypointLabelFactory(this.props.styles);
  }

  // eslint-disable-next-line jsdoc/require-jsdoc
  public onAttached(): void {
    super.onAttached();
    this.isInit = false;

    this.initWaypointRenderer();
    this.initModuleListener();
    this.isInit = true;
  }

  /**
   * Initializes the waypoint renderer.
   */
  private initWaypointRenderer(): void {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    this.props.waypointRenderer.setCanvasContext(MapWaypointRenderRole.Highlight, this.display!.context);
    this.props.waypointRenderer.setIconFactory(MapWaypointRenderRole.Highlight, this.iconFactory);
    this.props.waypointRenderer.setLabelFactory(MapWaypointRenderRole.Highlight, this.labelFactory);
  }

  /**
   * Initializes the waypoint highlight listener.
   */
  private initModuleListener(): void {
    this.props.model.getModule('waypointHighlight').waypoint.sub(this.onWaypointChanged.bind(this), true);
  }

  /**
   * A callback which is called when the highlighted waypoint changes.
   * @param waypoint The new highlighted waypoint.
   */
  private onWaypointChanged(waypoint: Waypoint | null): void {
    this.registeredWaypoint && this.props.waypointRenderer.deregister(this.registeredWaypoint, MapWaypointRenderRole.Highlight, 'waypoint-highlight-layer');
    waypoint && this.props.waypointRenderer.register(waypoint, MapWaypointRenderRole.Highlight, 'waypoint-highlight-layer');
    this.registeredWaypoint = waypoint;
  }
}