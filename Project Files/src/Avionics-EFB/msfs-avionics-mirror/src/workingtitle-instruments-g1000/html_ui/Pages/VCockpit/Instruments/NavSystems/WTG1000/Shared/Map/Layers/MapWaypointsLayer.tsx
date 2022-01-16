import { BitFlags, GeoPoint, GeoPointInterface, GeoPointReadOnly, LatLonInterface, UnitType, Vec2Math } from 'msfssdk';
import { EventBus } from 'msfssdk/data';
import { FacilityType, ICAO, NearestSearchResults, FacilitySearchType, FacilityLoader, NearestAirportSearchSession, NearestIntersectionSearchSession, NearestSearchSession, NearestVorSearchSession, FacilityRespository } from 'msfssdk/navigation';
import { MapCullableLocationTextLabel, MapCullableTextLabel, MapCullableTextLabelManager, MapIndexedRangeModule, MapLayerProps, MapLocationTextLabelOptions, MapProjection, MapProjectionChangeType, MapSyncedCanvasLayer } from 'msfssdk/components/map';

import { MapWaypointsModule } from '../Modules/MapWaypointsModule';
import { FacilityWaypointCache } from '../../Navigation/FacilityWaypointCache';
import { MapWaypointRenderer, MapWaypointRendererIconFactory, MapWaypointRendererLabelFactory, MapWaypointRenderRole } from '../MapWaypointRenderer';
import { AirportSize, AirportWaypoint, FacilityWaypoint, Waypoint } from '../../Navigation/Waypoint';
import { MapAirportIcon, MapBlankWaypointIcon, MapIntersectionIcon, MapNdbIcon, MapVorIcon, MapWaypointIcon } from '../MapWaypointIcon';
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
export interface MapWaypointsLayerProps extends MapLayerProps<MapWaypointsLayerModules> {
  /** The event bus. */
  bus: EventBus;

  /** The waypoint renderer to use. */
  waypointRenderer: MapWaypointRenderer;

  /** The text manager to use to manage the waypoint labels. */
  textManager: MapCullableTextLabelManager;

  /** Styling options. */
  styles: MapWaypointNormalStyles;
}

// TODO: This entire layer (and how the map renders waypoints) will need to be refactored eventually.
/**
 * The map layer showing waypoints.
 */
export class MapWaypointsLayer extends MapSyncedCanvasLayer<MapWaypointsLayerProps> {
  public static readonly SEARCH_RADIUS_OVERDRAW_FACTOR = Math.SQRT2;

  private static readonly SEARCH_AIRPORT_LIMIT = 500;
  private static readonly SEARCH_VOR_LIMIT = 250;
  private static readonly SEARCH_NDB_LIMIT = 250;
  private static readonly SEARCH_INTERSECTION_LIMIT = 500;

  private static readonly SEARCH_DEBOUNCE_DELAY = 500; // milliseconds

  private readonly facLoader = new FacilityLoader(FacilityRespository.getRepository(this.props.bus), this.onFacilityLoaderInitialized.bind(this));
  private readonly facWaypointCache = FacilityWaypointCache.getCache();

  private facilitySearches?: {
    /** A nearest airport search session. */
    airport: MapWaypointsLayer.NearestSearch,
    /** A nearest VOR search session. */
    vor: MapWaypointsLayer.NearestSearch,
    /** A nearest NDB search session. */
    ndb: MapWaypointsLayer.NearestSearch,
    /** A nearest intersection search session. */
    intersection: MapWaypointsLayer.NearestSearch
  };

  private searchRadius = 0;
  private searchMargin = 0;

  private icaosToShow = new Set<string>();

  private iconFactory: WaypointIconFactory;
  private labelFactory: WaypointLabelFactory;

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

  /**
   * A callback called when the facility loaded finishes initialization.
   */
  private onFacilityLoaderInitialized(): void {
    Promise.all([
      this.facLoader.startNearestSearchSession(FacilitySearchType.Airport),
      this.facLoader.startNearestSearchSession(FacilitySearchType.Vor),
      this.facLoader.startNearestSearchSession(FacilitySearchType.Ndb),
      this.facLoader.startNearestSearchSession(FacilitySearchType.Intersection)
    ]).then((value: [
      NearestAirportSearchSession,
      NearestVorSearchSession,
      NearestSearchSession<string, string>,
      NearestIntersectionSearchSession
    ]) => {
      const [airportSession, vorSession, ndbSession, intSession] = value;
      const callback = this.processSearchResults.bind(this);
      this.facilitySearches = {
        airport: new MapWaypointsLayer.NearestSearch(airportSession, MapWaypointsLayer.SEARCH_AIRPORT_LIMIT, callback),
        vor: new MapWaypointsLayer.NearestSearch(vorSession, MapWaypointsLayer.SEARCH_VOR_LIMIT, callback),
        ndb: new MapWaypointsLayer.NearestSearch(ndbSession, MapWaypointsLayer.SEARCH_NDB_LIMIT, callback),
        intersection: new MapWaypointsLayer.NearestSearch(intSession, MapWaypointsLayer.SEARCH_INTERSECTION_LIMIT, callback)
      };

      if (this.isInit) {
        this.tryRefreshAllSearches(this.props.mapProjection.getCenter(), this.searchRadius);
      }
    });
  }

