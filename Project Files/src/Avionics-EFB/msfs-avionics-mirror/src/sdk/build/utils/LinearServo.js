/** A class that linearly drives a SimVar value towards a given set point. */
export class LinearServo {
    /**
     * Creates an instance of a LinearServo.
     * @param rate The rate, in units per second, to drive the servo.
     */
    constructor(rate) {
        this.rate = rate;
    }
    /**
     * Drives the servo towards the set point.
     * @param currentValue The current value.
     * @param setValue The value to drive towards.
     * @returns The output value.
     */
    drive(currentValue, setValue) {
        if (this.currentTime === undefined) {
            this.currentTime = new Date().appTime();
            return currentValue;
        }
        const currentTime = new Date().appTime();
        const deltaTime = currentTime - this.currentTime;
        this.currentTime = currentTime;
        const deltaValue = setValue - currentValue;
        const maximumDrive = this.rate * (deltaTime / 1000);
        const output = Math.abs(deltaValue) > maximumDrive
            ? currentValue + (Math.sign(deltaValue) * maximumDrive)
            : setValue;
        return output;
    }
}
