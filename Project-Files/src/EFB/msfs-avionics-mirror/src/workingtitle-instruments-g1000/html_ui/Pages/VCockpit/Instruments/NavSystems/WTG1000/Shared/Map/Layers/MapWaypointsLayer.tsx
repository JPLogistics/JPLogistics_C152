import { FSComponent, GeoPointInterface, VNode } from 'msfssdk';
import { FacilityType, ICAO, FacilitySearchType, Facility, FacilityWaypointCache, AirportSize, AirportWaypoint, FacilityWaypoint, Waypoint } from 'msfssdk/navigation';
import {
  MapAbstractNearestWaypointsLayer, MapAbstractNearestWaypointsLayerProps, MapAbstractNearestWaypointsLayerSearch,
  MapAbstractNearestWaypointsLayerSearchTypes, MapBlankWaypointIcon, MapCullableLocationTextLabel,
  MapCullableTextLabel, MapCullableTextLabelManager, MapIndexedRangeModule, MapLocationTextLabelOptions, MapProjection, MapSyncedCanvasLayer,
  MapWaypointIcon, MapWaypointRendererIconFactory, MapWaypointRendererLabelFactory
} from 'msfssdk/components/map';

import { MapWaypointsModule } from '../Modules/MapWaypointsModule';
import { MapWaypointRenderer, MapWaypointRenderRole } from '../MapWaypointRenderer';
import { MapAirportIcon, MapIntersectionIcon, MapNdbIcon, MapVorIcon } from '../MapWaypointIcon';
import { MapWaypointNormalStyles } from '../MapWaypointStyles';

/**
 * Modules required by MapWaypointsLayer.
 */
export interface MapWaypointsLayerModules {
  /** Range module. */
  range: MapIndexedRangeModule;

  /** Waypoints module. */
  waypoints: MapWaypointsModule;
}

/**
 * Component props for MapWaypointsLayer
 */
export interface MapWaypointsLayerProps extends MapAbstractNearestWaypointsLayerProps<MapWaypointsLayerModules, MapWaypointRenderer> {
  /** The text manager to use to manage the waypoint labels. */
  textManager: MapCullableTextLabelManager;

  /** Styling options. */
  styles: MapWaypointNormalStyles;
}

/**
 * A map layer which displays waypoints.
 */
export class MapWaypointsLayer extends MapAbstractNearestWaypointsLayer<MapWaypointsLayerModules, MapWaypointRenderer, MapWaypointsLayerProps> {
  private static readonly SEARCH_ITEM_LIMITS = {
    [FacilitySearchType.Airport]: 500,
    [FacilitySearchType.Vor]: 250,
    [FacilitySearchType.Ndb]: 250,
    [FacilitySearchType.Intersection]: 500,
  };

  private static readonly SEARCH_DEBOUNCE_DELAY = 500; // milliseconds

  private readonly waypointsLayerRef = FSComponent.createRef<MapSyncedCanvasLayer>();

  protected readonly facWaypointCache = FacilityWaypointCache.getCache();

  private readonly iconFactory: WaypointIconFactory;
  private readonly labelFactory: WaypointLabelFactory;

  private isAirportVisible = {
    [AirportSize.Large]: false,
    [AirportSize.Medium]: false,
    [AirportSize.Small]: false
  };
  private isVorVisible = false;
  private isNdbVisible = false;
  private isIntersectionVisible = false;

  /** @inheritdoc */
  constructor(props: MapWaypointsLayerProps) {
    super(props);

    this.iconFactory = new WaypointIconFactory({
      airportIconPriority: Object.assign({}, this.props.styles.airportIconPriority),
      vorIconPriority: this.props.styles.vorIconPriority,
      ndbIconPriority: this.props.styles.ndbIconPriority,
      intIconPriority: this.props.styles.intIconPriority,

      airportIconSize: Object.assign({}, this.props.styles.airportIconSize),
      vorIconSize: this.props.styles.vorIconSize,
      ndbIconSize: this.props.styles.ndbIconSize,
      intIconSize: this.props.styles.intIconSize,
    });

    this.labelFactory = new WaypointLabelFactory({
      airportLabelPriority: Object.assign({}, this.props.styles.airportLabelPriority),
      vorLabelPriority: this.props.styles.vorLabelPriority,
      ndbLabelPriority: this.props.styles.ndbLabelPriority,
      intLabelPriority: this.props.styles.intLabelPriority,

      airportLabelOptions: {
        [AirportSize.Large]: Object.assign({}, this.props.styles.airportLabelOptions[AirportSize.Large]),
        [AirportSize.Medium]: Object.assign({}, this.props.styles.airportLabelOptions[AirportSize.Medium]),
        [AirportSize.Small]: Object.assign({}, this.props.styles.airportLabelOptions[AirportSize.Small])
      },
      vorLabelOptions: Object.assign({}, this.props.styles.vorLabelOptions),
      ndbLabelOptions: Object.assign({}, this.props.styles.ndbLabelOptions),
      intLabelOptions: Object.assign({}, this.props.styles.intLabelOptions)
    });
  }

