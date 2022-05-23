import { FlightPlan, FlightPlanLegIterator, LegDefinition } from '../flightplan';
import { TodBodDetails, VerticalFlightPlan, VNavConstraint, VNavLeg, VNavPlanSegment } from './VerticalNavigation';
/**
 * A Utility Class for VNAV
 */
export declare class VNavUtils {
    /**
     * Checks if a constraint is a user-created constraint.
     * @param lateralLeg The Lateral Flight Plan Leg.
     * @returns If this constraint is a user-created constraint.
     */
    static isUserConstraint(lateralLeg: LegDefinition): boolean;
    /**
     * Gets the current required vertical speed.
     * @param distance is the distance to the constraint (in nautical miles).
     * @param targetAltitude is the target altitude for the constraint (in meters).
     * @param currentAltitude is the current altitude (in feet)
     * @param groundSpeed is the current groundspeed
     * @returns the required vs in fpm.
     */
    static getRequiredVs(distance: number, targetAltitude: number, currentAltitude: number, groundSpeed: number): number;
    /**
     * Gets the requiured vertical speed for a given FPA and groundspeed.
     * @param fpa The FPA in degrees
     * @param groundspeed The current groundspeed.
     * @returns The rate of descent required to descend at the specified FPA in ft/minute.
     */
    static getVerticalSpeedFromFpa(fpa: number, groundspeed: number): number;
    /**
     * Gets the flight path angle for a given distance and altitude.
     * @param distance The distance to get the angle for.
     * @param altitude The altitude to get the angle for.
     * @returns The required flight path angle, in degrees.
     */
    static getFpa(distance: number, altitude: number): number;
    /**
     * Gets an increase in altitude for a given flight path angle and
     * lateral distance.
     * @param fpa The flight path angle to use, in degrees.
     * @param distance The lateral distance.
     * @returns The increase in altitude.
     */
    static altitudeForDistance(fpa: number, distance: number): number;
    /**
     * Gets a lateral distance for a given altitude increase and flight
     * path angle.
     * @param fpa The flight path angle to use, in degrees.
     * @param altitude The increase in altitude.
     * @returns The lateral distance.
     */
    static distanceForAltitude(fpa: number, altitude: number): number;
    /**
     * Gets the missed approach leg index.
     * @param plan The flight plan.
     * @returns The Destination leg global leg index.
     */
    static getMissedApproachLegIndex(plan: FlightPlan): number;
    /**
     * Gets the FAF index in the plan.
     * @param plan The flight plan.
     * @returns The FAF index in the plan.
     */
    static getFafIndex(plan: FlightPlan): number | undefined;
    /**
     * Finds and returns the FAF index in the plan.
     * @param lateralPlan The lateral flight plan.
     * @param iterator The FlightPlanLegIterator instance.
     * @returns The FAF index in the lateral flight plan.
     */
    static getFafIndexReverse(lateralPlan: FlightPlan, iterator: FlightPlanLegIterator): number;
    /**
     * Gets the index of the constraint containing an indexed leg.
     * @param verticalPlan The vertical flight plan
     * @param globalLegIndex The global leg index to find the constraint for.
     * @returns The index of the constraint containing the leg at the specified global index, or -1 if one could not be
     * found.
     */
    static getConstraintIndexFromLegIndex(verticalPlan: VerticalFlightPlan, globalLegIndex: number): number;
    /**
     * Gets the VNAV Constraint immediately prior to the constraint that contains a flight plan leg.
     * @param verticalPlan The vertical flight plan
     * @param globalLegIndex The global leg index of a flight plan leg.
     * @returns The VNAV Constraint immediately prior to the constraint that contains the flight plan leg with the
     * specified global leg index.
     */
    static getPriorConstraintFromLegIndex(verticalPlan: VerticalFlightPlan, globalLegIndex: number): VNavConstraint | undefined;
    /**
     * Gets and returns whether the input leg index is a path end.
     * @param verticalPlan The vertical flight plan.
     * @param globalLegIndex is the global leg index to check.
     * @returns whether the input leg index is a path end.
     */
    static getIsPathEnd(verticalPlan: VerticalFlightPlan, globalLegIndex: number): boolean;
    /**
     * Gets the VNAV Constraint that contains the supplied leg index.
     * @param verticalPlan The vertical flight plan.
     * @param globalLegIndex The flight plan global leg index to find the constraint for.
     * @returns The VNAV Constraint that contains the input leg index.
     */
    static getConstraintFromLegIndex(verticalPlan: VerticalFlightPlan, globalLegIndex: number): VNavConstraint | undefined;
    /**
     * Gets the global leg index for the constraint containing an indexed leg.
     * @param verticalPlan The vertical plan.
     * @param globalLegIndex A global leg index.
     * @returns The global leg index for the constraint containing the leg at the specified global index, or -1 if one
     * could not be found.
     */
    static getConstraintLegIndexFromLegIndex(verticalPlan: VerticalFlightPlan, globalLegIndex: number): number;
    /**
     * Gets a constraint segment distance from the constraint legs.
     * @param constraint The constraint to calculate a distance for.
     * @returns The constraint distance.
     */
    static getConstraintDistanceFromConstraint(constraint: VNavConstraint): number;
    /**
     * Gets a constraint segment distance from the Vertical Plan legs.
     * @param constraint The constraint to calculate a distance for.
     * @param previousConstraint The constraint that preceds the constraint we are calculating the distance for.
     * @param verticalPlan The Vertical Flight Plan.
     * @returns The constraint distance.
     */
    static getConstraintDistanceFromLegs(constraint: VNavConstraint, previousConstraint: VNavConstraint | undefined, verticalPlan: VerticalFlightPlan): number;
    /**
     * Gets and returns the vertical direct constraint based on an input index.
     * @param verticalPlan The vertical flight plan.
     * @param selectedGlobalLegIndex The global leg index selected for vertical direct.
     * @param activeLegIndex The active leg index.
     * @returns The Vnav Constraint for the vertical direct or undefined.
     */
    static getVerticalDirectConstraintFromIndex(verticalPlan: VerticalFlightPlan, selectedGlobalLegIndex: number, activeLegIndex: number): VNavConstraint | undefined;
    /**
     * Gets the VNAV desired altitude.
     * @param verticalPlan The vertical flight plan.
     * @param globalLegIndex The global leg index to get the target for.
     * @param distanceAlongLeg The distance along the leg the aircraft is presently.
     * @returns The current VNAV desired altitude.
     */
    static getDesiredAltitude(verticalPlan: VerticalFlightPlan, globalLegIndex: number, distanceAlongLeg: number): number;
    /**
     * Gets and returns the FAF altitude.
     * @param verticalPlan The vertical flight plan.
     * @returns the FAF constraint altitude.
     */
    static getFafAltitude(verticalPlan: VerticalFlightPlan): number | undefined;
    /**
     * Gets the VNAV TOD/BOD details for a vertical flight plan.
     * @param verticalPlan The vertical flight plan.
     * @param activeLegIndex The current active leg index.
     * @param distanceAlongLeg The distance the plane is along the current leg in meters.
     * @param currentAltitude The current indicated altitude in meters.
     * @param currentVS The current vertical speed in meters per minute.
     * @param out The object to which to write the TOD/BOD details.
     * @returns The VNAV TOD/BOD details.
     */
    static getTodBodDetails(verticalPlan: VerticalFlightPlan, activeLegIndex: number, distanceAlongLeg: number, currentAltitude: number, currentVS: number, out: TodBodDetails): TodBodDetails;
    /**
     * Gets a VNAV leg from a vertical flight plan.
     * @param verticalPlan The vertical flight plan.
     * @param globalLegIndex The global leg index of the leg to get.
     * @returns The requested VNAV leg.
     * @throws Not found if the index is not valid.
     */
    static getVerticalLegFromPlan(verticalPlan: VerticalFlightPlan, globalLegIndex: number): VNavLeg;
    /**
     * Gets a VNAV leg from the plan from a specified segment.
     * @param verticalPlan The vertical flight plan.
     * @param segmentIndex The segment index of the leg to get.
     * @param legIndex The index of the leg to get within the specified segment.
     * @returns The requested VNAV leg.
     * @throws Not found if the index is not valid.
     */
    static getVerticalLegFromSegmentInPlan(verticalPlan: VerticalFlightPlan, segmentIndex: number, legIndex: number): VNavLeg;
    /**
     * Gets the constraint for a vertical direct based on an input global leg index.
     * @param verticalPlan The vertical flight plan.
     * @param activeGlobalLegIndex The current active global leg index.
     * @param selectedGlobalLegIndex The input global leg index selected.
     * @returns The constraint, or undefined if none exists.
     */
    static getConstraintForVerticalDirect(verticalPlan: VerticalFlightPlan, activeGlobalLegIndex: number, selectedGlobalLegIndex: number): VNavConstraint | undefined;
    /**
     * Gets the VNAV segments from the calculated VNAV plan.
     * @param verticalPlan The vertical flight plan.
     * @returns The vnav segments.
     * @throws Not found if the index is not valid.
     */
    static getVerticalSegmentsFromPlan(verticalPlan: VerticalFlightPlan): VNavPlanSegment[];
    /**
     * Gets whether a lateral plan leg is a hold or procedure turn.
     * @param lateralLeg The Lateral Leg in the flight plan (LegDefinition).
     * @returns Whether the leg is a hold or procedure turn.
     */
    static isLegTypeHoldOrProcedureTurn(lateralLeg: LegDefinition): boolean;
    /**
     * Creates a new empty vertical flight plan constraint.
     * @param index The leg index of the constraint.
     * @param minAltitude The bottom altitude of the constraint.
     * @param maxAltitude THe top altitude of the constraint.
     * @param name The name of the leg for the constraint.
     * @param type The type of constraint.
     * @returns A new empty constraint.
     */
    static createConstraint(index: number, minAltitude: number, maxAltitude: number, name: string, type?: 'climb' | 'descent' | 'direct' | 'missed' | 'manual'): VNavConstraint;
    /**
     * Creates a new vertical flight plan leg.
     * @param segmentIndex The segment index for the leg.
     * @param legIndex The index of the leg within the segment.
     * @param name The name of the leg.
     * @param distance The leg distance.
     * @returns A new VNAV plan leg.
     */
    static createLeg(segmentIndex: number, legIndex: number, name: string, distance?: number): VNavLeg;
}
//# sourceMappingURL=VNavUtils.d.ts.map