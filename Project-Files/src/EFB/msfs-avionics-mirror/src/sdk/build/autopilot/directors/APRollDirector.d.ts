import { EventBus } from '../../data';
import { PlaneDirector, DirectorState } from '../PlaneDirector';
/**
 * Options for control of the roll director.
 */
export interface RollDirectorOptions {
    /** The minimum bank angle under which the roll director will go to wings level. */
    minimumBankAngle: number;
    /** The maximum bank angle that the roll director will not exceed. */
    maximumBankAngle: number;
}
/**
 * An autopilot roll director.
 */
export declare class APRollDirector implements PlaneDirector {
    private readonly bus;
    private readonly options?;
    state: DirectorState;
    /** A callback called when the LNAV director activates. */
    onActivate?: () => void;
    /** A callback called when the LNAV director arms. */
    onArm?: () => void;
    private currentBankRef;
    private desiredBank;
    private actualBank;
    private readonly bankServo;
    /**
     * Creates an instance of the LateralDirector.
     * @param bus The event bus to use with this instance.
     * @param options Options to set on the roll director for bank angle limitations.
     */
    constructor(bus: EventBus, options?: RollDirectorOptions | undefined);
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
//# sourceMappingURL=APRollDirector.d.ts.map