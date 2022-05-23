import { EventBus } from '../../data';
import { PlaneDirector, DirectorState } from '../PlaneDirector';
import { APValues } from '../APConfig';
/**
 * A heading autopilot director.
 */
export declare class APHdgDirector implements PlaneDirector {
    private readonly bus;
    state: DirectorState;
    /** A callback called when the director activates. */
    onActivate?: () => void;
    /** A callback called when the director arms. */
    onArm?: () => void;
    private currentBankRef;
    private currentHeading;
    private selectedHeading;
    private readonly bankServo;
    /**
     * Creates an instance of the LateralDirector.
     * @param bus The event bus to use with this instance.
     * @param apValues The AP Values from the Autopilot.
     */
    constructor(bus: EventBus, apValues: APValues);
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
    deactivate(): Promise<void>;
    /**
     * Updates this director.
     */
    update(): void;
    /**
     * Gets a desired bank from a Target Selected Heading.
     * @param targetHeading The target heading.
     * @returns The desired bank angle.
     */
    private desiredBank;
    /**
     * Sets the desired AP bank angle.
     * @param bankAngle The desired AP bank angle.
     */
    private setBank;
}
//# sourceMappingURL=APHdgDirector.d.ts.map