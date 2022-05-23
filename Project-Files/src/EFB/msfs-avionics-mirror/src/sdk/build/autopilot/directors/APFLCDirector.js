/// <reference types="msfstypes/JS/simvar" />
import { ExpSmoother, MathUtils, UnitType } from '../..';
import { SimVarValueType } from '../../data';
import { DirectorState } from '../PlaneDirector';
import { PidController } from '../../utils/controllers';
/**
 * A Flight Level Change autopilot director.
 */
export class APFLCDirector {
    /**
     * Creates an instance of the FLC Director.
     * @param bus The event bus to use with this instance.
     * @param apValues is the AP selected values subject.
     */
    constructor(bus, apValues) {
        this.bus = bus;
        this._lastTime = 0;
        this.currentIas = 0;
        this.selectedIas = 0;
        this.selectedMach = 0;
        this.isSelectedSpeedInMach = false;
        this.selectedAltitude = 0;
        this.currentAltitude = 0;
        this.currentPitch = 0;
        this.accelerationController = new PidController(.3, 0, 0.5, 10, -10);
        this.pitchController = new PidController(1.5, 0, 0, 15, -15);
        this.filter = new ExpSmoother(5);
        this.state = DirectorState.Inactive;
        const adc = this.bus.getSubscriber();
        adc.on('alt').withPrecision(0).handle((alt) => {
            this.currentAltitude = alt;
        });
        adc.on('ias').withPrecision(2).handle((ias) => {
            this.currentIas = ias;
        });
        adc.on('pitch_deg').withPrecision(1).handle((pitch) => {
            this.currentPitch = -pitch;
        });
        apValues.selectedIas.sub((ias) => {
            this.selectedIas = ias;
        });
        apValues.selectedMach.sub((mach) => {
            this.selectedMach = mach;
        });
        apValues.isSelectedSpeedInMach.sub((isMach) => {
            this.isSelectedSpeedInMach = isMach;
        });
        apValues.selectedAltitude.sub((alt) => {
            this.selectedAltitude = alt;
        });
    }
    /**
     * Activates this director.
     */
    activate() {
        this.state = DirectorState.Active;
        this.initialize();
        this.onActivate && this.onActivate();
        SimVar.SetSimVarValue('AUTOPILOT FLIGHT LEVEL CHANGE', 'Bool', true);
        // Make sure we sync the selected IAS when FLC activates.
        SimVar.SetSimVarValue('K:AP_SPD_VAR_SET', 'number', this.currentIas);
    }
    /**
     * Arms this director.
     * This director can be armed, but it will never automatically activate and remain in the armed state.
     */
    arm() {
        this.state = DirectorState.Armed;
        this.onArm && this.onArm();
    }
    /**
     * Deactivates this director.
     */
    deactivate() {
        this.state = DirectorState.Inactive;
        SimVar.SetSimVarValue('AUTOPILOT FLIGHT LEVEL CHANGE', 'Bool', false);
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
     * Initializes this director on activation.
     */
    initialize() {
        this._lastTime = 0;
        this.accelerationController.reset();
        this.pitchController.reset();
    }
    /**
     * Gets a desired pitch from the selected vs value.
     * @returns The desired pitch angle.
     */
    getDesiredPitch() {
        const time = performance.now() / 1000;
        let dt = time - this._lastTime;
        if (this._lastTime === 0) {
            dt = 0;
        }
        const targetIas = this.isSelectedSpeedInMach ? Simplane.getMachToKias(this.selectedMach) : this.selectedIas;
        //step 1 - we want to find the IAS error from target and set a target acceleration
        const iasError = this.currentIas - targetIas;
        const targetAcceleration = this.accelerationController.getOutput(dt, -iasError);
        //step 2 - we want to find the current acceleration, feed that to the pid to manage to the target acceleration
        const acceleration = UnitType.FOOT.convertTo(SimVar.GetSimVarValue('ACCELERATION BODY Z', 'feet per second squared'), UnitType.NMILE) * 3600;
        const accelerationError = acceleration - targetAcceleration;
        const pitchCorrection = this.pitchController.getOutput(dt, accelerationError);
        const aoa = SimVar.GetSimVarValue('INCIDENCE ALPHA', SimVarValueType.Degree);
        this._lastTime = time;
        let targetPitch = isNaN(pitchCorrection) ? this.currentPitch - aoa : (this.currentPitch - aoa) + pitchCorrection;
        targetPitch = this.filter.next(targetPitch, dt);
        if (this.selectedAltitude > this.currentAltitude) {
            return MathUtils.clamp(targetPitch + aoa, aoa, 15);
        }
        else {
            return MathUtils.clamp(targetPitch + aoa, -15, aoa);
        }
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
