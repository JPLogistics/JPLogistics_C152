/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { GeoPoint } from '..';
import { GeoKdTree } from '../utils/datastructures';
import { FacilityType, ICAO } from './Facilities';
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
export class FacilityRepository {
    /**
     * Constructor.
     * @param bus The event bus.
     */
    constructor(bus) {
        this.bus = bus;
        this.repos = {};
        this.trees = {
            [FacilityType.USR]: new GeoKdTree(FacilityRepository.treeKeyFunc)
        };
        this.ignoreSync = false;
        bus.getSubscriber().on(FacilityRepository.SYNC_TOPIC).handle(this.onSyncEvent.bind(this));
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
    // eslint-disable-next-line jsdoc/require-jsdoc
    search(type, lat, lon, radius, arg5, out, filter) {
        if (type !== FacilityType.USR) {
            throw new Error(`FacilityRepository: spatial searches are not supported for facility type ${type}`);
        }
        if (typeof arg5 === 'number') {
            return this.trees[type].search(lat, lon, radius, arg5, out, filter);
        }
        else {
            this.trees[type].search(lat, lon, radius, arg5);
        }
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
        var _b;
        const facilityType = ICAO.getFacilityType(fac.icao);
        ((_a = (_b = this.repos)[facilityType]) !== null && _a !== void 0 ? _a : (_b[facilityType] = new Map())).set(fac.icao, fac);
        if (facilityType !== FacilityType.USR) {
            return;
        }
        this.trees[facilityType].insert(fac);
    }
    /**
     * Removes a facility from this repository.
     * @param fac The facility to remove.
     */
    removeFromRepo(fac) {
        var _a;
        const facilityType = ICAO.getFacilityType(fac.icao);
        (_a = this.repos[ICAO.getFacilityType(fac.icao)]) === null || _a === void 0 ? void 0 : _a.delete(fac.icao);
        if (facilityType !== FacilityType.USR) {
            return;
        }
        this.trees[facilityType].remove(fac);
    }
    /**
     * Publishes a sync event over the event bus.
     * @param type The type of sync event.
     * @param facs The event's user facilities.
     */
    pubSyncEvent(type, facs) {
        this.ignoreSync = true;
        this.bus.pub(FacilityRepository.SYNC_TOPIC, { type, facs }, true, false);
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
     * Gets an instance of FacilityRepository.
     * @param bus The event bus.
     * @returns an instance of FacilityRepository.
     */
    static getRepository(bus) {
        var _a;
        return (_a = FacilityRepository.INSTANCE) !== null && _a !== void 0 ? _a : (FacilityRepository.INSTANCE = new FacilityRepository(bus));
    }
}
FacilityRepository.SYNC_TOPIC = 'facilityrepo_sync';
FacilityRepository.treeKeyFunc = (fac, out) => {
    return GeoPoint.sphericalToCartesian(fac, out);
};
