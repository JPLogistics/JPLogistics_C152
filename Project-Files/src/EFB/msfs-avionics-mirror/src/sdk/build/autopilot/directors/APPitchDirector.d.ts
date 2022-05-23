import { EventBus } from '../../data';
import { PlaneDirector, DirectorState } from '../PlaneDirector';
import { APValues } from '../APConfig';
/**
 * An autopilot pitch director.
 */
export declare class APPitchDirector implements PlaneDirector {
    private readonly bus;
    private readonly apValues;
    state: DirectorState;
    /** A callback called when the director activates. */
    onActivate?: () => void;
    /** A callback called when the director arms. */
    onArm?: () => void;
    private selectedPitch;
    private currentPitch;
    /**
     * Creates an instance of the LateralDirector.
     * @param bus The event bus to use with this instance.
     * @param apValues are the AP Values subjects.
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
    deactivate(): void;
    /**
     * Updates this director.
     */
    update(): void;
    /**
     * Sets the desired AP pitch angle.
     * @param targetPitch The desired AP pitch angle.
     */
    private setPitch;
}
//# sourceMappingURL=APPitchDirector.d.ts.map