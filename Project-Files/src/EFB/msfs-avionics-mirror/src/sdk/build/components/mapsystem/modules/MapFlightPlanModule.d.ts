import { SubEvent, Subject } from '../../..';
import { FlightPlan, FlightPlanner } from '../../../flightplan';
import { MapSystemContext } from '../MapSystemContext';
import { AbstractMapModule } from './AbstractMapModule';
/**
 * A map data module that handles the display of flight plan data.
 */
export declare class MapFlightPlanModule extends AbstractMapModule {
    private readonly flightPlanner;
    private readonly plans;
    /**
     * Creates an instance of a MapFlightPlanModule.
     * @param flightPlanner The flight planner to use with this module.
     * @param context The context to use with this module
     */
    constructor(flightPlanner: FlightPlanner, context: MapSystemContext);
    private planCopiedHandler;
    private planCreatedHandler;
    private planDeletedHandler;
    private planChangeHandler;
    private planCalculatedHandler;
    private activeLegChangedHandler;
    private readonly subscriber;
    private fplCopied;
    private fplCreated;
    private fplDeleted;
    private fplDirectToDataChanged;
    private fplLoaded;
    private fplOriginDestChanged;
    private fplProcDetailsChanged;
    private fplSegmentChange;
    private fplUserDataDelete;
    private fplUserDataSet;
    private fplActiveLegChange;
    private fplCalculated;
    /**
     * Gets the flight plan subjects for a specified flight plan.
     * @param index The index of the flight plan.
     * @returns The subject for the specified plan index.
     */
    getPlanSubjects(index: number): PlanSubjects;
    /** @inheritdoc */
    startSync(): void;
    /** @inheritdoc */
    stopSync(): void;
}
/**
 * A collection of subjects for consuming flight plan data in the flight plan module.
 */
export declare class PlanSubjects {
    /** The current flight plan to display, if any. */
    flightPlan: Subject<FlightPlan | undefined>;
    /** An event that fires when the plan is changed. */
    planChanged: SubEvent<any, void>;
    /** An event that fired when the flight path of the plan is recalculated. */
    planCalculated: SubEvent<any, void>;
    /** The active leg index currently being navigated to. */
    activeLeg: Subject<number>;
}
//# sourceMappingURL=MapFlightPlanModule.d.ts.map