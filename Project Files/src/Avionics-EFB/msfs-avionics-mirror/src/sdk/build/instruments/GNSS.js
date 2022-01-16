/// <reference types="msfstypes/JS/SimPlane" />
import { NavMath, UnitType } from '..';
import { SimVarValueType } from '../data/SimVars';
import { BasePublisher } from './BasePublishers';
/**
 * A publisher for basic GNSS information.
 */
export class GNSSPublisher extends BasePublisher {
    /**
     * Create an GNSSPublisher
     * @param bus The EventBus to publish to
     * @param pacer An optional pacer to use to control the rate of publishing
     */
    constructor(bus, pacer = undefined) {
        super(bus, pacer);
    }
    /**
     * A callback called when the publisher updates.
     */
    onUpdate() {
        this.publishPosition();
        this.publishTime();
        this.publishTrack();
        this.publishGroundSpeed();
        this.publishMagVar();
    }
    /**
     * Publishes the gps-position event.
     */
    publishPosition() {
        const lat = SimVar.GetSimVarValue('PLANE LATITUDE', SimVarValueType.Degree);
        const lon = SimVar.GetSimVarValue('PLANE LONGITUDE', SimVarValueType.Degree);
        const alt = SimVar.GetSimVarValue('PLANE ALTITUDE', SimVarValueType.Meters);
        this.publish('gps-position', new LatLongAlt(lat, lon, alt));
    }
    /**
     * Publishes the zulu_time and time_of_day events.
     */
    publishTime() {
        const zuluTime = SimVar.GetGlobalVarValue('ZULU TIME', 'seconds');
        const timeOfDay = SimVar.GetSimVarValue('E:TIME OF DAY', 'number');
        this.publish('zulu_time', zuluTime);
        this.publish('time_of_day', timeOfDay);
    }
    /**
     * Publishes the track_deg_true and track_deg_magnetic events.
     */
    publishTrack() {
        const headingTrue = SimVar.GetSimVarValue('PLANE HEADING DEGREES TRUE', SimVarValueType.Degree);
        const velocityEW = SimVar.GetSimVarValue('VELOCITY WORLD X', SimVarValueType.Knots);
        const velocityNS = SimVar.GetSimVarValue('VELOCITY WORLD Z', SimVarValueType.Knots);
        let track = headingTrue;
        if (velocityEW !== 0 || velocityNS !== 0) {
            track = NavMath.normalizeHeading(UnitType.RADIAN.convertTo(Math.atan2(velocityEW, velocityNS), UnitType.DEGREE));
        }
        const magvar = SimVar.GetSimVarValue('MAGVAR', SimVarValueType.Degree);
        const magneticTrack = NavMath.normalizeHeading(track - magvar);
        this.publish('track_deg_true', track);
        this.publish('track_deg_magnetic', magneticTrack);
    }
    /**
     * Publishes the ground_speed event.
     */
    publishGroundSpeed() {
        const gs = SimVar.GetSimVarValue('GROUND VELOCITY', SimVarValueType.Knots);
        this.publish('ground_speed', gs);
    }
    /**
     * Publishes the ground_speed event.
     */
    publishMagVar() {
        const magvar = SimVar.GetSimVarValue('MAGVAR', SimVarValueType.Degree);
        this.publish('magvar', magvar);
    }
}
