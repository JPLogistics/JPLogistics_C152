/// <reference types="msfstypes/JS/simvar" />
import { MathUtils, SimpleMovingAverage, UnitType } from '../..';
import { SimVarValueType } from '../../data';
import { APLateralModes } from '../APConfig';
import { ApproachGuidanceMode } from '../VerticalNavigation';
import { VNavUtils } from '../VNavUtils';
import { DirectorState } from '../PlaneDirector';
import { VNavVars } from '../VNavEvents';
/**
 * An RNAV LPV glidepath autopilot director.
 */
export class APGPDirector {
    /**
     * Creates an instance of the LateralDirector.
     * @param bus The event bus to use with this instance.
     * @param apValues are the ap selected values for the autopilot.
     */
    constructor(bus, apValues) {
        this.bus = bus;
        this.apValues = apValues;
        this.gpDeviation = 0;
        this.fpa = 0;
        this.verticalWindAverage = new SimpleMovingAverage(10);
        this.tas = 0;
        this.groundSpeed = 0;
        this.state = DirectorState.Inactive;
        this.bus.getSubscriber().on('gp_vertical_deviation').whenChanged().handle(dev => this.gpDeviation = dev);
        this.bus.getSubscriber().on('gp_fpa').whenChanged().handle(fpa => this.fpa = fpa);
        this.bus.getSubscriber().on('tas').withPrecision(0).handle((tas) => {
            this.tas = tas;
        });
        this.bus.getSubscriber().on('ground_speed').withPrecision(0).handle((gs) => {
            this.groundSpeed = gs;
        });
        apValues.approachHasGP.sub(v => {
            if (this.state !== DirectorState.Inactive && !v) {
                this.deactivate();
            }
        });
    }
    /**
     * Activates this director.
     */
    activate() {
        this.state = DirectorState.Active;
        SimVar.SetSimVarValue(VNavVars.GPApproachMode, SimVarValueType.Number, ApproachGuidanceMode.GPActive);
        if (this.onActivate !== undefined) {
            this.onActivate();
        }
        SimVar.SetSimVarValue('AUTOPILOT GLIDESLOPE ACTIVE', 'Bool', true);
        SimVar.SetSimVarValue('AUTOPILOT APPROACH ACTIVE', 'Bool', true);
        SimVar.SetSimVarValue('AUTOPILOT GLIDESLOPE ARM', 'Bool', false);
    }
    /**
     * Arms this director.
     */
    arm() {
        if (this.state === DirectorState.Inactive) {
            this.state = DirectorState.Armed;
            SimVar.SetSimVarValue(VNavVars.GPApproachMode, SimVarValueType.Number, ApproachGuidanceMode.GPArmed);
            if (this.onArm !== undefined) {
                this.onArm();
            }
            SimVar.SetSimVarValue('AUTOPILOT GLIDESLOPE ARM', 'Bool', true);
            SimVar.SetSimVarValue('AUTOPILOT GLIDESLOPE ACTIVE', 'Bool', false);
            SimVar.SetSimVarValue('AUTOPILOT APPROACH ACTIVE', 'Bool', true);
        }
    }
    /**
     * Deactivates this director.
     */
    deactivate() {
        this.state = DirectorState.Inactive;
        SimVar.SetSimVarValue(VNavVars.GPApproachMode, SimVarValueType.Number, ApproachGuidanceMode.None);
        SimVar.SetSimVarValue('AUTOPILOT GLIDESLOPE ARM', 'Bool', false);
        SimVar.SetSimVarValue('AUTOPILOT GLIDESLOPE ACTIVE', 'Bool', false);
        SimVar.SetSimVarValue('AUTOPILOT APPROACH ACTIVE', 'Bool', false);
    }
    /**
     * Updates this director.
     */
    update() {
        if (this.state === DirectorState.Armed) {
            if (this.apValues.lateralActive.get() === APLateralModes.GPSS &&
                this.gpDeviation <= 100 && this.gpDeviation >= -15 && this.fpa !== 0) {
                this.activate();
            }
        }
        if (this.state === DirectorState.Active) {
            if (this.apValues.lateralActive.get() !== APLateralModes.GPSS) {
                this.deactivate();
            }
            this.setPitch(this.getDesiredPitch());
        }
    }
    /**
     * Gets a desired pitch from the selected vs value.
     * @returns The desired pitch angle.
     */
    getDesiredPitch() {
        const fpaPercentage = Math.max(this.gpDeviation / -100, -1) + 1;
        const pitchForFpa = MathUtils.clamp(this.fpa * fpaPercentage * -1, -8, 3);
        const vsRequiredForFpa = VNavUtils.getVerticalSpeedFromFpa(-pitchForFpa, this.groundSpeed);
        //We need the instant vertical wind component here so we're avoiding the bus
        const verticalWindComponent = this.verticalWindAverage.getAverage(SimVar.GetSimVarValue('AMBIENT WIND Y', SimVarValueType.FPM));
        const vsRequiredWithVerticalWind = vsRequiredForFpa - verticalWindComponent;
        const pitchForVerticalSpeed = VNavUtils.getFpa(UnitType.NMILE.convertTo(this.tas / 60, UnitType.FOOT), vsRequiredWithVerticalWind);
        //We need the instant AOA here so we're avoiding the bus
        const aoa = SimVar.GetSimVarValue('INCIDENCE ALPHA', SimVarValueType.Degree);
        return aoa + pitchForVerticalSpeed;
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
