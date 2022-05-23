/// <reference types="msfstypes/JS/common" />
/// <reference types="msfstypes/JS/Simplane" />
import { UnitType } from '..';
import { GeoPoint } from '../geo';
import { FacilityType, FacilitySearchType, ICAO } from './Facilities';
import { RunwayUtils } from './RunwayUtils';
/**
 * A type map of facility type to facility search type.
 */
export const FacilityTypeSearchType = {
    /** Airport facility type. */
    [FacilityType.Airport]: FacilitySearchType.Airport,
    /** Intersection facility type. */
    [FacilityType.Intersection]: FacilitySearchType.Intersection,
    /** NDB facility type. */
    [FacilityType.NDB]: FacilitySearchType.Ndb,
    /** VOR facility type. */
    [FacilityType.VOR]: FacilitySearchType.Vor,
    /** USR facility type. */
    [FacilityType.USR]: FacilitySearchType.User
};
/**
 * A class that handles loading facility data from the simulator.
 */
export class FacilityLoader {
    /**
     * Creates an instance of the FacilityLoader.
     * @param facilityRepo A local facility repository.
     * @param onInitialized A callback to call when the facility loader has completed initialization.
     */
    constructor(facilityRepo, onInitialized = () => { }) {
        this.facilityRepo = facilityRepo;
        this.onInitialized = onInitialized;
        if (FacilityLoader.facilityListener === undefined) {
            FacilityLoader.facilityListener = RegisterViewListener('JS_LISTENER_FACILITY', () => {
                FacilityLoader.facilityListener.on('SendAirport', FacilityLoader.onFacilityReceived);
                FacilityLoader.facilityListener.on('SendIntersection', FacilityLoader.onFacilityReceived);
                FacilityLoader.facilityListener.on('SendVor', FacilityLoader.onFacilityReceived);
                FacilityLoader.facilityListener.on('SendNdb', FacilityLoader.onFacilityReceived);
                FacilityLoader.facilityListener.on('NearestSearchCompleted', FacilityLoader.onNearestSearchCompleted);
                setTimeout(() => this.onInitialized(), 2000);
            }, true);
        }
        else {
            setTimeout(() => this.onInitialized(), 2000);
        }
    }
    /**
     * Retrieves a facility.
     * @param type The type of facility to retrieve.
     * @param icao The ICAO of the facility to retrieve.
     * @returns A Promise which will be fulfilled with the requested facility, or rejected if the facility could not be
     * retrieved.
     */
    getFacility(type, icao) {
        switch (type) {
            case FacilityType.USR:
            case FacilityType.RWY:
            case FacilityType.VIS:
                return this.getFacilityFromRepo(type, icao);
            default:
                return this.getFacilityFromCoherent(type, icao);
        }
    }
    // eslint-disable-next-line jsdoc/require-throws
    /**
     * Retrieves a facility from the local facility repository.
     * @param type The type of facility to retrieve.
     * @param icao The ICAO of the facility to retrieve.
     * @returns A Promise which will be fulfilled with the requested facility, or rejected if the facility could not be
     * retrieved.
     */
    async getFacilityFromRepo(type, icao) {
        const fac = this.facilityRepo.get(icao);
        if (fac) {
            return fac;
        }
        else if (type === FacilityType.RWY) {
            try {
                const airport = await this.getFacility(FacilityType.Airport, `A      ${icao.substr(3, 4)} `);
                const runway = RunwayUtils.matchOneWayRunwayFromIdent(airport, ICAO.getIdent(icao));
                if (runway) {
                    const runwayFac = RunwayUtils.createRunwayFacility(airport, runway);
                    this.facilityRepo.add(runwayFac);
                    return runwayFac;
                }
            }
            catch (e) {
                // noop
            }
        }
        throw `Facility ${icao} could not be found.`;
    }
    /**
     * Retrieves a facility from Coherent.
     * @param type The type of facility to retrieve.
     * @param icao The ICAO of the facility to retrieve.
     * @returns A Promise which will be fulfilled with the requested facility, or rejected if the facility could not be
     * retrieved.
     */
    getFacilityFromCoherent(type, icao) {
        const isMismatch = ICAO.getFacilityType(icao) !== type;
        const currentTime = Date.now();
        let queue = FacilityLoader.requestQueue;
        let cache = FacilityLoader.facCache;
        if (isMismatch) {
            queue = FacilityLoader.mismatchRequestQueue;
            cache = FacilityLoader.typeMismatchFacCache;
        }
        let request = queue.get(icao);
        if (request === undefined || currentTime - request.timeStamp > 10000) {
            let resolve = undefined;
            let reject = undefined;
            const promise = new Promise((resolution, rejection) => {
                resolve = resolution;
                reject = rejection;
                const cachedFac = cache.get(icao);
                if (cachedFac === undefined) {
                    Coherent.call(type, icao).then((isValid) => {
                        if (!isValid) {
                            rejection(`Facility ${icao} could not be found.`);
                            FacilityLoader.requestQueue.delete(icao);
                        }
                    });
                }
                else {
                    resolve(cachedFac);
                }
            });
            if (request) {
                request.reject(`Facility request for ${icao} has timed out.`);
            }
            request = { promise, timeStamp: currentTime, resolve: resolve, reject: reject };
            FacilityLoader.requestQueue.set(icao, request);
        }
        return request.promise;
    }
    /**
     * Gets airway data from the sim.
     * @param airwayName The airway name.
     * @param airwayType The airway type.
     * @param icao The 12 character FS ICAO of at least one intersection in the airway.
     * @returns The retrieved airway.
     * @throws an error if no airway is returned
     */
    async getAirway(airwayName, airwayType, icao) {
        if (FacilityLoader.airwayCache.has(airwayName)) {
            const cachedAirway = FacilityLoader.airwayCache.get(airwayName);
            const match = cachedAirway === null || cachedAirway === void 0 ? void 0 : cachedAirway.waypoints.find((w) => {
                w.icao === icao;
            });
            if (match !== undefined && cachedAirway !== undefined) {
                return cachedAirway;
            }
        }
        const fac = await this.getFacility(FacilityType.Intersection, icao);
        const route = fac.routes.find((r) => r.name === airwayName);
        if (route !== undefined) {
            const airwayBuilder = new AirwayBuilder(fac, route, this);
            const status = await airwayBuilder.startBuild();
            if (status === AirwayStatus.COMPLETE) {
                const waypoints = airwayBuilder.waypoints;
                if (waypoints !== null) {
                    const airway = new AirwayObject(airwayName, airwayType);
                    airway.waypoints = [...waypoints];
                    FacilityLoader.addToAirwayCache(airway);
                    return airway;
                }
            }
        }
        throw new Error('Airway could not be found.');
    }
    /**
     * Starts a nearest facilities search session.
     * @param type The type of facilities for which to search.
     * @returns A Promise which will be fulfilled with the new nearest search session.
     */
    async startNearestSearchSession(type) {
        switch (type) {
            case FacilitySearchType.User:
                return this.startRepoNearestSearchSession(type);
            default:
                return this.startCoherentNearestSearchSession(type);
        }
    }
    /**
     * Starts a sim-side nearest facilities search session through Coherent.
     * @param type The type of facilities for which to search.
     * @returns A Promise which will be fulfilled with the new nearest search session.
     */
    async startCoherentNearestSearchSession(type) {
        const sessionId = await Coherent.call('START_NEAREST_SEARCH_SESSION', type);
        let session;
        switch (type) {
            case FacilitySearchType.Airport:
                session = new NearestAirportSearchSession(sessionId);
                break;
            case FacilitySearchType.Intersection:
                session = new NearestIntersectionSearchSession(sessionId);
                break;
            case FacilitySearchType.Vor:
                session = new NearestIntersectionSearchSession(sessionId);
                break;
            case FacilitySearchType.Boundary:
                session = new NearestBoundarySearchSession(sessionId);
                break;
            default:
                session = new CoherentNearestSearchSession(sessionId);
                break;
        }
        FacilityLoader.searchSessions.set(sessionId, session);
        return session;
    }
    /**
     * Starts a repository facilities search session.
     * @param type The type of facilities for which to search.
     * @returns A Promise which will be fulfilled with the new nearest search session.
     * @throws Error if the search type is not supported.
     */
    startRepoNearestSearchSession(type) {
        // Session ID doesn't really matter for these, so in order to not conflict with IDs from Coherent, we will set
        // them all to negative numbers
        const sessionId = FacilityLoader.repoSearchSessionId--;
        switch (type) {
            case FacilitySearchType.User:
                return new NearestUserFacilitySearchSession(this.facilityRepo, sessionId);
            default:
                throw new Error();
        }
    }
    // eslint-disable-next-line jsdoc/require-jsdoc
    async getMetar(arg) {
        const ident = typeof arg === 'string' ? arg : ICAO.getIdent(arg.icao);
        const metar = await Coherent.call('GET_METAR_BY_IDENT', ident);
        return FacilityLoader.cleanMetar(metar);
    }
    /**
     * Searches for the METAR issued for the closest airport to a given location.
     * @param lat The latitude of the center of the search, in degrees.
     * @param lon The longitude of the center of the search, in degrees.
     * @returns The METAR issued for the closest airport to the given location, or undefined if none could be found.
     */
    async searchMetar(lat, lon) {
        const metar = await Coherent.call('GET_METAR_BY_LATLON', lat, lon);
        return FacilityLoader.cleanMetar(metar);
    }
    /**
     * Cleans up a raw METAR object.
     * @param raw A raw METAR object.
     * @returns A cleaned version of the raw METAR object, or undefined if the raw METAR is empty.
     */
    static cleanMetar(raw) {
        if (raw.icao === '') {
            return undefined;
        }
        raw.gust < 0 && delete raw.gust;
        raw.vertVis < 0 && delete raw.vertVis;
        isNaN(raw.altimeterA) && delete raw.altimeterA;
        raw.altimeterQ < 0 && delete raw.altimeterQ;
        isNaN(raw.slp) && delete raw.slp;
        return raw;
    }
    /**
     * Searches for ICAOs by their ident portion only.
     * @param filter The type of facility to filter by. Selecting ALL will search all facility type ICAOs.
     * @param ident The partial or complete ident to search for.
     * @param maxItems The max number of matches to return.
     * @returns A collection of matched ICAOs.
     */
    async searchByIdent(filter, ident, maxItems = 40) {
        const results = await Coherent.call('SEARCH_BY_IDENT', ident, filter, maxItems);
        if (filter === FacilitySearchType.User || filter === FacilitySearchType.All) {
            this.facilityRepo.forEach(fac => {
                const facIdent = ICAO.getIdent(fac.icao);
                if (facIdent === ident) {
                    results.unshift(fac.icao);
                }
                else if (facIdent.startsWith(ident)) {
                    results.push(fac.icao);
                }
            }, FacilityLoader.facRepositorySearchTypes);
        }
        return results;
    }
    /** Searches for facilities matching a given ident, and returns the matching facilities, with nearest at the beginning of the array.
     * @param filter The type of facility to filter by. Selecting ALL will search all facility type ICAOs, except for boundary facilities.
     * @param ident The exact ident to search for. (ex: DEN, KDEN, ITADO)
     * @param lat The latitude to find facilities nearest to.
     * @param lon The longitude to find facilities nearest to.
     * @param maxItems The max number of matches to return.
     * @returns An array of matching facilities, sorted by distance to the given lat/lon, with nearest at the beginning of the array.
     */
    async findNearestFacilitiesByIdent(filter, ident, lat, lon, maxItems = 40) {
        const results = await this.searchByIdent(filter, ident, maxItems);
        if (!results) {
            return [];
        }
        const promises = [];
        for (let i = 0; i < results.length; i++) {
            const icao = results[i];
            const facIdent = ICAO.getIdent(icao);
            if (facIdent === ident) {
                const facType = ICAO.getFacilityType(icao);
                promises.push(this.getFacility(facType, icao));
            }
        }
        const foundFacilities = await Promise.all(promises);
        if (foundFacilities.length > 1) {
            foundFacilities.sort((a, b) => GeoPoint.distance(lat, lon, a.lat, a.lon) - GeoPoint.distance(lat, lon, b.lat, b.lon));
            return foundFacilities;
        }
        else if (foundFacilities.length === 1) {
            return foundFacilities;
        }
        else {
            return [];
        }
    }
    /**
     * A callback called when a facility is received from the simulator.
     * @param facility The received facility.
     */
    static onFacilityReceived(facility) {
        const request = FacilityLoader.requestQueue.get(facility.icao);
        if (request !== undefined) {
            request.resolve(facility);
            FacilityLoader.addToFacilityCache(facility, facility['__Type'] === 'JS_FacilityIntersection' && facility.icao[0] !== 'W');
            FacilityLoader.requestQueue.delete(facility.icao);
        }
    }
    /**
     * A callback called when a search completes.
     * @param results The results of the search.
     */
    static onNearestSearchCompleted(results) {
        const session = FacilityLoader.searchSessions.get(results.sessionId);
        if (session instanceof CoherentNearestSearchSession) {
            session.onSearchCompleted(results);
        }
    }
    /**
     * Adds a facility to the cache.
     * @param fac The facility to add.
     * @param isTypeMismatch Whether to add the facility to the type mismatch cache.
     */
    static addToFacilityCache(fac, isTypeMismatch) {
        const cache = isTypeMismatch ? FacilityLoader.typeMismatchFacCache : FacilityLoader.facCache;
        cache.set(fac.icao, fac);
        if (cache.size > FacilityLoader.MAX_FACILITY_CACHE_ITEMS) {
            cache.delete(cache.keys().next().value);
        }
    }
    /**
     * Adds an airway to the airway cache.
     * @param airway The airway to add.
     */
    static addToAirwayCache(airway) {
        FacilityLoader.airwayCache.set(airway.name, airway);
        if (FacilityLoader.airwayCache.size > FacilityLoader.MAX_AIRWAY_CACHE_ITEMS) {
            FacilityLoader.airwayCache.delete(FacilityLoader.airwayCache.keys().next().value);
        }
    }
}
FacilityLoader.MAX_FACILITY_CACHE_ITEMS = 1000;
FacilityLoader.MAX_AIRWAY_CACHE_ITEMS = 1000;
FacilityLoader.requestQueue = new Map();
FacilityLoader.mismatchRequestQueue = new Map();
FacilityLoader.facCache = new Map();
FacilityLoader.typeMismatchFacCache = new Map();
FacilityLoader.airwayCache = new Map();
FacilityLoader.searchSessions = new Map();
FacilityLoader.facRepositorySearchTypes = [FacilityType.USR];
FacilityLoader.repoSearchSessionId = -1;
/**
 * A session for searching for nearest facilities through Coherent.
 */
