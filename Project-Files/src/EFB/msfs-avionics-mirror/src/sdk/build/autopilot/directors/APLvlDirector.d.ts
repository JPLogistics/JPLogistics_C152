import { EventBus } from '../../data';
import { PlaneDirector, DirectorState } from '../PlaneDirector';
/**
 * An autopilot wing leveler director.
 */
export declare class APLvlDirector implements PlaneDirector {
    private readonly bus;
    state: DirectorState;
    /** A callback called when the wing leveler director activates. */
    onActivate?: () => void;
    /** A callback called when the wing leveler director arms. */
    onArm?: () => void;
    private currentBankRef;
    private desiredBank;
    private actualBank;
    private readonly bankServo;
    /**
     * Creates an instance of the wing leveler.
     * @param bus The event bus to use with this instance.
     */
    constructor(bus: EventBus);
    /**
     * Activates this director.
     */
    activate(): void;
    /**
     * Arms this director.
     * This director has no armed mode, so it activates immediately.
     */
    arm(): void;
    /**
     * Deactivates this director.
     */
    deactivate(): void;
    /**
     * Updates this director.
     */
    update(): void;
    /**
     * Sets the desired AP bank angle.
     * @param bankAngle The desired AP bank angle.
     */
    private setBank;
}
//# sourceMappingURL=APLvlDirector.d.ts.map