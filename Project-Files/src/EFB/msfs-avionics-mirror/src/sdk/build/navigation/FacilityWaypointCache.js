import { FacilityType, ICAO } from './Facilities';
import { AirportWaypoint, FacilityWaypoint } from './Waypoint';
/**
 * A cache of facility waypoints.
 */
export class FacilityWaypointCache {
    /**
     * Constructor.
     * @param size The maximum size of this cache.
     */
    constructor(size) {
        this.size = size;
        this.cache = new Map();
    }
    /**
     * Gets a waypoint from the cache for a specific facility. If one does not exist, a new waypoint will be created.
     * @param facility The facility for which to get a waypoint.
     * @returns A waypoint.
     */
    get(facility) {
        let existing = this.cache.get(facility);
        if (!existing) {
            if (ICAO.getFacilityType(facility.icao) === FacilityType.Airport) {
                existing = new AirportWaypoint(facility);
            }
            else {
                existing = new FacilityWaypoint(facility);
            }
            this.addToCache(facility, existing);
        }
        return existing;
    }
    /**
     * Adds a waypoint to this cache. If the size of the cache is greater than the maximum after the new waypoint is
     * added, a waypoint will be removed from the cache in FIFO order.
     * @param facility The facility associated with the waypoint to add.
     * @param waypoint The waypoint to add.
     */
    addToCache(facility, waypoint) {
        this.cache.set(facility, waypoint);
        if (this.cache.size > this.size) {
            this.cache.delete(this.cache.keys().next().value);
        }
    }
    /**
     * Gets a FacilityWaypointCache instance.
     * @returns A FacilityWaypointCache instance.
     */
    static getCache() {
        var _a;
        return (_a = FacilityWaypointCache.INSTANCE) !== null && _a !== void 0 ? _a : (FacilityWaypointCache.INSTANCE = new FacilityWaypointCache(1000));
    }
}
