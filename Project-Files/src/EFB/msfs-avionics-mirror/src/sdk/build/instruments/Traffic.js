import { GeoPoint } from '../geo/GeoPoint';
import { ExpSmoother } from '../math/ExpSmoother';
import { UnitType } from '../math/NumberUnit';
import { Wait } from '../utils/time/Wait';
/**
 * Tracks aircraft traffic. Maintains a list of contacts, periodically updates their position, altitude, and reported
 * heading, and uses these data to compute ground speed, ground track, and vertical speed.
 */
export class TrafficInstrument {
    /**
     * Constructor.
     * @param bus The event bus.
     * @param options Options with which to initialize this instrument.
     */
    constructor(bus, options) {
        this.bus = bus;
        this.tracked = new Map();
        this.lastUpdateRealTime = 0;
        this.lastUpdateSimTime = 0;
        this.isBusy = false;
        this.options = Object.assign({}, options);
    }
    /**
     * Retrieves a traffic contact by its assigned ID number.
     * @param uid an ID number.
     * @returns the traffic contact with the assigned ID number, or undefined if no such contact exists.
     */
    getContact(uid) {
        return this.tracked.get(uid);
    }
    /**
     * Iterates through all tracked traffic contacts with a visitor function.
     * @param visitor A visitor function.
     */
    forEachContact(visitor) {
        this.tracked.forEach(visitor);
    }
    /**
     * Initializes this instrument. Once initialized, this instrument will automatically track and update traffic
     * contacts.
     */
    init() {
        this.bus.getSubscriber()
            .on('simTime')
            .whenChanged()
            .handle(this.onSimTimeChanged.bind(this));
    }
    /**
     * Updates this instrument's list of contacts.
     * @param data An array of the most recent traffic data entries.
     * @param simTime The sim time at which the traffic data was generated.
     */
    updateContacts(data, simTime) {
        const len = data.length;
        for (let i = 0; i < len; i++) {
            const entry = data[i];
            const contact = this.tracked.get(entry.uId);
            if (contact) {
                this.updateContact(contact, entry, simTime);
            }
            else {
                this.createContact(entry, simTime);
            }
        }
    }
    /**
     * Creates a contact.
     * @param entry The traffic data entry from which to create the new contact.
     * @param simTime The sim time at which the traffic data entry was generated.
     */
    createContact(entry, simTime) {
        const contact = new TrafficContactClass(entry.uId, 1000 / this.options.simTimeUpdateFreq * 5);
        this.tracked.set(contact.uid, contact);
        contact.update(entry.lat, entry.lon, UnitType.METER.convertTo(entry.alt, UnitType.FOOT), entry.heading, simTime);
        this.bus.pub('traffic_contact_added', contact.uid, false, false);
    }
    /**
     * Updates a contact.
     * @param contact The contact to update.
     * @param entry The current traffic data entry for the contact.
     * @param simTime The sim time at which the traffic data entry was generated.
     */
    updateContact(contact, entry, simTime) {
        contact.update(entry.lat, entry.lon, UnitType.METER.convertTo(entry.alt, UnitType.FOOT), entry.heading, simTime);
        this.bus.pub('traffic_contact_updated', contact.uid, false, false);
    }
    /**
     * Removes all contacts whose time since last contact exceeds the deprecation threshold.
     * @param simTime The current sim time.
     */
    deprecateContacts(simTime) {
        this.tracked.forEach(contact => {
            const dt = Math.abs(simTime - contact.lastContactTime);
            if (dt >= this.options.contactDeprecateTime) {
                this.tracked.delete(contact.uid);
                this.bus.pub('traffic_contact_removed', contact.uid, false, false);
            }
        });
    }
    /**
     * A callback which is called when the sim time changes.
     * @param simTime The current sim time.
     */
    async onSimTimeChanged(simTime) {
        const realTime = Date.now();
        if (this.isBusy
            || Math.abs(simTime - this.lastUpdateSimTime) < 1000 / this.options.simTimeUpdateFreq
            || Math.abs(realTime - this.lastUpdateRealTime) < 1000 / this.options.realTimeUpdateFreq) {
            return;
        }
        this.isBusy = true;
        try {
            const data = await Promise.race([Coherent.call('GET_AIR_TRAFFIC'), Wait.awaitDelay(1000)]);
            if (data) {
                this.updateContacts(data, simTime);
                this.deprecateContacts(simTime);
                this.lastUpdateSimTime = simTime;
                this.lastUpdateRealTime = realTime;
            }
        }
        catch (e) {
            console.error(e);
            if (e instanceof Error) {
                console.error(e.stack);
            }
        }
        this.isBusy = false;
    }
    /**
     * This method does nothing.
     */
    onUpdate() {
        // noop
    }
}
/**
 * An aircraft contact that is being tracked. Each contact tracks its last reported position, altitude, and heading.
 * Successively updating these values will allow ground speed, ground track, and vertical speed to be calculated based
 * on changes in the values over time. The calculated values are exponentially smoothed to reduce artifacts from
 * potentially noisy data.
 */