class CoherentNearestSearchSession {
    /**
     * Creates an instance of a CoherentNearestSearchSession.
     * @param sessionId The ID of the session.
     */
    constructor(sessionId) {
        this.sessionId = sessionId;
        this.searchQueue = new Map();
    }
    /** @inheritdoc */
    searchNearest(lat, lon, radius, maxItems) {
        const promise = new Promise((resolve) => {
            Coherent.call('SEARCH_NEAREST', this.sessionId, lat, lon, radius, maxItems)
                .then((searchId) => {
                this.searchQueue.set(searchId, { promise, resolve });
            });
        });
        return promise;
    }
    /**
     * A callback called by the facility loader when a nearest search has completed.
     * @param results The search results.
     */
    onSearchCompleted(results) {
        const request = this.searchQueue.get(results.searchId);
        if (request !== undefined) {
            request.resolve(results);
            this.searchQueue.delete(results.searchId);
        }
    }
}
/**
 * A session for searching for nearest airports.
 */
export class NearestAirportSearchSession extends CoherentNearestSearchSession {
    /**
     * Sets the filter for the airport nearest search.
     * @param showClosed Whether or not to show closed airports.
     * @param classMask A bitmask to determine which JS airport classes to show.
     */
    setAirportFilter(showClosed, classMask) {
        Coherent.call('SET_NEAREST_AIRPORT_FILTER', this.sessionId, showClosed ? 1 : 0, classMask);
    }
}
/**
 * A session for searching for nearest intersections.
 */
