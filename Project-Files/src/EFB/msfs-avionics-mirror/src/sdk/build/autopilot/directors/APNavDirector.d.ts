import { EventBus } from '../../data';
import { PlaneDirector, DirectorState } from '../PlaneDirector';
import { APValues, APLateralModes } from '../APConfig';
/**
 * Calculates an intercept angle, in degrees, to capture the desired track from a navigation signal for
 * {@link APNavDirector}.
 * @param distanceToSource The distance from the plane to the source of the navigation signal, in nautical miles.
 * @param deflection The lateral deflection of the desired track relative to the plane, normalized from `-1` to `1`.
 * Negative values indicate that the desired track is to the left of the plane.
 * @param tas The true airspeed of the plane, in knots.
 * @param isLoc Whether the source of the navigation signal is a localizer. Defaults to `false`.
 * @returns The intercept angle, in degrees, to capture the desired track from the navigation signal.
 */
export declare type APNavDirectorInterceptFunc = (distanceToSource: number, deflection: number, tas: number, isLoc?: boolean) => number;
/**
 * A Nav/Loc autopilot director.
 */
export declare class APNavDirector implements PlaneDirector {
    private readonly bus;
    private readonly apValues;
    private readonly mode;
    private readonly lateralInterceptCurve?;
    state: DirectorState;
    /** A callback called when the director activates. */
    onActivate?: () => void;
    /** A callback called when the director arms. */
    onArm?: () => void;
    /** A callback called when the director deactivates. */
    onDeactivate?: () => void;
    private readonly bankServo;
    private currentBankRef;
    private currentHeading;
    private currentTrack;
    private navSource?;
    private cdi?;
    private obs?;
    private loc?;
    private magVar?;
    private ppos;
    private navLocation;
    private tas;
    private isApproachMode;
    /**
     * Creates an instance of the LateralDirector.
     * @param bus The event bus to use with this instance.
     * @param apValues Is the apValues object.
     * @param mode is the APLateralMode for this instance of the director.
     * @param lateralInterceptCurve The optional curve used to translate DTK and XTK into a track intercept angle.
     */
    constructor(bus: EventBus, apValues: APValues, mode: APLateralModes, lateralInterceptCurve?: APNavDirectorInterceptFunc | undefined);
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
     * Method to check whether the director can activate.
     * @returns Whether or not this director can activate.
     */
    private canActivate;
    /**
     * Gets a desired bank from the nav input data.
     * @returns The desired bank angle.
     */
    private desiredBank;
    /**
     * Gets a xtk value from the nav input data.
     * @param deviation is the input deviation value
     * @param isLoc is whether this is a LOC signal.
     * @returns The xtk value.
     */
    private getXtk;
    /**
     * Gets the lateral distance from PPOS to the nav signal.
     * @returns The distance value in nautical miles.
     */
    private getNavDistance;
    /**
     * Sets the desired AP bank angle.
     * @param bankAngle The desired AP bank angle.
     */
    private setBank;
    /**
     * Checks if we might be getting a wild deviation because of the zone of confusion and allows APNavDirector some time to resolve.
     * @returns Whether we might be in the zone of confusion.
     */
    private checkForZoneOfConfusion;
    /**
     * Method to monitor nav events to keep track of NAV related data needed for guidance.
     */
    private monitorEvents;
}
//# sourceMappingURL=APNavDirector.d.ts.map