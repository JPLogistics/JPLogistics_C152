/// <reference types="msfstypes/JS/simvar" />
import { LinearServo } from '../../utils/controllers';
import { DirectorState } from '../PlaneDirector';
/**
 * An autopilot roll director.
 */
export class APRollDirector {
    /**
     * Creates an instance of the LateralDirector.
     * @param bus The event bus to use with this instance.
     * @param options Options to set on the roll director for bank angle limitations.
     */
    constructor(bus, options) {
        this.bus = bus;
        this.options = options;
        this.currentBankRef = 0;
        this.desiredBank = 0;
        this.actualBank = 0;
        this.bankServo = new LinearServo(10);
        this.state = DirectorState.Inactive;
        const adc = this.bus.getSubscriber();
        adc.on('roll_deg').withPrecision(1).handle((roll) => {
            this.actualBank = roll;
        });
    }
    /**
     * Activates this director.
     */
    activate() {
        this.state = DirectorState.Active;
        if (this.options !== undefined) {
            if (this.actualBank <= this.options.minimumBankAngle) {
                this.desiredBank = 0;
            }
            else if (this.actualBank > this.options.maximumBankAngle) {
                this.desiredBank = this.options.maximumBankAngle;
            }
            else {
                this.desiredBank = this.actualBank;
            }
        }
        else {
            this.desiredBank = this.actualBank;
        }
        if (this.onActivate !== undefined) {
            this.onActivate();
        }
        SimVar.SetSimVarValue('AUTOPILOT BANK HOLD', 'Bool', true);
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
        this.desiredBank = 0;
        SimVar.SetSimVarValue('AUTOPILOT BANK HOLD', 'Bool', false);
    }
    /**
     * Updates this director.
     */
    update() {
        if (this.state === DirectorState.Active) {
            this.setBank(this.desiredBank);
        }
    }
    /**
     * Sets the desired AP bank angle.
     * @param bankAngle The desired AP bank angle.
     */
    setBank(bankAngle) {
        if (isFinite(bankAngle)) {
            this.currentBankRef = this.bankServo.drive(this.currentBankRef, bankAngle);
            SimVar.SetSimVarValue('AUTOPILOT BANK HOLD REF', 'degrees', this.currentBankRef);
        }
    }
}
