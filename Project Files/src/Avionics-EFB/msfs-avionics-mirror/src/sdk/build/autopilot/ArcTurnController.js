import { ExpSmoother, PidController } from '..';
/**
 * A bank angle controller that maintains a constant radius turn.
 */
export class ArcTurnController {
    constructor() {
        this.bankController = new PidController(1.5, 0, 0, 15, -15);
        this.precessionController = new PidController(0.025, 0, 0, 300, -300);
        this.previousTime = new Date().appTime();
        this.filter = new ExpSmoother(500);
    }
    /**
     * Gets the bank angle output for a given radius error.
     * @param radiusError The radius error.
     * @returns The bank angle output.
     */
    getOutput(radiusError) {
        var _a;
        const currentTime = new Date().appTime();
        const dTime = currentTime - this.previousTime;
        let bankAngle = 0;
        if (this.previousRadiusError !== undefined) {
            const input = ((radiusError - this.previousRadiusError) / dTime) * 1000;
            const precessionRate = isNaN((_a = this.filter.last()) !== null && _a !== void 0 ? _a : NaN)
                ? this.filter.reset(input)
                : this.filter.next(input, dTime);
            const targetPrecessionRate = -this.precessionController.getOutput(dTime, radiusError);
            const precessionError = targetPrecessionRate - precessionRate;
            bankAngle = this.bankController.getOutput(dTime, precessionError);
            SimVar.SetSimVarValue('L:AP_RADUIS_ERROR', 'number', radiusError);
            SimVar.SetSimVarValue('L:AP_PRECESSION_RATE', 'number', precessionRate);
            SimVar.SetSimVarValue('L:AP_TARGET_PRECESSION_RATE', 'number', targetPrecessionRate);
            SimVar.SetSimVarValue('L:AP_BANK_ADJUSTMENT', 'number', bankAngle);
        }
        this.previousTime = currentTime;
        this.previousRadiusError = radiusError;
        return -bankAngle;
    }
    /**
     * Resets the controller.
     */
    reset() {
        this.previousTime = Date.now();
        this.previousRadiusError = undefined;
        this.precessionController.reset();
        this.bankController.reset();
    }
}
