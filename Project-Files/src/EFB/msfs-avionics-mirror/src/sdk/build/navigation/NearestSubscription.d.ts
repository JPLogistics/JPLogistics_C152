import { AirportFacility, Facility, FacilitySearchType, IntersectionFacility, NdbFacility, NearestSearchResults, VorFacility } from './Facilities';
import { FacilityLoader, NearestSearchSession } from './FacilityLoader';
import { AbstractSubscribableArray } from '../sub/AbstractSubscribableArray';
import { SubscribableArray } from '../sub/SubscribableArray';
/**
 * Interface specification for a nearest search subscription.
 */
export interface NearestSubscription<T extends Facility> extends SubscribableArray<T> {
    /** Whether the search has started. */
    started: boolean;
    /** The method for starting a search. */
    start: () => Promise<void>;
    /** The method for updating a search. */
    update: (lat: number, lon: number, radius: number, maxItems: number) => Promise<void>;
}
/**
 * A class for tracking a nearest facility session and making it available as a
 * subscribable array of facilities.
 */
export declare abstract class AbstractNearestSubscription<T extends Facility, TAdded, TRemoved> extends AbstractSubscribableArray<T> implements NearestSubscription<T> {
    protected readonly facilityLoader: FacilityLoader;
    protected readonly type: FacilitySearchType;
    protected readonly facilities: T[];
    protected readonly facilityIndex: Map<TRemoved, T>;
    protected session: NearestSearchSession<TAdded, TRemoved> | undefined;
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
    getArray(): readonly T[];
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
 * A nearest search subscription for waypoint facilites, including logic for further filtering
 * of results beyond what the sim search API gives us.
 */
declare abstract class NearestWaypointSubscription<T extends Facility> extends AbstractNearestSubscription<T, string, string> {
    private filterCb?;
    private facilityCache;
    /**
     * Creates a new NearestWaypointSubscription.
     * @param facilityLoader An instance of the facility loader to search with.
     * @param type The type of facility to search for.
     * @param filterCb An optional callback for filtering the results.
     */
    constructor(facilityLoader: FacilityLoader, type?: FacilitySearchType, filterCb?: (facility: T) => boolean);
    /**
     * Change the search filter and trigger a refresh of the search results.
     * @param filter The new search filter to use.
     */
    setFilterCb(filter: (facility: T) => boolean): void;
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
     * @param filterCb An optional filter to use for additional search criteria.
     */
    constructor(facilityLoader: FacilityLoader, filterCb?: (facility: AirportFacility) => boolean);
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
/**
 * A wrapper for a {@link NearestSearchSession} that automatically adjusts the number of
 * search results requested from the sim to minimize search load while still attempting to
 * provide the total number of results needed by the user.
 */
export declare class AdaptiveNearestSubscription<T extends Facility> extends AbstractSubscribableArray<T> implements NearestSubscription<T> {
    private subscription;
    private absoluteMaxItems;
    private static readonly RAMP_UP_FACTOR;
    private static readonly RAMP_DOWN_FACTOR;
    /** The array that holds the results of our latest search. */
    private facilities;
    /**
     * This array provides a backing store for what is essentially a "virtual" array
     * representing the aggregate of our search results to the client. Since we need to
     * limit the number of results returned we will carefully manage notifications when
     * anything changes to only expose the requested number of elements.
     */
    private shadowFacilities;
    /** The number of items requested on the last call to update. */
    private lastMaxRequested;
    /** The number of items we are requesting from the inner search to meet current demands. */
    private derivedMaxItems;
    /** Whether we have a search in progress already. */
    private searchInProgress;
    /** A reusable GeoPoint for sorting by distance. */
    private pos;
    /**
     * Creates an instance of AdaptiveNearestSubscription.
     * @param subscription A {@link NearestSubscription} to use as our inner search.
     * @param absoluteMaxItems The maximum number of results to request in any search.
     */
    constructor(subscription: AbstractNearestSubscription<T, any, any>, absoluteMaxItems: number);
    /** @inheritdoc */
    get length(): number;
    /** @inheritdoc */
    getArray(): readonly T[];
    /**
     * Whether or not the inner search has started.
     * @returns True if started, false otherwise.
     */
    get started(): boolean;
    /**
     * Start the inner search subscription.
     */
    start(): Promise<void>;
    /**
     * Cause the inner subscription to update.
     * @param lat The latitude of the current search position.
     * @param lon The longitude of the current search position.
     * @param radius The radius of the search, in meters.
     * @param maxItems The maximum number of items to return in the search.
     */
    update(lat: number, lon: number, radius: number, maxItems: number): Promise<void>;
    /**
     * Responds to changes in our inner search and updates our facilities store accordingly.
     * @param index The index of the changed item.
     * @param type The type of change.
     * @param item The item(s) involved in the change, if any.
     */
    private onSourceChanged;
    /**
     * Notify our subscribers of changes to the virtual search results.
     * @param index The index of the changed item.
     * @param type The type of change.
     * @param item The item(s) involved in the change, if any.
     */
    private notifySubscribers;
}
export {};
//# sourceMappingURL=NearestSubscription.d.ts.map