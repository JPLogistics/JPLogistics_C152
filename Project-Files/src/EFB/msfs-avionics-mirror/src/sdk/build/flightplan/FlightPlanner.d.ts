import { EventBus } from '../data';
import { FlightPlanLeg } from '../navigation/Facilities';
import { SubEvent } from '../sub/SubEvent';
import { FlightPathCalculator } from './FlightPathCalculator';
import { ActiveLegType, DirectToData, FlightPlan, OriginDestChangeType, PlanChangeType } from './FlightPlan';
import { FlightPlanSegment, LegDefinition, ProcedureDetails } from './FlightPlanning';
/**
 * Events published by the FlightPlanner class.
 */
export interface FlightPlannerEvents {
    /** A flight plan has been modified from a secondary source */
    fplLegChange: FlightPlanLegEvent;
    /** A flight plan has been modified from a secondary source */
    fplSegmentChange: FlightPlanSegmentEvent;
    /** A flight plan has changed an active leg. */
    fplActiveLegChange: FlightPlanActiveLegEvent;
    /** A flight plan has calculated flight path vectors. */
    fplCalculated: FlightPlanCalculatedEvent;
    /** A flight plan has update origin/dest information. */
    fplOriginDestChanged: FlightPlanOriginDestEvent;
    /** A flight plan has updated procedure details. */
    fplProcDetailsChanged: FlightPlanProcedureDetailsEvent;
    /** A full flight plan has been loaded. */
    fplLoaded: FlightPlanIndicationEvent;
    /** A new flight plan has been created. */
    fplCreated: FlightPlanIndicationEvent;
    /** A flight plan has been deleted. */
    fplDeleted: FlightPlanIndicationEvent;
    /** The active flight plan index has changed in the Flight Planner. */
    fplIndexChanged: FlightPlanIndicationEvent;
    /** The flight plan has been copied. */
    fplCopied: FlightPlanCopiedEvent;
    /** User data has been set in the flight plan. */
    fplUserDataSet: FlightPlanUserDataEvent;
    /** User data has been deleted in the flight plan. */
    fplUserDataDelete: FlightPlanUserDataEvent;
    /** Direct to data has been changed in the flight plan. */
    fplDirectToDataChanged: FlightPlanDirectToDataEvent;
}
/**
 * An event fired when the flight plan is recalculated.
 */
export interface FlightPlanCalculatedEvent {
    /** The index of the flight plan. */
    readonly planIndex: number;
    /** The index from which the calculations were generated. */
    readonly index?: number;
}
/**
 * An event fired when there are leg related changes.
 */
export interface FlightPlanLegEvent {
    /** The type of the leg change. */
    readonly type: PlanChangeType;
    /** The index of the flight plan. */
    readonly planIndex: number;
    /** The index of the */
    readonly segmentIndex: number;
    /** The index of the changed leg in the segment. */
    readonly legIndex: number;
    /** The leg that was added or removed. */
    readonly leg?: LegDefinition;
}
/**
 * An event fired when an active leg changes.
 */
export interface FlightPlanActiveLegEvent {
    /** The index of the flight plan. */
    readonly planIndex: number;
    /** The index of the changed leg in the segment. */
    readonly index: number;
    /** The index of the segment in which the active leg is. */
    readonly segmentIndex: number;
    /** The index of the leg within the segment. */
    readonly legIndex: number;
    /** The index of the segment in which the previously active leg is. */
    readonly previousSegmentIndex: number;
    /** The index of the previously active leg within the previously active segment. */
    readonly previousLegIndex: number;
    /** The type of active leg that changed. */
    readonly type: ActiveLegType;
}
/**
 * An event fired when there are segment related changes.
 */
export interface FlightPlanSegmentEvent {
    /** The type of the leg change. */
    readonly type: PlanChangeType;
    /** The index of the flight plan. */
    readonly planIndex: number;
    /** The current leg selected. */
    readonly segmentIndex: number;
    /** The segment that was added, removed, or changed. */
    readonly segment?: FlightPlanSegment;
}
/**
 * An event generated when the origin and/or destination information
 * is updated.
 */
export interface FlightPlanOriginDestEvent {
    /** The type of change. */
    readonly type: OriginDestChangeType;
    /** The index of the flight plan. */
    readonly planIndex: number;
    /** The airport that was changed. */
    readonly airport?: string;
}
/**
 * An event generated when the flight plan procedure details changs.
 */
export interface FlightPlanProcedureDetailsEvent {
    /** THe index of the flight plan. */
    readonly planIndex: number;
    /** The procedure details that changed. */
    readonly details: ProcedureDetails;
}
/**
 * An event generated when an instrument requests a full set
 * of plans from the bus.
 */
export interface FlightPlanRequestEvent {
}
/**
 * An event generated when an instrument responds to a full
 * flight plan set request.
 */