export class NearestIntersectionSearchSession extends CoherentNearestSearchSession {
    /**
     * Sets the filter for the intersection nearest search.
     * @param typeMask A bitmask to determine which JS intersection types to show.
     */
    setIntersectionFilter(typeMask) {
        Coherent.call('SET_NEAREST_INTERSECTION_FILTER', this.sessionId, typeMask);
    }
}
/**
 * A session for searching for nearest VORs.
 */
export class NearestVorSearchSession extends CoherentNearestSearchSession {
    /**
     * Sets the filter for the VOR nearest search.
     * @param classMask A bitmask to determine which JS VOR classes to show.
     * @param typeMask A bitmask to determine which JS VOR types to show.
     */
    setVorFilter(classMask, typeMask) {
        Coherent.call('SET_NEAREST_VOR_FILTER', this.sessionId, classMask, typeMask);
    }
}
/**
 * A session for searching for nearest airspace boundaries.
 */
export class NearestBoundarySearchSession extends CoherentNearestSearchSession {
    /**
     * Sets the filter for the boundary nearest search.
     * @param classMask A bitmask to determine which boundary classes to show.
     */
    setBoundaryFilter(classMask) {
        Coherent.call('SET_NEAREST_BOUNDARY_FILTER', this.sessionId, classMask);
    }
}
/**
 * A session for searching for nearest user facilities.
 */
