import { ConsumerSubject } from '../data';
import { GeoPoint } from '../geo/GeoPoint';
import { GeoPointSubject } from '../geo/GeoPointSubject';
import { UnitType } from '../math/NumberUnit';
import { NumberUnitSubject } from '../math/NumberUnitSubject';
import { Vec2Math, Vec3Math } from '../math/VecMath';
import { Subject } from '../sub/Subject';
import { BitFlags } from '../math/BitFlags';
/**
 * TCAS operating modes.
 */
export var TCASOperatingMode;
(function (TCASOperatingMode) {
    TCASOperatingMode[TCASOperatingMode["Standby"] = 0] = "Standby";
    TCASOperatingMode[TCASOperatingMode["TAOnly"] = 1] = "TAOnly";
    TCASOperatingMode[TCASOperatingMode["TA_RA"] = 2] = "TA_RA";
})(TCASOperatingMode || (TCASOperatingMode = {}));
/**
 * TCAS alert level.
 */
export var TCASAlertLevel;
(function (TCASAlertLevel) {
    TCASAlertLevel[TCASAlertLevel["None"] = 0] = "None";
    TCASAlertLevel[TCASAlertLevel["ProximityAdvisory"] = 1] = "ProximityAdvisory";
    TCASAlertLevel[TCASAlertLevel["TrafficAdvisory"] = 2] = "TrafficAdvisory";
    TCASAlertLevel[TCASAlertLevel["ResolutionAdvisory"] = 3] = "ResolutionAdvisory";
})(TCASAlertLevel || (TCASAlertLevel = {}));
/**
 * Bit flags describing TCAS resolution advisories.
 */
export var TCASResolutionAdvisoryFlags;
(function (TCASResolutionAdvisoryFlags) {
    /** An initial resolution advisory. */
    TCASResolutionAdvisoryFlags[TCASResolutionAdvisoryFlags["Initial"] = 1] = "Initial";
    /** A corrective resolution advisory. Requires a change in the own airplane's vertical speed. */
    TCASResolutionAdvisoryFlags[TCASResolutionAdvisoryFlags["Corrective"] = 2] = "Corrective";
    /** An upward sense resolution advisory. Commands a vertical speed above a certain value. */
    TCASResolutionAdvisoryFlags[TCASResolutionAdvisoryFlags["UpSense"] = 4] = "UpSense";
    /** A downward sense resolution advisory. Commands a vertical speed below a certain value. */
    TCASResolutionAdvisoryFlags[TCASResolutionAdvisoryFlags["DownSense"] = 8] = "DownSense";
    /** A resolution advisory which crosses an intruder's altitude. */
    TCASResolutionAdvisoryFlags[TCASResolutionAdvisoryFlags["Crossing"] = 16] = "Crossing";
    /** A CLIMB resolution advisory. Commands a positive vertical speed above 1500 FPM. */
    TCASResolutionAdvisoryFlags[TCASResolutionAdvisoryFlags["Climb"] = 32] = "Climb";
    /** A DESCEND resolution advisory. Commands a negative vertical speed below -1500 FPM. */
    TCASResolutionAdvisoryFlags[TCASResolutionAdvisoryFlags["Descend"] = 64] = "Descend";
    /** An INCREASE CLIMB or INCREASE DESCENT resolution advisory. Commands a vertical speed above 2500 FPM or below -2500 FPM. */
    TCASResolutionAdvisoryFlags[TCASResolutionAdvisoryFlags["Increase"] = 128] = "Increase";
    /** A corrective REDUCE CLIMB resolution advisory. Commands a vertical speed of 0 FPM or less. */
    TCASResolutionAdvisoryFlags[TCASResolutionAdvisoryFlags["ReduceClimb"] = 256] = "ReduceClimb";
    /** A corrective REDUCE DESCENT resolution advisory. Commands a vertical speed of 0 FPM or more. */
    TCASResolutionAdvisoryFlags[TCASResolutionAdvisoryFlags["ReduceDescent"] = 512] = "ReduceDescent";
    /** A preventative DO NOT CLIMB resolution advisory. Commands a non-positive vertical speed. */
    TCASResolutionAdvisoryFlags[TCASResolutionAdvisoryFlags["DoNotClimb"] = 1024] = "DoNotClimb";
    /** A preventative DO NOT DESCEND resolution advisory. Commands a non-negative vertical speed. */
    TCASResolutionAdvisoryFlags[TCASResolutionAdvisoryFlags["DoNotDescend"] = 2048] = "DoNotDescend";
})(TCASResolutionAdvisoryFlags || (TCASResolutionAdvisoryFlags = {}));
/**
 * A TCAS-II-like system.
 */