export interface FlightPlanResponseEvent {
    /** The plans contained by the flight planner. */
    readonly flightPlans: FlightPlan[];
    /** The index of the active plan. */
    readonly planIndex: number;
}
/**
 * An event generated when a full plan has been loaded, created, or became active.
 */
export interface FlightPlanIndicationEvent {
    /** The index of the flight plan. */
    readonly planIndex: number;
}
/**
 * An event generated when the flight plan procedure details changs.
 */
export interface FlightPlanCopiedEvent {
    /** The index of the flight plan. */
    readonly planIndex: number;
    /** The index that the flight plan was copied to. */
    readonly targetPlanIndex: number;
}
/**
 * An event generated when user data is set in the flight plan.
 */
export interface FlightPlanUserDataEvent {
    /** The index of the flight plan. */
    readonly planIndex: number;
    /** The key of the user data. */
    readonly key: string;
    /** The user data. */
    readonly data: any;
}
/**
 * An event generated when direct to data is changed in the flight plan.
 */
export interface FlightPlanDirectToDataEvent {
    /** The index of the flight plan. */
    readonly planIndex: number;
    /** The direct to data. */
    readonly directToData: DirectToData;
}
/**
 * Manages the active flightplans of the navigational systems.
 */
export declare class FlightPlanner {
    private readonly bus;
    private readonly calculator;
    private onLegNameRequested;
    private static INSTANCE?;
    /** The flight plans managed by this flight planner. */
    private readonly flightPlans;
    /** A publisher for publishing flight planner update events. */
    private readonly publisher;
    private ignoreSync;
    /** The active flight plan index. */
    private _activePlanIndex;
    flightPlanSynced: SubEvent<this, boolean>;
    /**
     * Set a new active plan index.
     * @param planIndex The new active plan index.
     */
    set activePlanIndex(planIndex: number);
    /**
     * Get the active plan index.
     * @returns The active plan index number.
     */
    get activePlanIndex(): number;
    /**
     * Creates an instance of the FlightPlanner.
     * @param bus The event bus instance to notify changes on.
     * @param calculator The flight path calculator to use with this planner.
     * @param onLegNameRequested A callback fired when a flight plan leg is to be named.
     */
    private constructor();
    /**
     * Requests synchronization from other FlightPlanner instances.
     */
    requestSync(): void;
    /**
     * An event generated when a set of flight plans is requested.
     */
    private onFlightPlanRequest;
    /**
     * Sends a flight plan request event.
     */
    private sendFlightPlanRequest;
    /**
     * A callback which is called in response to flight plan request response sync events.
     * @param data The event data.
     */
    private onFlightPlanResponse;
    /**
     * Checks whether a flight plan exists at a specified index.
     * @param planIndex The index to check.
     * @returns Whether a a flight plan exists at `planIndex`.
     */
    hasFlightPlan(planIndex: number): boolean;
    /**
     * Gets a flight plan from the flight planner.
     * @param planIndex The index of the flight plan.
     * @returns The requested flight plan.
     * @throws Error if a flight plan does not exist at `planIndex`.
     */
    getFlightPlan(planIndex: number): FlightPlan;
    /**
     * Creates a new flight plan at a specified index if one does not already exist.
     * @param planIndex The index at which to create the new flight plan.
     * @param notify Whether to send an event notification. True by default.
     * @returns The new flight plan, or the existing flight plan at `planIndex`.
     */
    createFlightPlan(planIndex: number, notify?: boolean): FlightPlan;
    /**
     * A callback which is called in response to flight plan request response sync events.
     * @param data The event data.
     */
    private onPlanCreated;
    /**
     * Sends a flight plan created event.
     * @param planIndex The index of the flight plan that was created.
     */
    private sendPlanCreated;
    /**
     * Deletes a flight plan from the flight planner.
     * @param planIndex The index of the flight plan to delete.
     * @param notify Whether to send an event notification. True by default.
     */
    deleteFlightPlan(planIndex: number, notify?: boolean): void;
    /**
     * A callback which is called in response to flight plan deleted sync events.
     * @param data The event data.
     */
    private onPlanDeleted;
    /**
     * Sends a flight plan deleted event.
     * @param planIndex The index of the flight plan that was created.
     */
    private sendPlanDeleted;
    /**
     * Builds the plan event handlers for the flight plan.
     * @param planIndex The index of the flight plan.
     * @returns The plan event handlers.
     */
    private buildPlanEventHandlers;
    /**
     * Checks whether an active flight plan exists.
     * @returns Whether an active flight plan exists.
     */
    hasActiveFlightPlan(): boolean;
    /**
     * Gets the currently active flight plan from the flight planner.
     * @returns The currently active flight plan.
     * @throws Error if no active flight plan exists.
     */
    getActiveFlightPlan(): FlightPlan;
    /**
     * Copies a flight plan to another flight plan slot.
     * @param sourcePlanIndex The source flight plan index.
     * @param targetPlanIndex The target flight plan index.
     * @param notify Whether or not to notify subscribers that the plan has been copied.
     */
    copyFlightPlan(sourcePlanIndex: number, targetPlanIndex: number, notify?: boolean): void;
    /**
     * A callback which is called in response to flight plan copied sync events.
     * @param data The event data.
     */
    private onPlanCopied;
    /**
     * Sends a leg change event.
     * @param planIndex The index of the flight plan that was the source of the copy.
     * @param targetPlanIndex The index of the copy.
     */
    private sendPlanCopied;
    /**
     * A callback which is called in response to leg changed sync events.
     * @param data The event data.
     */
    private onLegChanged;
    /**
     * Sends a leg change event.
     * @param planIndex The index of the flight plan.
     * @param segmentIndex The index of the segment.
     * @param index The index of the leg.
     * @param type The type of change.
     * @param leg The leg that was changed.
     */
    private sendLegChanged;
    /**
     * A callback which is called in response to segment changed sync events.
     * @param data The event data.
     */
    private onSegmentChanged;
    /**
     * Sends a segment change event.
     * @param planIndex The index of the flight plan.
     * @param index The index of the segment.
     * @param type The type of change.
     * @param segment The segment that was changed.
     */
    private sendSegmentChanged;
    /**
     * A callback which is called in response to active leg changed sync events.
     * @param data The event data.
     */
    private onActiveLegChanged;
    /**
     * Sends an active leg change event.
     * @param planIndex The index of the flight plan.
     * @param index The index of the leg.
     * @param segmentIndex The index of the plan segment.
     * @param legIndex The index of the leg within the segment.
     * @param previousSegmentIndex The index of the segment in which the previously active leg is.
     * @param previousLegIndex The index of the previously active leg within the previously active segment.
     * @param type The type of leg that was changed.
     */
    private sendActiveLegChange;
    /**
     * A callback which is called in response to calculation sync events.
     * @param data The event data.
     */
    private onCalculated;
    /**
     * Sends a calculated event.
     * @param planIndex The index of the flight plan.
     * @param index The index that the path was generated from.
     */
    private sendCalculated;
    /**
     * A callback which is called in response to origin/destination changed sync events.
     * @param data The event data.
     */
    private onOriginDestChanged;
    /**
     * Sends a origin/dest change event.
     * @param planIndex The index of the flight plan.
     * @param type The origin/destination change type.
     * @param airport The airport that was changed.
     */
    private sendOriginDestChanged;
    /**
     * A callback which is called in response to procedure changed sync events.
     * @param data The event data.
     */
    private onProcedureDetailsChanged;
    /**
     * Sends a procedure details change event.
     * @param planIndex The index of the flight plan.
     * @param details The details that were changed.
     */
    private sendProcedureDetailsChanged;
    /**
     * A callback which is called in response to flight plan index changed sync events.
     * @param data The event data.
     */
    private onPlanIndexChanged;
    /**
     * Sends an active plan index change event.
     * @param planIndex The index of the flight plan.
     */
    private sendPlanIndexChanged;
    /**
     * A callback which is called in response to user data set sync events.
     * @param data The event data.
     */
    private onUserDataSet;
    /**
     * A callback which is called in response to user data delete sync events.
     * @param data The event data.
     */
    private onUserDataDelete;
    /**
     * Sends a user data set event.
     * @param planIndex The index of the flight plan.
     * @param key The key of the user data.
     * @param userData The data that was set.
     */
    private sendUserDataSet;
    /**
     * Sends a user data delete event.
     * @param planIndex The index of the flight plan.
     * @param key The key of the user data.
     */
    private sendUserDataDelete;
    /**
     * A callback which is called in response to direct to data changed sync events.
     * @param data The event data.
     */
    private onDirectToDataChanged;
    /**
     * Sends a direct to data changed event.
     * @param planIndex The index of the flight plan.
     * @param directToData The direct to data.
     */
    private sendDirectToData;
    /**
     * Method to set an active flight plan index.
     * @param planIndex The index of the flight plan to make active.
     */
    setActivePlanIndex(planIndex: number): void;
    /**
     * Sends a local event and its sync counterpart.
     * @param topic The topic of the local event.
     * @param data The event data.
     * @param sync Whether to send the sync event.
     */
    private sendEvent;
    /**
     * Gets an instance of FlightPlanner.
     * @param bus The event bus.
     * @param calculator A flight path calculator.
     * @param onLegNameRequested A callback fired when a flight plan leg is to be named.
     * @returns An instance of FlightPlanner.
     */
    static getPlanner(bus: EventBus, calculator: FlightPathCalculator, onLegNameRequested?: ((leg: FlightPlanLeg) => string | undefined)): FlightPlanner;
    /**
     * Default Method for leg naming - builds leg names using default nomenclature.
     * @param leg The leg to build a name for.
     * @returns The name of the leg.
     */
    static buildDefaultLegName(leg: FlightPlanLeg): string;
}
//# sourceMappingURL=FlightPlanner.d.ts.map