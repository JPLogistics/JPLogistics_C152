import { Subject } from '../../..';
/**
 * A map of airspace show types to their associated nearest boundary search filter bitflags.
 */
export declare type MapAirspaceShowTypes = Record<any, number>;
/**
 * A module describing the display of airspaces.
 */
export declare class MapAirspaceModule<T extends MapAirspaceShowTypes> {
    readonly showTypes: T;
    /** Whether to show each type of airspace. */
    readonly show: Record<keyof T, Subject<boolean>>;
    /**
     * Constructor.
     * @param showTypes A map of this module's airspace show types to their associated nearest boundary search filter
     * bitflags.
     */
    constructor(showTypes: T);
}
//# sourceMappingURL=MapAirspaceModule.d.ts.map