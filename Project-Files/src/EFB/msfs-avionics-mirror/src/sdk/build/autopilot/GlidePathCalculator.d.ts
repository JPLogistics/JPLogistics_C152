import { EventBus } from '../data';
import { FlightPlanner } from '../flightplan';
/**
 * Handles the calculation of a Glide Path.
 */
export declare class GlidePathCalculator {
    private readonly bus;
    private readonly flightPlanner;
    private readonly primaryPlanIndex;
    private mapLegIndex;
    private fafLegIndex;
    private readonly planePos;
    glidepathFpa: number;
    private flightPlanIterator;
    /**
     * Creates an instance of the GlidePathCalculator.
     * @param bus The EventBus to use with this instance.
     * @param flightPlanner The flight planner to use with this instance.
     * @param primaryPlanIndex The primary plan index to use for calculating GlidePath.
     */
    constructor(bus: EventBus, flightPlanner: FlightPlanner, primaryPlanIndex: number);
    private onPlanChanged;
    private onPlanCalculated;
    /**
     * Gets the current Glidepath distance.
     * @param index The current leg index.
     * @param distanceAlongLeg The distance along the leg the aircraft is presently.
     * @returns The current Glidepath distance.
     */
    getGlidepathDistance(index: number, distanceAlongLeg: number): number;
    /**
     * Gets the Glidepath desired altitude.
     * @param distance The current Glidepath distance.
     * @returns The current Glidepath desired altitude.
     */
    getDesiredGlidepathAltitude(distance: number): number;
    /**
     * Gets the Glidepath runway altitude.
     * @returns The Glidepath runway altitude.
     */
    getRunwayAltitude(): number;
    /**
     * Calculates the Glidepath flight path angle using the destination elevation
     * and FAF altitude restriction.
     * @param plan The plan to calculate from.
     */
    private calcGlidepathFpa;
}
//# sourceMappingURL=GlidePathCalculator.d.ts.map