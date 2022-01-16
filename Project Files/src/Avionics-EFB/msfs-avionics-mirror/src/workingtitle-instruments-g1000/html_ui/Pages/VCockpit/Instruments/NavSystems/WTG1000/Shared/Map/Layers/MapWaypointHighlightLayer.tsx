import { FacilityType, ICAO } from 'msfssdk/navigation';
import { MapCullableLocationTextLabel, MapCullableTextLabel, MapCullableTextLabelManager, MapLayerProps, MapLocationTextLabelOptions, MapSyncedCanvasLayer } from 'msfssdk/components/map';

import { MapWaypointRenderer, MapWaypointRendererIconFactory, MapWaypointRendererLabelFactory, MapWaypointRenderRole } from '../MapWaypointRenderer';
import { AirportSize, AirportWaypoint, FacilityWaypoint, Waypoint } from '../../Navigation/Waypoint';
import { AbstractMapWaypointIcon, MapAirportIcon, MapBlankWaypointIcon, MapIntersectionIcon, MapNdbIcon, MapUserWaypointIcon, MapVorIcon, MapWaypointHighlightIcon, MapWaypointHighlightIconOptions, MapWaypointIcon } from '../MapWaypointIcon';
import { MapWaypointHighlightStyles } from '../MapWaypointStyles';
import { MapWaypointHighlightModule } from '../Modules/MapWaypointHighlightModule';

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
  private readonly iconFactory: WaypointIconFactory;
  private readonly labelFactory: WaypointLabelFactory;

  private registeredWaypoint: Waypoint | null = null;

  /** @inheritdoc */
  constructor(props: MapWaypointHighlightLayerProps) {
    super(props);

    this.iconFactory = new WaypointIconFactory({
      highlightRingRadiusBuffer: this.props.styles.highlightRingRadiusBuffer,
      highlightRingStrokeWidth: this.props.styles.highlightRingStrokeWidth,
      highlightRingStrokeColor: this.props.styles.highlightRingStrokeColor,
      highlightRingOutlineWidth: this.props.styles.highlightRingOutlineWidth,
      highlightRingOutlineColor: this.props.styles.highlightRingOutlineColor,
      highlightBgColor: this.props.styles.highlightBgColor,

      airportIconPriority: Object.assign({}, this.props.styles.airportIconPriority),
      vorIconPriority: this.props.styles.vorIconPriority,
      ndbIconPriority: this.props.styles.ndbIconPriority,
      intIconPriority: this.props.styles.intIconPriority,
      userIconPriority: this.props.styles.userIconPriority,

      airportIconSize: Object.assign({}, this.props.styles.airportIconSize),
      vorIconSize: this.props.styles.vorIconSize,
      ndbIconSize: this.props.styles.ndbIconSize,
      intIconSize: this.props.styles.intIconSize,
      userIconSize: this.props.styles.userIconSize
    });

    this.labelFactory = new WaypointLabelFactory({
      airportLabelPriority: Object.assign({}, this.props.styles.airportLabelPriority),
      vorLabelPriority: this.props.styles.vorLabelPriority,
      ndbLabelPriority: this.props.styles.ndbLabelPriority,
      intLabelPriority: this.props.styles.intLabelPriority,
      userLabelPriority: this.props.styles.userLabelPriority,

      airportLabelOptions: {
        [AirportSize.Large]: Object.assign({}, this.props.styles.airportLabelOptions[AirportSize.Large]),
        [AirportSize.Medium]: Object.assign({}, this.props.styles.airportLabelOptions[AirportSize.Medium]),
        [AirportSize.Small]: Object.assign({}, this.props.styles.airportLabelOptions[AirportSize.Small])
      },
      vorLabelOptions: Object.assign({}, this.props.styles.vorLabelOptions),
      ndbLabelOptions: Object.assign({}, this.props.styles.ndbLabelOptions),
      intLabelOptions: Object.assign({}, this.props.styles.intLabelOptions),
      userLabelOptions: Object.assign({}, this.props.styles.userLabelOptions),
    });
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

/**
 * Icon styling options.
 */
type WaypointIconFactoryStyles = {
  /** The buffer of the highlight ring around the base icon, in pixels. */
  readonly highlightRingRadiusBuffer: number,

  /** The width of the stroke for the highlight ring, in pixels. */
  readonly highlightRingStrokeWidth: number

  /** The color of the stroke for the highlight ring. */
  readonly highlightRingStrokeColor: string

  /** The width of the outline for the highlight ring, in pixels. */
  readonly highlightRingOutlineWidth: number

  /** The color of the outline for the highlight ring. */
  readonly highlightRingOutlineColor: string

  /** The color of the highlight ring background. */
  readonly highlightBgColor: string;

  /** The render priority of airport icons. */
  readonly airportIconPriority: Record<AirportSize, number>,

  /** The render priority of VOR icons. */
  readonly vorIconPriority: number,

  /** The render priority of NDB icons. */
  readonly ndbIconPriority: number,

  /** The render priority of intersection icons. */
  readonly intIconPriority: number,

  /** The render priority of user waypoint icons. */
  readonly userIconPriority: number,

  /** The size of airport icons, in pixels. */
  readonly airportIconSize: Record<AirportSize, number>,

  /** The size of VOR icons, in pixels. */
  readonly vorIconSize: number,

  /** The size of NDB icons, in pixels. */
  readonly ndbIconSize: number,

  /** The size of intersection icons, in pixels. */
  readonly intIconSize: number,

  /** The size of user waypoint icons, in pixels. */
  readonly userIconSize: number
}

/**
 * A waypoint icon factory.
 */
class WaypointIconFactory implements MapWaypointRendererIconFactory {
  private readonly cache = new Map<string, MapWaypointIcon<Waypoint>>();

  private readonly highlightStyles: MapWaypointHighlightIconOptions;

  /**
   * Constructor.
   * @param styles Icon styling options used by this factory.
   */
  constructor(private readonly styles: WaypointIconFactoryStyles) {
    this.highlightStyles = {
      ringRadiusBuffer: styles.highlightRingRadiusBuffer,
      strokeWidth: styles.highlightRingStrokeWidth,
      strokeColor: styles.highlightRingStrokeColor,
      outlineWidth: styles.highlightRingOutlineWidth,
      outlineColor: styles.highlightRingOutlineColor,
      bgColor: styles.highlightBgColor
    };
  }

  // eslint-disable-next-line jsdoc/require-jsdoc
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
    const baseIcon = this.createBaseIcon(waypoint);

    return baseIcon
      ? new MapWaypointHighlightIcon(baseIcon, baseIcon.priority, this.highlightStyles)
      : new MapBlankWaypointIcon(waypoint, 0);
  }

  /**
   * Creates a new base icon for a waypoint.
   * @param waypoint The waypoint for which to create a base icon.
   * @returns a waypoint base icon.
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

/**
 * Icon styling options.
 */
type WaypointLabelFactoryStyles = {
  /** The render priority of airport labels. */
  readonly airportLabelPriority: Record<AirportSize, number>,

  /** The render priority of VOR labels. */
  readonly vorLabelPriority: number,

  /** The render priority of NDB labels. */
  readonly ndbLabelPriority: number,

  /** The render priority of intersection labels. */
  readonly intLabelPriority: number,

  /** The render priority of user waypoint labels. */
  readonly userLabelPriority: number,

  /** Initialization options for airport labels. */
  readonly airportLabelOptions: Record<AirportSize, MapLocationTextLabelOptions>,

  /** Initialization options for VOR labels. */
  readonly vorLabelOptions: MapLocationTextLabelOptions,

  /** Initialization options for NDB labels. */
  readonly ndbLabelOptions: MapLocationTextLabelOptions,

  /** Initialization options for intersection labels. */
  readonly intLabelOptions: MapLocationTextLabelOptions,

  /** Initialization options for user waypoint labels. */
  readonly userLabelOptions: MapLocationTextLabelOptions
}

/**
 * A waypoint label factory.
 */
class WaypointLabelFactory implements MapWaypointRendererLabelFactory {
  private readonly cache = new Map<string, MapCullableTextLabel>();

  /**
   * Constructor.
   * @param styles Icon styling options used by this factory.
   */
  constructor(private readonly styles: WaypointLabelFactoryStyles) {
  }

  // eslint-disable-next-line jsdoc/require-jsdoc
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
      }
    }

    return new MapCullableLocationTextLabel(text, priority, waypoint.location, false, options);
  }
}