export class TCAS {
    /**
     * Constructor.
     * @param bus The event bus.
     * @param tfcInstrument The traffic instrument which provides traffic contacts for this TCAS.
     * @param maxIntruderCount The maximum number of intruders tracked at any one time by this TCAS.
     * @param realTimeUpdateFreq The maximum update frequency (Hz) in real time.
     * @param simTimeUpdateFreq The maximum update frequency (Hz) in sim time.
     * @param raOptions Options to adjust how resolution advisories are calculated.
     */
    constructor(bus, tfcInstrument, maxIntruderCount, realTimeUpdateFreq, simTimeUpdateFreq, raOptions) {
        var _a, _b, _c, _d, _e, _f, _g, _h;
        this.bus = bus;
        this.tfcInstrument = tfcInstrument;
        this.maxIntruderCount = maxIntruderCount;
        this.realTimeUpdateFreq = realTimeUpdateFreq;
        this.simTimeUpdateFreq = simTimeUpdateFreq;
        this.operatingModeSub = Subject.create(TCASOperatingMode.Standby);
        this.intrudersSorted = [];
        this.intrudersFiltered = [];
        this.intrudersRA = new Set();
        this.contactCreatedHandler = this.onContactAdded.bind(this);
        this.contactRemovedHandler = this.onContactRemoved.bind(this);
        this.ownAirplaneSubs = {
            position: GeoPointSubject.createFromGeoPoint(new GeoPoint(0, 0)),
            altitude: NumberUnitSubject.createFromNumberUnit(UnitType.FOOT.createNumber(0)),
            groundTrack: ConsumerSubject.create(null, 0),
            groundSpeed: NumberUnitSubject.createFromNumberUnit(UnitType.KNOT.createNumber(0)),
            verticalSpeed: NumberUnitSubject.createFromNumberUnit(UnitType.FPM.createNumber(0)),
            radarAltitude: NumberUnitSubject.createFromNumberUnit(UnitType.FOOT.createNumber(0)),
            isOnGround: ConsumerSubject.create(null, false)
        };
        this.simTime = ConsumerSubject.create(null, 0);
        this.lastUpdateSimTime = 0;
        this.lastUpdateRealTime = 0;
        this.alertLevelHandlers = new Map();
        this.eventPublisher = this.bus.getPublisher();
        this.eventSubscriber = this.bus.getSubscriber();
        this.paSeparationCache = {
            horizontal: UnitType.NMILE.createNumber(0),
            vertical: UnitType.FOOT.createNumber(0)
        };
        this.sensitivity = this.createSensitivity();
        this.ownAirplane = new OwnAirplane(this.ownAirplaneSubs);
        const fullRAOptions = {
            initialResponseTime: ((_a = raOptions === null || raOptions === void 0 ? void 0 : raOptions.initialResponseTime) !== null && _a !== void 0 ? _a : TCAS.DEFAULT_RA_OPTIONS.initialResponseTime).copy(),
            initialAcceleration: ((_b = raOptions === null || raOptions === void 0 ? void 0 : raOptions.initialAcceleration) !== null && _b !== void 0 ? _b : TCAS.DEFAULT_RA_OPTIONS.initialAcceleration).copy(),
            subsequentResponseTime: ((_c = raOptions === null || raOptions === void 0 ? void 0 : raOptions.subsequentResponseTime) !== null && _c !== void 0 ? _c : TCAS.DEFAULT_RA_OPTIONS.subsequentResponseTime).copy(),
            subsequentAcceleration: ((_d = raOptions === null || raOptions === void 0 ? void 0 : raOptions.subsequentAcceleration) !== null && _d !== void 0 ? _d : TCAS.DEFAULT_RA_OPTIONS.subsequentAcceleration).copy(),
            allowClimb: (_e = raOptions === null || raOptions === void 0 ? void 0 : raOptions.allowClimb) !== null && _e !== void 0 ? _e : (() => true),
            allowIncreaseClimb: (_f = raOptions === null || raOptions === void 0 ? void 0 : raOptions.allowIncreaseClimb) !== null && _f !== void 0 ? _f : (() => true),
            allowDescend: (_g = raOptions === null || raOptions === void 0 ? void 0 : raOptions.allowDescend) !== null && _g !== void 0 ? _g : (() => this.ownAirplaneSubs.radarAltitude.get().asUnit(UnitType.FOOT) >= 1100),
            allowIncreaseDescent: (_h = raOptions === null || raOptions === void 0 ? void 0 : raOptions.allowIncreaseDescent) !== null && _h !== void 0 ? _h : (() => this.ownAirplaneSubs.radarAltitude.get().asUnit(UnitType.FOOT) >= 1450)
        };
        this.resolutionAdvisory = new TCASResolutionAdvisoryClass(bus, fullRAOptions, this.ownAirplane);
    }
    /**
     * Gets this system's operating mode.
     * @returns This system's operating mode.
     */
    getOperatingMode() {
        return this.operatingModeSub.get();
    }
    /**
     * Sets this system's operating mode.
     * @param mode The new operating mode.
     */
    setOperatingMode(mode) {
        this.operatingModeSub.set(mode);
    }
    /**
     * Gets an array of all currently tracked intruders. The intruders are sorted in order of decreasing threat.
     * @returns an array of all currently tracked intruders.
     */
    getIntruders() {
        return this.intrudersFiltered;
    }
    /**
     * Gets an event bus subscriber for TCAS events.
     * @returns an event bus subscriber for TCAS events..
     */
    getEventSubscriber() {
        return this.eventSubscriber;
    }
    /**
     * Initializes this system.
     */
    init() {
        // init contact listeners
        const sub = this.bus.getSubscriber();
        this.contactCreatedConsumer = sub.on('traffic_contact_added');
        this.contactRemovedConsumer = sub.on('traffic_contact_removed');
        this.contactCreatedConsumer.handle(this.contactCreatedHandler);
        this.contactRemovedConsumer.handle(this.contactRemovedHandler);
        // add all existing contacts
        this.tfcInstrument.forEachContact(contact => { this.onContactAdded(contact.uid); });
        // init own airplane subjects
        sub.on('gps-position').atFrequency(this.realTimeUpdateFreq).handle(lla => { this.ownAirplaneSubs.position.set(lla.lat, lla.long); });
        sub.on('ground_speed').whenChanged().atFrequency(this.realTimeUpdateFreq).handle(gs => { this.ownAirplaneSubs.groundSpeed.set(gs); });
        sub.on('alt').whenChanged().atFrequency(this.realTimeUpdateFreq).handle(alt => { this.ownAirplaneSubs.altitude.set(alt); });
        sub.on('vs').whenChanged().atFrequency(this.realTimeUpdateFreq).handle(vs => { this.ownAirplaneSubs.verticalSpeed.set(vs); });
        sub.on('radio_alt').whenChanged().atFrequency(this.realTimeUpdateFreq).handle(alt => { this.ownAirplaneSubs.radarAltitude.set(alt); });
        this.ownAirplaneSubs.groundTrack.setConsumer(sub.on('track_deg_true'));
        this.ownAirplaneSubs.isOnGround.setConsumer(sub.on('on_ground'));
        // init sim time subject
        this.simTime.setConsumer(sub.on('simTime'));
        // init operating mode notifier
        this.operatingModeSub.sub(mode => { this.bus.pub('tcas_operating_mode', mode, false, true); }, true);
        // init update loop
        sub.on('simTime').whenChanged().handle(this.onSimTimeChanged.bind(this));
    }
    /**
     * Sorts two intruders.
     * @param a The first intruder.
     * @param b The second intruder.
     * @returns A negative number if `a` is to be sorted before `b`, a positive number if `b` is to be sorted before `a`,
     * and zero if the two are equal.
     */
    intruderComparator(a, b) {
        // always sort intruders with valid predictions first
        if (a.isPredictionValid && !b.isPredictionValid) {
            return -1;
        }
        else if (!a.isPredictionValid && b.isPredictionValid) {
            return 1;
        }
        else if (a.isPredictionValid) {
            let tcaPredictionA, tcaPredictionB;
            // Always sort intruders predicted to violate RA protected zone first, then TA protected zone
            if (a.tcaRA.isValid && b.tcaRA.isValid) {
                if (a.tcaRA.tcaNorm <= 1 && b.tcaRA.tcaNorm > 1) {
                    return -1;
                }
                else if (a.tcaRA.tcaNorm > 1 && b.tcaRA.tcaNorm <= 1) {
                    return 1;
                }
                else if (a.tcaRA.tcaNorm <= 1 && b.tcaRA.tcaNorm <= 1) {
                    tcaPredictionA = a.tcaRA;
                    tcaPredictionB = b.tcaRA;
                }
            }
            if (!tcaPredictionA || !tcaPredictionB) {
                if (a.tcaTA.isValid && b.tcaTA.isValid) {
                    if (a.tcaTA.tcaNorm <= 1 && b.tcaTA.tcaNorm > 1) {
                        return -1;
                    }
                    else if (a.tcaTA.tcaNorm > 1 && b.tcaTA.tcaNorm <= 1) {
                        return 1;
                    }
                    else {
                        tcaPredictionA = a.tcaTA;
                        tcaPredictionB = b.tcaTA;
                    }
                }
            }
            if (!tcaPredictionA || !tcaPredictionB) {
                if ((a.tcaRA.isValid || a.tcaTA.isValid) && !b.tcaRA.isValid && !b.tcaTA.isValid) {
                    return -1;
                }
                else if ((b.tcaRA.isValid || b.tcaTA.isValid) && !a.tcaRA.isValid && !a.tcaTA.isValid) {
                    return 1;
                }
                else {
                    return 0;
                }
            }
            // If both are predicted to violate the RA or TA protected zone, sort by TCA.
            // Otherwise sort by how close they approach the TA protected zone at TCA.
            const tcaComparison = tcaPredictionA.tca.compare(tcaPredictionB.tca);
            const normComparison = tcaPredictionA.tcaNorm - tcaPredictionB.tcaNorm;
            let firstComparison;
            let secondComparison;
            if (tcaPredictionA.tcaNorm <= 1) {
                firstComparison = tcaComparison;
                secondComparison = normComparison;
            }
            else {
                firstComparison = normComparison;
                secondComparison = tcaComparison;
            }
            if (firstComparison === 0) {
                return secondComparison;
            }
            else {
                return firstComparison;
            }
        }
        else {
            return 0;
        }
    }
    /**
     * A callback which is called when a new traffic contact is added by this system's traffic instrument.
     * @param uid The ID number of the new contact.
     */
    onContactAdded(uid) {
        const contact = this.tfcInstrument.getContact(uid);
        const intruder = this.createIntruderEntry(contact);
        this.intrudersSorted.push(intruder);
    }
    /**
     * A callback which is called when a traffic contact is removed by this system's traffic instrument.
     * @param uid The ID number of the removed contact.
     */
    onContactRemoved(uid) {
        const sortedIndex = this.intrudersSorted.findIndex(intruder => intruder.contact.uid === uid);
        const culledIndex = this.intrudersFiltered.findIndex(intruder => intruder.contact.uid === uid);
        if (sortedIndex >= 0) {
            this.intrudersSorted.splice(sortedIndex, 1);
        }
        if (culledIndex >= 0) {
            const removed = this.intrudersFiltered[culledIndex];
            this.intrudersFiltered.splice(culledIndex, 1);
            this.cleanUpIntruder(removed);
        }
    }
    /**
     * A callback which is called when the sim time changes.
     * @param simTime The current sim time.
     */
    onSimTimeChanged(simTime) {
        if (this.operatingModeSub.get() === TCASOperatingMode.Standby) {
            return;
        }
        const realTime = Date.now();
        if (Math.abs(simTime - this.lastUpdateSimTime) < 1000 / this.simTimeUpdateFreq
            || Math.abs(realTime - this.lastUpdateRealTime) < 1000 / this.realTimeUpdateFreq) {
            return;
        }
        this.doUpdate(simTime);
        this.lastUpdateSimTime = simTime;
        this.lastUpdateRealTime = realTime;
    }
    /**
     * Executes an update.
     * @param simTime The current sim time, as a UNIX timestamp in milliseconds.
     */
    doUpdate(simTime) {
        this.updateSensitivity();
        this.updateIntruderPredictions(simTime);
        this.updateIntruderArrays();
        this.updateFilteredIntruderAlertLevels(simTime);
        this.updateResolutionAdvisory(simTime);
    }
    /**
     * Updates the TCA predictions for all intruders tracked by this system.
     * @param simTime The current sim time, as a UNIX timestamp in milliseconds.
     */
    updateIntruderPredictions(simTime) {
        this.ownAirplane.update(simTime);
        const len = this.intrudersSorted.length;
        for (let i = 0; i < len; i++) {
            this.intrudersSorted[i].updatePrediction(simTime, this.ownAirplane, this.sensitivity);
        }
    }
    /**
     * Updates the arrays of intruders tracked by this system.
     */
    updateIntruderArrays() {
        this.intrudersSorted.sort(this.intruderComparator.bind(this));
        const oldCulled = this.intrudersFiltered;
        this.intrudersFiltered = [];
        const len = this.intrudersSorted.length;
        for (let i = 0; i < len; i++) {
            const intruder = this.intrudersSorted[i];
            if (i < this.maxIntruderCount && intruder.isPredictionValid) {
                this.intrudersFiltered.push(intruder);
                if (!oldCulled.includes(intruder)) {
                    this.initIntruder(intruder);
                }
            }
            else {
                if (oldCulled.includes(intruder)) {
                    this.cleanUpIntruder(intruder);
                }
            }
        }
    }
    /**
     * Updates the alert levels for all intruders tracked by this system that have not been filtered out.
     * @param simTime The current sim time, as a UNIX timestamp in milliseconds.
     */
    updateFilteredIntruderAlertLevels(simTime) {
        let taCount = 0, raCount = 0;
        const len = this.intrudersFiltered.length;
        for (let i = 0; i < len; i++) {
            const intruder = this.intrudersFiltered[i];
            this.updateIntruderAlertLevel(simTime, intruder);
            switch (intruder.alertLevel.get()) {
                case TCASAlertLevel.TrafficAdvisory:
                    taCount++;
                    break;
                case TCASAlertLevel.ResolutionAdvisory:
                    raCount++;
                    break;
            }
        }
        this.eventPublisher.pub('tcas_ta_intruder_count', taCount, false, true);
        this.eventPublisher.pub('tcas_ra_intruder_count', raCount, false, true);
    }
    /**
     * Updates an intruder's alert level.
     * @param simTime The current sim time, as a UNIX timestamp in milliseconds.
     * @param intruder An intruder.
     */
    updateIntruderAlertLevel(simTime, intruder) {
        const currentAlertLevel = intruder.alertLevel.get();
        if (intruder.tcaRA.isValid && intruder.tcaRA.tcaNorm <= 1) {
            if (this.canIssueResolutionAdvisory(simTime, intruder)) {
                intruder.alertLevel.set(TCASAlertLevel.ResolutionAdvisory);
                return;
            }
            else if (currentAlertLevel === TCASAlertLevel.ResolutionAdvisory && !this.canCancelResolutionAdvisory(simTime, intruder)) {
                return;
            }
        }
        if (currentAlertLevel === TCASAlertLevel.ResolutionAdvisory
            && (!intruder.tcaRA.isValid || intruder.tcaRA.tcaNorm > 1)
            && !this.canCancelResolutionAdvisory(simTime, intruder)) {
            return;
        }
        if (intruder.tcaTA.isValid && intruder.tcaTA.tcaNorm <= 1) {
            if (this.canIssueTrafficAdvisory(simTime, intruder)) {
                intruder.alertLevel.set(TCASAlertLevel.TrafficAdvisory);
                return;
            }
            else if (currentAlertLevel === TCASAlertLevel.TrafficAdvisory && !this.canCancelTrafficAdvisory(simTime, intruder)) {
                return;
            }
        }
        if (currentAlertLevel === TCASAlertLevel.TrafficAdvisory
            && (!intruder.tcaTA.isValid || intruder.tcaTA.tcaNorm > 1)
            && !this.canCancelTrafficAdvisory(simTime, intruder)) {
            return;
        }
        if (intruder.isPredictionValid) {
            const radius = this.sensitivity.parametersPA.protectedRadius.get();
            const height = this.sensitivity.parametersPA.protectedHeight.get();
            if (!radius.isNaN() && !height.isNaN() && this.canIssueProximityAdvisory(simTime, intruder)) {
                const paParameters = this.sensitivity.parametersPA;
                intruder.predictSeparation(simTime, this.paSeparationCache.horizontal, this.paSeparationCache.vertical);
                if (this.paSeparationCache.horizontal.compare(paParameters.protectedRadius.get()) <= 0
                    && this.paSeparationCache.vertical.compare(paParameters.protectedHeight.get()) <= 0) {
                    intruder.alertLevel.set(TCASAlertLevel.ProximityAdvisory);
                    return;
                }
            }
        }
        if (currentAlertLevel === TCASAlertLevel.ProximityAdvisory && !this.canCancelProximityAdvisory(simTime, intruder)) {
            return;
        }
        intruder.alertLevel.set(TCASAlertLevel.None);
    }
    /**
     * Checks whether a resolution advisory can be issued for an intruder.
     * @param simTime The current sim time, as a UNIX timestamp in milliseconds.
     * @param intruder An intruder.
     * @returns Whether a resolution advisory can be issued for the intruder.
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    canIssueResolutionAdvisory(simTime, intruder) {
        return this.operatingModeSub.get() === TCASOperatingMode.TA_RA
            && intruder.tcaRA.isValid
            && intruder.tcaRA.tca.number > 0;
    }
    /**
     * Checks whether a resolution advisory can be canceled for an intruder.
     * @param simTime The current sim time, as a UNIX timestamp in milliseconds.
     * @param intruder An intruder.
     * @returns Whether a resolution advisory can be issued for the intruder.
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    canCancelResolutionAdvisory(simTime, intruder) {
        return true;
    }
    /**
     * Checks whether a traffic advisory can be issued for an intruder.
     * @param simTime The current sim time, as a UNIX timestamp in milliseconds.
     * @param intruder An intruder.
     * @returns Whether a traffic advisory can be issued for the intruder.
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    canIssueTrafficAdvisory(simTime, intruder) {
        return true;
    }
    /**
     * Checks whether a traffic advisory can be canceled for an intruder.
     * @param simTime The current sim time, as a UNIX timestamp in milliseconds.
     * @param intruder An intruder.
     * @returns Whether a traffic advisory can be canceled for the intruder.
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    canCancelTrafficAdvisory(simTime, intruder) {
        return true;
    }
    /**
     * Checks whether a proximity advisory can be issued for an intruder.
     * @param simTime The current sim time, as a UNIX timestamp in milliseconds.
     * @param intruder An intruder.
     * @returns Whether a proximity advisory can be issued for the intruder.
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    canIssueProximityAdvisory(simTime, intruder) {
        return true;
    }
    /**
     * Checks whether a proximity advisory can be canceled for an intruder.
     * @param simTime The current sim time, as a UNIX timestamp in milliseconds.
     * @param intruder An intruder.
     * @returns Whether a proximity advisory can be canceled for the intruder.
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    canCancelProximityAdvisory(simTime, intruder) {
        return true;
    }
    /**
     * Updates this TCAS's resolution advisory.
     * @param simTime The current sim time, as a UNIX timestamp in milliseconds.
     */
    updateResolutionAdvisory(simTime) {
        this.resolutionAdvisory.update(simTime, this.sensitivity.parametersRA.alim.get(), this.intrudersRA);
    }
    /**
     * Executes initialization code when an intruder is added.
     * @param intruder The newly added intruder.
     */
    initIntruder(intruder) {
        const handler = this.onAlertLevelChanged.bind(this, intruder);
        this.alertLevelHandlers.set(intruder, handler);
        intruder.alertLevel.sub(handler);
        this.eventPublisher.pub('tcas_intruder_added', intruder, false, false);
    }
    /**
     * Executes cleanup code when an intruder is removed.
     * @param intruder The intruder that was removed.
     */
    cleanUpIntruder(intruder) {
        if (intruder.alertLevel.get() === TCASAlertLevel.ResolutionAdvisory) {
            this.intrudersRA.delete(intruder);
        }
        const handler = this.alertLevelHandlers.get(intruder);
        handler && intruder.alertLevel.unsub(handler);
        this.eventPublisher.pub('tcas_intruder_removed', intruder, false, false);
    }
    /**
     * A callback which is called when an intruder's alert level changes.
     * @param intruder The intruder whose alert level changed.
     */
    onAlertLevelChanged(intruder) {
        if (intruder.alertLevel.get() === TCASAlertLevel.ResolutionAdvisory) {
            this.intrudersRA.add(intruder);
        }
        else {
            this.intrudersRA.delete(intruder);
        }
        this.eventPublisher.pub('tcas_intruder_alert_changed', intruder, false, false);
    }
}
TCAS.DEFAULT_RA_OPTIONS = {
    initialResponseTime: UnitType.SECOND.createNumber(5),
    initialAcceleration: UnitType.G_ACCEL.createNumber(0.25),
    subsequentResponseTime: UnitType.SECOND.createNumber(2.5),
    subsequentAcceleration: UnitType.G_ACCEL.createNumber(0.35)
};
/**
 * An airplane managed by TCAS.
 */