  // eslint-disable-next-line jsdoc/require-jsdoc
  public onAttached(): void {
    super.onAttached();
    this.isInit = false;

    this.initVisibilityFlags();
    this.initWaypointRenderer();
    this.updateSearchRadius();
    this.isInit = true;
    this.tryRefreshAllSearches(this.props.mapProjection.getCenter(), this.searchRadius);
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
      this.tryRefreshIntersectionSearch(this.props.mapProjection.getCenter(), this.searchRadius);
    }
  }

  /**
   * Updates VOR waypoint visibility.
   */
  private updateVorVisibility(): void {
    const waypointsModule = this.props.model.getModule('waypoints');

    this.isVorVisible = waypointsModule.vorShow.get();

    if (this.isVorVisible) {
      this.tryRefreshVorSearch(this.props.mapProjection.getCenter(), this.searchRadius);
    }
  }

  /**
   * Updates NDB waypoint visibility.
   */
  private updateNdbVisibility(): void {
    const waypointsModule = this.props.model.getModule('waypoints');

    this.isNdbVisible = waypointsModule.ndbShow.get();

    if (this.isNdbVisible) {
      this.tryRefreshNdbSearch(this.props.mapProjection.getCenter(), this.searchRadius);
    }
  }

  /**
   * Updates intersection waypoint visibility.
   */
  private updateIntersectionVisibility(): void {
    const waypointsModule = this.props.model.getModule('waypoints');

    this.isIntersectionVisible = waypointsModule.intShow.get();

    if (this.isIntersectionVisible) {
      this.tryRefreshIntersectionSearch(this.props.mapProjection.getCenter(), this.searchRadius);
    }
  }

  /**
   * Initializes the waypoint renderer.
   */
  private initWaypointRenderer(): void {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    this.props.waypointRenderer.setCanvasContext(MapWaypointRenderRole.Normal, this.display!.context);
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

  // eslint-disable-next-line jsdoc/require-jsdoc
  public onMapProjectionChanged(mapProjection: MapProjection, changeFlags: number): void {
    super.onMapProjectionChanged(mapProjection, changeFlags);

    if (BitFlags.isAny(changeFlags, MapProjectionChangeType.Range | MapProjectionChangeType.ProjectedSize)) {
      this.updateSearchRadius();
      this.tryRefreshAllSearches(mapProjection.getCenter(), this.searchRadius);
    } else if (BitFlags.isAll(changeFlags, MapProjectionChangeType.Center)) {
      this.tryRefreshAllSearches(mapProjection.getCenter(), this.searchRadius);
    }
  }

  /**
   * Updates the desired nearest facility search radius based on the current map projection.
   */
  private updateSearchRadius(): void {
    const mapHalfDiagRange = Vec2Math.abs(this.props.mapProjection.getProjectedSize()) * this.props.mapProjection.getProjectedResolution() / 2;
    this.searchRadius = mapHalfDiagRange * MapWaypointsLayer.SEARCH_RADIUS_OVERDRAW_FACTOR;
    this.searchMargin = mapHalfDiagRange * (MapWaypointsLayer.SEARCH_RADIUS_OVERDRAW_FACTOR - 1);
  }

  // eslint-disable-next-line jsdoc/require-jsdoc
  public onUpdated(time: number, elapsed: number): void {
    this.updateSearches(elapsed);
  }

  /**
   * Updates this layer's facility searches.
   * @param elapsed The elapsed time, in milliseconds, since the last update.
   */
  private updateSearches(elapsed: number): void {
    if (!this.facilitySearches) {
      return;
    }

    this.facilitySearches.airport.update(elapsed);
    this.facilitySearches.vor.update(elapsed);
    this.facilitySearches.ndb.update(elapsed);
    this.facilitySearches.intersection.update(elapsed);
  }

  /**
   * Attempts to refresh all of the nearest facility searches.
   * @param center The center of the search area.
   * @param radius The radius of the search area, in great-arc radians.
   */
  private tryRefreshAllSearches(center: GeoPointInterface, radius: number): void {
    this.tryRefreshAirportSearch(center, radius);
    this.tryRefreshVorSearch(center, radius);
    this.tryRefreshNdbSearch(center, radius);
    this.tryRefreshIntersectionSearch(center, radius);
  }

  /**
   * Attempts to refresh the nearest airport search. The search will only be refreshed if at least one size class of
   * airport is currently visible and the desired search radius is different from the last refreshed search radius or
   * the desired search center is outside of the margin of the last refreshed search center.
   * @param center The center of the search area.
   * @param radius The radius of the search area, in great-arc radians.
   */
  private tryRefreshAirportSearch(center: GeoPointInterface, radius: number): void {
    if (
      !this.facilitySearches
      || !(this.isAirportVisible[AirportSize.Large] || this.isAirportVisible[AirportSize.Medium] || this.isAirportVisible[AirportSize.Small])
    ) {
      return;
    }

    const search = this.facilitySearches.airport;
    if (search.lastRadius !== radius || search.lastCenter.distance(center) >= this.searchMargin) {
      search.scheduleRefresh(center, radius, MapWaypointsLayer.SEARCH_DEBOUNCE_DELAY);
    }
  }

  /**
   * Attempts to refresh the nearest VOR search. The search will only be refreshed if VORs are currently visible and
   * the desired search radius is different from the last refreshed search radius or the desired search center is
   * outside of the margin of the last refreshed search center.
   * @param center The center of the search area.
   * @param radius The radius of the search area, in great-arc radians.
   */
  private tryRefreshVorSearch(center: GeoPointInterface, radius: number): void {
    if (!this.facilitySearches || !this.isVorVisible) {
      return;
    }

    const search = this.facilitySearches.vor;
    if (search.lastRadius !== radius || search.lastCenter.distance(center) >= this.searchMargin) {
      search.scheduleRefresh(center, radius, MapWaypointsLayer.SEARCH_DEBOUNCE_DELAY);
    }
  }

  /**
   * Attempts to refresh the nearest NDB search. The search will only be refreshed if NDB are currently visible and
   * the desired search radius is different from the last refreshed search radius or the desired search center is
   * outside of the margin of the last refreshed search center.
   * @param center The center of the search area.
   * @param radius The radius of the search area, in great-arc radians.
   */
  private tryRefreshNdbSearch(center: GeoPointInterface, radius: number): void {
    if (!this.facilitySearches || !this.isNdbVisible) {
      return;
    }

    const search = this.facilitySearches.ndb;
    if (search.lastRadius !== radius || search.lastCenter.distance(center) >= this.searchMargin) {
      search.scheduleRefresh(center, radius, MapWaypointsLayer.SEARCH_DEBOUNCE_DELAY);
    }
  }

  /**
   * Attempts to refresh the nearest intersection search. The search will only be refreshed if intersections are
   * currently visible and the desired search radius is different from the last refreshed search radius or the desired
   * search center is outside of the margin of the last refreshed search center.
   * @param center The center of the search area.
   * @param radius The radius of the search area, in great-arc radians.
   */
  private tryRefreshIntersectionSearch(center: GeoPointInterface, radius: number): void {
    if (!this.facilitySearches || !this.isIntersectionVisible) {
      return;
    }

    const search = this.facilitySearches.intersection;
    if (search.lastRadius !== radius || search.lastCenter.distance(center) >= this.searchMargin) {
      search.scheduleRefresh(center, radius, MapWaypointsLayer.SEARCH_DEBOUNCE_DELAY);
    }
  }

  /**
   * Processes nearest facility search results. New facilities are registered, while removed facilities are deregistered.
   * @param results Nearest facility search results.
   */
  private processSearchResults(results: NearestSearchResults<string, string> | undefined): void {
    if (!results) {
      return;
    }

    const numAdded = results.added.length;
    for (let i = 0; i < numAdded; i++) {
      const icao = results.added[i];
      if (icao === undefined || icao === ICAO.emptyIcao) {
        continue;
      }

      this.registerFacility(icao);
    }

    const numRemoved = results.removed.length;
    for (let i = 0; i < numRemoved; i++) {
      const icao = results.removed[i];
      if (icao === undefined || icao === ICAO.emptyIcao) {
        continue;
      }

      this.deregisterFacility(icao);
    }
  }

  /**
   * Registers a facility with this layer. Registered facilities are drawn to this layer using a waypoint renderer.
   * @param icao The ICAO string of the facility to register.
   */
  private registerFacility(icao: string): void {
    this.icaosToShow.add(icao);
    this.facLoader.getFacility(ICAO.getFacilityType(icao), icao).then(facility => {
      if (!this.icaosToShow.has(icao)) {
        return;
      }

      const waypoint = this.facWaypointCache.get(facility);
      this.props.waypointRenderer.register(waypoint, MapWaypointRenderRole.Normal, 'waypoints-layer');
    });
  }

  /**
   * Deregisters a facility from this layer.
   * @param icao The ICAO string of the facility to deregister.
   */
  private deregisterFacility(icao: string): void {
    this.icaosToShow.delete(icao);
    this.facLoader.getFacility(ICAO.getFacilityType(icao), icao).then(facility => {
      if (this.icaosToShow.has(icao)) {
        return;
      }

      const waypoint = this.facWaypointCache.get(facility);
      this.props.waypointRenderer.deregister(waypoint, MapWaypointRenderRole.Normal, 'waypoints-layer');
    });
  }

  /**
   * A nearest facility search for MapWaypointLayer.
   */
  private static NearestSearch = class {
    private readonly _lastCenter = new GeoPoint(0, 0);
    private _lastRadius = 0;

    private refreshDebounceTimer = 0;
    private isRefreshScheduled = false;

    // eslint-disable-next-line jsdoc/require-returns
    /**
     * The center of this search's last refresh.
     */
    public get lastCenter(): GeoPointReadOnly {
      return this._lastCenter.readonly;
    }

    // eslint-disable-next-line jsdoc/require-returns
    /**
     * The radius of this search's last refresh, in great-arc radians.
     */
    public get lastRadius(): number {
      return this._lastRadius;
    }

    /**
     * Constructor.
     * @param session The session used by this search.
     * @param maxSearchItems The maximum number of items this search returns.
     * @param refreshCallback A callback which is called every time the search refreshes.
     */
    constructor(
      private readonly session: NearestSearchSession<string, string>,
      public readonly maxSearchItems: number,
      private readonly refreshCallback: (results: NearestSearchResults<string, string>) => void
    ) {
    }

    /**
     * Schedules a refresh of this search.  If a refresh was previously scheduled but not yet executed, this new
     * scheduled refresh will replace the old one.
     * @param center The center of the search area.
     * @param radius The radius of the search area, in great-arc radians.
     * @param delay The delay, in milliseconds, before the refresh is executed.
     */
    public scheduleRefresh(center: LatLonInterface, radius: number, delay: number): void {
      this._lastCenter.set(center);
      this._lastRadius = radius;

      this.refreshDebounceTimer = delay;
      this.isRefreshScheduled = true;
    }

    /**
     * Updates this search. Executes any pending refreshes if their delay timers have expired.
     * @param elapsed The elapsed time, in milliseconds, since the last update.
     */
    public update(elapsed: number): void {
      if (!this.isRefreshScheduled) {
        return;
      }

      this.refreshDebounceTimer = Math.max(0, this.refreshDebounceTimer - elapsed);
      if (this.refreshDebounceTimer === 0) {
        this.refresh();
        this.isRefreshScheduled = false;
      }
    }

    /**
     * Refreshes this search.
     * @returns a Promise which is fulfilled with the search results when the refresh completes.
     */
    private async refresh(): Promise<void> {
      const results = await this.session.searchNearest(
        this._lastCenter.lat,
        this._lastCenter.lon,
        UnitType.GA_RADIAN.convertTo(this._lastRadius, UnitType.METER),
        this.maxSearchItems
      );

      this.refreshCallback(results);
    }
  }
}

