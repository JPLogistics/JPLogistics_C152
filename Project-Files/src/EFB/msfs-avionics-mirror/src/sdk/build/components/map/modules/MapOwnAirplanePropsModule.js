import { GeoPoint, GeoPointSubject, NumberUnitSubject, Subject, UnitType } from '../../..';
/**
 * A module describing the state of the own airplane.
 */
export class MapOwnAirplanePropsModule {
    constructor() {
        /** The airplane's position. */
        this.position = GeoPointSubject.createFromGeoPoint(new GeoPoint(0, 0));
        /** The airplane's true heading, in degrees. */
        this.hdgTrue = Subject.create(0);
        /** The airplane's turn rate, in degrees per second. */
        this.turnRate = Subject.create(0);
        /** The airplane's indicated altitude. */
        this.altitude = NumberUnitSubject.createFromNumberUnit(UnitType.FOOT.createNumber(0));
        /** The airplane's vertical speed. */
        this.verticalSpeed = NumberUnitSubject.createFromNumberUnit(UnitType.FPM.createNumber(0));
        /** The airplane's true ground track, in degrees. */
        this.trackTrue = Subject.create(0);
        /** The airplane's ground speed. */
        this.groundSpeed = NumberUnitSubject.createFromNumberUnit(UnitType.KNOT.createNumber(0));
        /** Whether the airplane is on the ground. */
        this.isOnGround = Subject.create(true);
        /** The magnetic variation at the airplane's position. */
        this.magVar = Subject.create(0);
        this.positionHandler = (pos) => {
            this.position.set(pos.lat, pos.long);
        };
        this.headingHandler = (heading) => {
            this.hdgTrue.set(heading);
        };
        this.turnRateHandler = (turnRate) => {
            this.turnRate.set(turnRate);
        };
        this.altitudeHandler = (alt) => {
            this.altitude.set(alt);
        };
        this.verticalSpeedHandler = (vs) => {
            this.verticalSpeed.set(vs);
        };
        this.trackHandler = (track) => {
            this.trackTrue.set(track);
        };
        this.groundSpeedHandler = (gs) => {
            this.groundSpeed.set(gs);
        };
        this.onGroundHandler = (isOnGround) => {
            this.isOnGround.set(isOnGround);
        };
        this.magVarHandler = (magVar) => {
            this.magVar.set(magVar);
        };
        this.isSyncing = false;
        this.positionConsumer = null;
        this.headingConsumer = null;
        this.turnRateConsumer = null;
        this.altitudeConsumer = null;
        this.verticalSpeedConsumer = null;
        this.trackConsumer = null;
        this.groundSpeedConsumer = null;
        this.onGroundConsumer = null;
        this.magVarConsumer = null;
    }
    /**
     * Begins syncing this module with the event bus. While syncing is active, this module's properties will be
     * automatically updated with the latest information provided by the event bus.
     * @param bus The event bus.
     * @param updateFreq The frequency at which to sync with the event bus.
     */
    beginSync(bus, updateFreq) {
        this.stopSync();
        const subscriber = bus.getSubscriber();
        this.positionConsumer = subscriber.on('gps-position').atFrequency(updateFreq);
        this.positionConsumer.handle(this.positionHandler);
        this.headingConsumer = subscriber.on('hdg_deg_true').atFrequency(updateFreq);
        this.headingConsumer.handle(this.headingHandler);
        this.turnRateConsumer = subscriber.on('delta_heading_rate').atFrequency(updateFreq);
        this.turnRateConsumer.handle(this.turnRateHandler);
        this.altitudeConsumer = subscriber.on('alt').atFrequency(updateFreq);
        this.altitudeConsumer.handle(this.altitudeHandler);
        this.verticalSpeedConsumer = subscriber.on('vs').atFrequency(updateFreq);
        this.verticalSpeedConsumer.handle(this.verticalSpeedHandler);
        this.trackConsumer = subscriber.on('track_deg_true').atFrequency(updateFreq);
        this.trackConsumer.handle(this.trackHandler);
        this.groundSpeedConsumer = subscriber.on('ground_speed').atFrequency(updateFreq);
        this.groundSpeedConsumer.handle(this.groundSpeedHandler);
        this.onGroundConsumer = subscriber.on('on_ground').atFrequency(updateFreq);
        this.onGroundConsumer.handle(this.onGroundHandler);
        this.magVarConsumer = subscriber.on('magvar').atFrequency(updateFreq);
        this.magVarConsumer.handle(this.magVarHandler);
        this.isSyncing = true;
    }
    /**
     * Stops syncing this module with the event bus.
     */
    stopSync() {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j;
        if (!this.isSyncing) {
            return;
        }
        (_a = this.positionConsumer) === null || _a === void 0 ? void 0 : _a.off(this.positionHandler);
        (_b = this.headingConsumer) === null || _b === void 0 ? void 0 : _b.off(this.headingHandler);
        (_c = this.turnRateConsumer) === null || _c === void 0 ? void 0 : _c.off(this.turnRateHandler);
        (_d = this.altitudeConsumer) === null || _d === void 0 ? void 0 : _d.off(this.altitudeHandler);
        (_e = this.verticalSpeedConsumer) === null || _e === void 0 ? void 0 : _e.off(this.verticalSpeedHandler);
        (_f = this.trackConsumer) === null || _f === void 0 ? void 0 : _f.off(this.trackHandler);
        (_g = this.groundSpeedConsumer) === null || _g === void 0 ? void 0 : _g.off(this.groundSpeedHandler);
        (_h = this.onGroundConsumer) === null || _h === void 0 ? void 0 : _h.off(this.onGroundHandler);
        (_j = this.magVarConsumer) === null || _j === void 0 ? void 0 : _j.off(this.magVarHandler);
        this.isSyncing = false;
    }
}
