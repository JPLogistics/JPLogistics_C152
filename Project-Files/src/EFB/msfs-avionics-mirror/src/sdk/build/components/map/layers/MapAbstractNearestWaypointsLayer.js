import { BitFlags, GeoPoint, UnitType, Vec2Math } from '../../..';
import { ICAO, FacilitySearchType, FacilityLoader, FacilityRepository, FacilityWaypointCache } from '../../../navigation';
import { MapLayer } from '../MapLayer';
import { MapProjectionChangeType } from '../MapProjection';
/**
 * An abstract implementation of a map layer which displays waypoints (airports, navaids, and intersections) within a
 * search radius.
 */
export class MapAbstractNearestWaypointsLayer extends MapLayer {
    constructor() {
        super(...arguments);
        this.searchItemLimits = {
            [FacilitySearchType.Airport]: 500,
            [FacilitySearchType.Vor]: 250,
            [FacilitySearchType.Ndb]: 250,
            [FacilitySearchType.Intersection]: 500
        };
        this.searchRadiusLimits = {
            [FacilitySearchType.Airport]: Number.POSITIVE_INFINITY,
            [FacilitySearchType.Vor]: Number.POSITIVE_INFINITY,
            [FacilitySearchType.Ndb]: Number.POSITIVE_INFINITY,
            [FacilitySearchType.Intersection]: Number.POSITIVE_INFINITY
        };
        this.defaultSearchDebounceDelay = 500;
        this.facLoader = new FacilityLoader(FacilityRepository.getRepository(this.props.bus), this.onFacilityLoaderInitialized.bind(this));
        this.facWaypointCache = FacilityWaypointCache.getCache();
        this.searchRadius = 0;
        this.searchMargin = 0;
        this.defaultRenderRole = 1;
        this.icaosToShow = new Set();
        this.isInit = false;
    }
    /**
     * A callback called when the facility loaded finishes initialization.
     */
    onFacilityLoaderInitialized() {
        Promise.all([
            this.facLoader.startNearestSearchSession(FacilitySearchType.Airport),
            this.facLoader.startNearestSearchSession(FacilitySearchType.Vor),
            this.facLoader.startNearestSearchSession(FacilitySearchType.Ndb),
            this.facLoader.startNearestSearchSession(FacilitySearchType.Intersection)
        ]).then((value) => {
            const [airportSession, vorSession, ndbSession, intSession] = value;
            const callback = this.processSearchResults.bind(this);
            this.facilitySearches = {
                [FacilitySearchType.Airport]: new MapAbstractNearestWaypointsLayerSearch(airportSession, callback),
                [FacilitySearchType.Vor]: new MapAbstractNearestWaypointsLayerSearch(vorSession, callback),
                [FacilitySearchType.Ndb]: new MapAbstractNearestWaypointsLayerSearch(ndbSession, callback),
                [FacilitySearchType.Intersection]: new MapAbstractNearestWaypointsLayerSearch(intSession, callback)
            };
            if (this.isInit) {
                this.tryRefreshAllSearches(this.getSearchCenter(), this.searchRadius);
            }
        });
    }
    /** @inheritdoc */
    onAttached() {
        super.onAttached();
        this.isInit = false;
        this.doInit();
        this.isInit = true;
        this.tryRefreshAllSearches(this.getSearchCenter(), this.searchRadius);
    }
    /**
     * Initializes this layer.
     */
    doInit() {
        this.initWaypointRenderer();
        this.updateSearchRadius();
    }
    /**
     * Gets the search center for the waypoint searches on this layer.
     * @returns The waypoint search center geo point.
     */
    getSearchCenter() {
        return this.props.useMapTargetAsSearchCenter ? this.props.mapProjection.getTarget() : this.props.mapProjection.getCenter();
    }
    /** @inheritdoc */
    onMapProjectionChanged(mapProjection, changeFlags) {
        super.onMapProjectionChanged(mapProjection, changeFlags);
        if (BitFlags.isAny(changeFlags, MapProjectionChangeType.Range | MapProjectionChangeType.RangeEndpoints | MapProjectionChangeType.ProjectedSize)) {
            this.updateSearchRadius();
            this.tryRefreshAllSearches(this.getSearchCenter(), this.searchRadius);
        }
        else if (BitFlags.isAll(changeFlags, MapProjectionChangeType.Center)) {
            this.tryRefreshAllSearches(this.getSearchCenter(), this.searchRadius);
        }
    }
    /**
     * Updates the desired nearest facility search radius based on the current map projection.
     */
    updateSearchRadius() {
        const mapHalfDiagRange = Vec2Math.abs(this.props.mapProjection.getProjectedSize()) * this.props.mapProjection.getProjectedResolution() / 2;
        this.searchRadius = mapHalfDiagRange * MapAbstractNearestWaypointsLayer.SEARCH_RADIUS_OVERDRAW_FACTOR;
        this.searchMargin = mapHalfDiagRange * (MapAbstractNearestWaypointsLayer.SEARCH_RADIUS_OVERDRAW_FACTOR - 1);
    }
    /** @inheritdoc */
    onUpdated(time, elapsed) {
        this.updateSearches(elapsed);
    }
    /**
     * Updates this layer's facility searches.
     * @param elapsed The elapsed time, in milliseconds, since the last update.
     */
    updateSearches(elapsed) {
        if (!this.facilitySearches) {
            return;
        }
        this.facilitySearches[FacilitySearchType.Airport].update(elapsed);
        this.facilitySearches[FacilitySearchType.Vor].update(elapsed);
        this.facilitySearches[FacilitySearchType.Ndb].update(elapsed);
        this.facilitySearches[FacilitySearchType.Intersection].update(elapsed);
    }
    /**
     * Attempts to refresh all of the nearest facility searches.
     * @param center The center of the search area.
     * @param radius The radius of the search area, in great-arc radians.
     */
    tryRefreshAllSearches(center, radius) {
        this.tryRefreshSearch(FacilitySearchType.Airport, center, radius);
        this.tryRefreshSearch(FacilitySearchType.Vor, center, radius);
        this.tryRefreshSearch(FacilitySearchType.Ndb, center, radius);
        this.tryRefreshSearch(FacilitySearchType.Intersection, center, radius);
    }
    /**
     * Attempts to refresh a nearest search. The search will only be refreshed if `this.shouldRefreshSearch()` returns
     * true and and the desired search radius is different from the last refreshed search radius or the desired search
     * center is outside of the margin of the last refreshed search center.
     * @param type The type of nearest search to refresh.
     * @param center The center of the search area.
     * @param radius The radius of the search area, in great-arc radians.
     */
    tryRefreshSearch(type, center, radius) {
        const search = this.facilitySearches && this.facilitySearches[type];
        if (!search || !this.shouldRefreshSearch(type, center, radius)) {
            return;
        }
        if (search.lastRadius !== radius || search.lastCenter.distance(center) >= this.searchMargin) {
            this.scheduleSearchRefresh(type, search, center, radius);
        }
    }
    /**
     * Checks whether one of this layer's searches should be refreshed.
     * @param type The type of nearest search to refresh.
     * @param center The center of the search area.
     * @param radius The radius of the search area, in great-arc radians.
     * @returns Whether the search should be refreshed.
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    shouldRefreshSearch(type, center, radius) {
        return true;
    }
    /**
     * Schedules a refresh of this one of this layer's searches.
     * @param type The type of nearest search to refresh.
     * @param search The search to refresh.
     * @param center The center of the search area.
     * @param radius The radius of the search area, in great-arc radians.
     */
    scheduleSearchRefresh(type, search, center, radius) {
        let itemLimit = this.searchItemLimits[type];
        let radiusLimit = this.searchRadiusLimits[type];
        if (radiusLimit === undefined || (radiusLimit !== undefined && !isFinite(radiusLimit))) {
            radiusLimit = radius;
        }
        radiusLimit = radiusLimit < radius ? radiusLimit : radius;
        if (itemLimit === undefined) {
            itemLimit = 40;
        }
        search.scheduleRefresh(center, radiusLimit, itemLimit, this.defaultSearchDebounceDelay);
    }
    /**
     * Processes nearest facility search results. New facilities are registered, while removed facilities are
     * deregistered.
     * @param results Nearest facility search results.
     */
    processSearchResults(results) {
        if (!results) {
            return;
        }
        const numAdded = results.added.length;
        for (let i = 0; i < numAdded; i++) {
            const icao = results.added[i];
            if (icao === undefined || icao === ICAO.emptyIcao) {
                continue;
            }
            this.registerIcao(icao);
        }
        const numRemoved = results.removed.length;
        for (let i = 0; i < numRemoved; i++) {
            const icao = results.removed[i];
            if (icao === undefined || icao === ICAO.emptyIcao) {
                continue;
            }
            this.deregisterIcao(icao);
        }
    }
    /**
     * Registers an ICAO string with this layer. Once an ICAO is registered, its corresponding facility is drawn to this
     * layer using a waypoint renderer.
     * @param icao The ICAO string to register.
     */
    registerIcao(icao) {
        this.icaosToShow.add(icao);
        this.facLoader.getFacility(ICAO.getFacilityType(icao), icao).then(facility => {
            if (!this.icaosToShow.has(icao)) {
                return;
            }
            this.registerWaypointWithRenderer(this.props.waypointRenderer, facility);
        });
    }
    /**
     * Registers a facility with this layer's waypoint renderer.
     * @param renderer This layer's waypoint renderer.
     * @param facility The facility to register.
     */
    registerWaypointWithRenderer(renderer, facility) {
        const waypoint = this.facWaypointCache.get(facility);
        renderer.register(waypoint, this.defaultRenderRole, 'waypoints-layer');
    }
    /**
     * Deregisters an ICAO string from this layer.
     * @param icao The ICAO string to deregister.
     */
    deregisterIcao(icao) {
        this.icaosToShow.delete(icao);
        this.facLoader.getFacility(ICAO.getFacilityType(icao), icao).then(facility => {
            if (this.icaosToShow.has(icao)) {
                return;
            }
            this.deregisterWaypointWithRenderer(this.props.waypointRenderer, facility);
        });
    }
    /**
     * Deregisters a facility from this layer's waypoint renderer.
     * @param renderer This layer's waypoint renderer.
     * @param facility The facility to deregister.
     */
    deregisterWaypointWithRenderer(renderer, facility) {
        const waypoint = this.facWaypointCache.get(facility);
        renderer.deregister(waypoint, this.defaultRenderRole, 'waypoints-layer');
    }
}
MapAbstractNearestWaypointsLayer.SEARCH_RADIUS_OVERDRAW_FACTOR = Math.SQRT2;
/**
 * A nearest facility search for MapAbstractNearestWaypointsLayer.
 */