// eslint-disable-next-line @typescript-eslint/no-namespace
declare namespace MapWaypointsLayer {
  /**
   * A nearest facility search for MapWaypointLayer.
   */
  type NearestSearch = {
    /** The maximum number of items this search returns. */
    readonly maxSearchItems: number;

    /** The center of this search's last refresh. */
    readonly lastCenter: GeoPointReadOnly;

    /** The radius of this search's last refresh, in great-arc radians. */
    readonly lastRadius: number;

    /**
     * Schedules a refresh of this search.  If a refresh was previously scheduled but not yet executed, this new
     * scheduled refresh will replace the old one.
     * @param center The center of the search area.
     * @param radius The radius of the search area, in great-arc radians.
     * @param delay The delay, in milliseconds, before the refresh is executed.
     */
    scheduleRefresh(center: LatLonInterface, radius: number, delay: number): void;

    /**
     * Updates this search. Executes any pending refreshes if their delay timers have expired.
     * @param elapsed The elapsed time, in milliseconds, since the last update.
     */
    update(elapsed: number): void;
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
class WaypointIconFactory implements MapWaypointRendererIconFactory {
  private readonly cache = new Map<string, MapWaypointIcon<Waypoint>>();

  /**
   * Constructor.
   * @param styles Icon styling options used by this factory.
   */
  constructor(private readonly styles: WaypointIconFactoryStyles) {
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
      }
    }

    return new MapCullableLocationTextLabel(text, priority, waypoint.location, false, options);
  }
}