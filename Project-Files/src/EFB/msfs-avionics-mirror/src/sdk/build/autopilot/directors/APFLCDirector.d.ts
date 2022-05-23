import { EventBus } from '../../data';
import { PlaneDirector, DirectorState } from '../PlaneDirector';
import { APValues } from '../APConfig';
/**
 * A Flight Level Change autopilot director.
 */
export declare class APFLCDirector implements PlaneDirector {
    private readonly bus;
    state: DirectorState;
    /** A callback called when the director activates. */
    onActivate?: () => void;
    /** A callback called when the director arms. */
    onArm?: () => void;
    private _lastTime;
    private currentIas;
    private selectedIas;
    private selectedMach;
    private isSelectedSpeedInMach;
    private selectedAltitude;
    private currentAltitude;
    private currentPitch;
    private accelerationController;
    private pitchController;
    private filter;
    /**
     * Creates an instance of the FLC Director.
     * @param bus The event bus to use with this instance.
     * @param apValues is the AP selected values subject.
     */
    constructor(bus: EventBus, apValues: APValues);
    /**
     * Activates this director.
     */
    activate(): void;
    /**
     * Arms this director.
     * This director can be armed, but it will never automatically activate and remain in the armed state.
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
     * Initializes this director on activation.
     */
    private initialize;
    /**
     * Gets a desired pitch from the selected vs value.
     * @returns The desired pitch angle.
     */
    private getDesiredPitch;
    /**
     * Sets the desired AP pitch angle.
     * @param targetPitch The desired AP pitch angle.
     */
    private setPitch;
}
//# sourceMappingURL=APFLCDirector.d.ts.map