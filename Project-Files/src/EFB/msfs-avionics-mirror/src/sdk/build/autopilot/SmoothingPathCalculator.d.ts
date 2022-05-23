import { EventBus } from '../data';
import { FlightPlanner, LegDefinition } from '../flightplan';
import { VerticalFlightPhase, VerticalFlightPlan, VNavConstraint } from './VerticalNavigation';
import { VNavPathCalculator } from './VNavPathCalculator';
import { ReadonlySubEvent } from '../sub';
/**
 * Handles the calculation of the VNAV flight path for Path Smoothing VNAV Implementations.
 */
export declare class SmoothingPathCalculator implements VNavPathCalculator {
    private readonly bus;
    private readonly flightPlanner;
    private readonly primaryPlanIndex;
    /** The Vertical Flight Plans managed by this Path Calculator */
    private verticalFlightPlans;
    /** The default FPA for this path calculator */
    flightPathAngle: number;
    /** The maximum FPA allowed for path calculator */
    maxFlightPathAngle: number;
    /** The aircraft's current altitude in meters. */
    private currentAltitude;
    /** Sub Event fired when a path has been calculated, with the planIndex */
    readonly vnavCalculated: ReadonlySubEvent<this, number>;
    /**
     * Creates an instance of the VNavPathCalculator.
     * @param bus The EventBus to use with this instance.
     * @param flightPlanner The flight planner to use with this instance.
     * @param primaryPlanIndex The primary flight plan index to use to calculate a path from.
     * @param defaultFpa The default FPA for this path calculator.
     * @param defaultMaxFpa The default maximum FPA value for this path calculator.
     */
    constructor(bus: EventBus, flightPlanner: FlightPlanner, primaryPlanIndex: number, defaultFpa?: number, defaultMaxFpa?: number);
    /** @inheritdoc */
    getVerticalFlightPlan(planIndex: number): VerticalFlightPlan;
    /** @inheritdoc */
    createVerticalPlan(planIndex: number): VerticalFlightPlan;
    /** @inheritdoc */
    requestPathCompute(planIndex: number): boolean;
    /** @inheritdoc */
    setCurrentAlongLegDistance(planIndex: number, distance: number): void;
    /** @inheritdoc */
    getTargetAltitude(planIndex: number, globalLegIndex: number): number | undefined;
    /** @inheritdoc */
    getFlightPhase(planIndex: number): VerticalFlightPhase;
    /** @inheritdoc */
    getCurrentConstraintAltitude(planIndex: number, globalLegIndex: number): number | undefined;
    /** @inheritdoc */
    getNextConstraintAltitude(planIndex: number, globalLegIndex: number): number | undefined;
    /** @inheritdoc */
    getNextRestrictionForFlightPhase(planIndex: number, activeLateralLeg: number): VNavConstraint | undefined;
    /** @inheritdoc */
    activateVerticalDirect(planIndex: number, constraintGlobalLegIndex: number): void;
    /**
     * Sets an FPA on the current constraint when an event is received from the VNAV Profile Window via the bus.
     * @param fpa The FPA to set the constraint to manually.
     */
    private setFpaHandler;
    /**
     * Sets planChanged to true to flag that a plan change has been received over the bus.
     * @param planIndex The Plan Index that changed.
     * @param legChangeEvent The FlightPlanLegEvent, if any.
     * @param segmentChangeEvent The FlightPlanSegmentEvent, if any.
     */
    private onPlanChanged;
    /**
     * Method fired on a flight plan change event to rebuild the vertical path.
     * @param event The Flight Plan Calculated Event
     */
    private onPlanCalculated;
    /**
     * Resets the Vertical Flight Plan, populates the vertical segments and legs, finds and builds the vertical constraints.
     * @param lateralPlan The Lateral Flight Plan.
     * @param verticalPlan The Vertical Flight Plan.
     * @param verticalDirectIndex The vertical direct index, if any.
     */
    private buildVerticalLegsAndConstraints;
    /**
     * Builds the Vertical Flight Plan from the Lateral Flight Plan, setting the segments, legs, and constraints.
     * @param lateralPlan The Lateral Flight Plan.
     * @param verticalPlan The Vertical Flight Plan.
     * @param verticalDirectIndex The vertical direct index, if any.
     */
    private buildVerticalFlightPlan;
    /**
     * Computes the VNAV descent path.
     * @param lateralPlan The lateral Flight Plan
     * @param verticalPlan The Vertical Flight Plan
     * @returns True if the method completed successfully
     */
    private computeVnavPath;
    /**
     * Finds and removes invalid constrants from the vertical plan.
     * @param verticalPlan The Vertical Flight Plan.
     */
    private findAndRemoveInvalidConstraints;
    /**
     * Finds previously invalidated constraints and checks if they're now valid and, if so, reinserts them into the vertical plan.
     * @param verticalPlan The Vertical Flight Plan.
     * @param lateralPlan The Lateral Flight Plan.
     */
    private checkInvalidConstrantsAndReinsertIfValid;
    /**
     * Computes the flight path angles for each constraint segment.
     * @param verticalPlan The Vertical Flight Plan.
     * @param lateralPlan The Lateral Flight Plan.
     * @returns Whether the flight path angles were computed.
     */
    private computeFlightPathAngles;
    /**
     * Manages direct constraint types for this calculator, including when in the Mod or Active flight plans.
     * @param targetConstraint The target constraint to process.
     * @param currentPathSegmentMinFpa The current path segment min fpa value.
     * @param currentPathSegmentMaxFpa The current path segment max fpa value.
     * @param verticalPlan The vertical flight plan.
     * @param lateralPlan The lateral flight plan.
     * @returns The index or undefined.
     */
    private handleDirectToTargetConstraint;
    /**
     * Calculates and sets the target constraint FPA.
     * @param targetConstraint The target constraint to process.
     * @param legMinFpa The minimum FPA value for the current constraint leg.
     * @param legMaxFpa The maximum FPA value for the current constraint leg.
     * @param currentPathSegmentMinFpa The current path segment min fpa value.
     * @param currentPathSegmentMaxFpa The current path segment max fpa value.
     * @param currentConstraintIsFirstDescentConstraint The vertical flight plan.
     * @param currentConstraintIsFaf The lateral flight plan.
     * @returns The index or undefined.
     */
    private calculateAndSetTargetConstraintFpa;
    /** @inheritdoc */
    getFirstDescentConstraintAltitude(planIndex: number): number | undefined;
    /**
     * Sends an event when a vertical plan has been updated.
     * @param planIndex The plan index that was updated.
     */
    private notify;
    /**
     * Gets the constraint altitudes for a leg.
     * @param leg The leg to get the constraint for.
     * @returns The altitudes object, minimum altitude at index [0], maximum altitude at index [1]
     */
    private static getConstraintAltitudes;
    /**
     * Sets the first approach constraint altitudes based on the vertical plan and the approach start leg index.
     * @param verticalPlan The Vertical Flight Plan.
     * @param approachStartGlobalLegIndex The global leg index of the first approach leg.
     */
    private static setFirstApproachConstraintAltitudes;
    /**
     * Checks whether a leg constraint precedes a direct to or vertical direct to.
     * @param lateralPlan The Lateral Flight Plan.
     * @returns Whether the constraint precedes a vertical direct or direct to.
     */
    private static getDirectToGlobalLegIndex;
    /**
     * Checks whether a lateral leg is a current lateral direct to target.
     * @param lateralPlan The Lateral Flight Plan.
     * @param verticalPlan The Vertical Flight Plan.
     */
    private static setDirectToLegInVerticalPlan;
    /**
     * Checks whether a leg constraint is in a departure segment or is part of the missed approach.
     * @param lateralSegment The lateral FlightPlanSegment.
     * @param lateralLeg The lateral LegDefinition.
     * @returns Whether the leg constraint is in a departure segment or is part of the missed approach.
     */
    private static isConstraintInDepartureOrMissed;
    /**
     * Checks whether a leg constriant is a descent constraint and is higher than the prior descent leg constraint.
     * @param previousConstrant The previous VNav Constraint.
     * @param currentConstraint The current VNav Constraint.
     * @returns Whether the current constraint is higher than the previous constraint.
     */
    private static isConstraintHigherThanPriorConstraint;
    /**
     * Checks whether a leg constraint requires an FPA greater than the max allowed value.
     * @param previousConstrant The previous VNavConstraint.
     * @param currentConstraint The VNavConstraint being evaluated.
     * @param verticalPlan The vertical flight plan.
     * @param maxFpa The maximum FPA allowed.
     * @returns Whether this constraint requires an invalid FPA.
     */
    private static doesConstraintRequireInvalidFpa;
    /**
     * Checks whether a leg is eligible for VNav in this calculator.
     * @param lateralLeg The lateral LegDefinition.
     * @returns Whether the leg is eligible for vertical navigation.
     */
    static isLegVnavEligible(lateralLeg: LegDefinition): boolean;
    /**
     * Fills the VNAV plan leg and constraint segment distances.
     * @param lateralPlan The Lateral Flight Plan.
     * @param verticalPlan The Vertical Flight Plan.
     */
    private static fillLegDistances;
    /**
     * Fills the VNAV plan constraint distances.
     * @param verticalPlan The Vertical Flight Plan.
     */
    private static populateConstraints;
    /**
     * Finds the first descent constraint index.
     * @param verticalPlan The vertical flight plan.
     * @returns The constraint index or undefined.
     */
    private static getFirstDescentConstraintIndex;
    /**
     * Finds the last descent constraint index.
     * @param verticalPlan The vertical flight plan.
     * @returns The constraint index or undefined.
     */
    private static getLastDescentConstraintIndex;
    /**
     * Finds the prior max altitude in the descent path.
     * @param verticalPlan The Vertical Flight Plan.
     * @param currentConstraintIndex The current constraint index.
     * @param firstDescentConstraintIndex The first descent constraint index.
     * @returns The prior max altitude, or positive infinity if none exists.
     */
    private static findPriorMaxAltitude;
    /**
     * Applies path values to constraints in the smoothed path segment.
     * @param verticalPlan The Vertical Flight Plan.
     * @param targetConstraintIndex The target constraint index.
     * @param currentConstraintIndex The current constraint index.
     * @param nextMaxAltitude The calculated max altitude of the prior constraint.
     * @returns The index of the constraint that violated the next max altitude, or undefined.
     */
    private static applyPathValuesToSmoothedConstraints;
}
//# sourceMappingURL=SmoothingPathCalculator.d.ts.map