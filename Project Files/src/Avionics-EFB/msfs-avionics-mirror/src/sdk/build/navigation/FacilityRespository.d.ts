import { EventBus } from '../data/EventBus';
import { Facility, FacilityType } from './Facilities';
/**
 * A repository of facilities.
 */
export declare class FacilityRespository {
    private readonly bus;
    private static readonly SYNC_TOPIC;
    private static INSTANCE;
    private readonly repos;
    private ignoreSync;
    /**
     * Constructor.
     * @param bus The event bus.
     */
    private constructor();
    /**
     * Retrieves a facility from this repository.
     * @param icao The ICAO of the facility to retrieve.
     * @returns The requested user facility, or undefined if it was not found in this repository.
     */
    get(icao: string): Facility | undefined;
    /**
     * Adds a facility to this repository and all other repositories synced with this one.
     * @param fac The facility to add.
     */
    add(fac: Facility): void;
    /**
     * Removes a facility from this repository and all other repositories synced with this one.
     * @param fac The facility to remove.
     */
    remove(fac: Facility): void;
    /**
     * Iterates over every facility in this respository with a visitor function.
     * @param fn A visitor function.
     * @param types The types of facilities over which to iterate. Defaults to all facility types.
     */
    forEach(fn: (fac: Facility) => void, types?: FacilityType[]): void;
    /**
     * Adds a facility to this repository.
     * @param fac The facility to add.
     */
    private addToRepo;
    /**
     * Removes a facility from this repository.
     * @param fac The facility to remove.
     */
    private removeFromRepo;
    /**
     * Publishes a sync event over the event bus.
     * @param type The type of sync event.
     * @param facs The event's user facilities.
     */
    private pubSyncEvent;
    /**
     * A callback which is called when a sync event occurs.
     * @param data The event data.
     */
    private onSyncEvent;
    /**
     * Gets an instance of FacilityRespository.
     * @param bus The event bus.
     * @returns an instance of FacilityRespository.
     */
    static getRepository(bus: EventBus): FacilityRespository;
}
//# sourceMappingURL=FacilityRespository.d.ts.map