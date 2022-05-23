/// <reference types="msfstypes/JS/simvar" />
import { GeoPoint, MathUtils, SimpleMovingAverage, UnitType } from '../..';
import { SimVarValueType } from '../../data';
import { APLateralModes } from '../APConfig';
import { DirectorState } from '../PlaneDirector';
import { ApproachGuidanceMode } from '../VerticalNavigation';
import { VNavVars } from '../VNavEvents';
import { VNavUtils } from '../VNavUtils';
/**
 * A glideslope autopilot director.
 */
export class APGSDirector {
    /**
     * Creates an instance of the LateralDirector.
     * @param bus The event bus to use with this instance.
     * @param apValues is the APValues object from the Autopilot.
     */
    constructor(bus, apValues) {
        this.bus = bus;
        this.apValues = apValues;
        this.geoPointCache = [new GeoPoint(0, 0), new GeoPoint(0, 0), new GeoPoint(0, 0), new GeoPoint(0, 0)];
        this.ppos = new GeoPoint(0, 0);
        this.gsLocation = new GeoPoint(NaN, NaN);
        this.verticalWindAverage = new SimpleMovingAverage(10);
        this.tas = 0;
        this.groundSpeed = 0;
        this.state = DirectorState.Inactive;
        const nav = this.bus.getSubscriber();
        nav.on('nav_radio_active_glideslope').handle(gs => this.glideslope = gs);
        nav.on('nav_radio_active_gs_location').handle((loc) => {
            this.gsLocation.set(loc.lat, loc.long);
        });
        const gnss = this.bus.getSubscriber();
        gnss.on('gps-position').atFrequency(1).handle((lla) => {
            this.ppos.set(lla.lat, lla.long);
        });
        gnss.on('ground_speed').withPrecision(0).handle((gs) => {
            this.groundSpeed = gs;
        });
        this.bus.getSubscriber().on('tas').withPrecision(0).handle((tas) => {
            this.tas = tas;
        });
    }
    /**
     * Activates this director.
     */
    activate() {
        this.state = DirectorState.Active;
        SimVar.SetSimVarValue(VNavVars.GPApproachMode, SimVarValueType.Number, ApproachGuidanceMode.GSActive);
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
        if (this.canArm() && this.state === DirectorState.Inactive) {
            this.state = DirectorState.Armed;
            SimVar.SetSimVarValue(VNavVars.GPApproachMode, SimVarValueType.Number, ApproachGuidanceMode.GSArmed);
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
            if (this.apValues.lateralActive.get() === APLateralModes.LOC && this.glideslope !== undefined &&
                this.glideslope.isValid && this.glideslope.deviation <= 0.1 && this.glideslope.deviation >= -0.1) {
                this.activate();
            }
            if (!this.canArm()) {
                this.deactivate();
            }
        }
        if (this.state === DirectorState.Active) {
            if (this.apValues.lateralActive.get() !== APLateralModes.LOC) {
                this.deactivate();
            }
            this.trackGlideslope();
        }
    }
    /**
     * Method to check whether the director can arm.
     * @returns Whether or not this director can arm.
     */
    canArm() {
        if ((this.apValues.navToNavLocArm && this.apValues.navToNavLocArm()) || (this.glideslope !== undefined && this.glideslope.isValid)) {
            return true;
        }
        return false;
    }
    /**
     * Tracks the Glideslope.
     */
    trackGlideslope() {
        if (this.glideslope !== undefined && this.glideslope.isValid) {
            let gsDistance = UnitType.NMILE.convertTo(5, UnitType.METER);
            if (!isNaN(this.gsLocation.lat)) {
                const gsPosition = this.geoPointCache[0];
                gsPosition.set(this.gsLocation);
                const planePosGP = this.geoPointCache[1];
                planePosGP.set(this.ppos);
                gsDistance = UnitType.GA_RADIAN.convertTo(planePosGP.distance(gsPosition), UnitType.METER);
            }
            const gainDenominator = MathUtils.clamp((2200 - (0.4 * gsDistance)) / 3000, 0.1, 1);
            const fpaPercentage = Math.max(this.glideslope.deviation / gainDenominator, -1) + 1;
            const pitchForFpa = MathUtils.clamp(this.glideslope.gsAngle * fpaPercentage * -1, -8, 3);
            const vsRequiredForFpa = VNavUtils.getVerticalSpeedFromFpa(-pitchForFpa, this.groundSpeed);
            //We need the instant vertical wind component here so we're avoiding the bus
            const verticalWindComponent = this.verticalWindAverage.getAverage(SimVar.GetSimVarValue('AMBIENT WIND Y', SimVarValueType.FPM));
            const vsRequiredWithVerticalWind = vsRequiredForFpa - verticalWindComponent;
            const pitchForVerticalSpeed = VNavUtils.getFpa(UnitType.NMILE.convertTo(this.tas / 60, UnitType.FOOT), vsRequiredWithVerticalWind);
            //We need the instant AOA here so we're avoiding the bus
            const aoa = SimVar.GetSimVarValue('INCIDENCE ALPHA', SimVarValueType.Degree);
            const targetPitch = aoa + pitchForVerticalSpeed;
            SimVar.SetSimVarValue('AUTOPILOT PITCH HOLD REF', SimVarValueType.Degree, -targetPitch);
        }
        else {
            this.deactivate();
        }
    }
}
