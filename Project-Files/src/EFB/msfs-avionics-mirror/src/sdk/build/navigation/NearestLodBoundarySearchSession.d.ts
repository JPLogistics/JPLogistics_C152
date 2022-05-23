import { NearestBoundarySearchSession } from './FacilityLoader';
import { LodBoundary } from './LodBoundary';
import { LodBoundaryCache } from './LodBoundaryCache';
/**
 * Results of a nearest LodBoundary search.
 */
export declare type NearestLodBoundarySearchResults = {
    /** The boundaries found in these search results that were not returned in the last search. */
    added: readonly LodBoundary[];
    /** The unique IDs of the boundaries returned in the last search that are not found in these search results. */
    removed: readonly number[];
};
/**
 * A nearest search session for boundaries (airspaces) in the form of LodBoundary objects.
 */
export declare class NearestLodBoundarySearchSession {
    private readonly cache;
    private readonly session;
    readonly frameBudget: number;
    /**
     * Constructor.
     * @param cache The boundary cache this search session uses.
     * @param session The nearest boundary facility search session this search session uses.
     * @param frameBudget The maximum amount of time allotted per frame to retrieve and process LodBoundary objects, in
     * milliseconds.
     */
    constructor(cache: LodBoundaryCache, session: NearestBoundarySearchSession, frameBudget: number);
    /**
     * Searches for the nearest boundaries around a specified location.
     * @param lat The latitude of the search center, in degrees.
     * @param lon The longitude of the search center, in degrees.
     * @param radius The radius of the search, in meters.
     * @param maxItems The maximum number of items for which to search.
     * @returns The nearest search results.
     */
    searchNearest(lat: number, lon: number, radius: number, maxItems: number): Promise<NearestLodBoundarySearchResults>;
    /**
     * Sets this session's boundary class filter. The new filter takes effect with the next search executed in this
     * session.
     * @param classMask A bitmask defining the boundary classes to include in the search (`0`: exclude, `1`: include).
     * The bit index for each boundary class is equal to the value of the corresponding `BoundaryType` enum.
     */
    setFilter(classMask: number): void;
}
//# sourceMappingURL=NearestLodBoundarySearchSession.d.ts.map