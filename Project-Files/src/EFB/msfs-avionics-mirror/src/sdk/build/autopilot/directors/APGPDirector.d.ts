import { EventBus } from '../../data';
import { APValues } from '../APConfig';
import { DirectorState, PlaneDirector } from '../PlaneDirector';
/**
 * An RNAV LPV glidepath autopilot director.
 */
export declare class APGPDirector implements PlaneDirector {
    private readonly bus;
    private readonly apValues;
    state: DirectorState;
    /** A callback called when the director activates. */
    onActivate?: () => void;
    /** A callback called when the director arms. */
    onArm?: () => void;
    private gpDeviation;
    private fpa;
    private verticalWindAverage;
    private tas;
    private groundSpeed;
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
//# sourceMappingURL=APGPDirector.d.ts.map