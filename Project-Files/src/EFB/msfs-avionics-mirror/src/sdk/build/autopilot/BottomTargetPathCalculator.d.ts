import { ReadonlySubEvent } from '..';
import { EventBus } from '../data/EventBus';
import { FlightPlanner } from '../flightplan';
import { VNavPathCalculator } from './VNavPathCalculator';
import { VNavConstraint, VerticalFlightPhase, VerticalFlightPlan } from './VerticalNavigation';
/**
 * Handles the calculation of the VNAV flight path for VNAV Implemetations that use only the bottom altitude of each constraint.
 */
export declare class BottomTargetPathCalculator implements VNavPathCalculator {
    private readonly bus;
    private readonly flightPlanner;
    private readonly primaryPlanIndex;
    /** The Vertical Flight Plans managed by this Path Calculator */
    private verticalFlightPlans;
    /** The default or user set FPA for this path calculator */
    flightPathAngle: number;
    /** The maximum FPA allowed for path calculator */
    maxFlightPathAngle: number;
    /** The aircraft's current altitude in meters. */
    private currentAltitude;
    /** Sub Event fired when a path has been calculated, with the planIndex */
    readonly vnavCalculated: ReadonlySubEvent<this, number>;
    private flightPlanIterator;
    /**
     * Creates an instance of the VNavPathCalculator.
     * @param bus The EventBus to use with this instance.
     * @param flightPlanner The flight planner to use with this instance.
     * @param primaryPlanIndex The primary flight plan index to use to calculate a path from.
     * @param defaultFpa The default FPA for this path calculator.
     * @param defaultMaxFpa The default maximum FPA value for this path calculator.
     */
    constructor(bus: EventBus, flightPlanner: FlightPlanner, primaryPlanIndex: number, defaultFpa: number, defaultMaxFpa: number);
    /** @inheritdoc */
    getVerticalFlightPlan(planIndex: number): VerticalFlightPlan;
    /** @inheritdoc */
    createVerticalPlan(planIndex: number): VerticalFlightPlan;
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
    /**
     * Gets the next altitude limit for the current phase of flight. (used to calculate the required VS and is not always the next constraint)
     * In descent, this will return the next above altitude in the vertical plan.
     * In climb, this will return the next below altitude in the vertical plan.
     * @param activeLateralLeg The current active lateral leg.
     * @returns The VNavConstraint not to exceed appropriate to the current phase of flight, or undefined if one does not exist.
     */
    getNextRestrictionForFlightPhase(activeLateralLeg: number): VNavConstraint | undefined;
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
     * Resets the VNAV plan segments, legs, and constraints based on the new plan.
     * @param lateralPlan The Lateral Flight Plan.
     * @param verticalPlan The Vertical Flight Plan.
     * @param verticalDirectIndex The vertical direct index, if any
     */
    private buildVerticalPath;
    /**
     * Computes the VNAV descent path.
     * @param verticalPlan The Vertical Flight Plan
     * @param lateralPlan The Lateral Flight Plan
     */
    private computeVnavPath;
    /**
     * Fills the VNAV plan leg and constraint segment distances.
     * @param verticalPlan The Vertical Flight Plan
     * @param lateralPlan The Lateral Flight Plan
     */
    private fillLegAndConstraintDistances;
    /**
     * Computes the flight path angles for each constraint segment.
     * @param verticalPlan The Vertical Flight Plan.
     * @returns Whether the flight path angles were computed.
     */
    private computeFlightPathAngles;
    /** @inheritdoc */
    getFirstDescentConstraintAltitude(planIndex: number): number | undefined;
    /**
     * Gets the constraint for a leg altitude restriction.
     * @param leg The leg to get the constraint for.
     * @returns The altitude constraint.
     */
    private getConstraintAltitude;
    /**
     * Creates a new empty constraint.
     * @param index The leg index of the constraint.
     * @param targetAltitude The altitude of the constraint.
     * @param name The name of the leg for the constraint.
     * @param type The type of constraint.
     * @returns A new empty constraint.
     */
    private createConstraint;
    /**
     * Creates a new VNAV plan leg.
     * @param segmentIndex The segment index for the leg.
     * @param legIndex The index of the leg within the segment.
     * @param name The name of the leg.
     * @param distance The leg distance.
     * @returns A new VNAV plan leg.
     */
    private createLeg;
    /**
     * Sends an event when a vertical plan has been updated.
     * @param planIndex The plan index that was updated.
     */
    private notify;
    /** @inheritdoc */
    requestPathCompute(planIndex: number): boolean;
}
//# sourceMappingURL=BottomTargetPathCalculator.d.ts.map