/// <reference types="msfstypes/JS/simvar" />
import { SimVarValueType } from '../../data';
import { DirectorState } from '../PlaneDirector';
/**
 * An autopilot pitch director.
 */
export class APPitchDirector {
    /**
     * Creates an instance of the LateralDirector.
     * @param bus The event bus to use with this instance.
     * @param apValues are the AP Values subjects.
     */
    constructor(bus, apValues) {
        this.bus = bus;
        this.apValues = apValues;
        this.selectedPitch = 0;
        this.currentPitch = 0;
        this.state = DirectorState.Inactive;
        this.apValues.selectedPitch.sub((p) => {
            this.selectedPitch = p;
        });
        const adc = this.bus.getSubscriber();
        adc.on('pitch_deg').withPrecision(1).handle((p) => {
            this.currentPitch = p;
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
        this.apValues.selectedPitch.set(this.currentPitch);
        SimVar.SetSimVarValue('AUTOPILOT PITCH HOLD', 'Bool', true);
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
        SimVar.SetSimVarValue('AUTOPILOT PITCH HOLD', 'Bool', false);
    }
    /**
     * Updates this director.
     */
    update() {
        if (this.state === DirectorState.Active) {
            this.setPitch(this.selectedPitch);
        }
    }
    /**
     * Sets the desired AP pitch angle.
     * @param targetPitch The desired AP pitch angle.
     */
    setPitch(targetPitch) {
        if (isFinite(targetPitch)) {
            SimVar.SetSimVarValue('AUTOPILOT PITCH HOLD REF', SimVarValueType.Degree, targetPitch);
        }
    }
}
