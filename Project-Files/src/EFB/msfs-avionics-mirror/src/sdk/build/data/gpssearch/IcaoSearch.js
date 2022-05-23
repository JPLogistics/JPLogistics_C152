import { FacilityType, ICAO } from '../../navigation';
export var IcaoSearchFilter;
(function (IcaoSearchFilter) {
    IcaoSearchFilter[IcaoSearchFilter["ALL"] = 0] = "ALL";
    IcaoSearchFilter[IcaoSearchFilter["AIRPORT"] = 1] = "AIRPORT";
    IcaoSearchFilter[IcaoSearchFilter["VOR"] = 2] = "VOR";
    IcaoSearchFilter[IcaoSearchFilter["NDB"] = 3] = "NDB";
    IcaoSearchFilter[IcaoSearchFilter["INTERSECTION"] = 4] = "INTERSECTION";
    IcaoSearchFilter[IcaoSearchFilter["USR"] = 5] = "USR";
})(IcaoSearchFilter || (IcaoSearchFilter = {}));
/**
 * An ICAO search session, which allows searching for ICAO strings that match a particular ident string.
 */
export class IcaoSearch {
    /**
     * Constructor.
     * @param facilityRepo The local facility repository included in this search session.
     * @param filter The filter applied to this search session.
     */
    constructor(facilityRepo, filter) {
        this.facilityRepo = facilityRepo;
        this.filter = filter;
        this.searchGuid = this.genGuid();
        this.MAX_RETRIES = 6;
        this.filterMap = new Map([
            [IcaoSearchFilter.ALL, 'AVNW'],
            [IcaoSearchFilter.AIRPORT, 'A'],
            [IcaoSearchFilter.VOR, 'V'],
            [IcaoSearchFilter.NDB, 'N'],
            [IcaoSearchFilter.INTERSECTION, 'W'],
            [IcaoSearchFilter.USR, '']
        ]);
        this.opId = 0;
        this.batch = new SimVar.SimVarBatch('C:fs9gps:IcaoSearchMatchedIcaosNumber', 'C:fs9gps:IcaoSearchMatchedIcao');
        this.batch.add('C:fs9gps:IcaoSearchCurrentIcao', 'string', 'string');
    }
    /**
     * Executes a new search in this session with a specified ident string to match. Only one active search can run
     * simultaneously. Therefore, if doSearch() is called while a previous search is still running, the newer search will
     * pre-empt the older one, causing the older one to fail.
     * @param ident An ident string.
     * @returns a Promise which is fulfilled with an array of ICAO strings that matched the ident string.
     * @throws Error if the search was pre-empted by a newer one.
     */
    async doSearch(ident) {
        const opId = ++this.opId;
        let icaos;
        if (this.filter !== IcaoSearchFilter.USR) {
            // send search
            await Promise.all([
                SimVar.SetSimVarValue('C:fs9gps:IcaoSearchStartCursor', 'string', this.filterMap.get(this.filter), this.searchGuid),
                SimVar.SetSimVarValue('C:fs9gps:IcaoSearchEnterChar', 'string', ident, this.searchGuid)
            ]);
            if (opId !== this.opId) {
                throw new Error('ICAO search was pre-empted by a newer search');
            }
            let retries = this.MAX_RETRIES;
            // eslint-disable-next-line no-constant-condition
            while (true) {
                await this.delay(20);
                const itemCount = SimVar.GetSimVarValue('C:fs9gps:IcaoSearchMatchedIcaosNumber', 'number', this.searchGuid);
                if (itemCount > 0) {
                    break;
                }
                else {
                    if (retries == 0) {
                        break;
                    }
                    retries--;
                }
            }
            if (opId !== this.opId) {
                throw new Error('ICAO search was pre-empted by a newer search');
            }
            icaos = await new Promise((resolve) => SimVar.GetSimVarArrayValues(this.batch, (items) => {
                if (opId !== this.opId) {
                    throw new Error('ICAO search was pre-empted by a newer search');
                }
                const fs9gpsIcaos = this.mapResult(items);
                SimVar.SetSimVarValue('C:fs9gps:IcaoSearchMatchedIcao', 'number', 0, this.searchGuid);
                resolve(fs9gpsIcaos);
            }, this.searchGuid));
        }
        else {
            icaos = [];
        }
        if (this.filter === IcaoSearchFilter.USR || this.filter === IcaoSearchFilter.ALL) {
            const userIcaos = [];
            this.facilityRepo.forEach(fac => {
                if (ICAO.getIdent(fac.icao).search(ident) === 0) {
                    userIcaos.push(fac.icao);
                }
            }, [FacilityType.USR]);
            icaos.push(...userIcaos);
        }
        if (icaos.length > 1) {
            // remove any auto-complete matches if we have multiple matches
            icaos = icaos.filter(icao => ICAO.getIdent(icao) === ident);
        }
        return icaos;
    }
    /**
     * Maps the search results to an array of ICAO strings.
     * @param items The search results.
     * @returns an array of ICAO strings.
     */
    mapResult(items) {
        return items.map(item => item[0]);
    }
    /**
     * Artificial delay for skipping cycles during search.
     * @param time The time to wait.
     * @returns a Promise which fulfills when the delay expires.
     */
    async delay(time) {
        return new Promise(resolve => setTimeout(() => resolve(), time));
    }
    /**
     * Generates a unique id for search context.
     * @returns A unique ID string.
     */
    genGuid() {
        return 'SRCH-xxxyxxyy'.replace(/[xy]/g, function (c) {
            const r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }
}
