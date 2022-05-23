import { EventBus } from '../../data';
import { APValues } from '../APConfig';
import { PlaneDirector, DirectorState } from '../PlaneDirector';
/**
 * An altitude capture autopilot director.
 */
export declare class APAltCapDirector implements PlaneDirector {
    private readonly bus;
    private readonly apValues;
    private readonly captureAltitude;
    state: DirectorState;
    /** A callback called when the director activates. */
    onActivate?: () => void;
    /** A callback called when the director arms. */
    onArm?: () => void;
    private tas;
    private capturedAltitude;
    private indicatedAltitude;
    private verticalSpeed;
    private initialFpa;
    private selectedAltitude;
    private verticalWindAverage;
    /**
     * Creates an instance of the LateralDirector.
     * @param bus The event bus to use with this instance.
     * @param apValues are the ap selected values for the autopilot.
     * @param captureAltitude The captureAltitude Method to use to capture the altitude
     */
    constructor(bus: EventBus, apValues: APValues, captureAltitude?: (targetAltitude: number, indicatedAltitude: number, initialFpa: number) => number);
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
     * @param captured is whether the altitude was captured.
     */
    deactivate(captured?: boolean): void;
    /**
     * Updates this director.
     */
    update(): void;
    /**
     * Attempts to activate altitude capture.
     */
    private tryActivate;
    /**
     * Sets the initial capture FPA from the current vs value when capture is initiated.
     * @param vs target vertical speed.
     */
    private setCaptureFpa;
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
    /**
     * Default method to use for capturing a target altitude.
     * @param targetAltitude is the captured targed altitude
     * @param indicatedAltitude is the current indicated altitude
     * @param initialFpa is the FPA when capture was initiatiated
     * @returns The target pitch value to set.
     */
    private static captureAltitude;
}
//# sourceMappingURL=APAltCapDirector.d.ts.map