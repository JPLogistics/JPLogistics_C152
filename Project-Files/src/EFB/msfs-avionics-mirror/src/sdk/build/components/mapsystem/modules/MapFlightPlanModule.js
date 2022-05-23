import { SubEvent, Subject } from '../../..';
import { AbstractMapModule } from './AbstractMapModule';
/**
 * A map data module that handles the display of flight plan data.
 */
export class MapFlightPlanModule extends AbstractMapModule {
    /**
     * Creates an instance of a MapFlightPlanModule.
     * @param flightPlanner The flight planner to use with this module.
     * @param context The context to use with this module
     */
    constructor(flightPlanner, context) {
        super(context);
        this.flightPlanner = flightPlanner;
        this.plans = [];
        this.planCopiedHandler = (evt) => {
            this.getPlanSubjects(evt.targetPlanIndex).flightPlan.set(this.flightPlanner.getFlightPlan(evt.targetPlanIndex));
            this.getPlanSubjects(evt.targetPlanIndex).planChanged.notify(this);
        };
        this.planCreatedHandler = (evt) => {
            this.getPlanSubjects(evt.planIndex).flightPlan.set(this.flightPlanner.getFlightPlan(evt.planIndex));
        };
        this.planDeletedHandler = (evt) => {
            this.getPlanSubjects(evt.planIndex).flightPlan.set(undefined);
        };
        this.planChangeHandler = (evt) => {
            this.getPlanSubjects(evt.planIndex).planChanged.notify(this);
        };
        this.planCalculatedHandler = (evt) => {
            this.getPlanSubjects(evt.planIndex).planCalculated.notify(this);
        };
        this.activeLegChangedHandler = (evt) => {
            this.getPlanSubjects(evt.planIndex).activeLeg.set(evt.legIndex);
        };
        this.subscriber = this.mapSystemContext.bus.getSubscriber();
        this.fplCopied = this.subscriber.on('fplCopied');
        this.fplCreated = this.subscriber.on('fplCreated');
        this.fplDeleted = this.subscriber.on('fplDeleted');
        this.fplDirectToDataChanged = this.subscriber.on('fplDirectToDataChanged');
        this.fplLoaded = this.subscriber.on('fplLoaded');
        this.fplOriginDestChanged = this.subscriber.on('fplOriginDestChanged');
        this.fplProcDetailsChanged = this.subscriber.on('fplProcDetailsChanged');
        this.fplSegmentChange = this.subscriber.on('fplSegmentChange');
        this.fplUserDataDelete = this.subscriber.on('fplUserDataDelete');
        this.fplUserDataSet = this.subscriber.on('fplUserDataSet');
        this.fplActiveLegChange = this.subscriber.on('fplActiveLegChange');
        this.fplCalculated = this.subscriber.on('fplCalculated');
    }
    /**
     * Gets the flight plan subjects for a specified flight plan.
     * @param index The index of the flight plan.
     * @returns The subject for the specified plan index.
     */
    getPlanSubjects(index) {
        let planSubject = this.plans[index];
        if (planSubject === undefined) {
            planSubject = new PlanSubjects();
            this.plans[index] = planSubject;
        }
        return planSubject;
    }
    /** @inheritdoc */
    startSync() {
        this.fplCopied.handle(this.planCopiedHandler);
        this.fplCreated.handle(this.planCreatedHandler);
        this.fplDeleted.handle(this.planDeletedHandler);
        this.fplDirectToDataChanged.handle(this.planChangeHandler);
        this.fplLoaded.handle(this.planCreatedHandler);
        this.fplOriginDestChanged.handle(this.planChangeHandler);
        this.fplProcDetailsChanged.handle(this.planChangeHandler);
        this.fplSegmentChange.handle(this.planChangeHandler);
        this.fplUserDataDelete.handle(this.planChangeHandler);
        this.fplUserDataSet.handle(this.planChangeHandler);
        this.fplActiveLegChange.handle(this.activeLegChangedHandler);
        this.fplCalculated.handle(this.planCalculatedHandler);
        super.startSync();
    }
    /** @inheritdoc */
    stopSync() {
        this.fplCopied.off(this.planCopiedHandler);
        this.fplCreated.off(this.planCreatedHandler);
        this.fplDeleted.off(this.planDeletedHandler);
        this.fplDirectToDataChanged.off(this.planChangeHandler);
        this.fplLoaded.off(this.planCreatedHandler);
        this.fplOriginDestChanged.off(this.planChangeHandler);
        this.fplProcDetailsChanged.off(this.planChangeHandler);
        this.fplSegmentChange.off(this.planChangeHandler);
        this.fplUserDataDelete.off(this.planChangeHandler);
        this.fplUserDataSet.off(this.planChangeHandler);
        this.fplActiveLegChange.off(this.activeLegChangedHandler);
        this.fplCalculated.off(this.planCalculatedHandler);
        super.stopSync();
    }
}
/**
 * A collection of subjects for consuming flight plan data in the flight plan module.
 */
export class PlanSubjects {
    constructor() {
        /** The current flight plan to display, if any. */
        this.flightPlan = Subject.create(undefined);
        /** An event that fires when the plan is changed. */
        this.planChanged = new SubEvent();
        /** An event that fired when the flight path of the plan is recalculated. */
        this.planCalculated = new SubEvent();
        /** The active leg index currently being navigated to. */
        this.activeLeg = Subject.create(0);
    }
}