class TCASAirplane {
    constructor() {
        this._position = new GeoPoint(0, 0);
        /** The position of this airplane at the time of the most recent update. */
        this.position = this._position.readonly;
        /** The altitude of this airplane at the time of the most recent update. */
        this._altitude = UnitType.FOOT.createNumber(0);
        this.altitude = this._altitude.readonly;
        this._groundTrack = 0;
        /** The ground speed of this airplane at the time of the most recent update. */
        this._groundSpeed = UnitType.KNOT.createNumber(0);
        this.groundSpeed = this._groundSpeed.readonly;
        /** The vertical speed of this airplane at the time of the most recent update. */
        this._verticalSpeed = UnitType.FPM.createNumber(0);
        this.verticalSpeed = this._verticalSpeed.readonly;
        /**
         * The 3D position vector of this airplane at the time of the last update. Each component is expressed in units of
         * meters. The coordinate system is an Euclidean approximation of the geodetic space around the own airplane such
         * that the z-coordinate represents orthometric height and the x- and y-coordinates represent an east-
         * counterclockwise equirectangular projection of latitude and longitude, with the origin at the location of the own
         * airplane.
         */
        this.positionVec = new Float64Array(3);
        /**
         * The 3D velocity vector of this airplane at the time of the last update. Each component is expressed in units of
         * meters per second. The coordinate system is defined the same as for position vectors.
         */
        this.velocityVec = new Float64Array(3);
        this.lastUpdateTime = 0;
    }
    // eslint-disable-next-line jsdoc/require-returns
    /** The true ground track of this airplane at the time of the most recent update. */
    get groundTrack() {
        return this._groundTrack;
    }
}
/**
 * The own airplane managed by TCAS.
 */
class OwnAirplane extends TCASAirplane {
    /**
     * Constructor.
     * @param subs Subscribables which provide data related to this airplane.
     */
    constructor(subs) {
        super();
        this.subs = subs;
        /** The radar altitude of this airplane at the time of the most recent update. */
        this._radarAltitude = UnitType.FOOT.createNumber(0);
        this.radarAltitude = this._radarAltitude.readonly;
        this._isOnGround = false;
    }
    // eslint-disable-next-line jsdoc/require-returns
    /** Whether this airplane is on the ground. */
    get isOnGround() {
        return this._isOnGround;
    }
    /**
     * Calculates the predicted 3D position vector of this airplane at a specified time based on the most recent
     * available data. Each component of the vector is expressed in units of meters, and the origin lies at the most
     * recent updated position of this airplane.
     * @param simTime The sim time at which to calculate the position, as a UNIX timestamp in milliseconds.
     * @param out A Float64Array object to which to write the result.
     * @returns The predicted position vector of this airplane at the specified time.
     */
    predictPosition(simTime, out) {
        const dt = (simTime - this.lastUpdateTime) / 1000;
        return Vec3Math.add(this.positionVec, Vec3Math.multScalar(this.velocityVec, dt, out), out);
    }
    /**
     * Updates this airplane's position and velocity data.
     * @param simTime The current sim time, as a UNIX millisecond timestamp.
     */
    update(simTime) {
        this.updateParameters();
        this.updateVectors();
        this.lastUpdateTime = simTime;
    }
    /**
     * Updates this airplane's position, altitude, ground track, ground speed, vertical speed, and whether it is on the ground.
     */
    updateParameters() {
        this._position.set(this.subs.position.get());
        this._altitude.set(this.subs.altitude.get());
        this._groundTrack = this.subs.groundTrack.get();
        this._groundSpeed.set(this.subs.groundSpeed.get());
        this._verticalSpeed.set(this.subs.verticalSpeed.get());
        this._radarAltitude.set(this.subs.radarAltitude.get());
        this._isOnGround = this.subs.isOnGround.get();
    }
    /**
     * Updates this airplane's position and velocity vectors.
     */
    updateVectors() {
        Vec2Math.setFromPolar(this._groundSpeed.asUnit(UnitType.MPS), (90 - this._groundTrack) * Avionics.Utils.DEG2RAD, this.velocityVec);
        const verticalVelocity = this._verticalSpeed.asUnit(UnitType.MPS);
        this.velocityVec[2] = verticalVelocity;
    }
}
/**
 * An abstract implementation of {@link TCASIntruder}.
 */
