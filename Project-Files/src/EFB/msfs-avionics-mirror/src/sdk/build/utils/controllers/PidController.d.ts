/** A PID controller. */
export declare class PidController {
    private kP;
    private kI;
    private kD;
    private maxOut;
    private minOut;
    private maxI;
    private minI;
    /** The previously sampled error. */
    private previousError;
    /** The previously generated output. */
    private previousOutput;
    /** The currently accumulated integral. */
    private integral;
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
    constructor(kP: number, kI: number, kD: number, maxOut: number, minOut: number, maxI?: number, minI?: number);
    /**
     * Gets the output of the PID controller at a given time.
     * @param deltaTime The difference in time between the previous sample and this sample.
     * @param error The amount of error seen between the desired output and the current output.
     * @returns The PID output.
     */
    getOutput(deltaTime: number, error: number): number;
    /** Resets the controller. */
    reset(): void;
    /**
     * Clamps a number to maximum and minimum values.
     * @param value The value to clamp.
     * @param max The maximum value.
     * @param min The minumum value.
     * @returns The clamped value.
     */
    static clamp(value: number, max: number, min: number): number;
}
//# sourceMappingURL=PidController.d.ts.map