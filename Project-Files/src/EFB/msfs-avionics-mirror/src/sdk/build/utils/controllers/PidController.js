/** A PID controller. */
export class PidController {
    /**
     * Creates a new PidController.
     * @param kP The proportional gain of the controller.
     * @param kI The integral gain of the controller.
     * @param kD The differential gain of the controller.
     * @param maxOut The maximum output of the controller.
     * @param minOut The minumum output of the controller.
     * @param maxI The maximum integral gain.
     * @param minI The minimum integral gain.
     */
    constructor(kP, kI, kD, maxOut, minOut, maxI = Number.MAX_SAFE_INTEGER, minI = Number.MIN_SAFE_INTEGER) {
        this.kP = kP;
        this.kI = kI;
        this.kD = kD;
        this.maxOut = maxOut;
        this.minOut = minOut;
        this.maxI = maxI;
        this.minI = minI;
        /** The previously sampled error. */
        this.previousError = 0;
        /** The previously generated output. */
        this.previousOutput = 0;
        /** The currently accumulated integral. */
        this.integral = 0;
    }
    /**
     * Gets the output of the PID controller at a given time.
     * @param deltaTime The difference in time between the previous sample and this sample.
     * @param error The amount of error seen between the desired output and the current output.
     * @returns The PID output.
     */
    getOutput(deltaTime, error) {
        const p = this.kP * error;
        if (Math.sign(error) === Math.sign(this.previousError)) {
            this.integral += ((error * deltaTime) + ((deltaTime * (error - this.previousError)) / 2)) * this.kI;
            this.integral = PidController.clamp(this.integral, this.maxI, this.minI);
        }
        else {
            this.integral = 0;
        }
        const i = this.integral;
        const d = this.kD * ((error - this.previousError) / deltaTime);
        const output = PidController.clamp(p + i + d, this.maxOut, this.minOut);
        this.previousError = error;
        this.previousOutput = output;
        return output;
    }
    /** Resets the controller. */
    reset() {
        this.previousError = 0;
        this.previousOutput = 0;
        this.integral = 0;
    }
    /**
     * Clamps a number to maximum and minimum values.
     * @param value The value to clamp.
     * @param max The maximum value.
     * @param min The minumum value.
     * @returns The clamped value.
     */
    static clamp(value, max, min) {
        return Math.min(Math.max(value, min), max);
    }
}
