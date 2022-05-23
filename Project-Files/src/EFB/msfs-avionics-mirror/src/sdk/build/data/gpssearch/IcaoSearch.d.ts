import { FacilityRepository } from '../../navigation/FacilityRepository';
export declare enum IcaoSearchFilter {
    ALL = 0,
    AIRPORT = 1,
    VOR = 2,
    NDB = 3,
    INTERSECTION = 4,
    USR = 5
}
/**
 * An ICAO search session, which allows searching for ICAO strings that match a particular ident string.
 */
export declare class IcaoSearch {
    private readonly facilityRepo;
    private readonly filter;
    private readonly searchGuid;
    private batch;
    private readonly MAX_RETRIES;
    private filterMap;
    private opId;
    /**
     * Constructor.
     * @param facilityRepo The local facility repository included in this search session.
     * @param filter The filter applied to this search session.
     */
    constructor(facilityRepo: FacilityRepository, filter: IcaoSearchFilter);
    /**
     * Executes a new search in this session with a specified ident string to match. Only one active search can run
     * simultaneously. Therefore, if doSearch() is called while a previous search is still running, the newer search will
     * pre-empt the older one, causing the older one to fail.
     * @param ident An ident string.
     * @returns a Promise which is fulfilled with an array of ICAO strings that matched the ident string.
     * @throws Error if the search was pre-empted by a newer one.
     */
    doSearch(ident: string): Promise<string[]>;
    /**
     * Maps the search results to an array of ICAO strings.
     * @param items The search results.
     * @returns an array of ICAO strings.
     */
    private mapResult;
    /**
     * Artificial delay for skipping cycles during search.
     * @param time The time to wait.
     * @returns a Promise which fulfills when the delay expires.
     */
    private delay;
    /**
     * Generates a unique id for search context.
     * @returns A unique ID string.
     */
    private genGuid;
}
//# sourceMappingURL=IcaoSearch.d.ts.map