import { SubscribableArray, SubscribableArrayEventType } from '../utils/Subscribable';
import { AirportFacility, Facility, FacilitySearchType, IntersectionFacility, NdbFacility, NearestSearchResults, VorFacility } from './Facilities';
import { FacilityLoader, NearestSearchSession } from './FacilityLoader';
/**
 * A class for tracking a nearest facility session and making it available as a
 * subscribable array of facilities.
 */
export declare abstract class NearestSubscription<T extends Facility, TAdded, TRemoved> implements SubscribableArray<T> {
    protected readonly facilityLoader: FacilityLoader;
    protected readonly type: FacilitySearchType;
    protected readonly facilities: T[];
    protected readonly facilityIndex: Map<TRemoved, T>;
    private readonly subscriptions;
    protected session: NearestSearchSession<TAdded, TRemoved> | undefined;
    private pos;
    private searchInProgress;
    /**
     * Creates an instance of a NearestSubscription.
     * @param facilityLoader An instance of the facility loader to search with.
     * @param type The type of facility to search for.
     */
    constructor(facilityLoader: FacilityLoader, type: FacilitySearchType);
    /** @inheritdoc */
    get length(): number;
    /**
     * Whether or not this subscription has been started.
     * @returns True if started, false otherwise.
     */
    get started(): boolean;
    /** @inheritdoc */
    get(index: number): T;
    /** @inheritdoc */
    tryGet(index: number): T | undefined;
    /** @inheritdoc */
    getArray(): readonly T[];
    /** @inheritdoc */
    sub(fn: (index: number, type: SubscribableArrayEventType, item: T | readonly T[] | undefined, array: readonly T[]) => void, initialNotify?: boolean): void;
    /** @inheritdoc */
    unsub(fn: (index: number, type: SubscribableArrayEventType, item: T | readonly T[] | undefined, array: readonly T[]) => void): void;
    /**
     * Starts the search subscription.
     */
    start(): Promise<void>;
    /**
     * Updates the nearest search subscription.
     * @param lat The latitude of the current search position.
     * @param lon The longitude of the current search position.
     * @param radius The radius of the search, in meters.
     * @param maxItems The maximum number of items to return in the search.
     */
    update(lat: number, lon: number, radius: number, maxItems: number): Promise<void>;
    /**
     * A callback called when results are received.
     * @param results The results that were received.
     */
    protected abstract onResults(results: NearestSearchResults<TAdded, TRemoved>): Promise<void>;
    /**
     * Adds a facility to the collection.
     * @param facility The facility to add.
     * @param key The key to track this facility by.
     */
    protected addFacility(facility: T, key: TRemoved): void;
    /**
     * Removes a facility from the collection.
     * @param key The key of the facility to remove.
     */
    protected removeFacility(key: TRemoved): void;
}
/**
 * A nearest search subscription for waypoint facilites.
 */
declare abstract class NearestWaypointSubscription<T extends Facility> extends NearestSubscription<T, string, string> {
    /** @inheritdoc */
    protected onResults(results: NearestSearchResults<string, string>): Promise<void>;
}
/**
 * A nearest search subscription for airport facilites.
 */
export declare class NearestAirportSubscription extends NearestWaypointSubscription<AirportFacility> {
    /**
     * Creates a new NearestAirportSubscription.
     * @param facilityLoader The facility loader to use with this instance.
     */
    constructor(facilityLoader: FacilityLoader);
    /**
     * Sets the airport search filter.
     * @param showClosed Whether or not to return closed airports in the search.
     * @param classMask A bitmask representing the classes of airports to show.
     */
    setFilter(showClosed: boolean, classMask: number): void;
}
/**
 * A nearest search subscription for intersection facilites.
 */
export declare class NearestIntersectionSubscription extends NearestWaypointSubscription<IntersectionFacility> {
    /**
     * Creates a new NearestIntersectionSubscription.
     * @param facilityLoader The facility loader to use with this instance.
     */
    constructor(facilityLoader: FacilityLoader);
    /**
     * Sets the intersection search filter.
     * @param typeMask A bitmask representing the classes of intersections to show.
     */
    setFilter(typeMask: number): void;
}
/**
 * A nearest search subscription for VOR facilites.
 */
export declare class NearestVorSubscription extends NearestWaypointSubscription<VorFacility> {
    /**
     * Creates a new NearestVorSubscription.
     * @param facilityLoader The facility loader to use with this instance.
     */
    constructor(facilityLoader: FacilityLoader);
}
/**
 * A nearest search subscription for NDB facilites.
 */
export declare class NearestNdbSubscription extends NearestWaypointSubscription<NdbFacility> {
    /**
     * Creates a new NearestNdbSubscription.
     * @param facilityLoader The facility loader to use with this instance.
     */
    constructor(facilityLoader: FacilityLoader);
}
export {};
//# sourceMappingURL=NearestSubscription.d.ts.map