import { ICAO } from './Facilities';
var FacilityRepositorySyncType;
(function (FacilityRepositorySyncType) {
    FacilityRepositorySyncType[FacilityRepositorySyncType["Add"] = 0] = "Add";
    FacilityRepositorySyncType[FacilityRepositorySyncType["Remove"] = 1] = "Remove";
    FacilityRepositorySyncType[FacilityRepositorySyncType["DumpRequest"] = 2] = "DumpRequest";
    FacilityRepositorySyncType[FacilityRepositorySyncType["DumpResponse"] = 3] = "DumpResponse";
})(FacilityRepositorySyncType || (FacilityRepositorySyncType = {}));
/**
 * A repository of facilities.
 */
export class FacilityRespository {
    /**
     * Constructor.
     * @param bus The event bus.
     */
    constructor(bus) {
        this.bus = bus;
        this.repos = {};
        this.ignoreSync = false;
        bus.getSubscriber().on(FacilityRespository.SYNC_TOPIC).handle(this.onSyncEvent.bind(this));
        this.pubSyncEvent(FacilityRepositorySyncType.DumpRequest);
    }
    /**
     * Retrieves a facility from this repository.
     * @param icao The ICAO of the facility to retrieve.
     * @returns The requested user facility, or undefined if it was not found in this repository.
     */
    get(icao) {
        var _a;
        if (!ICAO.isFacility(icao)) {
            return undefined;
        }
        return (_a = this.repos[ICAO.getFacilityType(icao)]) === null || _a === void 0 ? void 0 : _a.get(icao);
    }
    /**
     * Adds a facility to this repository and all other repositories synced with this one.
     * @param fac The facility to add.
     */
    add(fac) {
        if (!ICAO.isFacility(fac.icao)) {
            return;
        }
        this.addToRepo(fac);
        this.pubSyncEvent(FacilityRepositorySyncType.Add, [fac]);
    }
    /**
     * Removes a facility from this repository and all other repositories synced with this one.
     * @param fac The facility to remove.
     */
    remove(fac) {
        if (!ICAO.isFacility(fac.icao)) {
            return;
        }
        this.removeFromRepo(fac);
        this.pubSyncEvent(FacilityRepositorySyncType.Remove, [fac]);
    }
    /**
     * Iterates over every facility in this respository with a visitor function.
     * @param fn A visitor function.
     * @param types The types of facilities over which to iterate. Defaults to all facility types.
     */
    forEach(fn, types) {
        var _a;
        const keys = types !== null && types !== void 0 ? types : Object.keys(this.repos);
        const len = keys.length;
        for (let i = 0; i < len; i++) {
            (_a = this.repos[keys[i]]) === null || _a === void 0 ? void 0 : _a.forEach(fn);
        }
    }
    /**
     * Adds a facility to this repository.
     * @param fac The facility to add.
     */
    addToRepo(fac) {
        var _a;
        var _b, _c;
        ((_a = (_b = this.repos)[_c = ICAO.getFacilityType(fac.icao)]) !== null && _a !== void 0 ? _a : (_b[_c] = new Map())).set(fac.icao, fac);
    }
    /**
     * Removes a facility from this repository.
     * @param fac The facility to remove.
     */
    removeFromRepo(fac) {
        var _a;
        (_a = this.repos[ICAO.getFacilityType(fac.icao)]) === null || _a === void 0 ? void 0 : _a.delete(fac.icao);
    }
    /**
     * Publishes a sync event over the event bus.
     * @param type The type of sync event.
     * @param facs The event's user facilities.
     */
    pubSyncEvent(type, facs) {
        this.ignoreSync = true;
        this.bus.pub(FacilityRespository.SYNC_TOPIC, { type, facs }, true, false);
        this.ignoreSync = false;
    }
    /**
     * A callback which is called when a sync event occurs.
     * @param data The event data.
     */
    onSyncEvent(data) {
        if (this.ignoreSync) {
            return;
        }
        switch (data.type) {
            case FacilityRepositorySyncType.Add:
            case FacilityRepositorySyncType.DumpResponse:
                data.facs.forEach(fac => this.addToRepo(fac));
                break;
            case FacilityRepositorySyncType.Remove:
                data.facs.forEach(fac => this.removeFromRepo(fac));
                break;
            case FacilityRepositorySyncType.DumpRequest:
                {
                    const facs = [];
                    this.forEach(fac => facs.push(fac));
                    this.pubSyncEvent(FacilityRepositorySyncType.DumpResponse, facs);
                }
                break;
        }
    }
    /**
     * Gets an instance of FacilityRespository.
     * @param bus The event bus.
     * @returns an instance of FacilityRespository.
     */
    static getRepository(bus) {
        var _a;
        return (_a = FacilityRespository.INSTANCE) !== null && _a !== void 0 ? _a : (FacilityRespository.INSTANCE = new FacilityRespository(bus));
    }
}
FacilityRespository.SYNC_TOPIC = 'facilityrepo_sync';