export class AbstractTCASIntruder extends TCASAirplane {
    /**
     * Constructor.
     * @param contact The traffic contact associated with this intruder.
     */
    constructor(contact) {
        super();
        this.contact = contact;
        this.alertLevel = Subject.create(TCASAlertLevel.None);
        /** The 3D position vector of this intruder relative to own airplane. */
        this.relativePositionVec = new Float64Array(3);
        /** The 3D velocity vector of this intruder relative to own airplane. */
        this.relativeVelocityVec = new Float64Array(3);
        this._isPredictionValid = false;
        /** @inheritdoc */
        this.tcaTA = new TCASTcaPredictionClass(this);
        /** @inheritdoc */
        this.tcaRA = new TCASTcaPredictionClass(this);
    }
    // eslint-disable-next-line jsdoc/require-returns
    /** Whether there is a valid prediction for time of closest approach between this intruder and own airplane. */
    get isPredictionValid() {
        return this._isPredictionValid;
    }
    /** @inheritdoc */
    predictDisplacement(simTime, out) {
        if (!this._isPredictionValid) {
            return Vec3Math.set(NaN, NaN, NaN, out);
        }
        const dt = (simTime - this.contact.lastContactTime) / 1000;
        return Vec3Math.add(this.relativePositionVec, Vec3Math.multScalar(this.relativeVelocityVec, dt, out), out);
    }
    /** @inheritdoc */
    predictSeparation(simTime, horizontalOut, verticalOut) {
        if (!this._isPredictionValid) {
            horizontalOut.set(NaN);
            verticalOut.set(NaN);
            return;
        }
        const displacement = this.predictDisplacement(simTime, AbstractTCASIntruder.vec3Cache[0]);
        AbstractTCASIntruder.displacementToHorizontalSeparation(displacement, horizontalOut);
        AbstractTCASIntruder.displacementToVerticalSeparation(displacement, verticalOut);
    }
    /**
     * Updates this intruder's predicted TCA and related data.
     * @param simTime The current sim time, as a UNIX timestamp in milliseconds.
     * @param ownAirplane Own airplane.
     * @param sensitivity The TCAS sensitivity parameters to use when calculating predictions.
     */
    updatePrediction(simTime, ownAirplane, sensitivity) {
        this.updateParameters(simTime, ownAirplane);
        if (this.isPredictionValid) {
            const taParams = sensitivity.parametersTA;
            const raParams = sensitivity.parametersRA;
            this.tcaTA.update(simTime, taParams.lookaheadTime.get(), taParams.protectedRadius.get(), taParams.protectedHeight.get());
            this.tcaRA.update(simTime, raParams.lookaheadTime.get(), raParams.protectedRadius.get(), raParams.protectedHeight.get());
        }
        else {
            this.invalidatePredictions();
        }
        this.lastUpdateTime = simTime;
    }
    /**
     * Updates this intruder's position and velocity data.
     * @param simTime The current sim time, as a UNIX timestamp in milliseconds.
     * @param ownAirplane The own airplane.
     */
    updateParameters(simTime, ownAirplane) {
        if (isNaN(this.contact.groundTrack) || this.contact.groundSpeed.compare(AbstractTCASIntruder.MIN_GROUND_SPEED) < 0) {
            this._isPredictionValid = false;
            this._position.set(NaN, NaN);
            this._altitude.set(NaN);
            this._groundTrack = NaN;
            this._groundSpeed.set(NaN);
            this._verticalSpeed.set(NaN);
            Vec3Math.set(NaN, NaN, NaN, this.positionVec);
            Vec3Math.set(NaN, NaN, NaN, this.velocityVec);
            Vec3Math.set(NaN, NaN, NaN, this.relativePositionVec);
            Vec3Math.set(NaN, NaN, NaN, this.relativeVelocityVec);
        }
        else {
            this.updatePosition(simTime, ownAirplane);
            this.updateVelocity(ownAirplane);
            this._groundSpeed.set(this.contact.groundSpeed);
            this._verticalSpeed.set(this.contact.verticalSpeed);
            this._isPredictionValid = true;
        }
    }
    /**
     * Updates this intruder's position.
     * @param simTime The current sim time, as a UNIX timestamp in milliseconds.
     * @param ownAirplane The own airplane.
     */
    updatePosition(simTime, ownAirplane) {
        this.contact.predict(simTime, this._position, this._altitude);
        this._groundTrack = this._position.equals(this.contact.lastPosition) ? this.contact.groundTrack : this._position.bearingFrom(this.contact.lastPosition);
        const distance = UnitType.GA_RADIAN.convertTo(this._position.distance(ownAirplane.position), UnitType.METER);
        const bearing = ownAirplane.position.bearingTo(this._position);
        Vec2Math.setFromPolar(distance, (90 - bearing) * Avionics.Utils.DEG2RAD, this.positionVec);
        const verticalPosition = this._altitude.asUnit(UnitType.METER) - ownAirplane.altitude.asUnit(UnitType.METER);
        this.positionVec[2] = verticalPosition;
        Vec3Math.sub(this.positionVec, ownAirplane.positionVec, this.relativePositionVec);
    }
    /**
     * Updates this intruder's velocity.
     * @param ownAirplane The own airplane.
     */
    updateVelocity(ownAirplane) {
        Vec2Math.setFromPolar(this.contact.groundSpeed.asUnit(UnitType.MPS), (90 - this.contact.groundTrack) * Avionics.Utils.DEG2RAD, this.velocityVec);
        const verticalVelocity = this.contact.verticalSpeed.asUnit(UnitType.MPS);
        this.velocityVec[2] = verticalVelocity;
        Vec3Math.sub(this.velocityVec, ownAirplane.velocityVec, this.relativeVelocityVec);
    }
    /**
     * Invalidates this intruder's predicted TCA and related data.
     */
    invalidatePredictions() {
        this.tcaTA.invalidate();
        this.tcaRA.invalidate();
    }
    /**
     * Converts a 3D displacement vector to a horizontal separation distance.
     * @param displacement A displacement vector, in meters.
     * @param out A NumberUnit object to which to write the result.
     * @returns The horizontal separation distance corresponding to the displacement vector.
     */
    static displacementToHorizontalSeparation(displacement, out) {
        return out.set(Math.hypot(displacement[0], displacement[1]), UnitType.METER);
    }
    /**
     * Converts a 3D displacement vector to a vertical separation distance.
     * @param displacement A displacement vector, in meters.
     * @param out A NumberUnit object to which to write the result.
     * @returns The vertical separation distance corresponding to the displacement vector.
     */
    static displacementToVerticalSeparation(displacement, out) {
        return out.set(Math.abs(displacement[2]), UnitType.METER);
    }
}
AbstractTCASIntruder.MIN_GROUND_SPEED = UnitType.KNOT.createNumber(30);
AbstractTCASIntruder.vec3Cache = [new Float64Array(3), new Float64Array(3)];
/**
 * An default implementation of {@link TCASIntruder}.
 */
export class DefaultTCASIntruder extends AbstractTCASIntruder {
}
/**
 * A time-of-closest-approach prediction made by TCAS.
 */
