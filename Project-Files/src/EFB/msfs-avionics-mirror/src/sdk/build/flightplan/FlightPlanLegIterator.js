/**
 * A Utility Class that supports iterating through a flight plan either forward or reverse.
 */
export class FlightPlanLegIterator {
    constructor() {
        this.cursor = {
            segment: undefined,
            legIndex: -1,
            legDefinition: undefined,
            index: 0
        };
        this.cursorIsBusy = false;
    }
    /**
     * Method that checks whether the FlightPlanLegIterator is busy.
     * @returns Whether the cursor is busy.
     */
    isBusy() {
        return this.cursorIsBusy;
    }
    /**
     * Iterates through the active flight plan in reverse order.
     * @param lateralPlan The lateral flight plan to iterate through.
     * @param each The function to call for each flight plan leg.
     * @throws an Error if the cursor is busy.
     */
    iterateReverse(lateralPlan, each) {
        if (this.cursorIsBusy) {
            throw new Error('FlightPlanLegIterator - iterateReverse: The iterator cursor is busy');
        }
        this.cursorIsBusy = true;
        let segmentIndex = lateralPlan.segmentCount - 1;
        let index = 0;
        try {
            while (segmentIndex >= 0) {
                const segment = lateralPlan.getSegment(segmentIndex);
                let legIndex = segment.legs.length - 1;
                while (legIndex >= 0) {
                    this.cursor.legDefinition = segment.legs[legIndex];
                    this.cursor.legIndex = legIndex;
                    this.cursor.segment = segment;
                    this.cursor.index = index;
                    each(this.cursor);
                    legIndex--;
                    index++;
                }
                segmentIndex--;
            }
        }
        catch (error) {
            console.error(`FlightPlanLegIterator - iterateReverse: error in while loop: ${error}`);
            if (error instanceof Error) {
                console.error(error.stack);
            }
        }
        this.cursorIsBusy = false;
    }
    /**
     * Iterates through the active flight plan in forward order.
     * @param lateralPlan The lateral flight plan to iterate through.
     * @param each The function to call for each flight plan leg.
     * @throws an Error if the cursor is busy.
     */
    iterateForward(lateralPlan, each) {
        if (this.cursorIsBusy) {
            throw new Error('FlightPlanLegIterator - iterateForward: The iterator cursor is busy');
        }
        this.cursorIsBusy = true;
        let segmentIndex = 0;
        let index = 0;
        try {
            while (segmentIndex < lateralPlan.segmentCount) {
                const segment = lateralPlan.getSegment(segmentIndex);
                let legIndex = 0;
                while (legIndex < segment.legs.length) {
                    this.cursor.legDefinition = segment.legs[legIndex];
                    this.cursor.legIndex = legIndex;
                    this.cursor.segment = segment;
                    this.cursor.index = index;
                    each(this.cursor);
                    legIndex++;
                    index++;
                }
                segmentIndex++;
            }
        }
        catch (error) {
            console.error(`FlightPlanLegIterator - iterateForward: error in while loop: ${error}`);
            if (error instanceof Error) {
                console.error(error.stack);
            }
        }
        this.cursorIsBusy = false;
    }
}
