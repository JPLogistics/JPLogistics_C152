import { LegDefinition } from '../flightplan';
import { GeoPointReadOnly } from '../geo';
import { AirportFacility, AirportRunway, Facility } from './Facilities';
/**
 * A collection of unique string waypoint type keys.
 */
export declare enum WaypointTypes {
    Custom = "Custom",
    Airport = "Airport",
    NDB = "NDB",
    VOR = "VOR",
    Intersection = "Intersection",
    Runway = "Runway",
    User = "User",
    Visual = "Visual",
    FlightPlan = "FlightPlan",
    VNAV = "VNAV"
}
/**
 * A navigational waypoint.
 */
export interface Waypoint {
    /** The geographic location of the waypoint. */
    readonly location: GeoPointReadOnly;
    /** A unique string ID assigned to this waypoint. */
    readonly uid: string;
    /**
     * Checks whether this waypoint and another are equal.
     * @param other The other waypoint.
     * @returns whether this waypoint and the other are equal.
     */
    equals(other: Waypoint): boolean;
    /** The unique string type of this waypoint. */
    readonly type: string;
}
/**
 * An abstract implementation of Waypoint.
 */
export declare abstract class AbstractWaypoint implements Waypoint {
    abstract get location(): GeoPointReadOnly;
    abstract get uid(): string;
    abstract get type(): string;
    equals(other: Waypoint): boolean;
}
/**
 * A waypoint with custom defined lat/lon coordinates.
 */
export declare class CustomWaypoint extends AbstractWaypoint {
    private readonly _location;
    private readonly _uid;
    /**
     * Constructor.
     * @param lat The latitude of this waypoint.
     * @param lon The longitude of this waypoint.
     * @param uidPrefix The prefix of this waypoint's UID.
     */
    constructor(lat: number, lon: number, uidPrefix: string);
    get location(): GeoPointReadOnly;
    get uid(): string;
    /** @inheritdoc */
    get type(): string;
}
/**
 * A waypoint associated with a facility.
 */
export declare class FacilityWaypoint<T extends Facility = Facility> extends AbstractWaypoint {
    readonly facility: T;
    private readonly _location;
    private readonly _type;
    /**
     * Constructor.
     * @param facility The facility associated with this waypoint.
     */
    constructor(facility: T);
    get location(): GeoPointReadOnly;
    get uid(): string;
    /** @inheritdoc */
    get type(): string;
}
/**
 * Airport size.
 */
export declare enum AirportSize {
    Large = "Large",
    Medium = "Medium",
    Small = "Small"
}
/**
 * A waypoint associated with an airport.
 */
export declare class AirportWaypoint<T extends AirportFacility = AirportFacility> extends FacilityWaypoint<T> {
    /** The longest runway at the airport associated with this waypoint, or null if the airport has no runways. */
    readonly longestRunway: AirportRunway | null;
    /** The size of the airport associated with this waypoint. */
    readonly size: AirportSize;
    /**
     * Constructor.
     * @param airport The airport associated with this waypoint.
     */
    constructor(airport: T);
    /**
     * Gets the longest runway at an airport.
     * @param airport An airport.
     * @returns the longest runway at an airport, or null if the airport has no runways.
     */
    private static getLongestRunway;
    /**
     * Gets the size of an airport.
     * @param airport An airport.
     * @param longestRunway The longest runway at the airport.
     * @returns the size of the airport.
     */
    private static getAirportSize;
}
/**
 * A flight path waypoint.
 */
export declare class FlightPathWaypoint extends CustomWaypoint {
    readonly ident: string;
    static readonly UID_PREFIX = "FLPTH";
    /** @inheritdoc */
    get type(): string;
    /**
     * Constructor.
     * @param lat The latitude of this waypoint.
     * @param lon The longitude of this waypoint.
     * @param ident The ident string of this waypoint.
     */
    constructor(lat: number, lon: number, ident: string);
}
/**
 * A VNAV TOD/BOD waypoint.
 */
export declare class VNavWaypoint extends AbstractWaypoint {
    private static readonly uidMap;
    private static readonly vec3Cache;
    private static readonly geoPointCache;
    private static readonly geoCircleCache;
    private readonly _location;
    private readonly _uid;
    /** @inheritdoc */
    get type(): string;
    /**
     * Constructor.
     * @param leg The leg that the VNAV waypoint is contained in.
     * @param distanceFromEnd The distance along the flight path from the end of the leg to the location of the waypoint,
     * in meters.
     * @param type The type of VNAV leg.
     */
    constructor(leg: LegDefinition, distanceFromEnd: number, type: 'tod' | 'bod');
    /**
     * Gets the waypoint's location in space.
     * @param leg The leg that the waypoint resides in.
     * @param distanceFromEnd The distance along the flight path from the end of the leg to the location of the waypoint,
     * in meters.
     * @returns The waypoint's location.
     */
    private getWaypointLocation;
    get location(): GeoPointReadOnly;
    get uid(): string;
}
//# sourceMappingURL=Waypoint.d.ts.map