  /** @inheritdoc */
  public onAttached(): void {
    this.waypointsLayerRef.instance.onAttached();
    super.onAttached();
  }

  /** @inheritdoc */
  protected doInit(): void {
    this.initVisibilityFlags();
    super.doInit();
  }

  /**
   * Initializes waypoint visibility flags and listeners.
   */
  private initVisibilityFlags(): void {
    const waypointsModule = this.props.model.getModule('waypoints');

    waypointsModule.airportShow[AirportSize.Large].sub(this.updateAirportVisibility.bind(this, AirportSize.Large), true);
    waypointsModule.airportShow[AirportSize.Medium].sub(this.updateAirportVisibility.bind(this, AirportSize.Medium), true);
    waypointsModule.airportShow[AirportSize.Small].sub(this.updateAirportVisibility.bind(this, AirportSize.Small), true);

    waypointsModule.vorShow.sub(this.updateVorVisibility.bind(this), true);

    waypointsModule.ndbShow.sub(this.updateNdbVisibility.bind(this), true);

    waypointsModule.intShow.sub(this.updateIntersectionVisibility.bind(this), true);
  }

  /**
   * Updates airport waypoint visibility.
   * @param size The airport size class to update.
   */
  private updateAirportVisibility(size: AirportSize): void {
    const waypointsModule = this.props.model.getModule('waypoints');

    const wasAnyAirportVisible = this.isAirportVisible[AirportSize.Large]
      || this.isAirportVisible[AirportSize.Medium]
      || this.isAirportVisible[AirportSize.Small];

    this.isAirportVisible[size] = waypointsModule.airportShow[size].get();

    if (!wasAnyAirportVisible && this.isAirportVisible[size]) {
      this.tryRefreshSearch(FacilitySearchType.Airport, this.props.mapProjection.getCenter(), this.searchRadius);
    }
  }

  /**
   * Updates VOR waypoint visibility.
   */
  private updateVorVisibility(): void {
    const waypointsModule = this.props.model.getModule('waypoints');

    this.isVorVisible = waypointsModule.vorShow.get();

    if (this.isVorVisible) {
      this.tryRefreshSearch(FacilitySearchType.Vor, this.props.mapProjection.getCenter(), this.searchRadius);
    }
  }

  /**
   * Updates NDB waypoint visibility.
   */
  private updateNdbVisibility(): void {
    const waypointsModule = this.props.model.getModule('waypoints');

    this.isNdbVisible = waypointsModule.ndbShow.get();

    if (this.isNdbVisible) {
      this.tryRefreshSearch(FacilitySearchType.Ndb, this.props.mapProjection.getCenter(), this.searchRadius);
    }
  }

  /**
   * Updates intersection waypoint visibility.
   */
  private updateIntersectionVisibility(): void {
    const waypointsModule = this.props.model.getModule('waypoints');

    this.isIntersectionVisible = waypointsModule.intShow.get();

    if (this.isIntersectionVisible) {
      this.tryRefreshSearch(FacilitySearchType.Intersection, this.props.mapProjection.getCenter(), this.searchRadius);
    }
  }

  /** @inheritdoc */
  protected initWaypointRenderer(): void {
    this.props.waypointRenderer.setCanvasContext(MapWaypointRenderRole.Normal, this.waypointsLayerRef.instance.display.context);
    this.props.waypointRenderer.setIconFactory(MapWaypointRenderRole.Normal, this.iconFactory);
    this.props.waypointRenderer.setLabelFactory(MapWaypointRenderRole.Normal, this.labelFactory);
    this.props.waypointRenderer.setVisibilityHandler(MapWaypointRenderRole.Normal, this.isWaypointVisible.bind(this));
  }

  /**
   * Checks whether a waypoint is visible.
   * @param waypoint A waypoint.
   * @returns whether the waypoint is visible.
   */
  private isWaypointVisible(waypoint: Waypoint): boolean {
    if (waypoint instanceof FacilityWaypoint) {
      switch (ICAO.getFacilityType(waypoint.facility.icao)) {
        case FacilityType.Airport:
          return this.isAirportVisible[(waypoint as AirportWaypoint<any>).size];
        case FacilityType.VOR:
          return this.isVorVisible;
        case FacilityType.NDB:
          return this.isNdbVisible;
        case FacilityType.Intersection:
          return this.isIntersectionVisible;
      }
    }
    return false;
  }

