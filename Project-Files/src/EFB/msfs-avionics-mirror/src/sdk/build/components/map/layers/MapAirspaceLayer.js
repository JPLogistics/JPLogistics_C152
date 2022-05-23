import { BitFlags, FSComponent, GeoPoint, UnitType, VecNSubject } from '../../..';
import { FacilityLoader, FacilityRepository, FacilitySearchType, NearestLodBoundarySearchSession } from '../../../navigation';
import { ClippedPathStream } from '../../../graphics/path';
import { MapLayer } from '../MapLayer';
import { MapProjectionChangeType } from '../MapProjection';
import { MapCachedCanvasLayer } from './MapCachedCanvasLayer';
/**
 * A layer which draws airspaces.
 */
export class MapAirspaceLayer extends MapLayer {
    constructor() {
        var _a, _b;
        super(...arguments);
        this.canvasLayerRef = FSComponent.createRef();
        this.clipBoundsSub = VecNSubject.createFromVector(new Float64Array(4));
        this.facLoader = new FacilityLoader(FacilityRepository.getRepository(this.props.bus), async () => {
            this.searchSession = new NearestLodBoundarySearchSession(this.props.lodBoundaryCache, await this.facLoader.startNearestSearchSession(FacilitySearchType.Boundary), 0.5);
            this.isAttached && this.scheduleSearch(0, true);
        });
        this.searchedAirspaces = new Map();
        this.searchDebounceDelay = (_a = this.props.searchDebounceDelay) !== null && _a !== void 0 ? _a : MapAirspaceLayer.DEFAULT_SEARCH_DEBOUNCE_DELAY;
        this.renderTimeBudget = (_b = this.props.renderTimeBudget) !== null && _b !== void 0 ? _b : MapAirspaceLayer.DEFAULT_RENDER_TIME_BUDGET;
        this.activeRenderProcess = null;
        this.renderTaskQueueHandler = {
            renderTimeBudget: this.renderTimeBudget,
            // eslint-disable-next-line jsdoc/require-jsdoc
            onStarted() {
                // noop
            },
            // eslint-disable-next-line jsdoc/require-jsdoc
            canContinue(elapsedFrameCount, dispatchedTaskCount, timeElapsed) {
                return timeElapsed < this.renderTimeBudget;
            },
            // eslint-disable-next-line jsdoc/require-jsdoc
            onPaused: this.onRenderPaused.bind(this),
            // eslint-disable-next-line jsdoc/require-jsdoc
            onFinished: this.onRenderFinished.bind(this),
            // eslint-disable-next-line jsdoc/require-jsdoc
            onAborted: this.onRenderAborted.bind(this)
        };
        this.searchDebounceTimer = 0;
        this.isSearchScheduled = false;
        this.needRefilter = false;
        this.isSearchBusy = false;
        this.lastDesiredSearchRadius = 0; // meters
        this.lastSearchRadius = 0; // meters
        this.isRenderScheduled = false;
        this.isBackgroundRenderScheduled = false;
        this.isDisplayInvalidated = true;
        this.isAttached = false;
    }
    /** @inheritdoc */
    onAttached() {
        this.canvasLayerRef.instance.onAttached();
        this.updateClipBounds();
        this.clippedPathStream = new ClippedPathStream(this.canvasLayerRef.instance.buffer.context, this.clipBoundsSub);
        this.props.maxSearchRadius.sub(radius => {
            const radiusMeters = radius.asUnit(UnitType.METER);
            if (radiusMeters < this.lastSearchRadius || radiusMeters > this.lastDesiredSearchRadius) {
                this.scheduleSearch(0, false);
            }
        });
        this.props.maxSearchItemCount.sub(() => { this.scheduleSearch(0, false); });
        this.initModuleListeners();
        this.isAttached = true;
        this.searchSession && this.scheduleSearch(0, true);
    }
    /**
     * Initializes this layer's airspace module property listeners.
     */
    initModuleListeners() {
        const airspaceModule = this.props.model.getModule('airspace');
        for (const type of Object.values(airspaceModule.show)) {
            type.sub(this.onAirspaceTypeShowChanged.bind(this));
        }
    }
    /** @inheritdoc */
    onMapProjectionChanged(mapProjection, changeFlags) {
        this.canvasLayerRef.instance.onMapProjectionChanged(mapProjection, changeFlags);
        if (BitFlags.isAll(changeFlags, MapProjectionChangeType.ProjectedSize)) {
            this.updateClipBounds();
        }
    }
    /**
     * Updates this layer's canvas clipping bounds.
     */
    updateClipBounds() {
        const size = this.canvasLayerRef.instance.getSize();
        this.clipBoundsSub.set(-MapAirspaceLayer.CLIP_BOUNDS_BUFFER, -MapAirspaceLayer.CLIP_BOUNDS_BUFFER, size + MapAirspaceLayer.CLIP_BOUNDS_BUFFER, size + MapAirspaceLayer.CLIP_BOUNDS_BUFFER);
    }
    /**
     * Schedules a search. If a search was previously scheduled but not yet executed, this new scheduled search will
     * replace the old one.
     * @param delay The delay, in milliseconds, before the search is executed.
     * @param refilter Whether to update the search's boundary class filter.
     */
    scheduleSearch(delay, refilter) {
        if (!this.searchSession) {
            return;
        }
        this.searchDebounceTimer = delay;
        this.isSearchScheduled = true;
        this.needRefilter || (this.needRefilter = refilter);
    }
    /**
     * Schedules a render to be executed during the next update cycle.
     */
    scheduleRender() {
        this.isRenderScheduled = true;
    }
    /**
     * Searches for airspaces around the map center. After the search is complete, the list of search results is filtered
     * and, if necessary, rendered.
     * @param refilter Whether to update the search's boundary class filter.
     */
    async searchAirspaces(refilter) {
        this.isSearchBusy = true;
        const center = this.props.mapProjection.getCenter();
        const drawableDiag = this.canvasLayerRef.instance.display.canvas.width * Math.SQRT2;
        this.lastDesiredSearchRadius = UnitType.GA_RADIAN.convertTo(this.props.mapProjection.getProjectedResolution() * drawableDiag / 2, UnitType.METER);
        this.lastSearchRadius = Math.min(this.props.maxSearchRadius.get().asUnit(UnitType.METER), this.lastDesiredSearchRadius);
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        const session = this.searchSession;
        refilter && session.setFilter(this.getBoundaryFilter());
        const results = await session.searchNearest(center.lat, center.lon, this.lastSearchRadius, this.props.maxSearchItemCount.get());
        for (let i = 0; i < results.added.length; i++) {
            const airspace = results.added[i];
            this.searchedAirspaces.set(airspace.facility.id, airspace);
        }
        for (let i = 0; i < results.removed.length; i++) {
            this.searchedAirspaces.delete(results.removed[i]);
        }
        this.isSearchBusy = false;
        this.scheduleRender();
    }
    /**
     * Gets the boundary class filter based on the current airspace type visibility settings.
     * @returns The boundary class filter based on the current airspace type visibility settings.
     */
    getBoundaryFilter() {
        const module = this.props.model.getModule('airspace');
        const show = module.show;
        let filter = 0;
        for (const type in show) {
            if (show[type].get()) {
                filter |= module.showTypes[type];
            }
        }
        return filter;
    }
    // eslint-disable-next-line jsdoc/require-jsdoc
    onUpdated(time, elapsed) {
        this.canvasLayerRef.instance.onUpdated(time, elapsed);
        this.updateFromInvalidation();
        this.updateScheduledRender();
        this.updateScheduledSearch(elapsed);
    }
    /**
     * Checks if the display and buffer canvases have been invalidated, and if so, clears them and schedules a render.
     */
    updateFromInvalidation() {
        const canvasLayer = this.canvasLayerRef.instance;
        const display = canvasLayer.display;
        const buffer = canvasLayer.buffer;
        const needBackgroundRender = !this.isBackgroundRenderScheduled
            && !this.activeRenderProcess
            && (display.transform.marginRemaining / display.transform.margin <= MapAirspaceLayer.BACKGROUND_RENDER_MARGIN_THRESHOLD);
        const shouldScheduleSearch = needBackgroundRender
            || display.isInvalid
            || (buffer.isInvalid && this.activeRenderProcess);
        this.isBackgroundRenderScheduled || (this.isBackgroundRenderScheduled = needBackgroundRender);
        if (display.isInvalid) {
            this.isDisplayInvalidated = true;
            this.isBackgroundRenderScheduled = false;
            display.clear();
            display.syncWithMapProjection(this.props.mapProjection);
        }
        if (buffer.isInvalid) {
            if (this.activeRenderProcess) {
                this.activeRenderProcess.abort();
                this.cleanUpRender();
            }
            buffer.clear();
            buffer.syncWithMapProjection(this.props.mapProjection);
        }
        if (shouldScheduleSearch) {
            this.scheduleSearch(this.searchDebounceDelay, false);
        }
    }
    /**
     * If a search is scheduled, decrements the delay timer and if necessary, executes the search.
     * @param elapsed The time elapsed, in milliseconds, since the last update.
     */
    updateScheduledSearch(elapsed) {
        if (!this.isSearchScheduled) {
            return;
        }
        this.searchDebounceTimer = Math.max(0, this.searchDebounceTimer - elapsed);
        if (this.searchDebounceTimer === 0 && !this.isSearchBusy) {
            this.searchAirspaces(this.needRefilter);
            this.isSearchScheduled = false;
            this.needRefilter = false;
        }
    }
    /**
     * Executes a render if one is scheduled.
     */
    updateScheduledRender() {
        if (!this.isRenderScheduled) {
            return;
        }
        this.startRenderProcess();
        this.isRenderScheduled = false;
        this.isBackgroundRenderScheduled = false;
    }
    /**
     * Syncs this layer's display canvas instance with the current map projection and renders this layer's airspaces to
     * the display.
     */
    startRenderProcess() {
        const canvasLayer = this.canvasLayerRef.instance;
        if (this.activeRenderProcess) {
            this.activeRenderProcess.abort();
        }
        const buffer = canvasLayer.buffer;
        buffer.clear();
        buffer.syncWithMapProjection(this.props.mapProjection);
        this.props.airspaceRenderManager.clearRegisteredAirspaces();
        for (const airspace of this.searchedAirspaces.values()) {
            if (this.isAirspaceInBounds(airspace, buffer)) {
                this.props.airspaceRenderManager.registerAirspace(airspace);
            }
        }
        const lod = this.selectLod(this.props.mapProjection.getProjectedResolution());
        this.activeRenderProcess = this.props.airspaceRenderManager.prepareRenderProcess(buffer.geoProjection, buffer.context, this.renderTaskQueueHandler, lod, this.clippedPathStream);
        this.activeRenderProcess.start();
    }
    /**
     * Checks whether an airspace is within the projected bounds of a cached canvas instance.
     * @param airspace An airspace.
     * @param canvas A cached canvas instance.
     * @returns Whether the airspace is within the projected bounds of the cached canvas instance.
     */
    isAirspaceInBounds(airspace, canvas) {
        const corner = MapAirspaceLayer.geoPointCache[0];
        const cornerProjected = MapAirspaceLayer.vec2Cache[0];
        let minX, maxX, minY, maxY;
        canvas.geoProjection.project(corner.set(airspace.facility.topLeft.lat, airspace.facility.topLeft.long), cornerProjected);
        minX = maxX = cornerProjected[0];
        minY = maxY = cornerProjected[1];
        canvas.geoProjection.project(corner.set(airspace.facility.topLeft.lat, airspace.facility.bottomRight.long), cornerProjected);
        minX = Math.min(minX, cornerProjected[0]);
        maxX = Math.max(maxX, cornerProjected[0]);
        minY = Math.min(minY, cornerProjected[1]);
        maxY = Math.max(maxY, cornerProjected[1]);
        canvas.geoProjection.project(corner.set(airspace.facility.bottomRight.lat, airspace.facility.bottomRight.long), cornerProjected);
        minX = Math.min(minX, cornerProjected[0]);
        maxX = Math.max(maxX, cornerProjected[0]);
        minY = Math.min(minY, cornerProjected[1]);
        maxY = Math.max(maxY, cornerProjected[1]);
        canvas.geoProjection.project(corner.set(airspace.facility.bottomRight.lat, airspace.facility.topLeft.long), cornerProjected);
        minX = Math.min(minX, cornerProjected[0]);
        maxX = Math.max(maxX, cornerProjected[0]);
        minY = Math.min(minY, cornerProjected[1]);
        maxY = Math.max(maxY, cornerProjected[1]);
        const width = canvas.canvas.width;
        const height = canvas.canvas.height;
        return minX < width
            && maxX > 0
            && minY < height
            && maxY > 0;
    }
    /**
     * Selects an LOD level based on projected map resolution.
     * @param resolution A projected map resolution, in great-arc radians per pixel.
     * @returns An LOD level based on the projected map resolution.
     */
    selectLod(resolution) {
        const thresholds = this.props.lodBoundaryCache.lodDistanceThresholds;
        let i = thresholds.length - 1;
        while (i >= 0) {
            if (resolution * 2 >= thresholds[i]) {
                break;
            }
            i--;
        }
        return i;
    }
    /**
     * Cleans up the active render process.
     */
    cleanUpRender() {
        this.canvasLayerRef.instance.buffer.reset();
        this.activeRenderProcess = null;
    }
    /**
     * Renders airspaces from the buffer to the display.
     */
    renderAirspacesToDisplay() {
        const display = this.canvasLayerRef.instance.display;
        const buffer = this.canvasLayerRef.instance.buffer;
        display.clear();
        display.syncWithCanvasInstance(buffer);
        this.canvasLayerRef.instance.copyBufferToDisplay();
    }
    /**
     * This method is called when the airspace render process pauses.
     */
    onRenderPaused() {
        if (this.isDisplayInvalidated) {
            this.renderAirspacesToDisplay();
        }
    }
    /**
     * This method is called when the airspace render process finishes.
     */
    onRenderFinished() {
        this.renderAirspacesToDisplay();
        this.cleanUpRender();
        this.isDisplayInvalidated = false;
    }
    /**
     * This method is called when the airspace render process is aborted.
     */
    onRenderAborted() {
        this.cleanUpRender();
    }
    /**
     * This method is called when an airspace show property changes.
     */
    onAirspaceTypeShowChanged() {
        this.scheduleSearch(0, true);
    }
    /** @inheritdoc */
    render() {
        return (FSComponent.buildComponent(MapCachedCanvasLayer, { ref: this.canvasLayerRef, model: this.props.model, mapProjection: this.props.mapProjection, useBuffer: true, overdrawFactor: Math.SQRT2 }));
    }
}
MapAirspaceLayer.DEFAULT_SEARCH_DEBOUNCE_DELAY = 500; // milliseconds
MapAirspaceLayer.DEFAULT_RENDER_TIME_BUDGET = 0.2; // milliseconds per frame
MapAirspaceLayer.BACKGROUND_RENDER_MARGIN_THRESHOLD = 0.1; // relative to total margin
MapAirspaceLayer.CLIP_BOUNDS_BUFFER = 10; // number of pixels from edge of canvas to extend the clipping bounds, in pixels
MapAirspaceLayer.geoPointCache = [new GeoPoint(0, 0)];
MapAirspaceLayer.vec2Cache = [new Float64Array(2)];
