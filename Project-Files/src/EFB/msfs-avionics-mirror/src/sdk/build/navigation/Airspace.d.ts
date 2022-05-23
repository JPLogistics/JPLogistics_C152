import { GeoPoint } from '../geo/GeoPoint';
/**
 * Types of airspaces.
 */
export declare enum AirspaceType {
    None = 0,
    Center = 1,
    ClassA = 2,
    ClassB = 3,
    ClassC = 4,
    ClassD = 5,
    ClassE = 6,
    ClassF = 7,
    ClassG = 8,
    Tower = 9,
    Clearance = 10,
    Ground = 11,
    Departure = 12,
    Approach = 13,
    MOA = 14,
    Restricted = 15,
    Prohibited = 16,
    Warning = 17,
    Alert = 18,
    Danger = 19,
    Nationalpark = 20,
    ModeC = 21,
    Radar = 22,
    Training = 23,
    Max = 24
}
/**
 * An airspace.
 */
export interface Airspace {
    /** The type of the airspace. */
    readonly type: AirspaceType;
    /** The name of the airspace. */
    readonly name: string;
    /** The type of the airspace. */
    readonly segments: readonly GeoPoint[];
    /**
     * Checks whether this airspace is the same as another airspace.
     * @param other The other airspace.
     * @returns whether this airspace is the same as another airspace.
     */
    equals(other: Airspace): boolean;
}
//# sourceMappingURL=Airspace.d.ts.map