export class MapAbstractNearestWaypointsLayerSearch {
    /**
     * Constructor.
     * @param session The session used by this search.
     * @param refreshCallback A callback which is called every time the search refreshes.
     */
    constructor(session, refreshCallback) {
        this.session = session;
        this.refreshCallback = refreshCallback;
        this._lastCenter = new GeoPoint(0, 0);
        this._lastRadius = 0;
        this.maxItemCount = 0;
        this.refreshDebounceTimer = 0;
        this.isRefreshScheduled = false;
    }
    // eslint-disable-next-line jsdoc/require-returns
    /**
     * The center of this search's last refresh.
     */
    get lastCenter() {
        return this._lastCenter.readonly;
    }
    // eslint-disable-next-line jsdoc/require-returns
    /**
     * The radius of this search's last refresh, in great-arc radians.
     */
    get lastRadius() {
        return this._lastRadius;
    }
    /**
     * Schedules a refresh of this search.  If a refresh was previously scheduled but not yet executed, this new
     * scheduled refresh will replace the old one.
     * @param center The center of the search area.
     * @param radius The radius of the search area, in great-arc radians.
     * @param maxItemCount The maximum number of results returned by the refresh.
     * @param delay The delay, in milliseconds, before the refresh is executed.
     */
    scheduleRefresh(center, radius, maxItemCount, delay) {
        this._lastCenter.set(center);
        this._lastRadius = radius;
        this.maxItemCount = maxItemCount;
        this.refreshDebounceTimer = delay;
        this.isRefreshScheduled = true;
    }
    /**
     * Updates this search. Executes any pending refreshes if their delay timers have expired.
     * @param elapsed The elapsed time, in milliseconds, since the last update.
     */
    update(elapsed) {
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
     * @returns a Promise which is fulfilled when the refresh completes.
     */
    async refresh() {
        const results = await this.session.searchNearest(this._lastCenter.lat, this._lastCenter.lon, UnitType.GA_RADIAN.convertTo(this._lastRadius, UnitType.METER), this.maxItemCount);
        this.refreshCallback(results);
    }
}