class TCASTcaPredictionClass {
    /**
     * Constructor.
     * @param intruder The intruder associated with this prediction.
     */
    constructor(intruder) {
        this.intruder = intruder;
        this._isValid = false;
        this._time = NaN;
        this._tca = UnitType.SECOND.createNumber(NaN);
        /** @inheritdoc */
        this.tca = this._tca.readonly;
        this._tcaNorm = NaN;
        /** @inheritdoc */
        this.tcaDisplacement = new Float64Array(3);
        this._tcaHorizontalSep = UnitType.NMILE.createNumber(0);
        /** @inheritdoc */
        this.tcaHorizontalSep = this._tcaHorizontalSep.readonly;
        this._tcaVerticalSep = UnitType.FOOT.createNumber(0);
        /** @inheritdoc */
        this.tcaVerticalSep = this._tcaVerticalSep.readonly;
    }
    /** @inheritdoc */
    get isValid() {
        return this._isValid;
    }
    /** @inheritdoc */
    get time() {
        return this._time;
    }
    // eslint-disable-next-line jsdoc/require-returns
    /** @inheritdoc */
    get tcaNorm() {
        return this._tcaNorm;
    }
    /**
     * Updates the time-to-closest-approach (TCA) and related data of this intruder.
     * @param simTime The current sim time, as a UNIX timestamp in milliseconds.
     * @param lookaheadTime The maximum lookahead time.
     * @param protectedRadius The radius of the own airplane's protected zone.
     * @param protectedHeight The half-height of the own airplane's protected zone.
     */
    update(simTime, lookaheadTime, protectedRadius, protectedHeight) {
        this._time = simTime;
        if (lookaheadTime.isNaN() || protectedRadius.isNaN() || protectedHeight.isNaN()) {
            this.invalidate();
            return;
        }
        // Source: Munoz, CA and Narkawicz, AJ. "Time of Closest Approach in Three-Dimensional Airspace." 2010.
        // https://ntrs.nasa.gov/api/citations/20100037766/downloads/20100037766.pdf
        const s = this.intruder.relativePositionVec;
        const v = this.intruder.relativeVelocityVec;
        const sHoriz = Vec2Math.set(s[0], s[1], TCASTcaPredictionClass.vec2Cache[0]);
        const vHoriz = Vec2Math.set(v[0], v[1], TCASTcaPredictionClass.vec2Cache[0]);
        const h = protectedHeight.asUnit(UnitType.METER);
        const r = protectedRadius.asUnit(UnitType.METER);
        const vHorizSquared = Vec2Math.dot(vHoriz, vHoriz);
        const sHorizSquared = Vec2Math.dot(sHoriz, sHoriz);
        const hSquared = h * h;
        const rSquared = r * r;
        const a = (v[2] * v[2]) / hSquared - vHorizSquared / rSquared;
        const b = 2 * s[2] * v[2] / hSquared - 2 * Vec2Math.dot(sHoriz, vHoriz) / rSquared;
        const c = (s[2] * s[2]) / hSquared - sHorizSquared / rSquared;
        const solution = TCASTcaPredictionClass.calculateSolution(0, s, v, r, h, TCASTcaPredictionClass.solutionCache[0]);
        if (vHorizSquared !== 0) {
            const t = -Vec2Math.dot(sHoriz, vHoriz) / vHorizSquared;
            if (t > 0) {
                TCASTcaPredictionClass.evaluateCandidate(t, s, v, r, h, solution, TCASTcaPredictionClass.solutionCache[1]);
            }
        }
        if (v[2] !== 0) {
            const t = -s[2] / v[2];
            if (t > 0) {
                TCASTcaPredictionClass.evaluateCandidate(t, s, v, r, h, solution, TCASTcaPredictionClass.solutionCache[1]);
            }
        }
        const discriminant = b * b - 4 * a * c;
        if (a !== 0 && discriminant >= 0) {
            const sqrt = Math.sqrt(discriminant);
            let t = (-b + sqrt) / (2 * a);
            if (t > 0) {
                TCASTcaPredictionClass.evaluateCandidate(t, s, v, r, h, solution, TCASTcaPredictionClass.solutionCache[1]);
            }
            t = (-b - sqrt) / (2 * a);
            if (t > 0) {
                TCASTcaPredictionClass.evaluateCandidate(t, s, v, r, h, solution, TCASTcaPredictionClass.solutionCache[1]);
            }
        }
        else if (a === 0 && b !== 0) {
            const t = -c / b;
            if (t > 0) {
                TCASTcaPredictionClass.evaluateCandidate(t, s, v, r, h, solution, TCASTcaPredictionClass.solutionCache[1]);
            }
        }
        const lookaheadTimeSeconds = lookaheadTime.asUnit(UnitType.SECOND);
        if (solution.tca > lookaheadTimeSeconds) {
            TCASTcaPredictionClass.calculateSolution(lookaheadTimeSeconds, s, v, r, h, solution);
        }
        this._tca.set(solution.tca);
        this._tcaNorm = solution.norm;
        Vec3Math.copy(solution.displacement, this.tcaDisplacement);
        AbstractTCASIntruder.displacementToHorizontalSeparation(solution.displacement, this._tcaHorizontalSep);
        AbstractTCASIntruder.displacementToVerticalSeparation(solution.displacement, this._tcaVerticalSep);
        this._isValid = true;
    }
    /**
     * Invalidates this intruder's predicted TCA and related data.
     */
    invalidate() {
        this._isValid = false;
        this._tca.set(NaN);
        this._tcaNorm = NaN;
        Vec3Math.set(NaN, NaN, NaN, this.tcaDisplacement);
        this._tcaHorizontalSep.set(NaN);
        this._tcaVerticalSep.set(NaN);
    }
    /**
     * Evaluates a TCA candidate against the best existing solution, and if the candidate produces a smaller cylindrical
     * norm, replaces the best existing solution with the candidate.
     * @param t The candidate TCA time, in seconds.
     * @param s The relative position vector of the intruder, in meters.
     * @param v The relative velocity vector of the intruder, in meters per second.
     * @param r The radius of the own airplane's protected zone, in meters.
     * @param h The half-height of the own airplane's protected zone, in meters.
     * @param best The best existing solution.
     * @param candidate A TcaSolution object to which to temporarily write the candidate solution.
     */
    static evaluateCandidate(t, s, v, r, h, best, candidate) {
        TCASTcaPredictionClass.calculateSolution(t, s, v, r, h, candidate);
        if (candidate.norm < best.norm) {
            TCASTcaPredictionClass.copySolution(candidate, best);
        }
    }
    /**
     * Calculates a TCA solution.
     * @param t The candidate TCA time, in seconds.
     * @param s The relative position vector of the intruder, in meters.
     * @param v The relative velocity vector of the intruder, in meters per second.
     * @param r The radius of the own airplane's protected zone, in meters.
     * @param h The half-height of the own airplane's protected zone, in meters.
     * @param out A TcaSolution object to which to write the result.
     * @returns A TCA solution.
     */
    static calculateSolution(t, s, v, r, h, out) {
        out.tca = t;
        TCASTcaPredictionClass.calculateDisplacementVector(s, v, t, out.displacement);
        out.norm = TCASTcaPredictionClass.calculateCylindricalNorm(out.displacement, r, h);
        return out;
    }
    /**
     * Copies a TCA solution.
     * @param from The solution from which to copy.
     * @param to The solution to which to copy.
     */
    static copySolution(from, to) {
        to.tca = from.tca;
        Vec3Math.copy(from.displacement, to.displacement);
        to.norm = from.norm;
    }
    /**
     * Calculates a time-offset displacement vector given an initial displacement, a velocity vector, and elapsed time.
     * @param initial The initial displacement vector.
     * @param velocity A velocity vector.
     * @param elapsedTime The elapsed time.
     * @param out A Float64Array object to which to write the result.
     * @returns The time-offset displacement vector.
     */
    static calculateDisplacementVector(initial, velocity, elapsedTime, out) {
        return Vec3Math.add(initial, Vec3Math.multScalar(velocity, elapsedTime, out), out);
    }
    /**
     * Calculates a cylindrical norm.
     * @param vector A displacement vector.
     * @param radius The radius of the protected zone.
     * @param halfHeight The half-height of the protected zone.
     * @returns A cylindrical norm.
     */
    static calculateCylindricalNorm(vector, radius, halfHeight) {
        const horizLength = Math.hypot(vector[0], vector[1]);
        return Math.max(Math.abs(vector[2]) / halfHeight, horizLength / radius);
    }
}
TCASTcaPredictionClass.vec2Cache = [new Float64Array(2), new Float64Array(2)];
TCASTcaPredictionClass.solutionCache = [
    {
        tca: 0,
        displacement: new Float64Array(3),
        norm: 0
    },
    {
        tca: 0,
        displacement: new Float64Array(3),
        norm: 0
    }
];
/**
 * A TCAS resolution advisory.
 */