export class NearestUserFacilitySearchSession {
    /**
     * Creates an instance of a NearestUserSearchSession.
     * @param repo The facility repository in which to search.
     * @param sessionId The ID of the session.
     */
    constructor(repo, sessionId) {
        this.repo = repo;
        this.sessionId = sessionId;
        this.filter = undefined;
        this.cachedResults = new Set();
        this.searchId = 0;
    }
    /** @inheritdoc */
    searchNearest(lat, lon, radius, maxItems) {
        const radiusGAR = UnitType.METER.convertTo(radius, UnitType.GA_RADIAN);
        const results = this.repo.search(FacilityType.USR, lat, lon, radiusGAR, maxItems, [], this.filter);
        const added = [];
        for (let i = 0; i < results.length; i++) {
            const icao = results[i].icao;
            if (this.cachedResults.has(icao)) {
                this.cachedResults.delete(icao);
            }
            else {
                added.push(icao);
            }
        }
        const removed = Array.from(this.cachedResults);
        for (let i = 0; i < results.length; i++) {
            this.cachedResults.add(results[i].icao);
        }
        return Promise.resolve({
            sessionId: this.sessionId,
            searchId: this.searchId++,
            added,
            removed
        });
    }
    /**
     * Sets the filter for this search session.
     * @param filter A function to filter the search results.
     */
    setUserFacilityFilter(filter) {
        this.filter = filter;
    }
}
/**
 * An airway.
 */
