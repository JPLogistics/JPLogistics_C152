import { GeoPointInterface, GeoPointReadOnly, LatLonInterface } from '../../..';
import { EventBus } from '../../../data';
import { NearestSearchResults, FacilitySearchType, FacilityLoader, NearestSearchSession, Facility, FacilityWaypointCache } from '../../../navigation';
import { MapWaypointRenderer } from '../MapWaypointRenderer';
import { MapLayer, MapLayerProps } from '../MapLayer';
import { MapProjection } from '../MapProjection';
/**
 * Facility search types supported by MapAbstractNearestWaypointsLayer.
 */
export declare type MapAbstractNearestWaypointsLayerSearchTypes = FacilitySearchType.Airport | FacilitySearchType.Vor | FacilitySearchType.Ndb | FacilitySearchType.Intersection;
/**
 * Component props for MapAbstractNearestWaypointsLayer.
 */
export interface MapAbstractNearestWaypointsLayerProps<M, R extends MapWaypointRenderer<any> = MapWaypointRenderer<any>> extends MapLayerProps<M> {
    /** The event bus. */
    bus: EventBus;
    /** The waypoint renderer to use. */
    waypointRenderer: R;
    /**
     * Whether to search using the map target as the center of the search. By
     * default the layer uses the map center and not the map target (which includes the offset).
     */
    useMapTargetAsSearchCenter?: boolean;
}
/**
 * An abstract implementation of a map layer which displays waypoints (airports, navaids, and intersections) within a
 * search radius.
 */
export declare abstract class MapAbstractNearestWaypointsLayer<M, R extends MapWaypointRenderer<any> = MapWaypointRenderer<any>, P extends MapAbstractNearestWaypointsLayerProps<M, R> = MapAbstractNearestWaypointsLayerProps<M, R>> extends MapLayer<P> {
    static readonly SEARCH_RADIUS_OVERDRAW_FACTOR: number;
    protected readonly searchItemLimits: {
        1: number;
        3: number;
        4: number;
        2: number;
    };
    protected readonly searchRadiusLimits: {
        1: number;
        3: number;
        4: number;
        2: number;
    };
    protected readonly defaultSearchDebounceDelay = 500;
    protected readonly facLoader: FacilityLoader;
    protected readonly facWaypointCache: FacilityWaypointCache;
    protected facilitySearches?: {
        /** A nearest airport search session. */
        [FacilitySearchType.Airport]: MapAbstractNearestWaypointsLayerSearch;
        /** A nearest VOR search session. */
        [FacilitySearchType.Vor]: MapAbstractNearestWaypointsLayerSearch;
        /** A nearest NDB search session. */
        [FacilitySearchType.Ndb]: MapAbstractNearestWaypointsLayerSearch;
        /** A nearest intersection search session. */
        [FacilitySearchType.Intersection]: MapAbstractNearestWaypointsLayerSearch;
    };
    protected searchRadius: number;
    protected searchMargin: number;
    protected defaultRenderRole: number;
    protected readonly icaosToShow: Set<string>;
    protected isInit: boolean;
    /**
     * A callback called when the facility loaded finishes initialization.
     */
    private onFacilityLoaderInitialized;
    /** @inheritdoc */
    onAttached(): void;
    /**
     * Initializes this layer.
     */
    protected doInit(): void;
    /**
     * Gets the search center for the waypoint searches on this layer.
     * @returns The waypoint search center geo point.
     */
    protected getSearchCenter(): GeoPointReadOnly;
    /**
     * Initializes this layer's waypoint renderer.
     */
    protected abstract initWaypointRenderer(): void;
    /** @inheritdoc */
    onMapProjectionChanged(mapProjection: MapProjection, changeFlags: number): void;
    /**
     * Updates the desired nearest facility search radius based on the current map projection.
     */
    protected updateSearchRadius(): void;
    /** @inheritdoc */
    onUpdated(time: number, elapsed: number): void;
    /**
     * Updates this layer's facility searches.
     * @param elapsed The elapsed time, in milliseconds, since the last update.
     */
    protected updateSearches(elapsed: number): void;
    /**
     * Attempts to refresh all of the nearest facility searches.
     * @param center The center of the search area.
     * @param radius The radius of the search area, in great-arc radians.
     */
    protected tryRefreshAllSearches(center: GeoPointInterface, radius: number): void;
    /**
     * Attempts to refresh a nearest search. The search will only be refreshed if `this.shouldRefreshSearch()` returns
     * true and and the desired search radius is different from the last refreshed search radius or the desired search
     * center is outside of the margin of the last refreshed search center.
     * @param type The type of nearest search to refresh.
     * @param center The center of the search area.
     * @param radius The radius of the search area, in great-arc radians.
     */
    protected tryRefreshSearch(type: MapAbstractNearestWaypointsLayerSearchTypes, center: GeoPointInterface, radius: number): void;
    /**
     * Checks whether one of this layer's searches should be refreshed.
     * @param type The type of nearest search to refresh.
     * @param center The center of the search area.
     * @param radius The radius of the search area, in great-arc radians.
     * @returns Whether the search should be refreshed.
     */
    protected shouldRefreshSearch(type: MapAbstractNearestWaypointsLayerSearchTypes, center: GeoPointInterface, radius: number): boolean;
    /**
     * Schedules a refresh of this one of this layer's searches.
     * @param type The type of nearest search to refresh.
     * @param search The search to refresh.
     * @param center The center of the search area.
     * @param radius The radius of the search area, in great-arc radians.
     */
    protected scheduleSearchRefresh(type: MapAbstractNearestWaypointsLayerSearchTypes, search: MapAbstractNearestWaypointsLayerSearch, center: GeoPointInterface, radius: number): void;
    /**
     * Processes nearest facility search results. New facilities are registered, while removed facilities are
     * deregistered.
     * @param results Nearest facility search results.
     */
    protected processSearchResults(results: NearestSearchResults<string, string> | undefined): void;
    /**
     * Registers an ICAO string with this layer. Once an ICAO is registered, its corresponding facility is drawn to this
     * layer using a waypoint renderer.
     * @param icao The ICAO string to register.
     */
    protected registerIcao(icao: string): void;
    /**
     * Registers a facility with this layer's waypoint renderer.
     * @param renderer This layer's waypoint renderer.
     * @param facility The facility to register.
     */
    protected registerWaypointWithRenderer(renderer: R, facility: Facility): void;
    /**
     * Deregisters an ICAO string from this layer.
     * @param icao The ICAO string to deregister.
     */
    protected deregisterIcao(icao: string): void;
    /**
     * Deregisters a facility from this layer's waypoint renderer.
     * @param renderer This layer's waypoint renderer.
     * @param facility The facility to deregister.
     */
    protected deregisterWaypointWithRenderer(renderer: R, facility: Facility): void;
}
/**
 * A nearest facility search for MapAbstractNearestWaypointsLayer.
 */