class TCASResolutionAdvisoryClass {
    /**
     * Constructor.
     * @param bus The event bus.
     * @param options Options to adjust how this resolution advisory should be calculated.
     * @param ownAirplane The own airplane of this resolution advisory.
     */
    constructor(bus, options, ownAirplane) {
        this.options = options;
        this.ownAirplane = ownAirplane;
        this.intruders = [];
        this._maxVerticalSpeed = UnitType.FPM.createNumber(NaN);
        /** @inheritdoc */
        this.maxVerticalSpeed = this._maxVerticalSpeed.readonly;
        this._minVerticalSpeed = UnitType.FPM.createNumber(NaN);
        /** @inheritdoc */
        this.minVerticalSpeed = this._minVerticalSpeed.readonly;
        this._flags = 0;
        this.isActive = false;
        this.timeUpdated = 0;
        this.canReverseSense = true;
        this.publisher = bus.getPublisher();
    }
    /** @inheritdoc */
    get flags() {
        return this._flags;
    }
    /**
     * Updates this resolution advisory.
     * @param simTime The current sim time, as a UNIX timestamp in milliseconds.
     * @param alim The required vertical separation between own airplane and intruders.
     * @param intruders The set of active intruders to be tracked by this resolution advisory.
     */
    update(simTime, alim, intruders) {
        if (this.intruders.length === 0 && intruders.size === 0) {
            return;
        }
        if (intruders.size === 0) {
            this.cancel();
        }
        else if (this.intruders.length === 0) {
            this.activate(simTime, alim, intruders);
        }
        else {
            this.updateActive(simTime, alim, intruders);
        }
    }
    /**
     * Activates this resolution advisory.
     * @param simTime The current sim time, as a UNIX timestamp in milliseconds.
     * @param alim The required vertical separation between own airplane and intruders.
     * @param intruders The set of active intruders to be tracked by this resolution advisory.
     */
    activate(simTime, alim, intruders) {
        this.updateIntrudersArray(intruders);
        // TODO: Support multiple intruders
        const intruder = this.intruders[0];
        const t0 = intruder.tcaRA.time;
        const tca = intruder.tcaRA.tca;
        const tcaSeconds = tca.asUnit(UnitType.SECOND);
        const vertDisplMeters = intruder.tcaRA.tcaDisplacement[2];
        const ownAirplaneAltMeters = this.ownAirplane.predictPosition(t0, TCASResolutionAdvisoryClass.vec3Cache[0])[2];
        const ownAirplaneVSMPS = this.ownAirplane.verticalSpeed.asUnit(UnitType.MPS);
        const ownAirplaneAltTcaMeters = this.ownAirplane.predictPosition(t0 + tca.asUnit(UnitType.MILLISECOND), TCASResolutionAdvisoryClass.vec3Cache[0])[2];
        const intruderAltTcaMeters = ownAirplaneAltTcaMeters + vertDisplMeters;
        const alimMeters = alim.asUnit(UnitType.METER);
        const responseTimeSeconds = this.options.initialResponseTime.asUnit(UnitType.SECOND);
        const accel = this.options.initialAcceleration.asUnit(UnitType.MPS_PER_SEC);
        const senseCandidate = this.selectSense(simTime, tcaSeconds, alimMeters, responseTimeSeconds, accel, ownAirplaneAltMeters, ownAirplaneVSMPS, ownAirplaneAltTcaMeters, intruderAltTcaMeters, TCASResolutionAdvisoryClass.senseCandidateCache[0]);
        this.apply(simTime, senseCandidate.sense, senseCandidate.targetVS, ownAirplaneAltMeters, Math.sign(ownAirplaneAltMeters - intruderAltTcaMeters) === -senseCandidate.sense);
        this.publisher.pub('tcas_ra_issued', this, false, false);
    }
    /**
     * Updates this resolution advisory while it is active.
     * @param simTime The current sim time, as a UNIX timestamp in milliseconds.
     * @param alim The required vertical separation between own airplane and intruders.
     * @param intruders The set of active intruders to be tracked by this resolution advisory.
     */
    updateActive(simTime, alim, intruders) {
        this.updateIntrudersArray(intruders);
        // TODO: Support multiple intruders
        const intruder = this.intruders[0];
        const t0 = intruder.tcaRA.time;
        const tca = intruder.tcaRA.tca;
        const tcaSeconds = tca.asUnit(UnitType.SECOND);
        const vertDisplMeters = intruder.tcaRA.tcaDisplacement[2];
        const ownAirplaneAltMeters = this.ownAirplane.predictPosition(t0, TCASResolutionAdvisoryClass.vec3Cache[0])[2];
        const ownAirplaneVSMPS = this.ownAirplane.verticalSpeed.asUnit(UnitType.MPS);
        const ownAirplaneAltTcaMeters = this.ownAirplane.predictPosition(t0 + tca.asUnit(UnitType.MILLISECOND), TCASResolutionAdvisoryClass.vec3Cache[0])[2];
        const intruderAltTcaMeters = ownAirplaneAltTcaMeters + vertDisplMeters;
        const alimMeters = alim.asUnit(UnitType.METER);
        const isInitial = BitFlags.isAll(this._flags, TCASResolutionAdvisoryFlags.Initial);
        const responseTimeSeconds = (isInitial ? this.options.initialResponseTime : this.options.subsequentResponseTime).asUnit(UnitType.SECOND);
        const accel = (isInitial ? this.options.initialAcceleration : this.options.subsequentAcceleration).asUnit(UnitType.MPS_PER_SEC);
        const minAlimMeters = intruderAltTcaMeters - alimMeters;
        const maxAlimMeters = intruderAltTcaMeters + alimMeters;
        const minAlimSense = Math.sign(minAlimMeters - ownAirplaneAltTcaMeters);
        const maxAlimSense = Math.sign(maxAlimMeters - ownAirplaneAltTcaMeters);
        const minDescendVSMPS = -TCASResolutionAdvisoryClass.CLIMB_DESC_VS_MPS;
        const maxClimbVSMPS = TCASResolutionAdvisoryClass.CLIMB_DESC_VS_MPS;
        const minIncDescendVSMPS = -TCASResolutionAdvisoryClass.INC_CLIMB_DESC_VS_MPS;
        const maxIncClimbVSMPS = TCASResolutionAdvisoryClass.INC_CLIMB_DESC_VS_MPS;
        const maxDownVslVSMPS = TCASResolutionAdvisoryClass.VSL_MAX_VS_MPS;
        const minUpVslVSMPS = -TCASResolutionAdvisoryClass.VSL_MAX_VS_MPS;
        const sense = this._maxVerticalSpeed.isNaN() ? 1 : -1;
        const isCrossing = Math.sign(ownAirplaneAltMeters - intruderAltTcaMeters) === -sense;
        let requiredVSMPS = NaN;
        let needCheckSenseReversal = false;
        let allowClimb, allowIncreaseClimb;
        let allowDescend, allowIncreaseDescent;
        if (sense === 1) {
            // upward sense
            const currentVSTargetMPS = this._minVerticalSpeed.asUnit(UnitType.MPS);
            const maxVS = currentVSTargetMPS > 0 ? maxIncClimbVSMPS : maxClimbVSMPS;
            if (maxAlimSense === 1) {
                requiredVSMPS = TCASResolutionAdvisoryClass.calculateVSToTargetAlt(tcaSeconds, ownAirplaneAltMeters, ownAirplaneVSMPS, Math.max(responseTimeSeconds - (simTime - this.timeUpdated) / 1000, 0), accel, maxAlimMeters);
                needCheckSenseReversal = isNaN(requiredVSMPS);
            }
            else {
                requiredVSMPS = (maxAlimMeters - ownAirplaneAltMeters) / tcaSeconds;
            }
            if (!isNaN(requiredVSMPS)) {
                if (requiredVSMPS > 0) {
                    if (requiredVSMPS > maxVS) {
                        needCheckSenseReversal = true;
                    }
                    else if (requiredVSMPS <= maxClimbVSMPS) {
                        requiredVSMPS = maxClimbVSMPS;
                    }
                    else {
                        requiredVSMPS = maxIncClimbVSMPS;
                    }
                }
                else {
                    requiredVSMPS = Math.ceil(Math.max(requiredVSMPS, minUpVslVSMPS) / TCASResolutionAdvisoryClass.VSL_VS_STEP_MPS) * TCASResolutionAdvisoryClass.VSL_VS_STEP_MPS;
                }
                if (!needCheckSenseReversal) {
                    // Check if we need to strengthen the RA
                    if (requiredVSMPS > currentVSTargetMPS + 1e-7) {
                        if (requiredVSMPS <= 0
                            || (requiredVSMPS === maxClimbVSMPS && (allowClimb !== null && allowClimb !== void 0 ? allowClimb : (allowClimb = this.options.allowClimb(simTime))))
                            || (requiredVSMPS === maxIncClimbVSMPS && (allowIncreaseClimb !== null && allowIncreaseClimb !== void 0 ? allowIncreaseClimb : (allowIncreaseClimb = this.options.allowIncreaseClimb(simTime))))) {
                            this.apply(simTime, 1, requiredVSMPS, ownAirplaneVSMPS, isCrossing);
                            this.publisher.pub('tcas_ra_updated', this, false, false);
                            return;
                        }
                        else {
                            needCheckSenseReversal = true;
                        }
                    }
                    // Check if we can weaken the RA (vertical speed limit RAs can never be weakened)
                    if (currentVSTargetMPS > 0 && requiredVSMPS < currentVSTargetMPS - 1e-7) {
                        this.apply(simTime, 1, requiredVSMPS, ownAirplaneVSMPS, isCrossing);
                        this.publisher.pub('tcas_ra_updated', this, false, false);
                        return;
                    }
                }
            }
        }
        else {
            // downward sense
            const currentVSTargetMPS = this._maxVerticalSpeed.asUnit(UnitType.MPS);
            const minVS = currentVSTargetMPS < 0 ? minIncDescendVSMPS : minDescendVSMPS;
            if (minAlimSense === -1) {
                requiredVSMPS = TCASResolutionAdvisoryClass.calculateVSToTargetAlt(tcaSeconds, ownAirplaneAltMeters, ownAirplaneVSMPS, Math.max(responseTimeSeconds - (simTime - this.timeUpdated) / 1000, 0), accel, minAlimMeters);
                needCheckSenseReversal = isNaN(requiredVSMPS);
            }
            else {
                requiredVSMPS = (minAlimMeters - ownAirplaneAltMeters) / tcaSeconds;
            }
            if (!isNaN(requiredVSMPS)) {
                if (requiredVSMPS < 0) {
                    if (requiredVSMPS < minVS) {
                        needCheckSenseReversal = true;
                    }
                    else if (requiredVSMPS >= minDescendVSMPS) {
                        requiredVSMPS = minDescendVSMPS;
                    }
                    else {
                        requiredVSMPS = minIncDescendVSMPS;
                    }
                }
                else {
                    requiredVSMPS = Math.floor(Math.min(requiredVSMPS, maxDownVslVSMPS) / TCASResolutionAdvisoryClass.VSL_VS_STEP_MPS) * TCASResolutionAdvisoryClass.VSL_VS_STEP_MPS;
                }
                if (!needCheckSenseReversal) {
                    // Check if we need to strengthen the RA
                    if (requiredVSMPS < currentVSTargetMPS - 1e-7) {
                        if (requiredVSMPS >= 0
                            || (requiredVSMPS === minDescendVSMPS && (allowDescend !== null && allowDescend !== void 0 ? allowDescend : (allowDescend = this.options.allowDescend(simTime))))
                            || (requiredVSMPS === minIncDescendVSMPS && (allowIncreaseDescent !== null && allowIncreaseDescent !== void 0 ? allowIncreaseDescent : (allowIncreaseDescent = this.options.allowIncreaseDescent(simTime))))) {
                            this.apply(simTime, -1, requiredVSMPS, ownAirplaneVSMPS, isCrossing);
                            this.publisher.pub('tcas_ra_updated', this, false, false);
                            return;
                        }
                        else {
                            needCheckSenseReversal = true;
                        }
                    }
                    // Check if we can weaken the RA (vertical speed limit RAs can never be weakened)
                    if (currentVSTargetMPS < 0 && requiredVSMPS > currentVSTargetMPS + 1e-7) {
                        this.apply(simTime, -1, requiredVSMPS, ownAirplaneVSMPS, isCrossing);
                        this.publisher.pub('tcas_ra_updated', this, false, false);
                        return;
                    }
                }
            }
        }
        if (needCheckSenseReversal) {
            if (this.canReverseSense) {
                const senseCandidate = this.selectSense(simTime, tcaSeconds, alimMeters, this.options.subsequentResponseTime.asUnit(UnitType.SECOND), this.options.subsequentAcceleration.asUnit(UnitType.MPS_PER_SEC), ownAirplaneAltMeters, ownAirplaneVSMPS, ownAirplaneAltTcaMeters, intruderAltTcaMeters, TCASResolutionAdvisoryClass.senseCandidateCache[0]);
                // Only reverse sense if doing so will achieve ALIM vertical separation at TCA, otherwise command the vertical
                // speed target limit for the current sense
                if (senseCandidate.sense !== sense && senseCandidate.doesReachTargetAlt) {
                    this.canReverseSense = false;
                    this.apply(simTime, senseCandidate.sense, senseCandidate.targetVS, ownAirplaneVSMPS, !isCrossing);
                    this.publisher.pub('tcas_ra_updated', this, false, false);
                    return;
                }
            }
            if (sense === 1) {
                const currentVSTargetMPS = this._minVerticalSpeed.asUnit(UnitType.MPS);
                const maxVS = currentVSTargetMPS > 0 ? maxIncClimbVSMPS : maxClimbVSMPS;
                if ((isNaN(requiredVSMPS) || requiredVSMPS > maxVS)
                    && maxVS > currentVSTargetMPS + 1e-7
                    && ((maxVS === maxClimbVSMPS && (allowClimb !== null && allowClimb !== void 0 ? allowClimb : (allowClimb = this.options.allowClimb(simTime))))
                        || (maxVS === maxIncClimbVSMPS && (allowIncreaseClimb !== null && allowIncreaseClimb !== void 0 ? allowIncreaseClimb : (allowIncreaseClimb = this.options.allowIncreaseClimb(simTime)))))) {
                    this.apply(simTime, 1, maxVS, ownAirplaneVSMPS, isCrossing);
                    this.publisher.pub('tcas_ra_updated', this, false, false);
                }
            }
            else {
                const currentVSTargetMPS = this._maxVerticalSpeed.asUnit(UnitType.MPS);
                const minVS = currentVSTargetMPS < 0 ? minIncDescendVSMPS : minDescendVSMPS;
                if ((isNaN(requiredVSMPS) || requiredVSMPS < minVS)
                    && minVS < currentVSTargetMPS - 1e-7
                    && ((minVS === minDescendVSMPS && (allowDescend !== null && allowDescend !== void 0 ? allowDescend : (allowDescend = this.options.allowDescend(simTime))))
                        || (minVS === minIncDescendVSMPS && (allowIncreaseDescent !== null && allowIncreaseDescent !== void 0 ? allowIncreaseDescent : (allowIncreaseDescent = this.options.allowIncreaseDescent(simTime)))))) {
                    this.apply(simTime, -1, minVS, ownAirplaneVSMPS, isCrossing);
                    this.publisher.pub('tcas_ra_updated', this, false, false);
                }
            }
        }
        // Check if we need to convert a CLIMB/DESCEND RA to a DO NOT DESCEND/DO NOT CLIMB RA.
        if (sense === 1 && this._minVerticalSpeed.number > 0 && !(allowClimb !== null && allowClimb !== void 0 ? allowClimb : (allowClimb = this.options.allowClimb(simTime)))) {
            this.apply(simTime, 1, 0, ownAirplaneVSMPS, isCrossing);
            this.publisher.pub('tcas_ra_updated', this, false, false);
            return;
        }
        else if (sense === -1 && this._maxVerticalSpeed.number < 0 && !(allowDescend !== null && allowDescend !== void 0 ? allowDescend : (allowDescend = this.options.allowDescend(simTime)))) {
            this.apply(simTime, -1, 0, ownAirplaneVSMPS, isCrossing);
            this.publisher.pub('tcas_ra_updated', this, false, false);
            return;
        }
        // Update corrective and crossing flags
        const isCorrective = (!this._minVerticalSpeed.isNaN() && this._minVerticalSpeed.compare(ownAirplaneVSMPS, UnitType.MPS) > 0)
            || (!this._maxVerticalSpeed.isNaN() && this._maxVerticalSpeed.compare(ownAirplaneVSMPS, UnitType.MPS) < 0);
        if (BitFlags.isAll(this._flags, TCASResolutionAdvisoryFlags.Corrective) !== isCorrective
            || BitFlags.isAll(this._flags, TCASResolutionAdvisoryFlags.Crossing) !== isCrossing) {
            this._flags &= ~(TCASResolutionAdvisoryFlags.Corrective | TCASResolutionAdvisoryFlags.Crossing);
            this._flags |= ((isCorrective ? TCASResolutionAdvisoryFlags.Corrective : 0)
                | (isCrossing ? TCASResolutionAdvisoryFlags.Crossing : 0));
            this.publisher.pub('tcas_ra_updated', this, false, false);
        }
    }
    /**
     * Updates this resolution advisory's array of active intruders.
     * @param intruders The set of active intruders to be tracked by this resolution advisory.
     */
    updateIntrudersArray(intruders) {
        this.intruders.length = 0;
        for (const intruder of intruders) {
            this.intruders.push(intruder);
        }
        this.intruders.sort(TCASResolutionAdvisoryClass.INTRUDER_SORT_FUNC);
    }
    /**
     * Applies a vertical speed target to this resolution advisory.
     * @param simTime The current sim time, as a UNIX timestamp in milliseconds.
     * @param sense The sense of the vertical speed target.
     * @param targetVS The vertical speed target, in meters per second.
     * @param ownAirplaneVS The current vertical speed of the own airplane, in meters per second.
     * @param isCrossing Whether the applied sense crosses an intruder's altitude.
     */
    apply(simTime, sense, targetVS, ownAirplaneVS, isCrossing) {
        let isCorrective;
        if (sense === 1) {
            isCorrective = ownAirplaneVS < targetVS;
            if (isCorrective && targetVS < 0) {
                // This is a corrective vertical speed limit RA -> change to level off RA
                targetVS = 0;
            }
            this._minVerticalSpeed.set(targetVS, UnitType.MPS);
            this._maxVerticalSpeed.set(NaN);
        }
        else {
            isCorrective = ownAirplaneVS > targetVS;
            if (isCorrective && targetVS > 0) {
                // This is a corrective vertical speed limit RA -> change to level off RA
                targetVS = 0;
            }
            this._minVerticalSpeed.set(NaN);
            this._maxVerticalSpeed.set(targetVS, UnitType.MPS);
        }
        // Resolve flags
        this._flags = ((isCorrective ? TCASResolutionAdvisoryFlags.Corrective : 0)
            | (this.isActive ? 0 : TCASResolutionAdvisoryFlags.Initial)
            | (sense === 1
                ? (TCASResolutionAdvisoryFlags.UpSense
                    | (targetVS > 0
                        ? TCASResolutionAdvisoryFlags.Climb
                        : (isCorrective ? TCASResolutionAdvisoryFlags.ReduceDescent : TCASResolutionAdvisoryFlags.DoNotDescend)))
                : (TCASResolutionAdvisoryFlags.DownSense
                    | (targetVS < 0
                        ? TCASResolutionAdvisoryFlags.Descend
                        : (isCorrective ? TCASResolutionAdvisoryFlags.ReduceClimb : TCASResolutionAdvisoryFlags.DoNotClimb))))
            | (targetVS * sense >= TCASResolutionAdvisoryClass.INC_CLIMB_DESC_VS_MPS - 1e-7 ? TCASResolutionAdvisoryFlags.Increase : 0)
            | (isCrossing ? TCASResolutionAdvisoryFlags.Crossing : 0));
        this.isActive = true;
        this.timeUpdated = simTime;
    }
    /**
     * Cancels this resolution advisory.
     */
    cancel() {
        this.intruders.length = 0;
        this._maxVerticalSpeed.set(NaN);
        this._minVerticalSpeed.set(NaN);
        this._flags = 0;
        this.isActive = false;
        this.canReverseSense = true;
        this.publisher.pub('tcas_ra_canceled', undefined, false, false);
    }
    /**
     * Selects the best sense and vertical speed target for a resolution advisory. If the non-crossing sense is able to
     * achieve the target vertical separation, it will be selected. Otherwise, the sense that achieves the greatest
     * vertical separation at time of closest approach will be selected.
     * @param simTime The current sim time, as a UNIX timestamp in milliseconds.
     * @param tca The time to closest approach, in seconds.
     * @param alim The minimum target vertical separation, in meters, between the own airplane and intruders at the time
     * of closest approach.
     * @param responseTime The response time of the own airplane, in seconds.
     * @param accel The acceleration of the own airplane, in meters per second squared.
     * @param ownAirplaneAlt The current altitude of the own airplane, in meters.
     * @param ownAirplaneVS The current vertical speed of the own airplane, in meters per second.
     * @param ownAirplaneAltTca The predicted altitude of the own airplane at the time of closest approach, in meters.
     * @param intruderAltTca The predicted altitude of the intruder at the time of closest approach, in meters.
     * @param out The object to which to write the results.
     * @returns Information on the selected sense and vertical speed target.
     */
    selectSense(simTime, tca, alim, responseTime, accel, ownAirplaneAlt, ownAirplaneVS, ownAirplaneAltTca, intruderAltTca, out) {
        let sense;
        let targetVS;
        let doesReachTargetAlt = true;
        const minDescendVS = -TCASResolutionAdvisoryClass.CLIMB_DESC_VS_MPS;
        const maxClimbVS = TCASResolutionAdvisoryClass.CLIMB_DESC_VS_MPS;
        const maxDownVslVS = TCASResolutionAdvisoryClass.VSL_MAX_VS_MPS;
        const minUpVslVS = -TCASResolutionAdvisoryClass.VSL_MAX_VS_MPS;
        const minAlim = intruderAltTca - alim;
        const maxAlim = intruderAltTca + alim;
        const minAlimSense = Math.sign(minAlim - ownAirplaneAltTca);
        const maxAlimSense = Math.sign(maxAlim - ownAirplaneAltTca);
        // We need to model both senses to select the best one
        let downVS, upVS;
        if (minAlimSense === -1) {
            // Own airplane needs to adjust vertical speed in the negative direction in order to pass below the intruder with
            // ALIM vertical separation at TCA
            downVS = responseTime < tca
                ? TCASResolutionAdvisoryClass.calculateVSToTargetAlt(tca, ownAirplaneAlt, ownAirplaneVS, responseTime, accel, minAlim)
                : NaN;
        }
        else {
            // Own airplane is already on track to pass below the intruder with ALIM vertical separation at TCA.
            downVS = (minAlim - ownAirplaneAlt) / tca;
        }
        if (maxAlimSense === 1) {
            // Own airplane needs to adjust vertical speed in the positive direction in order to pass above the intruder with
            // ALIM vertical separation at TCA
            upVS = responseTime < tca
                ? TCASResolutionAdvisoryClass.calculateVSToTargetAlt(tca, ownAirplaneAlt, ownAirplaneVS, responseTime, accel, maxAlim)
                : NaN;
        }
        else {
            // Own airplane is already on track to pass above the intruder with ALIM vertical separation at TCA.
            upVS = (maxAlim - ownAirplaneAlt) / tca;
        }
        if (!isNaN(downVS)) {
            if (downVS < minDescendVS) {
                downVS = NaN;
            }
            else if (downVS > maxDownVslVS) {
                downVS = maxDownVslVS;
            }
        }
        if (!isNaN(upVS)) {
            if (upVS < maxClimbVS) {
                upVS = NaN;
            }
            else if (upVS < minUpVslVS) {
                upVS = minUpVslVS;
            }
        }
        let canChooseDownSense = !isNaN(downVS) && (downVS >= 0 || this.options.allowDescend(simTime));
        let canChooseUpSense = !isNaN(upVS) && (upVS <= 0 || this.options.allowClimb(simTime));
        // Select the non-crossing sense if it achieves ALIM vertical separation.
        // If both senses are non-crossing, select the one that gives the greatest vertical separation with the least change in VS.
        // Otherwise, select the sense that achieves ALIM vertical separation.
        const nonCrossingSense = Math.sign(ownAirplaneAlt - intruderAltTca);
        const nonCrossingSenseVS = nonCrossingSense === 0 ? NaN : nonCrossingSense === 1 ? upVS : downVS;
        const canChooseNonCrossingSense = nonCrossingSense !== 0 && (nonCrossingSense === 1 ? canChooseUpSense : canChooseDownSense);
        if (canChooseNonCrossingSense) {
            sense = nonCrossingSense;
            targetVS = nonCrossingSenseVS;
        }
        else {
            if (canChooseUpSense && !canChooseDownSense) {
                sense = 1;
                targetVS = upVS;
            }
            else if (!canChooseUpSense && canChooseDownSense) {
                sense = -1;
                targetVS = downVS;
            }
            else if (canChooseUpSense && canChooseDownSense) {
                if (Math.abs(upVS - ownAirplaneVS) < Math.abs(downVS - ownAirplaneVS)) {
                    sense = 1;
                    targetVS = upVS;
                }
                else {
                    sense = -1;
                    targetVS = downVS;
                }
            }
            else if (!isNaN(downVS) || !isNaN(upVS)) {
                // At least one of the upward or downward sense RAs is viable, but is inhibited -> select the
                // sense that is viable (or the one that gives the greatest vertical separation if both are viable)
                // and set the target vertical speed to 0 to avoid a CLIMB or DESCEND RA.
                if (isNaN(downVS)) {
                    sense = 1;
                }
                else if (isNaN(upVS)) {
                    sense = -1;
                }
                else {
                    if (Math.abs(upVS - ownAirplaneVS) < Math.abs(downVS - ownAirplaneVS)) {
                        sense = 1;
                    }
                    else {
                        sense = -1;
                    }
                }
                targetVS = 0;
                doesReachTargetAlt = false;
            }
        }
        if (sense === undefined) {
            // If sense has not been selected yet, it means neither sense achieves ALIM vertical separation, so we will
            // simply choose the sense that gives the greatest potential vertical separation.
            const requiredDownVS = (minAlim - ownAirplaneAlt) / tca;
            const requiredUpVS = (maxAlim - ownAirplaneAlt) / tca;
            downVS = Utils.Clamp(requiredDownVS, minDescendVS, maxDownVslVS);
            upVS = Utils.Clamp(requiredUpVS, minUpVslVS, maxClimbVS);
            canChooseDownSense = downVS >= 0 || this.options.allowDescend(simTime);
            canChooseUpSense = upVS <= 0 || this.options.allowClimb(simTime);
            if (canChooseUpSense && (!canChooseDownSense || Math.abs(requiredUpVS - ownAirplaneVS) < Math.abs(requiredDownVS - ownAirplaneVS))) {
                sense = 1;
                targetVS = upVS;
            }
            else if (canChooseDownSense) {
                sense = -1;
                targetVS = downVS;
            }
            else {
                // Both senses are inhibited -> we will set the target vertical speed to 0 and choose the non-crossing sense
                if (ownAirplaneAlt > intruderAltTca) {
                    sense = 1;
                }
                else {
                    sense = -1;
                }
                targetVS = 0;
            }
            doesReachTargetAlt = false;
        }
        if (targetVS !== undefined) {
            if (sense === 1) {
                if (targetVS < 0) {
                    targetVS = Math.ceil(targetVS / TCASResolutionAdvisoryClass.VSL_VS_STEP_MPS) * TCASResolutionAdvisoryClass.VSL_VS_STEP_MPS;
                }
                else if (targetVS > 0) {
                    targetVS = maxClimbVS;
                }
            }
            else {
                if (targetVS > 0) {
                    targetVS = Math.floor(targetVS / TCASResolutionAdvisoryClass.VSL_VS_STEP_MPS) * TCASResolutionAdvisoryClass.VSL_VS_STEP_MPS;
                }
                else if (targetVS < 0) {
                    targetVS = minDescendVS;
                }
            }
        }
        out.sense = sense;
        out.targetAltTca = sense === 1 ? maxAlim : minAlim;
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        out.targetVS = targetVS;
        out.doesReachTargetAlt = doesReachTargetAlt;
        return out;
    }
    /**
     * Calculates the vertical speed required to achieve a desired altitude target at time of closest approach.
     * @param tca The time to closest approach from the present, in seconds.
     * @param currentAlt The current altitude of the own airplane, in meters.
     * @param vs The current vertical speed of the own airplane, in meters per second.
     * @param responseTime The response time of the own airplane, in seconds.
     * @param accel The acceleration of the own airplane, in meters per second squared.
     * @param targetAlt The target altitude of the own airplane at time of closest approach, in meters.
     * @returns The vertical speed, in meters per second, required to achieve a desired altitude target at time of
     * closest approach. A value of `NaN` indicates the altitude target cannot be reached with the specified parameters.
     */
    static calculateVSToTargetAlt(tca, currentAlt, vs, responseTime, accel, targetAlt) {
        const signedAccel = accel * Math.sign(targetAlt - (currentAlt + vs * tca));
        if (signedAccel === 0) {
            return vs;
        }
        const y0 = currentAlt + vs * responseTime;
        const tc = tca - responseTime;
        const a = signedAccel / 2;
        const b = -signedAccel * tc;
        const c = targetAlt - y0 - vs * tc;
        const discriminant = b * b - 4 * a * c;
        if (discriminant < 0) {
            return NaN;
        }
        const sqrtDiscr = Math.sqrt(discriminant);
        const t1 = (-b + sqrtDiscr) / (2 * a);
        const t2 = (-b - sqrtDiscr) / (2 * a);
        if (t1 <= tc && t1 >= 0) {
            return vs + signedAccel * t1;
        }
        if (t2 <= tc && t2 >= 0) {
            return vs + signedAccel * t2;
        }
        return NaN;
    }
}
TCASResolutionAdvisoryClass.CLIMB_DESC_VS_MPS = UnitType.FPM.convertTo(1500, UnitType.MPS);
TCASResolutionAdvisoryClass.INC_CLIMB_DESC_VS_MPS = UnitType.FPM.convertTo(2500, UnitType.MPS);
TCASResolutionAdvisoryClass.VSL_MAX_VS_MPS = UnitType.FPM.convertTo(2000, UnitType.MPS);
TCASResolutionAdvisoryClass.VSL_VS_STEP_MPS = UnitType.FPM.convertTo(500, UnitType.MPS);
TCASResolutionAdvisoryClass.INTRUDER_SORT_FUNC = (a, b) => {
    if (a.tcaRA.tca < b.tcaRA.tca) {
        return -1;
    }
    else if (a.tcaRA.tca > b.tcaRA.tca) {
        return 1;
    }
    else if (a.tcaRA.tcaNorm < b.tcaRA.tcaNorm) {
        return -1;
    }
    else if (a.tcaRA.tcaNorm > b.tcaRA.tcaNorm) {
        return 1;
    }
    else {
        return 0;
    }
};
TCASResolutionAdvisoryClass.vec3Cache = [new Float64Array(3)];
TCASResolutionAdvisoryClass.senseCandidateCache = [{ sense: -1, targetAltTca: 0, targetVS: 0, doesReachTargetAlt: false }];
/**
 * An abstract implementation of {@link TCASSensitivity}.
 */
