import { EventBus } from '../../data';
import { APValues } from '../APConfig';
import { PlaneDirector, DirectorState } from '../PlaneDirector';
/**
 * An altitude hold autopilot director.
 */
export declare class APAltDirector implements PlaneDirector {
    private readonly bus;
    state: DirectorState;
    /** A callback called when the director activates. */
    onActivate?: () => void;
    /** A callback called when the director arms. */
    onArm?: () => void;
    private tas;
    private capturedAltitude;
    private indicatedAltitude;
    private verticalWindAverage;
    /**
     * Creates an instance of the LateralDirector.
     * @param bus The event bus to use with this instance.
     * @param apValues are the ap selected values for the autopilot.
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
     * Attempts to activate altitude capture.
     */
    private tryActivate;
    /**
     * Holds a captured altitude.
     * @param targetAltitude is the captured targed altitude
     */
    private holdAltitude;
    /**
     * Gets a desired pitch from the selected vs value.
     * @param vs target vertical speed.
     * @returns The desired pitch angle.
     */
    private getDesiredPitch;
    /**
     * Gets a desired fpa.
     * @param distance is the distance traveled per minute.
     * @param altitude is the vertical speed per minute.
     * @returns The desired pitch angle.
     */
    private getFpa;
    /**
     * Sets the desired AP pitch angle.
     * @param targetPitch The desired AP pitch angle.
     */
    private setPitch;
}
//# sourceMappingURL=APAltDirector.d.ts.map