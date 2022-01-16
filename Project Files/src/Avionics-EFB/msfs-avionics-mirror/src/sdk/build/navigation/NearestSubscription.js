import { SubscribableArrayEventType } from '../utils/Subscribable';
import { FacilitySearchType, FacilityType } from './Facilities';
/**
 * A type map of search type to concrete facility loader query type.
 */
const facilitySearchTypeMap = new Map([
    [FacilitySearchType.Airport, FacilityType.Airport],
    [FacilitySearchType.Intersection, FacilityType.Intersection],
    [FacilitySearchType.Vor, FacilityType.VOR],
    [FacilitySearchType.Ndb, FacilityType.NDB],
    [FacilitySearchType.User, FacilityType.USR]
]);
/**
 * A class for tracking a nearest facility session and making it available as a
 * subscribable array of facilities.
 */
export class NearestSubscription {
    /**
     * Creates an instance of a NearestSubscription.
     * @param facilityLoader An instance of the facility loader to search with.
     * @param type The type of facility to search for.
     */
    constructor(facilityLoader, type) {
        this.facilityLoader = facilityLoader;
        this.type = type;
        this.facilities = [];
        this.facilityIndex = new Map();
        this.subscriptions = [];
        this.pos = new LatLongAlt();
        this.searchInProgress = false;
    }
    /** @inheritdoc */
    get length() {
        return this.facilities.length;
    }
    /**
     * Whether or not this subscription has been started.
     * @returns True if started, false otherwise.
     */
    get started() {
        return this.session !== undefined;
    }
    /** @inheritdoc */
    get(index) {
        const facility = this.facilities[index];
        if (facility === undefined) {
            throw new Error(`Facility at index ${index} could not be found.`);
        }
        return facility;
    }
    /** @inheritdoc */
    tryGet(index) {
        return this.facilities[index];
    }
    /** @inheritdoc */
    getArray() {
        return this.facilities;
    }
    /** @inheritdoc */
    sub(fn, initialNotify) {
        this.subscriptions.push(fn);
        if (initialNotify) {
            fn(0, SubscribableArrayEventType.Added, this.facilities, this.facilities);
        }
    }
    /** @inheritdoc */
    unsub(fn) {
        const subIndex = this.subscriptions.indexOf(fn);
        if (subIndex >= 0) {
            this.subscriptions.splice(subIndex, 1);
        }
    }
    /**
     * Starts the search subscription.
     */
    async start() {
        if (this.session === undefined) {
            this.session = await this.facilityLoader.startNearestSearchSession(this.type);
        }
    }
    /**
     * Updates the nearest search subscription.
     * @param lat The latitude of the current search position.
     * @param lon The longitude of the current search position.
     * @param radius The radius of the search, in meters.
     * @param maxItems The maximum number of items to return in the search.
     */
    async update(lat, lon, radius, maxItems) {
        if (this.searchInProgress) {
            return;
        }
        this.searchInProgress = true;
        this.pos.lat = lat;
        this.pos.long = lon;
        if (this.session === undefined) {
            this.session = await this.facilityLoader.startNearestSearchSession(this.type);
        }
        const results = await this.session.searchNearest(lat, lon, radius, maxItems);
        await this.onResults(results);
        this.searchInProgress = false;
    }
    /**
     * Adds a facility to the collection.
     * @param facility The facility to add.
     * @param key The key to track this facility by.
     */
    addFacility(facility, key) {
        if (this.facilityIndex.has(key)) {
            console.warn(`Facility ${key} is already in the collection.`);
        }
        this.facilities.push(facility);
        this.facilityIndex.set(key, facility);
        for (let i = 0; i < this.subscriptions.length; i++) {
            const sub = this.subscriptions[i];
            sub(this.facilities.length - 1, SubscribableArrayEventType.Added, facility, this.facilities);
        }
    }
    /**
     * Removes a facility from the collection.
     * @param key The key of the facility to remove.
     */
    removeFacility(key) {
        const facility = this.facilityIndex.get(key);
        if (facility !== undefined) {
            const index = this.facilities.indexOf(facility);
            this.facilities.splice(index, 1);
            this.facilityIndex.delete(key);
            for (let i = 0; i < this.subscriptions.length; i++) {
                const sub = this.subscriptions[i];
                sub(this.facilities.length - 1, SubscribableArrayEventType.Removed, facility, this.facilities);
            }
        }
    }
}
/**
 * A nearest search subscription for waypoint facilites.
 */
class NearestWaypointSubscription extends NearestSubscription {
    /** @inheritdoc */
    async onResults(results) {
        const facilityType = facilitySearchTypeMap.get(this.type);
        if (facilityType !== undefined) {
            const added = await Promise.all(results.added.map(icao => this.facilityLoader.getFacility(facilityType, icao)));
            for (let i = 0; i < added.length; i++) {
                this.addFacility(added[i], added[i].icao);
            }
            for (let i = 0; i < results.removed.length; i++) {
                this.removeFacility(results.removed[i]);
            }
        }
    }
}
/**
 * A nearest search subscription for airport facilites.
 */
export class NearestAirportSubscription extends NearestWaypointSubscription {
    /**
     * Creates a new NearestAirportSubscription.
     * @param facilityLoader The facility loader to use with this instance.
     */
    constructor(facilityLoader) {
        super(facilityLoader, FacilitySearchType.Airport);
    }
    /**
     * Sets the airport search filter.
     * @param showClosed Whether or not to return closed airports in the search.
     * @param classMask A bitmask representing the classes of airports to show.
     */
    setFilter(showClosed, classMask) {
        if (this.session !== undefined) {
            this.session.setAirportFilter(showClosed, classMask);
        }
    }
}
/**
 * A nearest search subscription for intersection facilites.
 */
export class NearestIntersectionSubscription extends NearestWaypointSubscription {
    /**
     * Creates a new NearestIntersectionSubscription.
     * @param facilityLoader The facility loader to use with this instance.
     */
    constructor(facilityLoader) {
        super(facilityLoader, FacilitySearchType.Intersection);
    }
    /**
     * Sets the intersection search filter.
     * @param typeMask A bitmask representing the classes of intersections to show.
     */
    setFilter(typeMask) {
        if (this.session !== undefined) {
            this.session.setIntersectionFilter(typeMask);
        }
    }
}
/**
 * A nearest search subscription for VOR facilites.
 */
export class NearestVorSubscription extends NearestWaypointSubscription {
    /**
     * Creates a new NearestVorSubscription.
     * @param facilityLoader The facility loader to use with this instance.
     */
    constructor(facilityLoader) {
        super(facilityLoader, FacilitySearchType.Vor);
    }
}
/**
 * A nearest search subscription for NDB facilites.
 */
export class NearestNdbSubscription extends NearestWaypointSubscription {
    /**
     * Creates a new NearestNdbSubscription.
     * @param facilityLoader The facility loader to use with this instance.
     */
    constructor(facilityLoader) {
        super(facilityLoader, FacilitySearchType.Ndb);
    }
}