class TrafficContactClass {
    /**
     * Constructor.
     * @param uid This contact's unique ID number.
     * @param contactTimeResetThreshold The maximum allowed elapsed sim time, in milliseconds, since time of last contact
     * before this contact's computed values are reset.
     */
    constructor(uid, contactTimeResetThreshold) {
        this.uid = uid;
        this.contactTimeResetThreshold = contactTimeResetThreshold;
        // reported data
        this._lastPosition = new GeoPoint(NaN, NaN);
        this.lastPosition = this._lastPosition.readonly;
        this._lastAltitude = UnitType.FOOT.createNumber(NaN);
        this.lastAltitude = this._lastAltitude.readonly;
        this._lastHeading = NaN;
        this._lastContactTime = NaN;
        // computed data
        this._groundSpeed = UnitType.KNOT.createNumber(NaN);
        this.groundSpeed = this._groundSpeed.readonly;
        this._groundTrack = NaN;
        this._verticalSpeed = UnitType.FPM.createNumber(NaN);
        this.verticalSpeed = this._verticalSpeed.readonly;
        this.groundSpeedSmoother = new ExpSmoother(TrafficContactClass.GROUND_SPEED_TIME_CONSTANT, null, this.contactTimeResetThreshold / 1000);
        this.groundTrackSmoother = new ExpSmoother(TrafficContactClass.GROUND_TRACK_TIME_CONSTANT, null, this.contactTimeResetThreshold / 1000);
        this.verticalSpeedSmoother = new ExpSmoother(TrafficContactClass.VERTICAL_SPEED_TIME_CONSTANT, null, this.contactTimeResetThreshold / 1000);
    }
    // eslint-disable-next-line jsdoc/require-jsdoc
    get lastHeading() {
        return this._lastHeading;
    }
    // eslint-disable-next-line jsdoc/require-jsdoc
    get lastContactTime() {
        return this._lastContactTime;
    }
    // eslint-disable-next-line jsdoc/require-jsdoc
    get groundTrack() {
        return this._groundTrack;
    }
    // eslint-disable-next-line jsdoc/require-jsdoc
    predict(simTime, positionOut, altitudeOut) {
        if (this.groundSpeed.isNaN()) {
            positionOut.set(NaN, NaN);
            altitudeOut.set(NaN);
            return;
        }
        const dt = simTime - this.lastContactTime;
        const distance = UnitType.NMILE.convertTo(this._groundSpeed.number * (dt / 3600000), UnitType.GA_RADIAN);
        this._lastPosition.offset(this._groundTrack, distance, positionOut);
        const deltaAlt = this._verticalSpeed.number * (dt / 60000);
        this._lastAltitude.add(deltaAlt, UnitType.FOOT, altitudeOut);
    }
    /**
     * Updates this contact with the current reported position, altitude and heading. Also updates the computed ground
     * speed, ground track, and vertical speed if there are sufficient data to do so.
     * @param lat The current reported latitude.
     * @param lon The current reported longitude.
     * @param altitude The current reported altitude, in feet.
     * @param heading The current reported heading.
     * @param simTime The current sim time.
     */
    update(lat, lon, altitude, heading, simTime) {
        const dt = simTime - this._lastContactTime;
        if (!isNaN(dt) && (dt < 0 || dt > this.contactTimeResetThreshold)) {
            this.reset(lat, lon, altitude, heading, simTime);
            return;
        }
        if (!isNaN(dt) && dt > 0) {
            this.updateComputedValues(dt / 1000, lat, lon, altitude);
        }
        this.setReportedValues(lat, lon, altitude, heading);
        if (this.areComputedValuesValid()) {
            this._lastContactTime = simTime;
        }
        else {
            this.reset(lat, lon, altitude, heading, simTime);
        }
    }
    /**
     * Erases this contact's tracking history and sets the initial reported position, altitude, and heading.
     * @param lat The current reported latitude.
     * @param lon The current reported longitude.
     * @param altitude The current reported altitude, in feet.
     * @param heading The current reported heading.
     * @param simTime The current sim time.
     */
    reset(lat, lon, altitude, heading, simTime) {
        this.setReportedValues(lat, lon, altitude, heading);
        this._groundSpeed.set(NaN);
        this._groundTrack = NaN;
        this._verticalSpeed.set(NaN);
        this.groundSpeedSmoother.reset();
        this.groundTrackSmoother.reset();
        this.verticalSpeedSmoother.reset();
        this._lastContactTime = simTime;
    }
    /**
     * Sets the most recent reported values.
     * @param lat The reported latitude.
     * @param lon The reported longitude.
     * @param altitude The reported altitude, in feet.
     * @param heading The reported heading.
     */
    setReportedValues(lat, lon, altitude, heading) {
        this._lastPosition.set(lat, lon);
        this._lastAltitude.set(altitude);
        this._lastHeading = heading;
    }
    /**
     * Updates this contact's computed values.
     * @param dt The elapsed time, in seconds, since last contact.
     * @param lat The current reported latitude.
     * @param lon The current reported longitude.
     * @param altitude The current reported altitude, in feet.
     */
    updateComputedValues(dt, lat, lon, altitude) {
        const pos = TrafficContactClass.tempGeoPoint.set(lat, lon);
        const distanceNM = UnitType.GA_RADIAN.convertTo(this.lastPosition.distance(pos), UnitType.NMILE);
        const track = pos.bearingFrom(this._lastPosition);
        this.updateGroundSpeed(dt, distanceNM);
        this.updateGroundTrack(dt, track, distanceNM);
        this.updateVerticalSpeed(dt, altitude);
    }
    /**
     * Updates this contact's ground speed.
     * @param dt The elapsed time, in seconds, since last contact.
     * @param distanceNM The distance, in nautical miles, from this contact's position at last contact to this contact's
     * current reported position.
     */
    updateGroundSpeed(dt, distanceNM) {
        const dtHours = dt / 3600;
        const speedKnots = distanceNM / dtHours;
        this._groundSpeed.set(this.groundSpeedSmoother.next(speedKnots, dt));
    }
    /**
     * Updates this contact's ground track.
     * @param dt The elapsed time, in seconds, since last contact.
     * @param track The true ground track from this contact's position at last contact to this contact's current reported
     * position, as measured at the current reported position.
     * @param distanceNM The distance, in nautical miles, from this contact's position at last contact to this contact's
     * current reported position.
     */
    updateGroundTrack(dt, track, distanceNM) {
        const last = this.groundTrackSmoother.last();
        if (distanceNM >= TrafficContactClass.MIN_GROUND_TRACK_DISTANCE) {
            if (last !== null && !isNaN(last)) {
                // need to handle wraparounds
                let delta = track - last;
                if (delta > 180) {
                    delta = delta - 360;
                }
                else if (delta < -180) {
                    delta = delta + 360;
                }
                track = last + delta;
            }
        }
        else {
            // if distance between current and last position is too small, computed ground track will be unreliable
            // (and if distance = 0 the track will be meaningless), so we just copy forward the last computed track,
            // or NaN if there is no previously computed track
            track = last === null ? NaN : last;
        }
        const next = last !== null && isNaN(last) ? this.groundTrackSmoother.reset(track) : this.groundTrackSmoother.next(track, dt);
        this._groundTrack = (next + 360) % 360; // enforce range 0-359
    }
    /**
     * Updates this contact's vertical speed.
     * @param dt The elapsed time, in seconds, since last contact.
     * @param altitude The current reported altitude, in feet.
     */
    updateVerticalSpeed(dt, altitude) {
        const dtMin = dt / 60;
        const deltaAltFeet = altitude - this._lastAltitude.number;
        const vsFPM = deltaAltFeet / dtMin;
        this._verticalSpeed.set(this.verticalSpeedSmoother.next(vsFPM, dt));
    }
    /**
     * Checks whether this contact's calculated ground speed and vertical speeds are valid.
     * @returns whether this contact's calculated ground speed and vertical speeds are valid.
     */
    areComputedValuesValid() {
        const isGroundSpeedValid = this._groundSpeed.isNaN() || this._groundSpeed.number <= TrafficContactClass.MAX_VALID_GROUND_SPEED;
        const isVerticalSpeedValid = this._verticalSpeed.isNaN() || this._verticalSpeed.number <= TrafficContactClass.MAX_VALID_VERTICAL_SPEED;
        return isGroundSpeedValid && isVerticalSpeedValid;
    }
}
TrafficContactClass.GROUND_SPEED_TIME_CONSTANT = 2 / Math.LN2;
TrafficContactClass.GROUND_TRACK_TIME_CONSTANT = 2 / Math.LN2;
TrafficContactClass.VERTICAL_SPEED_TIME_CONSTANT = 2 / Math.LN2;
TrafficContactClass.MAX_VALID_GROUND_SPEED = 1500; // knots
TrafficContactClass.MAX_VALID_VERTICAL_SPEED = 10000; // fpm
TrafficContactClass.MIN_GROUND_TRACK_DISTANCE = 10 / 1852; // nautical miles
TrafficContactClass.tempGeoPoint = new GeoPoint(0, 0);