export class AbstractTCASSensitivity {
    constructor() {
        this.parametersPA = {
            protectedRadius: NumberUnitSubject.createFromNumberUnit(UnitType.NMILE.createNumber(NaN)),
            protectedHeight: NumberUnitSubject.createFromNumberUnit(UnitType.FOOT.createNumber(NaN))
        };
        this.parametersTA = {
            lookaheadTime: NumberUnitSubject.createFromNumberUnit(UnitType.SECOND.createNumber(NaN)),
            protectedRadius: NumberUnitSubject.createFromNumberUnit(UnitType.NMILE.createNumber(NaN)),
            protectedHeight: NumberUnitSubject.createFromNumberUnit(UnitType.FOOT.createNumber(NaN))
        };
        this.parametersRA = {
            lookaheadTime: NumberUnitSubject.createFromNumberUnit(UnitType.SECOND.createNumber(NaN)),
            protectedRadius: NumberUnitSubject.createFromNumberUnit(UnitType.NMILE.createNumber(NaN)),
            protectedHeight: NumberUnitSubject.createFromNumberUnit(UnitType.FOOT.createNumber(NaN)),
            alim: NumberUnitSubject.createFromNumberUnit(UnitType.FOOT.createNumber(NaN)),
        };
    }
}
/**
 * TCAS sensitivity settings which update based on the altitude of the own airplane to standard values defined in the
 * TCAS II specification.
 */
