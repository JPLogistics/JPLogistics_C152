/// <reference types="msfstypes/JS/simvar" />
import { MathUtils, SimpleMovingAverage, UnitType } from '../../';
import { SimVarValueType } from '../../data';
import { DirectorState } from '../PlaneDirector';
import { VNavUtils } from '../VNavUtils';
/**
 * An altitude capture autopilot director.
 */
export class APAltCapDirector {
    /**
     * Creates an instance of the LateralDirector.
     * @param bus The event bus to use with this instance.
     * @param apValues are the ap selected values for the autopilot.
     * @param captureAltitude The captureAltitude Method to use to capture the altitude
     */
    constructor(bus, apValues, captureAltitude = APAltCapDirector.captureAltitude) {
        this.bus = bus;
        this.apValues = apValues;
        this.captureAltitude = captureAltitude;
        this.tas = 0;
        this.capturedAltitude = 0;
        this.indicatedAltitude = 0;
        this.verticalSpeed = 0;
        this.initialFpa = 0;
        this.selectedAltitude = 0;
        this.verticalWindAverage = new SimpleMovingAverage(10);
        this.state = DirectorState.Inactive;
        this.bus.getSubscriber().on('tas').withPrecision(0).handle((tas) => {
            this.tas = tas;
        });
        const adc = this.bus.getSubscriber();
        adc.on('alt').withPrecision(0).handle((alt) => {
            this.indicatedAltitude = alt;
        });
        adc.on('vs').withPrecision(0).handle((vs) => {
            this.verticalSpeed = vs;
        });
        this.apValues.capturedAltitude.sub((cap) => {
            this.capturedAltitude = Math.round(cap);
        });
        this.apValues.selectedAltitude.sub((alt) => {
            this.selectedAltitude = alt;
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
        this.setCaptureFpa(this.verticalSpeed);
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
     * @param captured is whether the altitude was captured.
     */
    deactivate(captured = false) {
        this.state = DirectorState.Inactive;
        if (!captured) {
            SimVar.SetSimVarValue('AUTOPILOT ALTITUDE LOCK', 'Bool', false);
        }
        //this.capturedAltitude = 0;
    }
    /**
     * Updates this director.
     */
    update() {
        if (this.state === DirectorState.Active) {
            this.setPitch(this.captureAltitude(this.capturedAltitude, this.indicatedAltitude, this.initialFpa));
        }
        if (this.state === DirectorState.Armed) {
            this.tryActivate();
        }
    }
    /**
     * Attempts to activate altitude capture.
     */
    tryActivate() {
        const deviationFromTarget = Math.abs(this.selectedAltitude - this.indicatedAltitude);
        if (deviationFromTarget <= Math.abs(this.verticalSpeed / 6)) {
            this.apValues.capturedAltitude.set(Math.round(this.selectedAltitude));
            this.activate();
        }
    }
    /**
     * Sets the initial capture FPA from the current vs value when capture is initiated.
     * @param vs target vertical speed.
     */
    setCaptureFpa(vs) {
        if (Math.abs(vs) < 400) {
            const altCapDeviation = this.indicatedAltitude - this.selectedAltitude;
            vs = altCapDeviation > 0 ? -400 : 400;
        }
        this.initialFpa = this.getFpa(UnitType.NMILE.convertTo(this.tas / 60, UnitType.FOOT), vs);
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
            const verticalWindComponent = this.verticalWindAverage.getAverage(SimVar.GetSimVarValue('AMBIENT WIND Y', SimVarValueType.FPM));
            const verticalWindPitchAdjustment = VNavUtils.getFpa(UnitType.NMILE.convertTo(this.tas / 60, UnitType.FOOT), -verticalWindComponent);
            SimVar.SetSimVarValue('AUTOPILOT PITCH HOLD REF', SimVarValueType.Degree, -(targetPitch + verticalWindPitchAdjustment));
        }
    }
    /**
     * Default method to use for capturing a target altitude.
     * @param targetAltitude is the captured targed altitude
     * @param indicatedAltitude is the current indicated altitude
     * @param initialFpa is the FPA when capture was initiatiated
     * @returns The target pitch value to set.
     */
    static captureAltitude(targetAltitude, indicatedAltitude, initialFpa) {
        const altCapDeviation = indicatedAltitude - targetAltitude;
        const altCapPitchPercentage = Math.min(Math.abs(altCapDeviation) / 100, 1);
        const desiredPitch = (initialFpa * altCapPitchPercentage);
        const aoa = SimVar.GetSimVarValue('INCIDENCE ALPHA', SimVarValueType.Degree);
        return aoa + MathUtils.clamp(desiredPitch, -6, 6);
    }
}
