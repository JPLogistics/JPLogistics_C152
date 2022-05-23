import { GeoPoint } from '../geo/GeoPoint';
import { AirspaceType } from './Airspace';
/**
 *
 */
class CoherentAirspace {
    /**
     * Constructor.
     * @param def The airspace definition to use for the new airspace.
     * @param uid A unique string ID for the new airspace.
     */
    constructor(def, uid) {
        /** @inheritdoc */
        this.name = '';
        this._segments = [];
        this.type = def.type;
        this.uid = uid;
        const segments = def.segments;
        const len = segments.length;
        for (let i = 0; i < len; i++) {
            const point = segments[i];
            this._segments[i] = new GeoPoint(point.lat, point.long);
        }
    }
    /** @inheritdoc */
    get segments() {
        return this._segments;
    }
    /** @inheritdoc */
    equals(other) {
        if (other instanceof CoherentAirspace) {
            return this.uid === other.uid;
        }
        return this.type === other.type
            && this.segments.length === other.segments.length
            && this.segments.every((point, index) => point.equals(other.segments[index]));
    }
}
/**
 * A searcher for airspaces.
 */
export class AirspaceSearcher {
    /**
     * Constructor.
     * @param cacheSize The maximum size of the Airspace cache.
     */
    constructor(cacheSize = AirspaceSearcher.DEFAULT_CACHE_SIZE) {
        this.cacheSize = cacheSize;
        this.cache = new Map();
        this._isBusy = false;
        this.queue = [];
    }
    /**
     * Checks whether this searcher is currently busy with a search.
     * @returns whether this searcher is currently busy with a search.
     */
    isBusy() {
        return this._isBusy;
    }
    /**
     * Searches for airspaces around a geographic point. If the searcher is not busy, the search will execute
     * immediately. If the search is busy, the search will be queued. Queued searches will be executed one at a time in
     * FIFO order as searches are finished.
     * @param center The center of the search area.
     * @returns a Promise which is fulfilled with an array of airspaces when the search finishes.
     */
    search(center) {
        return new Promise(resolve => {
            if (this._isBusy || this.queue.length > 0) {
                this.enqueueSearch(center, resolve);
            }
            else {
                this.doSearch(center, resolve);
            }
        });
    }
    /**
     * Enqueues a search operation.
     * @param center The center of the search area.
     * @param resolve The Promise resolve function to call with the search results.
     */
    enqueueSearch(center, resolve) {
        this.queue.push(this.doSearch.bind(this, center, resolve));
    }
    /**
     * Executes the next search operation in the queue, if one exists.
     */
    processQueue() {
        const next = this.queue.shift();
        if (next) {
            next();
        }
    }
    /**
     * Executes an airspace search.
     * @param center The center of the search area.
     * @param resolve The Promise resolve function to call with the search results.
     */
    async doSearch(center, resolve) {
        this._isBusy = true;
        try {
            const coherentDefs = await Promise.race([
                this.executeCoherentSearch(center),
                new Promise((timeoutResolve, reject) => setTimeout(() => reject('Airspace search timed out.'), AirspaceSearcher.SEARCH_TIMEOUT))
            ]);
            const airspaces = this.processCoherentDefs(coherentDefs);
            resolve(airspaces);
        }
        catch (e) {
            // console.log(e);
            resolve([]);
        }
        this._isBusy = false;
        this.processQueue();
    }
    /**
     * Executes a Coherent airspace search.
     * @param center The center of the search area.
     * @returns a Promise which is fulfilled with an array of Coherent airspace definitions when the search finishes.
     */
    async executeCoherentSearch(center) {
        await Coherent.call('SET_LOAD_LATLON', center.lat, center.lon);
        return await Coherent.call('GET_NEAREST_AIRSPACES');
    }
    /**
     * Processes an array of Coherent airspace definitions into an array of Airspaces.
     * @param defs An array fo Coherent airspace definitions.
     * @returns an array of Airspaces corresponding to the supplied definitions.
     */
    processCoherentDefs(defs) {
        const result = [];
        const len = defs.length;
        for (let i = 0; i < len; i++) {
            const def = defs[i];
            if (def.type === AirspaceType.None) {
                continue;
            }
            const uid = AirspaceSearcher.generateUID(def);
            let airspace = this.cache.get(uid);
            if (!airspace) {
                airspace = new CoherentAirspace(def, uid);
                this.cacheAirspace(airspace);
            }
            result.push(airspace);
        }
        return result;
    }
    /**
     * Adds an airspace to the cache. If the cache size exceeds the maximum after the operation, airspaces will be
     * removed from the cache in FIFO order to maintain the maximum cache size.
     * @param airspace The airspace to cache.
     */
    cacheAirspace(airspace) {
        this.cache.set(airspace.uid, airspace);
        if (this.cache.size > this.cacheSize) {
            this.cache.delete(this.cache.keys().next().value);
        }
    }
    /**
     * Generates a unique string ID for a Coherent airspace definition.
     * @param def The airspace definition.
     * @returns a unique string ID.
     */
    static generateUID(def) {
        const segments = def.segments;
        let uid = `${def.type}[${segments.length}]:`;
        // skip last vertex since it is always a repeat of the first; cap length to 10 to avoid creating super long strings
        const len = Math.min(segments.length - 1, 10);
        for (let i = 0; i < len; i++) {
            const point = segments[i];
            uid += `(${point.lat},${point.long})`;
        }
        // if vertices were skipped, grab the last (unique) vertex to decrease chance of uid collision.
        if (len < segments.length - 1) {
            const point = segments[segments.length - 2];
            uid += `(${point.lat},${point.long})`;
        }
        return uid;
    }
}
/** The amount of time to wait for a search to finish before it times out, in milliseconds. */
AirspaceSearcher.SEARCH_TIMEOUT = 5000;
AirspaceSearcher.DEFAULT_CACHE_SIZE = 1000;
