import { GeoPoint } from '../utils/geo/GeoPoint';
import { GeoPointSubject } from '../utils/geo/GeoPointSubject';
import { UnitType } from '../utils/math/NumberUnit';
import { NumberUnitSubject } from '../utils/math/NumberUnitSubject';
import { Vec2Math, Vec3Math } from '../utils/math/VecMath';
import { Subject } from '../utils/Subject';
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
     */
    constructor(bus, tfcInstrument, maxIntruderCount, realTimeUpdateFreq, simTimeUpdateFreq) {
        this.bus = bus;
        this.tfcInstrument = tfcInstrument;
        this.maxIntruderCount = maxIntruderCount;
        this.realTimeUpdateFreq = realTimeUpdateFreq;
        this.simTimeUpdateFreq = simTimeUpdateFreq;
        this.operatingModeSub = Subject.create(TCASOperatingMode.Standby);
        this.intrudersSorted = [];
        this.intrudersFiltered = [];
        this.contactCreatedHandler = this.onContactAdded.bind(this);
        this.contactRemovedHandler = this.onContactRemoved.bind(this);
        this.ownAirplaneSubs = {
            position: GeoPointSubject.createFromGeoPoint(new GeoPoint(0, 0)),
            altitude: NumberUnitSubject.createFromNumberUnit(UnitType.FOOT.createNumber(0)),
            groundTrack: Subject.create(0),
            groundSpeed: NumberUnitSubject.createFromNumberUnit(UnitType.KNOT.createNumber(0)),
            verticalSpeed: NumberUnitSubject.createFromNumberUnit(UnitType.FPM.createNumber(0))
        };
        this.isOwnAirplaneOnGround = false;
        this.lastUpdateSimTime = 0;
        this.lastUpdateRealTime = 0;
        this.alertLevelHandlers = new Map();
        this.eventSubscriber = this.bus.getSubscriber();
        this.sensitivity = this.createSensitivity();
        this.ownAirplane = new OwnAirplane(this.ownAirplaneSubs);
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
        // own airplane listeners
        const gnssSub = this.bus.getSubscriber();
        gnssSub.on('gps-position').atFrequency(this.realTimeUpdateFreq).handle(lla => { this.ownAirplaneSubs.position.set(lla.lat, lla.long); });
        gnssSub.on('track_deg_true').whenChanged().atFrequency(this.realTimeUpdateFreq).handle(track => { this.ownAirplaneSubs.groundTrack.set(track); });
        gnssSub.on('ground_speed').whenChanged().atFrequency(this.realTimeUpdateFreq).handle(gs => { this.ownAirplaneSubs.groundSpeed.set(gs); });
        const adcSub = this.bus.getSubscriber();
        adcSub.on('alt').whenChanged().atFrequency(this.realTimeUpdateFreq).handle(alt => { this.ownAirplaneSubs.altitude.set(alt); });
        adcSub.on('vs').whenChanged().atFrequency(this.realTimeUpdateFreq).handle(vs => { this.ownAirplaneSubs.verticalSpeed.set(vs); });
        adcSub.on('on_ground').whenChanged().handle(isOnGround => { this.isOwnAirplaneOnGround = isOnGround; });
        // init operating mode notifier
        this.operatingModeSub.sub(mode => { this.bus.pub('tcas_operating_mode', mode, false, true); }, true);
        // init update loop
        this.bus.getSubscriber().on('simTime').whenChanged().handle(this.onSimTimeChanged.bind(this));
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
            // always sort intruders predicted to violate protected zone first
            if (a.tcaNorm <= 1 && b.tcaNorm > 1) {
                return -1;
            }
            else if (a.tcaNorm > 1 && b.tcaNorm <= 1) {
                return 1;
            }
            else {
                // if both are predicted to violate protected zone, sort by TCA.
                // Otherwise sort by how close they approach the protected zone at TCA.
                const tcaComparison = a.tca.compare(b.tca);
                const normComparison = a.tcaNorm - b.tcaNorm;
                let firstComparison;
                let secondComparison;
                if (a.tcaNorm <= 1) {
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
     * @param simTime The current sim time.
     */
    doUpdate(simTime) {
        this.updateSensitivity();
        this.updateIntruderPredictions(simTime);
        this.updateIntruderArrays();
        this.updateFilteredIntruderAlertLevels(simTime);
    }
    /**
     * Updates the TCA predictions for all intruders tracked by this system.
     * @param simTime The current sim time.
     */
    updateIntruderPredictions(simTime) {
        this.ownAirplane.update(simTime);
        const lookaheadTime = this.sensitivity.lookaheadTime.get();
        const protectedRadius = this.sensitivity.protectedRadius.get();
        const protectedHeight = this.sensitivity.protectedHeight.get();
        const len = this.intrudersSorted.length;
        for (let i = 0; i < len; i++) {
            this.intrudersSorted[i].updatePrediction(simTime, this.ownAirplane, lookaheadTime, protectedRadius, protectedHeight);
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
     * @param simTime The current sim time.
     */
    updateFilteredIntruderAlertLevels(simTime) {
        const len = this.intrudersFiltered.length;
        for (let i = 0; i < len; i++) {
            this.updateIntruderAlertLevel(simTime, this.intrudersFiltered[i]);
        }
    }
    /**
     * Executes initialization code when an intruder is added.
     * @param intruder The newly added intruder.
     */
    initIntruder(intruder) {
        const handler = this.onAlertLevelChanged.bind(this, intruder);
        this.alertLevelHandlers.set(intruder, handler);
        intruder.alertLevel.sub(handler);
        this.bus.pub('tcas_intruder_added', intruder, false, false);
    }
    /**
     * Executes cleanup code when an intruder is removed.
     * @param intruder The intruder that was removed.
     */
    cleanUpIntruder(intruder) {
        const handler = this.alertLevelHandlers.get(intruder);
        handler && intruder.alertLevel.unsub(handler);
        this.bus.pub('tcas_intruder_removed', intruder, false, false);
    }
    /**
     * A callback which is called when an intruder's alert level changes.
     * @param intruder The intruder whose alert level changed.
     */
    onAlertLevelChanged(intruder) {
        this.bus.pub('tcas_intruder_alert_changed', intruder, false, false);
    }
}
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
    }
    /**
     * Updates this airplane's position, altitude, ground track, ground speed, and vertical speed.
     */
    updateParameters() {
        this._position.set(this.subs.position.get());
        this._altitude.set(this.subs.altitude.get());
        this._groundTrack = this.subs.groundTrack.get();
        this._groundSpeed.set(this.subs.groundSpeed.get());
        this._verticalSpeed.set(this.subs.verticalSpeed.get());
    }
    /**
     * Updates this airplane's position and velocity vectors.
     */
    updateVectors() {
        Vec2Math.setFromPolar(this._groundSpeed.asUnit(UnitType.MPS), (90 - this._groundTrack) * Avionics.Utils.DEG2RAD, this.velocityVec);
        const verticalVelocity = this._verticalSpeed.asUnit(UnitType.MPS);
        this.velocityVec[2] = verticalVelocity;
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
}
/**
 * An abstract implementation of TCASIntruder.
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
        this._tca = UnitType.SECOND.createNumber(NaN);
        /** Time to closest approach between this intruder and own airplane. */
        this.tca = this._tca.readonly;
        this._tcaNorm = NaN;
        /** The predicted 3D displacement vector from own airplane to this intruder at time of closest approach. */
        this.tcaDisplacement = new Float64Array(3);
        this._tcaHorizontalSep = UnitType.NMILE.createNumber(0);
        /** The predicted horizontal separation between this intruder and own airplane at time of closest approach. */
        this.tcaHorizontalSep = this._tcaHorizontalSep.readonly;
        this._tcaVerticalSep = UnitType.FOOT.createNumber(0);
        /** The predicted vertical separation between this intruder and own airplane at time of closest approach. */
        this.tcaVerticalSep = this._tcaVerticalSep.readonly;
    }
    // eslint-disable-next-line jsdoc/require-returns
    /** Whether there is a valid prediction for time of closest approach between this intruder and own airplane. */
    get isPredictionValid() {
        return this._isPredictionValid;
    }
    // eslint-disable-next-line jsdoc/require-returns
    /**
     * The cylindrical norm of the predicted displacement vector between this intruder and own airplane at time of
     * closest approach. A value less than or equal to 1 indicates the intruder will be inside the protected zone.
     * Larger values correspond to greater separation.
     */
    get tcaNorm() {
        return this._tcaNorm;
    }
    // eslint-disable-next-line jsdoc/require-jsdoc
    predictDisplacement(simTime, out) {
        if (!this._isPredictionValid) {
            return Vec3Math.set(NaN, NaN, NaN, out);
        }
        const dt = (simTime - this.contact.lastContactTime) / 1000;
        return Vec3Math.add(this.relativePositionVec, Vec3Math.multScalar(this.relativeVelocityVec, dt, out), out);
    }
    // eslint-disable-next-line jsdoc/require-jsdoc
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
     * @param simTime The current sim time.
     * @param ownAirplane Own airplane.
     * @param lookaheadTime The maximum lookahead time to calculate TCA.
     * @param protectedRadius The radius of the own airplane's protected zone.
     * @param protectedHeight The half-height of the own airplane's protected zone.
     */
    updatePrediction(simTime, ownAirplane, lookaheadTime, protectedRadius, protectedHeight) {
        this.updateParameters(simTime, ownAirplane);
        if (this.isPredictionValid) {
            this.updateTCA(ownAirplane, lookaheadTime, protectedRadius, protectedHeight);
        }
        else {
            this.invalidatePrediction();
        }
        this.lastUpdateTime = simTime;
    }
    /**
     * Updates this intruder's position and velocity data.
     * @param simTime The current sim time.
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
        }
        else {
            this.updatePosition(simTime, ownAirplane);
            this.updateVelocity();
            this._groundSpeed.set(this.contact.groundSpeed);
            this._verticalSpeed.set(this.contact.verticalSpeed);
            this._isPredictionValid = true;
        }
    }
    /**
     * Updates this intruder's position.
     * @param simTime The current sim time.
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
    }
    /**
     * Updates this intruder's velocity.
     */
    updateVelocity() {
        Vec2Math.setFromPolar(this.contact.groundSpeed.asUnit(UnitType.MPS), (90 - this.contact.groundTrack) * Avionics.Utils.DEG2RAD, this.velocityVec);
        const verticalVelocity = this.contact.verticalSpeed.asUnit(UnitType.MPS);
        this.velocityVec[2] = verticalVelocity;
    }
    /**
     * Updates the time-to-closest-approach (TCA) and related data of this intruder.
     * @param ownAirplane The own airplane.
     * @param lookaheadTime The maximum lookahead time.
     * @param protectedRadius The radius of the own airplane's protected zone.
     * @param protectedHeight The half-height of the own airplane's protected zone.
     */
    updateTCA(ownAirplane, lookaheadTime, protectedRadius, protectedHeight) {
        // Source: Munoz, CA and Narkawicz, AJ. "Time of Closest Approach in Three-Dimensional Airspace." 2010.
        // https://ntrs.nasa.gov/api/citations/20100037766/downloads/20100037766.pdf
        const s = Vec3Math.sub(this.positionVec, ownAirplane.positionVec, this.relativePositionVec);
        const v = Vec3Math.sub(this.velocityVec, ownAirplane.velocityVec, this.relativeVelocityVec);
        const sHoriz = Vec2Math.set(s[0], s[1], AbstractTCASIntruder.vec2Cache[0]);
        const vHoriz = Vec2Math.set(v[0], v[1], AbstractTCASIntruder.vec2Cache[0]);
        const h = protectedHeight.asUnit(UnitType.METER);
        const r = protectedRadius.asUnit(UnitType.METER);
        const vHorizSquared = Vec2Math.dot(vHoriz, vHoriz);
        const sHorizSquared = Vec2Math.dot(sHoriz, sHoriz);
        const hSquared = h * h;
        const rSquared = r * r;
        const a = (v[2] * v[2]) / hSquared - vHorizSquared / rSquared;
        const b = 2 * s[2] * v[2] / hSquared - 2 * Vec2Math.dot(sHoriz, vHoriz) / rSquared;
        const c = (s[2] * s[2]) / hSquared - sHorizSquared / rSquared;
        const solution = AbstractTCASIntruder.calculateSolution(0, s, v, r, h, AbstractTCASIntruder.solutionCache[0]);
        if (vHorizSquared !== 0) {
            const t = -Vec2Math.dot(sHoriz, vHoriz) / vHorizSquared;
            if (t > 0) {
                AbstractTCASIntruder.evaluateCandidate(t, s, v, r, h, solution, AbstractTCASIntruder.solutionCache[1]);
            }
        }
        if (v[2] !== 0) {
            const t = -s[2] / v[2];
            if (t > 0) {
                AbstractTCASIntruder.evaluateCandidate(t, s, v, r, h, solution, AbstractTCASIntruder.solutionCache[1]);
            }
        }
        const discriminant = b * b - 4 * a * c;
        if (a !== 0 && discriminant >= 0) {
            const sqrt = Math.sqrt(discriminant);
            let t = (-b + sqrt) / (2 * a);
            if (t > 0) {
                AbstractTCASIntruder.evaluateCandidate(t, s, v, r, h, solution, AbstractTCASIntruder.solutionCache[1]);
            }
            t = (-b - sqrt) / (2 * a);
            if (t > 0) {
                AbstractTCASIntruder.evaluateCandidate(t, s, v, r, h, solution, AbstractTCASIntruder.solutionCache[1]);
            }
        }
        else if (a === 0 && b !== 0) {
            const t = -c / b;
            if (t > 0) {
                AbstractTCASIntruder.evaluateCandidate(t, s, v, r, h, solution, AbstractTCASIntruder.solutionCache[1]);
            }
        }
        const lookaheadTimeSeconds = lookaheadTime.asUnit(UnitType.SECOND);
        if (solution.tca > lookaheadTimeSeconds) {
            AbstractTCASIntruder.calculateSolution(lookaheadTimeSeconds, s, v, r, h, solution);
        }
        this._tca.set(solution.tca);
        this._tcaNorm = solution.norm;
        AbstractTCASIntruder.displacementToHorizontalSeparation(solution.displacement, this._tcaHorizontalSep);
        AbstractTCASIntruder.displacementToVerticalSeparation(solution.displacement, this._tcaVerticalSep);
    }
    /**
     * Invalidates this intruder's predicted TCA and related data.
     */
    invalidatePrediction() {
        Vec3Math.set(NaN, NaN, NaN, this.relativePositionVec);
        Vec3Math.set(NaN, NaN, NaN, this.relativeVelocityVec);
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
        AbstractTCASIntruder.calculateSolution(t, s, v, r, h, candidate);
        if (candidate.norm < best.norm) {
            AbstractTCASIntruder.copySolution(candidate, best);
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
        AbstractTCASIntruder.calculateDisplacementVector(s, v, t, out.displacement);
        out.norm = AbstractTCASIntruder.calculateCylindricalNorm(out.displacement, r, h);
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
AbstractTCASIntruder.vec2Cache = [new Float64Array(2), new Float64Array(2)];
AbstractTCASIntruder.vec3Cache = [new Float64Array(3), new Float64Array(3)];
AbstractTCASIntruder.solutionCache = [
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
 * An abstract implementation of TCASSensitivity.
 */
export class AbstractTCASSensitivity {
    constructor() {
        this.lookaheadTime = NumberUnitSubject.createFromNumberUnit(UnitType.SECOND.createNumber(0));
        this.protectedRadius = NumberUnitSubject.createFromNumberUnit(UnitType.NMILE.createNumber(0));
        this.protectedHeight = NumberUnitSubject.createFromNumberUnit(UnitType.FOOT.createNumber(0));
    }
}
