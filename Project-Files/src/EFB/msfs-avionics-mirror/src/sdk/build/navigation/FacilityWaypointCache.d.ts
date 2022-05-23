import { Facility } from './Facilities';
import { FacilityWaypoint } from './Waypoint';
/**
 * A cache of facility waypoints.
 */
export declare class FacilityWaypointCache {
    readonly size: number;
    private static INSTANCE;
    private readonly cache;
    /**
     * Constructor.
     * @param size The maximum size of this cache.
     */
    private constructor();
    /**
     * Gets a waypoint from the cache for a specific facility. If one does not exist, a new waypoint will be created.
     * @param facility The facility for which to get a waypoint.
     * @returns A waypoint.
     */
    get<T extends Facility>(facility: Facility): FacilityWaypoint<T>;
    /**
     * Adds a waypoint to this cache. If the size of the cache is greater than the maximum after the new waypoint is
     * added, a waypoint will be removed from the cache in FIFO order.
     * @param facility The facility associated with the waypoint to add.
     * @param waypoint The waypoint to add.
     */
    private addToCache;
    /**
     * Gets a FacilityWaypointCache instance.
     * @returns A FacilityWaypointCache instance.
     */
    static getCache(): FacilityWaypointCache;
}
//# sourceMappingURL=FacilityWaypointCache.d.ts.map