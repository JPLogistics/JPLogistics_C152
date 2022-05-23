import { FlightPlan } from './FlightPlan';
import { FlightPlanSegment, LegDefinition } from './FlightPlanning';
/**
 * A cursor for storing data while iterating
 * over the current flight plan.
 */
export interface IteratorCursor {
    /** The current plan segment. */
    segment: FlightPlanSegment;
    /** The current leg index within the segment. */
    legIndex: number;
    /** The current leg definition. */
    legDefinition: LegDefinition;
    /** The current iterator index. */
    index: number;
}
/**
 * A Utility Class that supports iterating through a flight plan either forward or reverse.
 */
export declare class FlightPlanLegIterator {
    private readonly cursor;
    private cursorIsBusy;
    /**
     * Method that checks whether the FlightPlanLegIterator is busy.
     * @returns Whether the cursor is busy.
     */
    isBusy(): boolean;
    /**
     * Iterates through the active flight plan in reverse order.
     * @param lateralPlan The lateral flight plan to iterate through.
     * @param each The function to call for each flight plan leg.
     * @throws an Error if the cursor is busy.
     */
    iterateReverse(lateralPlan: FlightPlan, each: (data: IteratorCursor) => void): void;
    /**
     * Iterates through the active flight plan in forward order.
     * @param lateralPlan The lateral flight plan to iterate through.
     * @param each The function to call for each flight plan leg.
     * @throws an Error if the cursor is busy.
     */
    iterateForward(lateralPlan: FlightPlan, each: (data: IteratorCursor) => void): void;
}
//# sourceMappingURL=FlightPlanLegIterator.d.ts.map