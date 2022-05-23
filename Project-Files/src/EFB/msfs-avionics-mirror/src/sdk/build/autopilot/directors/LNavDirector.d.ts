import { EventBus } from '../../data';
import { FlightPlanner, LegCalculations, FlightPathVector } from '../../flightplan';
import { DirectorState, PlaneDirector, ObsDirector } from '../PlaneDirector';
import { LNavTransitionMode } from '../LNavEvents';
/**
 * Calculates an intercept angle, in degrees, to capture the desired GPS track for {@link LNavDirector}.
 * @param dtk The desired track, in degrees true.
 * @param xtk The cross-track error, in nautical miles. Negative values indicate that the plane is to the left of the
 * desired track.
 * @param tas The true airspeed of the plane, in knots.
 * @returns The intercept angle, in degrees, to capture the desired track from the navigation signal.
 */
export declare type LNavDirectorInterceptFunc = (dtk: number, xtk: number, tas: number) => number;
/**
 * A class that handles lateral navigation.
 */
export declare class LNavDirector implements PlaneDirector {
    private readonly bus;
    private readonly flightPlanner;
    private readonly obsDirector?;
    private readonly lateralInterceptCurve?;
    private readonly vec3Cache;
    private readonly geoPointCache;
    private readonly geoCircleCache;
    previousLegIndex: number;
    /** The current active leg index. */
    currentLegIndex: number;
    /** The current flight path vector index. */
    currentVectorIndex: number;
    state: DirectorState;
    /** A callback called when the LNAV director activates. */
    onActivate?: () => void;
    /** A callback called when the LNAV director arms. */
    onArm?: () => void;
    private readonly aircraftState;
    private currentLeg;
    private dtk;
    private xtk;
    private bearingToVectorEnd;
    private courseToSteer;
    private alongVectorDistance;
    private vectorDistanceRemaining;
    private transitionMode;
    private isSuspended;
    private suspendedLegIndex;
    private resetVectorsOnSuspendEnd;
    private inhibitNextSequence;
    private missedApproachActive;
    private currentBankRef;
    private readonly arcController;
    private readonly bankServo;
    private readonly lnavData;
    private isObsDirectorTracking;
    private canArm;
    private trackAtActivation;
    private isInterceptingFromArmedState;
    private awaitCalculateId;
    private isAwaitingCalculate;
    private readonly lnavDataHandler;
    /**
     * Creates an instance of the LateralDirector.
     * @param bus The event bus to use with this instance.
     * @param flightPlanner The flight planner to use with this instance.
     * @param obsDirector The OBS Director.
     * @param lateralInterceptCurve The optional curve used to translate DTK and XTK into a track intercept angle.
     */
    constructor(bus: EventBus, flightPlanner: FlightPlanner, obsDirector?: ObsDirector | undefined, lateralInterceptCurve?: LNavDirectorInterceptFunc | undefined);
    /**
     * Activates the LNAV director.
     */
    activate(): void;
    /**
     * Arms the LNAV director.
     */
    arm(): void;
    /**
     * Deactivates the LNAV director.
     */
    deactivate(): void;
    /**
     * Updates the lateral director.
     */
    update(): void;
    /**
     * Navigates the provided leg flight path.
     * @param calcs The legs calculations that has the provided flight path.
     */
    private navigateFlightPath;
    /**
     * Adjusts the desired bank angle for arc vectors.
     * @param vector The arc vector to adjust for.
     * @param bankAngle The current starting input desired bank angle.
     * @returns The adjusted bank angle.
     */
    private adjustBankAngleForArc;
    /**
     * Sets the desired AP bank angle.
     * @param bankAngle The desired AP bank angle.
     */
    private setBank;
    /**
     * Gets a desired bank from a desired track.
     * @param desiredTrack The desired track.
     * @returns The desired bank angle.
     */
    private desiredBank;
    /**
     * Calculates the tracking from the current leg.
     */
    private calculateTracking;
    /**
     * Applies suspends that apply at the end of a leg.
     */
    private applyEndOfLegSuspends;
    /**
     * Applies suspends that apply at the beginning of a leg.
     */
    private applyStartOfLegSuspends;
    /**
     * Advances the current flight path vector along the flight path.
     * @param leg The definition of the leg being flown.
     */
    private advanceVector;
    /**
     * Advances the current flight plan leg to the next leg.
     * @param leg The current leg being flown.
     * @returns Whether the leg was advanced.
     */
    private advanceEgressToIngress;
    /**
     * Sets flight plan advance in or out of SUSP.
     * @param isSuspended Whether or not advance is suspended.
     * @param resetVectorsOnSuspendEnd Whether to reset the tracked vector to the beginning of the leg when the applied
     * suspend ends. Ignored if `isSuspended` is false. Defaults to false.
     * @param inhibitResuspend Whether to allow re-suspending a previously suspended leg.
     */
    private trySetSuspended;
    /**
     * Tries to activate when armed.
     */
    private tryActivate;
    /**
     * Awaits a flight plan calculation. Starts a calculation of the active flight plan and suspends all tracking and
     * sequencing until the calculation is finished. If this method is called while a previous execution is still
     * awaiting, the new await takes precedence.
     */
    private awaitCalculate;
    /**
     * Gets the along-track distance from the start of the currently tracked flight plan leg to the airplane's present
     * position, in nautical miles.
     * @param leg The currently tracked flight plan leg.
     * @param vectorIndex The index of the currently tracked vector.
     * @param alongVectorDistance The along-track distance from the start of the currently tracked vector to the
     * airplane's present position, in nautical miles.
     * @returns The along-track distance from the start of the currently tracked flight plan leg to the airplane's
     * present position, in nautical miles.
     */
    private getAlongLegDistance;
    /**
     * Gets the along-track distance from the airplane's present position to the end of the currently tracked flight plan
     * leg, in nautical miles.
     * @param leg The currently tracked flight plan leg.
     * @param vectorIndex The index of the currently tracked vector.
     * @param vectorDistanceRemaining The along-track distance from the airplane's present position to the end of the
     * currently tracked vector, in nautical miles.
     * @returns The along-track distance from the airplane's present position to the end of the currently tracked flight
     * plan leg, in nautical miles.
     */
    private getLegDistanceRemaining;
    /**
     * Gets the flight path vectors to navigate for a leg and a given transition mode.
     * @param calc The calculations for a flight plan leg.
     * @param mode A transition mode.
     * @param isSuspended Whether sequencing is suspended.
     * @returns The flight path vectors to navigate for the given leg and transition mode.
     */
    static getVectorsForTransitionMode(calc: LegCalculations, mode: LNavTransitionMode, isSuspended: boolean): FlightPathVector[];
}
//# sourceMappingURL=LNavDirector.d.ts.map