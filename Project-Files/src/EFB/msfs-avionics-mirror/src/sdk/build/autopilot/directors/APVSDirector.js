/// <reference types="msfstypes/JS/simvar" />
import { MathUtils, SimpleMovingAverage, UnitType } from '../..';
import { SimVarValueType } from '../../data';
import { DirectorState } from '../PlaneDirector';
/**
 * A vertical speed autopilot director.
 */
export class APVSDirector {
    /**
     * Creates an instance of the LateralDirector.
     * @param bus The event bus to use with this instance.
     * @param apValues are the ap selected values for the autopilot.
     */
    constructor(bus, apValues) {
        this.bus = bus;
        this.tas = 0;
        this.selectedVS = 0;
        this.verticalWindAverage = new SimpleMovingAverage(10);
        this.state = DirectorState.Inactive;
        this.bus.getSubscriber().on('tas').withPrecision(0).handle((tas) => {
            this.tas = tas;
        });
        apValues.selectedVerticalSpeed.sub((vs) => {
            this.selectedVS = vs;
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
        Coherent.call('AP_VS_VAR_SET_ENGLISH', 1, Simplane.getVerticalSpeed());
        SimVar.SetSimVarValue('AUTOPILOT VERTICAL HOLD', 'Bool', true);
    }
    /**
     * Arms this director.
     * This director has no armed mode, so it activates immediately.
     */
    arm() {
        if (this.state == DirectorState.Inactive) {
            this.activate();
        }
    }
    /**
     * Deactivates this director.
     */
    deactivate() {
        this.state = DirectorState.Inactive;
        SimVar.SetSimVarValue('AUTOPILOT VERTICAL HOLD', 'Bool', false);
    }
    /**
     * Updates this director.
     */
    update() {
        if (this.state === DirectorState.Active) {
            this.setPitch(this.getDesiredPitch());
        }
    }
    /**
     * Gets a desired pitch from the selected vs value.
     * @returns The desired pitch angle.
     */
    getDesiredPitch() {
        //We need the instant AOA and VS here so we're avoiding the bus
        const aoa = SimVar.GetSimVarValue('INCIDENCE ALPHA', SimVarValueType.Degree);
        const verticalWindComponent = this.verticalWindAverage.getAverage(SimVar.GetSimVarValue('AMBIENT WIND Y', SimVarValueType.FPM));
        const desiredPitch = this.getFpa(UnitType.NMILE.convertTo(this.tas / 60, UnitType.FOOT), this.selectedVS - verticalWindComponent);
        return MathUtils.clamp(aoa + (isNaN(desiredPitch) ? 10 : desiredPitch), -10, 10);
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