export declare class MapAbstractNearestWaypointsLayerSearch {
    private readonly session;
    private readonly refreshCallback;
    private readonly _lastCenter;
    private _lastRadius;
    private maxItemCount;
    private refreshDebounceTimer;
    private isRefreshScheduled;
    /**
     * The center of this search's last refresh.
     */
    get lastCenter(): GeoPointReadOnly;
    /**
     * The radius of this search's last refresh, in great-arc radians.
     */
    get lastRadius(): number;
    /**
     * Constructor.
     * @param session The session used by this search.
     * @param refreshCallback A callback which is called every time the search refreshes.
     */
    constructor(session: NearestSearchSession<string, string>, refreshCallback: (results: NearestSearchResults<string, string>) => void);
    /**
     * Schedules a refresh of this search.  If a refresh was previously scheduled but not yet executed, this new
     * scheduled refresh will replace the old one.
     * @param center The center of the search area.
     * @param radius The radius of the search area, in great-arc radians.
     * @param maxItemCount The maximum number of results returned by the refresh.
     * @param delay The delay, in milliseconds, before the refresh is executed.
     */
    scheduleRefresh(center: LatLonInterface, radius: number, maxItemCount: number, delay: number): void;
    /**
     * Updates this search. Executes any pending refreshes if their delay timers have expired.
     * @param elapsed The elapsed time, in milliseconds, since the last update.
     */
    update(elapsed: number): void;
    /**
     * Refreshes this search.
     * @returns a Promise which is fulfilled when the refresh completes.
     */
    private refresh;
}
//# sourceMappingURL=MapAbstractNearestWaypointsLayer.d.ts.map