  /** @inheritdoc */
  public onMapProjectionChanged(mapProjection: MapProjection, changeFlags: number): void {
    this.waypointsLayerRef.instance.onMapProjectionChanged(mapProjection, changeFlags);
    super.onMapProjectionChanged(mapProjection, changeFlags);
  }

  /** @inheritdoc */
  protected shouldRefreshSearch(type: MapAbstractNearestWaypointsLayerSearchTypes): boolean {
    switch (type) {
      case FacilitySearchType.Airport:
        return this.isAirportVisible[AirportSize.Large] || this.isAirportVisible[AirportSize.Medium] || this.isAirportVisible[AirportSize.Small];
      case FacilitySearchType.Vor:
        return this.isVorVisible;
      case FacilitySearchType.Ndb:
        return this.isNdbVisible;
      case FacilitySearchType.Intersection:
        return this.isIntersectionVisible;
    }
  }

  /** @inheritdoc */
  protected scheduleSearchRefresh(
    type: MapAbstractNearestWaypointsLayerSearchTypes,
    search: MapAbstractNearestWaypointsLayerSearch,
    center: GeoPointInterface,
    radius: number
  ): void {
    search.scheduleRefresh(center, radius, MapWaypointsLayer.SEARCH_ITEM_LIMITS[type], MapWaypointsLayer.SEARCH_DEBOUNCE_DELAY);
  }

  /** @inheritdoc */
  protected registerWaypointWithRenderer(renderer: MapWaypointRenderer, facility: Facility): void {
    const waypoint = this.facWaypointCache.get(facility);
    renderer.register(waypoint, MapWaypointRenderRole.Normal, 'waypoints-layer');
  }

  /** @inheritdoc */
  protected deregisterWaypointWithRenderer(renderer: MapWaypointRenderer, facility: Facility): void {
    const waypoint = this.facWaypointCache.get(facility);
    renderer.deregister(waypoint, MapWaypointRenderRole.Normal, 'waypoints-layer');
  }

  /** @inheritdoc */
  public render(): VNode {
    return (
      <MapSyncedCanvasLayer
        ref={this.waypointsLayerRef}
        model={this.props.model}
        mapProjection={this.props.mapProjection}
      />
    );
  }
}

/**
 * Icon styling options.
 */
type WaypointIconFactoryStyles = {
  /** The render priority of airport icons. */
  readonly airportIconPriority: Record<AirportSize, number>,

  /** The render priority of VOR icons. */
  readonly vorIconPriority: number,

  /** The render priority of NDB icons. */
  readonly ndbIconPriority: number,

  /** The render priority of intersection icons. */
  readonly intIconPriority: number,

  /** The size of airport icons, in pixels. */
  readonly airportIconSize: Record<AirportSize, number>,

  /** The size of VOR icons, in pixels. */
  readonly vorIconSize: number,

  /** The size of NDB icons, in pixels. */
  readonly ndbIconSize: number,

  /** The size of intersection icons, in pixels. */
  readonly intIconSize: number
}

/**
 * A waypoint icon factory.
 */
class WaypointIconFactory implements MapWaypointRendererIconFactory<Waypoint> {
  private readonly cache = new Map<string, MapWaypointIcon<Waypoint>>();

  /**
   * Constructor.
   * @param styles Icon styling options used by this factory.
   */
  constructor(private readonly styles: WaypointIconFactoryStyles) {
  }

  // eslint-disable-next-line jsdoc/require-jsdoc
  public getIcon<T extends Waypoint>(role: number, waypoint: T): MapWaypointIcon<T> {
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
      }
    }

    return new MapBlankWaypointIcon(waypoint, 0);
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

  /** Initialization options for airport labels. */
  readonly airportLabelOptions: Record<AirportSize, MapLocationTextLabelOptions>,

  /** Initialization options for VOR labels. */
  readonly vorLabelOptions: MapLocationTextLabelOptions,

  /** Initialization options for NDB labels. */
  readonly ndbLabelOptions: MapLocationTextLabelOptions,

  /** Initialization options for intersection labels. */
  readonly intLabelOptions: MapLocationTextLabelOptions
}

/**
 * A waypoint label factory.
 */
class WaypointLabelFactory implements MapWaypointRendererLabelFactory<Waypoint> {
  private readonly cache = new Map<string, MapCullableTextLabel>();

  /**
   * Constructor.
   * @param styles Icon styling options used by this factory.
   */
  constructor(private readonly styles: WaypointLabelFactoryStyles) {
  }

  // eslint-disable-next-line jsdoc/require-jsdoc
  public getLabel<T extends Waypoint>(role: number, waypoint: T): MapCullableTextLabel {
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
      }
    }

    return new MapCullableLocationTextLabel(text, priority, waypoint.location, false, options);
  }
}