export class AirwayObject {
    /** Builds a Airway
     * @param name - the name of the new airway.
     * @param type - the type of the new airway.
     */
    constructor(name, type) {
        this._waypoints = [];
        this._name = name;
        this._type = type;
    }
    /**
     * Gets the name of the airway
     * @returns the airway name
     */
    get name() {
        return this._name;
    }
    /**
     * Gets the type of the airway
     * @returns the airway type
     */
    get type() {
        return this._type;
    }
    /**
     * Gets the waypoints of this airway.
     * @returns the waypoints of this airway.
     */
    get waypoints() {
        return this._waypoints;
    }
    /**
     * Sets the waypoints of this airway.
     * @param waypoints is the array of waypoints.
     */
    set waypoints(waypoints) {
        this._waypoints = waypoints;
    }
}
/**
 * WT Airway Status Enum
 */
export var AirwayStatus;
(function (AirwayStatus) {
    /**
     * @readonly
     * @property {number} INCOMPLETE - indicates waypoints have not been loaded yet.
     */
    AirwayStatus[AirwayStatus["INCOMPLETE"] = 0] = "INCOMPLETE";
    /**
     * @readonly
     * @property {number} COMPLETE - indicates all waypoints have been successfully loaded.
     */
    AirwayStatus[AirwayStatus["COMPLETE"] = 1] = "COMPLETE";
    /**
     * @readonly
     * @property {number} PARTIAL - indicates some, but not all, waypoints have been successfully loaded.
     */
    AirwayStatus[AirwayStatus["PARTIAL"] = 2] = "PARTIAL";
})(AirwayStatus || (AirwayStatus = {}));
/**
 * The Airway Builder.
 */
