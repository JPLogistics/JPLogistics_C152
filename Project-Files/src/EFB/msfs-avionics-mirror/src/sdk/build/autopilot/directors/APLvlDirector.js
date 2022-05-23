/// <reference types="msfstypes/JS/simvar" />
import { LinearServo } from '../../utils/controllers';
import { DirectorState } from '../PlaneDirector';
/**
 * An autopilot wing leveler director.
 */
export class APLvlDirector {
    /**
     * Creates an instance of the wing leveler.
     * @param bus The event bus to use with this instance.
     */
    constructor(bus) {
        this.bus = bus;
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
        this.desiredBank = 0;
        if (this.onActivate !== undefined) {
            this.onActivate();
        }
        SimVar.SetSimVarValue('AUTOPILOT WING LEVELER', 'Bool', true);
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
        SimVar.SetSimVarValue('AUTOPILOT WING LEVELER', 'Bool', false);
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
