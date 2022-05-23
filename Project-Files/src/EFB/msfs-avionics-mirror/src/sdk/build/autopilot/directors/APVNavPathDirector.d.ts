import { EventBus } from '../../data';
import { APValues } from '../APConfig';
import { PlaneDirector, DirectorState } from '../PlaneDirector';
/**
 * A VNAV Path autopilot director.
 */
export declare class APVNavPathDirector implements PlaneDirector {
    private readonly bus;
    private readonly apValues;
    state: DirectorState;
    /** @inheritdoc */
    onActivate?: () => void;
    /** @inheritdoc */
    onArm?: () => void;
    /** @inheritdoc */
    onDeactivate?: () => void;
    private deviation;
    private fpa;
    private verticalWindAverage;
    private tas;
    private groundSpeed;
    /**
     * Creates an instance of the APVNavPathDirector.
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
     * Gets a desired pitch from the FPA, AOA and Deviation.
     * @returns The desired pitch angle.
     */
    private getDesiredPitch;
    /**
     * Sets the desired AP pitch angle.
     * @param targetPitch The desired AP pitch angle.
     */
    private setPitch;
}
//# sourceMappingURL=APVNavPathDirector.d.ts.map