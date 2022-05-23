import { GeoPointInterface } from '../geo/GeoPoint';
import { Airspace } from './Airspace';
/**
 * A searcher for airspaces.
 */
export declare class AirspaceSearcher {
    readonly cacheSize: number;
    /** The amount of time to wait for a search to finish before it times out, in milliseconds. */
    static readonly SEARCH_TIMEOUT = 5000;
    static readonly DEFAULT_CACHE_SIZE = 1000;
    private cache;
    private _isBusy;
    private queue;
    /**
     * Constructor.
     * @param cacheSize The maximum size of the Airspace cache.
     */
    constructor(cacheSize?: number);
    /**
     * Checks whether this searcher is currently busy with a search.
     * @returns whether this searcher is currently busy with a search.
     */
    isBusy(): boolean;
    /**
     * Searches for airspaces around a geographic point. If the searcher is not busy, the search will execute
     * immediately. If the search is busy, the search will be queued. Queued searches will be executed one at a time in
     * FIFO order as searches are finished.
     * @param center The center of the search area.
     * @returns a Promise which is fulfilled with an array of airspaces when the search finishes.
     */
    search(center: GeoPointInterface): Promise<Airspace[]>;
    /**
     * Enqueues a search operation.
     * @param center The center of the search area.
     * @param resolve The Promise resolve function to call with the search results.
     */
    private enqueueSearch;
    /**
     * Executes the next search operation in the queue, if one exists.
     */
    private processQueue;
    /**
     * Executes an airspace search.
     * @param center The center of the search area.
     * @param resolve The Promise resolve function to call with the search results.
     */
    private doSearch;
    /**
     * Executes a Coherent airspace search.
     * @param center The center of the search area.
     * @returns a Promise which is fulfilled with an array of Coherent airspace definitions when the search finishes.
     */
    private executeCoherentSearch;
    /**
     * Processes an array of Coherent airspace definitions into an array of Airspaces.
     * @param defs An array fo Coherent airspace definitions.
     * @returns an array of Airspaces corresponding to the supplied definitions.
     */
    private processCoherentDefs;
    /**
     * Adds an airspace to the cache. If the cache size exceeds the maximum after the operation, airspaces will be
     * removed from the cache in FIFO order to maintain the maximum cache size.
     * @param airspace The airspace to cache.
     */
    private cacheAirspace;
    /**
     * Generates a unique string ID for a Coherent airspace definition.
     * @param def The airspace definition.
     * @returns a unique string ID.
     */
    private static generateUID;
}
//# sourceMappingURL=AirspaceSearcher.d.ts.map