export class AirwayBuilder {
    /** Creates an instance of the AirwayBuilder
     * @param _initialWaypoint is the initial intersection facility
     * @param _initialData is the intersection route to build from
     * @param facilityLoader is an instance of the facility loader
     */
    constructor(_initialWaypoint, _initialData, facilityLoader) {
        this._initialWaypoint = _initialWaypoint;
        this._initialData = _initialData;
        this.facilityLoader = facilityLoader;
        this._waypointsArray = [];
        this._hasStarted = false;
        this._isDone = false;
    }
    // constructor(private _initialWaypoint: IntersectionFacility, private _requestEntry: (entry: string) => Promise<IntersectionFacility>) {
    // }
    /**
     * Get whether this builder has started loading waypoints
     * @returns whether this builder has started
     */
    get hasStarted() {
        return this._hasStarted;
    }
    /**
     * Get whether this builder is done loading waypoints
     * @returns whether this builder is done loading waypoints
     */
    get isDone() {
        return this._isDone;
    }
    /**
     * Get the airway waypoints
     * @returns the airway waypoints, or null
     */
    get waypoints() {
        return this._waypointsArray;
    }
    /** Steps through the airway waypoints
     * @param stepForward is the direction to step; true = forward, false = backward
     * @param arrayInsertFunc is the arrayInsertFunc
     */
    async _step(stepForward, arrayInsertFunc) {
        let isDone = false;
        let current = this._initialData;
        while (!isDone && current) {
            const nextICAO = stepForward ? current.nextIcao : current.prevIcao;
            if (nextICAO && nextICAO.length > 0 && nextICAO[0] != ' ' && this._waypointsArray !== null
                && !this._waypointsArray.find(waypoint => waypoint.icao === nextICAO)) {
                const fac = await this.facilityLoader.getFacility(FacilityType.Intersection, nextICAO);
                arrayInsertFunc(fac);
                const next = fac.routes.find((route) => route.name === current.name);
                if (next !== undefined) {
                    current = next;
                }
                else {
                    isDone = true;
                }
            }
            else {
                isDone = true;
            }
        }
    }
    /** Steps Forward through the airway waypoints
     * @returns the step forward function
     */
    async _stepForward() {
        if (this._waypointsArray !== null) {
            return this._step(true, this._waypointsArray.push.bind(this._waypointsArray));
        }
    }
    /** Steps Backward through the airway waypoints
     * @returns the step backward function
     */
    async _stepBackward() {
        if (this._waypointsArray !== null) {
            return this._step(false, this._waypointsArray.unshift.bind(this._waypointsArray));
        }
    }
    /**
     * Sets the array into which this builder will load waypoints.
     * @param array is the array into which the builder will load waypoints
     */
    setWaypointsArray(array) {
        this._waypointsArray = array;
    }
    /**
     * Begins loading waypoints for this builder's parent airway.
     * @returns a Promise to return a status code corresponding to Airway.Status when this builder has
     * finished loading waypoints.
     */
    startBuild() {
        if (this.hasStarted) {
            return Promise.reject(new Error('Airway builder has already started building.'));
        }
        return new Promise(resolve => {
            this._hasStarted = true;
            if (this._waypointsArray !== null) {
                this._waypointsArray.push(this._initialWaypoint);
                Promise.all([
                    this._stepForward(),
                    this._stepBackward()
                ]).then(() => {
                    this._isDone = true;
                    resolve(AirwayStatus.COMPLETE);
                }).catch(() => {
                    this._isDone = true;
                    resolve(AirwayStatus.PARTIAL);
                });
            }
        });
    }
}
