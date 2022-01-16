/** A class that linearly drives a SimVar value towards a given set point. */
export declare class LinearServo {
    private rate;
    /** The current time. */
    private currentTime?;
    /**
     * Creates an instance of a LinearServo.
     * @param rate The rate, in units per second, to drive the servo.
     */
    constructor(rate: number);
    /**
     * Drives the servo towards the set point.
     * @param currentValue The current value.
     * @param setValue The value to drive towards.
     * @returns The output value.
     */
    drive(currentValue: number, setValue: number): number;
}
//# sourceMappingURL=LinearServo.d.ts.map