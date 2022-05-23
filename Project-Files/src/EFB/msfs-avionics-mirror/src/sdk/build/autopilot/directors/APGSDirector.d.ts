import { EventBus } from '../../data';
import { APValues } from '../APConfig';
import { PlaneDirector, DirectorState } from '../PlaneDirector';
/**
 * A glideslope autopilot director.
 */
export declare class APGSDirector implements PlaneDirector {
    private readonly bus;
    private readonly apValues;
    state: DirectorState;
    /** A callback called when the director activates. */
    onActivate?: () => void;
    /** A callback called when the director arms. */
    onArm?: () => void;
    private geoPointCache;
    private ppos;
    private gsLocation;
    private glideslope?;
    private verticalWindAverage;
    private tas;
    private groundSpeed;
    /**
     * Creates an instance of the LateralDirector.
     * @param bus The event bus to use with this instance.
     * @param apValues is the APValues object from the Autopilot.
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
     * Method to check whether the director can arm.
     * @returns Whether or not this director can arm.
     */
    private canArm;
    /**
     * Tracks the Glideslope.
     */
    private trackGlideslope;
}
//# sourceMappingURL=APGSDirector.d.ts.map