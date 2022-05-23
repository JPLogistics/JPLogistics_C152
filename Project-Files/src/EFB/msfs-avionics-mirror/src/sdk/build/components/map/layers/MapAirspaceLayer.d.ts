import { NumberUnitInterface, Subscribable, UnitFamily, VNode } from '../../..';
import { EventBus } from '../../../data';
import { LodBoundaryCache } from '../../../navigation';
import { MapAirspaceRenderManager } from '../MapAirspaceRenderManager';
import { MapLayer, MapLayerProps } from '../MapLayer';
import { MapProjection } from '../MapProjection';
import { MapAirspaceModule, MapAirspaceShowTypes } from '../modules/MapAirspaceModule';
/**
 * Modules required by MapAirspaceLayer.
 */
export interface MapAirspaceLayerModules {
    /** Airspace module. */
    airspace: MapAirspaceModule<MapAirspaceShowTypes>;
}
/**
 * Component props for MapAirspaceLayer.
 */
export interface MapAirspaceLayerProps extends MapLayerProps<MapAirspaceLayerModules> {
    /** The event bus. */
    bus: EventBus;
    /** A cache of LodBoundary objects to use to cache airspace search results. */
    lodBoundaryCache: LodBoundaryCache;
    /** The airspace render manager to use to render airspaces. */
    airspaceRenderManager: MapAirspaceRenderManager;
    /** A subscribable which provides the maximum airspace search radius. */
    maxSearchRadius: Subscribable<NumberUnitInterface<UnitFamily.Distance>>;
    /** A subscribable which provides the maximum number of items to return per airspace search. */
    maxSearchItemCount: Subscribable<number>;
    /** The debounce delay, in milliseconds, for airspace searches. Defaults to 500. */
    searchDebounceDelay?: number;
    /** The maximum amount of time, in milliseconds, allotted per frame for rendering airspaces. Defaults to 0.2. */
    renderTimeBudget?: number;
}
/**
 * A layer which draws airspaces.
 */
export declare class MapAirspaceLayer extends MapLayer<MapAirspaceLayerProps> {
    private static readonly DEFAULT_SEARCH_DEBOUNCE_DELAY;
    private static readonly DEFAULT_RENDER_TIME_BUDGET;
    private static readonly BACKGROUND_RENDER_MARGIN_THRESHOLD;
    private static readonly CLIP_BOUNDS_BUFFER;
    private static readonly geoPointCache;
    private static readonly vec2Cache;
    private readonly canvasLayerRef;
    private clippedPathStream?;
    private readonly clipBoundsSub;
    private readonly facLoader;
    private searchSession?;
    private readonly searchedAirspaces;
    private readonly searchDebounceDelay;
    private readonly renderTimeBudget;
    private activeRenderProcess;
    private readonly renderTaskQueueHandler;
    private searchDebounceTimer;
    private isSearchScheduled;
    private needRefilter;
    private isSearchBusy;
    private lastDesiredSearchRadius;
    private lastSearchRadius;
    private isRenderScheduled;
    private isBackgroundRenderScheduled;
    private isDisplayInvalidated;
    private isAttached;
    /** @inheritdoc */
    onAttached(): void;
    /**
     * Initializes this layer's airspace module property listeners.
     */
    private initModuleListeners;
    /** @inheritdoc */
    onMapProjectionChanged(mapProjection: MapProjection, changeFlags: number): void;
    /**
     * Updates this layer's canvas clipping bounds.
     */
    private updateClipBounds;
    /**
     * Schedules a search. If a search was previously scheduled but not yet executed, this new scheduled search will
     * replace the old one.
     * @param delay The delay, in milliseconds, before the search is executed.
     * @param refilter Whether to update the search's boundary class filter.
     */
    private scheduleSearch;
    /**
     * Schedules a render to be executed during the next update cycle.
     */
    private scheduleRender;
    /**
     * Searches for airspaces around the map center. After the search is complete, the list of search results is filtered
     * and, if necessary, rendered.
     * @param refilter Whether to update the search's boundary class filter.
     */
    private searchAirspaces;
    /**
     * Gets the boundary class filter based on the current airspace type visibility settings.
     * @returns The boundary class filter based on the current airspace type visibility settings.
     */
    private getBoundaryFilter;
    onUpdated(time: number, elapsed: number): void;
    /**
     * Checks if the display and buffer canvases have been invalidated, and if so, clears them and schedules a render.
     */
    private updateFromInvalidation;
    /**
     * If a search is scheduled, decrements the delay timer and if necessary, executes the search.
     * @param elapsed The time elapsed, in milliseconds, since the last update.
     */
    private updateScheduledSearch;
    /**
     * Executes a render if one is scheduled.
     */
    private updateScheduledRender;
    /**
     * Syncs this layer's display canvas instance with the current map projection and renders this layer's airspaces to
     * the display.
     */
    protected startRenderProcess(): void;
    /**
     * Checks whether an airspace is within the projected bounds of a cached canvas instance.
     * @param airspace An airspace.
     * @param canvas A cached canvas instance.
     * @returns Whether the airspace is within the projected bounds of the cached canvas instance.
     */
    private isAirspaceInBounds;
    /**
     * Selects an LOD level based on projected map resolution.
     * @param resolution A projected map resolution, in great-arc radians per pixel.
     * @returns An LOD level based on the projected map resolution.
     */
    private selectLod;
    /**
     * Cleans up the active render process.
     */
    private cleanUpRender;
    /**
     * Renders airspaces from the buffer to the display.
     */
    private renderAirspacesToDisplay;
    /**
     * This method is called when the airspace render process pauses.
     */
    private onRenderPaused;
    /**
     * This method is called when the airspace render process finishes.
     */
    private onRenderFinished;
    /**
     * This method is called when the airspace render process is aborted.
     */
    private onRenderAborted;
    /**
     * This method is called when an airspace show property changes.
     */
    private onAirspaceTypeShowChanged;
    /** @inheritdoc */
    render(): VNode;
}
//# sourceMappingURL=MapAirspaceLayer.d.ts.map