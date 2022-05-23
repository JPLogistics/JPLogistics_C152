/// <reference types="msfstypes/JS/simvar" />
import { MathUtils, UnitType, NavMath, SimpleMovingAverage } from '../../';
import { SimVarValueType } from '../../data';
import { DirectorState } from '../PlaneDirector';
/**
 * An altitude hold autopilot director.
 */
export class APAltDirector {
    /**
     * Creates an instance of the LateralDirector.
     * @param bus The event bus to use with this instance.
     * @param apValues are the ap selected values for the autopilot.
     */
    constructor(bus, apValues) {
        this.bus = bus;
        this.tas = 0;
        this.capturedAltitude = 0;
        this.indicatedAltitude = 0;
        this.verticalWindAverage = new SimpleMovingAverage(10);
        this.state = DirectorState.Inactive;
        this.bus.getSubscriber().on('tas').withPrecision(0).handle((tas) => {
            this.tas = tas;
        });
        this.bus.getSubscriber().on('alt').withPrecision(0).handle((alt) => {
            this.indicatedAltitude = alt;
        });
        apValues.capturedAltitude.sub((cap) => {
            this.capturedAltitude = Math.round(cap);
        });
    }
    /**
     * Activates this director.
     */
    activate() {
        this.state = DirectorState.Active;
        if (this.onActivate !== undefined) {
            this.onActivate();
        }
        SimVar.SetSimVarValue('AUTOPILOT ALTITUDE LOCK', 'Bool', true);
    }
    /**
     * Arms this director.
     * This director has no armed mode, so it activates immediately.
     */
    arm() {
        this.state = DirectorState.Armed;
        if (this.onArm !== undefined) {
            this.onArm();
        }
    }
    /**
     * Deactivates this director.
     */
    deactivate() {
        this.state = DirectorState.Inactive;
        SimVar.SetSimVarValue('AUTOPILOT ALTITUDE LOCK', 'Bool', false);
    }
    /**
     * Updates this director.
     */
    update() {
        if (this.state === DirectorState.Active) {
            this.holdAltitude(this.capturedAltitude);
        }
        if (this.state === DirectorState.Armed) {
            this.tryActivate();
        }
    }
    /**
     * Attempts to activate altitude capture.
     */
    tryActivate() {
        const deviationFromTarget = Math.abs(this.capturedAltitude - this.indicatedAltitude);
        if (deviationFromTarget <= 20) {
            this.activate();
        }
    }
    /**
     * Holds a captured altitude.
     * @param targetAltitude is the captured targed altitude
     */
    holdAltitude(targetAltitude) {
        const deltaAlt = this.indicatedAltitude - targetAltitude;
        let setVerticalSpeed = 0;
        const correction = MathUtils.clamp(10 * Math.abs(deltaAlt), 100, 500);
        if (deltaAlt > 10) {
            setVerticalSpeed = 0 - correction;
        }
        else if (deltaAlt < -10) {
            setVerticalSpeed = correction;
        }
        this.setPitch(this.getDesiredPitch(setVerticalSpeed));
    }
    /**
     * Gets a desired pitch from the selected vs value.
     * @param vs target vertical speed.
     * @returns The desired pitch angle.
     */
    getDesiredPitch(vs) {
        //We need the instant AOA and VS here so we're avoiding the bus
        const aoa = SimVar.GetSimVarValue('INCIDENCE ALPHA', SimVarValueType.Degree);
        const verticalWindComponent = this.verticalWindAverage.getAverage(SimVar.GetSimVarValue('AMBIENT WIND Y', SimVarValueType.FPM));
        const desiredPitch = this.getFpa(UnitType.NMILE.convertTo(this.tas / 60, UnitType.FOOT), vs - verticalWindComponent);
        return NavMath.clamp(aoa + desiredPitch, -10, 10);
    }
    /**
     * Gets a desired fpa.
     * @param distance is the distance traveled per minute.
     * @param altitude is the vertical speed per minute.
     * @returns The desired pitch angle.
     */
    getFpa(distance, altitude) {
        return UnitType.RADIAN.convertTo(Math.atan(altitude / distance), UnitType.DEGREE);
    }
    /**
     * Sets the desired AP pitch angle.
     * @param targetPitch The desired AP pitch angle.
     */
    setPitch(targetPitch) {
        if (isFinite(targetPitch)) {
            SimVar.SetSimVarValue('AUTOPILOT PITCH HOLD REF', SimVarValueType.Degree, -targetPitch);
        }
    }
}