export class DefaultTCASSensitivity extends AbstractTCASSensitivity {
    /** @inheritdoc */
    constructor() {
        super();
        this.parametersPA.protectedRadius.set(6, UnitType.NMILE);
        this.parametersPA.protectedHeight.set(1200, UnitType.FOOT);
    }
    /**
     * Updates the sensitivity level.
     * @param altitude The indicated altitude of the own airplane.
     * @param radarAltitude The radar altitude of the own airplane.
     */
    update(altitude, radarAltitude) {
        const altFeet = altitude.asUnit(UnitType.FOOT);
        const radarAltFeet = radarAltitude.asUnit(UnitType.FOOT);
        let level;
        if (radarAltFeet > 2350) {
            if (altFeet > 42000) {
                level = 6;
            }
            else if (altFeet > 20000) {
                level = 5;
            }
            else if (altFeet > 10000) {
                level = 4;
            }
            else if (altFeet > 5000) {
                level = 3;
            }
            else {
                level = 2;
            }
        }
        else if (radarAltFeet > 1000) {
            level = 1;
        }
        else {
            level = 0;
        }
        const parametersTA = DefaultTCASSensitivity.TA_LEVELS[level];
        this.parametersTA.lookaheadTime.set(parametersTA.lookaheadTime, UnitType.SECOND);
        this.parametersTA.protectedRadius.set(parametersTA.protectedRadius, UnitType.NMILE);
        this.parametersTA.protectedHeight.set(parametersTA.protectedHeight, UnitType.FOOT);
        const parametersRA = DefaultTCASSensitivity.RA_LEVELS[level];
        this.parametersRA.lookaheadTime.set(parametersRA.lookaheadTime, UnitType.SECOND);
        this.parametersRA.protectedRadius.set(parametersRA.protectedRadius, UnitType.NMILE);
        this.parametersRA.protectedHeight.set(parametersRA.protectedHeight, UnitType.FOOT);
        this.parametersRA.alim.set(parametersRA.alim, UnitType.FOOT);
    }
}
// TA sensitivity levels (seconds/NM/feet).
DefaultTCASSensitivity.TA_LEVELS = [
    {
        lookaheadTime: 20,
        protectedRadius: 0.3,
        protectedHeight: 850
    },
    {
        lookaheadTime: 25,
        protectedRadius: 0.33,
        protectedHeight: 850
    },
    {
        lookaheadTime: 30,
        protectedRadius: 0.48,
        protectedHeight: 850
    },
    {
        lookaheadTime: 40,
        protectedRadius: 0.75,
        protectedHeight: 850
    },
    {
        lookaheadTime: 45,
        protectedRadius: 1,
        protectedHeight: 850
    },
    {
        lookaheadTime: 48,
        protectedRadius: 1.3,
        protectedHeight: 850
    },
    {
        lookaheadTime: 48,
        protectedRadius: 1.3,
        protectedHeight: 1200
    }
];
// RA sensitivity levels (seconds/NM/feet/feet).
DefaultTCASSensitivity.RA_LEVELS = [
    {
        lookaheadTime: 15,
        protectedRadius: 0.2,
        protectedHeight: 600,
        alim: 300
    },
    {
        lookaheadTime: 15,
        protectedRadius: 0.2,
        protectedHeight: 600,
        alim: 300
    },
    {
        lookaheadTime: 20,
        protectedRadius: 0.35,
        protectedHeight: 600,
        alim: 300
    },
    {
        lookaheadTime: 25,
        protectedRadius: 0.55,
        protectedHeight: 600,
        alim: 350
    },
    {
        lookaheadTime: 30,
        protectedRadius: 0.8,
        protectedHeight: 600,
        alim: 400
    },
    {
        lookaheadTime: 35,
        protectedRadius: 1.1,
        protectedHeight: 700,
        alim: 600
    },
    {
        lookaheadTime: 35,
        protectedRadius: 1.1,
        protectedHeight: 800,
        alim: 700
    }
];
