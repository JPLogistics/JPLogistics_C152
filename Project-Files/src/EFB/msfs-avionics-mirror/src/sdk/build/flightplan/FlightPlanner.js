import { ICAO, LegType } from '../navigation/Facilities';
import { UnitType } from '../math';
import { SubEvent } from '../sub/SubEvent';
import { ActiveLegType, FlightPlan, OriginDestChangeType, PlanChangeType } from './FlightPlan';
/**
 * Manages the active flightplans of the navigational systems.
 */
export class FlightPlanner {
    /**
     * Creates an instance of the FlightPlanner.
     * @param bus The event bus instance to notify changes on.
     * @param calculator The flight path calculator to use with this planner.
     * @param onLegNameRequested A callback fired when a flight plan leg is to be named.
     */
    constructor(bus, calculator, onLegNameRequested = FlightPlanner.buildDefaultLegName) {
        this.bus = bus;
        this.calculator = calculator;
        this.onLegNameRequested = onLegNameRequested;
        /** The flight plans managed by this flight planner. */
        this.flightPlans = [];
        this.ignoreSync = false;
        /** The active flight plan index. */
        this._activePlanIndex = 0;
        this.flightPlanSynced = new SubEvent();
        this.publisher = bus.getPublisher();
        const subscriber = bus.getSubscriber();
        subscriber.on('fplsync_fplRequest').handle(() => !this.ignoreSync && this.onFlightPlanRequest());
        subscriber.on('fplsync_fplResponse').handle(data => !this.ignoreSync && this.onFlightPlanResponse(data));
        subscriber.on('fplsync_fplCreated').handle(data => !this.ignoreSync && this.onPlanCreated(data));
        subscriber.on('fplsync_fplDeleted').handle(data => !this.ignoreSync && this.onPlanDeleted(data));
        subscriber.on('fplsync_fplActiveLegChange').handle(data => !this.ignoreSync && this.onActiveLegChanged(data));
        subscriber.on('fplsync_fplLegChange').handle(data => !this.ignoreSync && this.onLegChanged(data));
        subscriber.on('fplsync_fplSegmentChange').handle(data => !this.ignoreSync && this.onSegmentChanged(data));
        subscriber.on('fplsync_fplCalculated').handle(data => !this.ignoreSync && this.onCalculated(data));
        subscriber.on('fplsync_fplOriginDestChanged').handle(data => !this.ignoreSync && this.onOriginDestChanged(data));
        subscriber.on('fplsync_fplProcDetailsChanged').handle(data => !this.ignoreSync && this.onProcedureDetailsChanged(data));
        subscriber.on('fplsync_fplIndexChanged').handle(data => !this.ignoreSync && this.onPlanIndexChanged(data));
        subscriber.on('fplsync_fplCopied').handle(data => !this.ignoreSync && this.onPlanCopied(data));
        subscriber.on('fplsync_fplUserDataSet').handle(data => !this.ignoreSync && this.onUserDataSet(data));
        subscriber.on('fplsync_fplUserDataDelete').handle(data => !this.ignoreSync && this.onUserDataDelete(data));
        subscriber.on('fplsync_fplDirectToDataChanged').handle(data => !this.ignoreSync && this.onDirectToDataChanged(data));
    }
    /**
     * Set a new active plan index.
     * @param planIndex The new active plan index.
     */
    set activePlanIndex(planIndex) {
        this._activePlanIndex = planIndex;
    }
    /**
     * Get the active plan index.
     * @returns The active plan index number.
     */
    get activePlanIndex() {
        return this._activePlanIndex;
    }
    /**
     * Requests synchronization from other FlightPlanner instances.
     */
    requestSync() {
        this.sendFlightPlanRequest();
    }
    /**
     * An event generated when a set of flight plans is requested.
     */
    onFlightPlanRequest() {
        this.ignoreSync = true;
        this.publisher.pub('fplsync_fplResponse', {
            flightPlans: this.flightPlans.map(plan => {
                const newPlan = Object.assign({}, plan);
                newPlan.calculator = undefined;
                return newPlan;
            }), planIndex: this.activePlanIndex
        }, true, false);
        this.ignoreSync = false;
    }
    /**
     * Sends a flight plan request event.
     */
    sendFlightPlanRequest() {
        this.ignoreSync = true;
        this.publisher.pub('fplsync_fplRequest', {}, true, false);
        this.ignoreSync = false;
    }
    /**
     * A callback which is called in response to flight plan request response sync events.
     * @param data The event data.
     */
    onFlightPlanResponse(data) {
        for (let i = 0; i < data.flightPlans.length; i++) {
            const newPlan = Object.assign(new FlightPlan(i, this.calculator, this.onLegNameRequested), data.flightPlans[i]);
            newPlan.events = this.buildPlanEventHandlers(i);
            this.flightPlans[i] = newPlan;
            this.sendEvent('fplLoaded', { planIndex: i }, false);
            // Make sure the newly loaded plans are calculated at least once from the beginning
            newPlan.calculate(0);
        }
        this.setActivePlanIndex(data.planIndex);
        this.flightPlanSynced.notify(this, true);
    }
    /**
     * Checks whether a flight plan exists at a specified index.
     * @param planIndex The index to check.
     * @returns Whether a a flight plan exists at `planIndex`.
     */
    hasFlightPlan(planIndex) {
        return !!this.flightPlans[planIndex];
    }
    /**
     * Gets a flight plan from the flight planner.
     * @param planIndex The index of the flight plan.
     * @returns The requested flight plan.
     * @throws Error if a flight plan does not exist at `planIndex`.
     */
    getFlightPlan(planIndex) {
        const plan = this.flightPlans[planIndex];
        if (!plan) {
            throw new Error(`FlightPlanner: Flight plan does not exist at index ${planIndex}`);
        }
        return plan;
    }
    /**
     * Creates a new flight plan at a specified index if one does not already exist.
     * @param planIndex The index at which to create the new flight plan.
     * @param notify Whether to send an event notification. True by default.
     * @returns The new flight plan, or the existing flight plan at `planIndex`.
     */
    createFlightPlan(planIndex, notify = true) {
        if (this.flightPlans[planIndex]) {
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            return this.flightPlans[planIndex];
        }
        const flightPlan = new FlightPlan(planIndex, this.calculator, this.onLegNameRequested);
        flightPlan.events = this.buildPlanEventHandlers(planIndex);
        this.flightPlans[planIndex] = flightPlan;
        notify && this.sendPlanCreated(planIndex);
        return flightPlan;
    }
    /**
     * A callback which is called in response to flight plan request response sync events.
     * @param data The event data.
     */
    onPlanCreated(data) {
        this.createFlightPlan(data.planIndex, false);
        this.sendEvent('fplCreated', data, false);
    }
    /**
     * Sends a flight plan created event.
     * @param planIndex The index of the flight plan that was created.
     */
    sendPlanCreated(planIndex) {
        const data = { planIndex };
        this.sendEvent('fplCreated', data, true);
    }
    /**
     * Deletes a flight plan from the flight planner.
     * @param planIndex The index of the flight plan to delete.
     * @param notify Whether to send an event notification. True by default.
     */
    deleteFlightPlan(planIndex, notify = true) {
        const flightPlan = this.flightPlans[planIndex];
        if (flightPlan) {
            flightPlan.events = {};
            this.flightPlans[planIndex] = undefined;
            notify && this.sendPlanDeleted(planIndex);
        }
        if (planIndex === this.flightPlans.length - 1) {
            this.flightPlans.length--;
        }
    }
    /**
     * A callback which is called in response to flight plan deleted sync events.
     * @param data The event data.
     */
    onPlanDeleted(data) {
        this.deleteFlightPlan(data.planIndex, false);
        this.sendEvent('fplDeleted', data, false);
    }
    /**
     * Sends a flight plan deleted event.
     * @param planIndex The index of the flight plan that was created.
     */
    sendPlanDeleted(planIndex) {
        const data = { planIndex };
        this.sendEvent('fplDeleted', data, true);
    }
    /**
     * Builds the plan event handlers for the flight plan.
     * @param planIndex The index of the flight plan.
     * @returns The plan event handlers.
     */
    buildPlanEventHandlers(planIndex) {
        return {
            onLegChanged: (segmentIndex, index, type, leg) => this.sendLegChanged(planIndex, segmentIndex, index, type, leg),
            onSegmentChanged: (segmentIndex, type, segment) => this.sendSegmentChanged(planIndex, segmentIndex, type, segment),
            onActiveLegChanged: (index, segmentIndex, legIndex, previousSegmentIndex, previousLegIndex, type) => this.sendActiveLegChange(planIndex, index, segmentIndex, legIndex, previousSegmentIndex, previousLegIndex, type),
            onCalculated: (index) => this.sendCalculated(planIndex, index),
            onOriginDestChanged: (type, airport) => this.sendOriginDestChanged(planIndex, type, airport),
            onProcedureDetailsChanged: (details) => this.sendProcedureDetailsChanged(planIndex, details),
            onUserDataSet: (key, data) => this.sendUserDataSet(planIndex, key, data),
            onUserDataDelete: (key) => this.sendUserDataDelete(planIndex, key),
            onDirectDataChanged: (directToData) => this.sendDirectToData(planIndex, directToData)
        };
    }
    /**
     * Checks whether an active flight plan exists.
     * @returns Whether an active flight plan exists.
     */
    hasActiveFlightPlan() {
        return this.hasFlightPlan(this.activePlanIndex);
    }
    /**
     * Gets the currently active flight plan from the flight planner.
     * @returns The currently active flight plan.
     * @throws Error if no active flight plan exists.
     */
    getActiveFlightPlan() {
        return this.getFlightPlan(this.activePlanIndex);
    }
    /**
     * Copies a flight plan to another flight plan slot.
     * @param sourcePlanIndex The source flight plan index.
     * @param targetPlanIndex The target flight plan index.
     * @param notify Whether or not to notify subscribers that the plan has been copied.
     */
    copyFlightPlan(sourcePlanIndex, targetPlanIndex, notify = true) {
        const sourcePlan = this.flightPlans[sourcePlanIndex];
        if (!sourcePlan) {
            return;
        }
        const newPlan = sourcePlan.copy(targetPlanIndex);
        newPlan.events = this.buildPlanEventHandlers(targetPlanIndex);
        this.flightPlans[targetPlanIndex] = newPlan;
        if (notify) {
            this.sendPlanCopied(sourcePlanIndex, targetPlanIndex);
        }
    }
    /**
     * A callback which is called in response to flight plan copied sync events.
     * @param data The event data.
     */
    onPlanCopied(data) {
        this.copyFlightPlan(data.planIndex, data.targetPlanIndex, false);
        this.sendEvent('fplCopied', data, false);
    }
    /**
     * Sends a leg change event.
     * @param planIndex The index of the flight plan that was the source of the copy.
     * @param targetPlanIndex The index of the copy.
     */
    sendPlanCopied(planIndex, targetPlanIndex) {
        const data = { planIndex, targetPlanIndex };
        this.sendEvent('fplCopied', data, true);
    }
    /**
     * A callback which is called in response to leg changed sync events.
     * @param data The event data.
     */
    onLegChanged(data) {
        var _a;
        const plan = this.getFlightPlan(data.planIndex);
        let localLeg = undefined;
        switch (data.type) {
            case PlanChangeType.Added:
                localLeg = data.leg && plan.addLeg(data.segmentIndex, data.leg.leg, data.legIndex, data.leg.flags, false);
                break;
            case PlanChangeType.Removed:
                localLeg = (_a = plan.removeLeg(data.segmentIndex, data.legIndex, false)) !== null && _a !== void 0 ? _a : undefined;
                break;
            case PlanChangeType.Changed:
                try {
                    localLeg = plan.getLeg(data.segmentIndex, data.legIndex);
                }
                catch (_b) {
                    // noop
                }
                data.leg && data.leg.verticalData && plan.setLegVerticalData(data.segmentIndex, data.legIndex, data.leg.verticalData, false);
                break;
        }
        // We need to send a reference to the local flight plan's copy of the leg with the local event so that
        // event consumers that save the reference don't become desynced with the local flight plan.
        const localData = {
            planIndex: data.planIndex,
            type: data.type,
            segmentIndex: data.segmentIndex,
            legIndex: data.legIndex,
            leg: localLeg
        };
        this.sendEvent('fplLegChange', localData, false);
    }
    /**
     * Sends a leg change event.
     * @param planIndex The index of the flight plan.
     * @param segmentIndex The index of the segment.
     * @param index The index of the leg.
     * @param type The type of change.
     * @param leg The leg that was changed.
     */
    sendLegChanged(planIndex, segmentIndex, index, type, leg) {
        const data = {
            planIndex, segmentIndex, legIndex: index, type, leg
        };
        this.sendEvent('fplLegChange', data, true);
    }
    /**
     * A callback which is called in response to segment changed sync events.
     * @param data The event data.
     */
    onSegmentChanged(data) {
        const plan = this.flightPlans[data.planIndex];
        if (!plan) {
            return;
        }
        let localSegment = undefined;
        switch (data.type) {
            case PlanChangeType.Added:
                localSegment = data.segment && plan.addSegment(data.segmentIndex, data.segment.segmentType, data.segment.airway, false);
                break;
            case PlanChangeType.Inserted:
                localSegment = data.segment && plan.insertSegment(data.segmentIndex, data.segment.segmentType, data.segment.airway, false);
                break;
            case PlanChangeType.Removed:
                try {
                    localSegment = plan.getSegment(data.segmentIndex);
                }
                catch (_a) {
                    // noop
                }
                plan.removeSegment(data.segmentIndex, false);
                break;
            case PlanChangeType.Changed:
                data.segment && plan.setAirway(data.segmentIndex, data.segment.airway, false);
                break;
        }
        // We need to send a reference to the local flight plan's copy of the segment with the local event so that
        // event consumers that save the reference don't become desynced with the local flight plan.
        const localData = {
            planIndex: data.planIndex,
            type: data.type,
            segmentIndex: data.segmentIndex,
            segment: localSegment
        };
        this.sendEvent('fplSegmentChange', localData, false);
    }
    /**
     * Sends a segment change event.
     * @param planIndex The index of the flight plan.
     * @param index The index of the segment.
     * @param type The type of change.
     * @param segment The segment that was changed.
     */
    sendSegmentChanged(planIndex, index, type, segment) {
        const data = {
            planIndex, segmentIndex: index, type, segment
        };
        this.sendEvent('fplSegmentChange', data, true);
    }
    /**
     * A callback which is called in response to active leg changed sync events.
     * @param data The event data.
     */
    onActiveLegChanged(data) {
        const plan = this.flightPlans[data.planIndex];
        if (!plan) {
            return;
        }
        switch (data.type) {
            case ActiveLegType.Lateral:
                plan.setLateralLeg(data.index, false);
                break;
            case ActiveLegType.Vertical:
                plan.setVerticalLeg(data.index, false);
                break;
            case ActiveLegType.Calculating:
                plan.setCalculatingLeg(data.index, false);
                break;
        }
        this.sendEvent('fplActiveLegChange', data, false);
    }
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
    sendActiveLegChange(planIndex, index, segmentIndex, legIndex, previousSegmentIndex, previousLegIndex, type) {
        const data = {
            segmentIndex, legIndex, planIndex,
            index, previousSegmentIndex, previousLegIndex, type
        };
        this.sendEvent('fplActiveLegChange', data, true);
    }
    /**
     * A callback which is called in response to calculation sync events.
     * @param data The event data.
     */
    async onCalculated(data) {
        const plan = this.flightPlans[data.planIndex];
        if (!plan) {
            return;
        }
        await plan.calculate(data.index, false);
        this.sendEvent('fplCalculated', data, false);
    }
    /**
     * Sends a calculated event.
     * @param planIndex The index of the flight plan.
     * @param index The index that the path was generated from.
     */
    sendCalculated(planIndex, index) {
        const data = { planIndex, index };
        this.sendEvent('fplCalculated', data, true);
    }
    /**
     * A callback which is called in response to origin/destination changed sync events.
     * @param data The event data.
     */
    onOriginDestChanged(data) {
        const plan = this.flightPlans[data.planIndex];
        if (!plan) {
            return;
        }
        switch (data.type) {
            case OriginDestChangeType.OriginAdded:
                data.airport && plan.setOriginAirport(data.airport, false);
                break;
            case OriginDestChangeType.OriginRemoved:
                plan.removeOriginAirport(false);
                break;
            case OriginDestChangeType.DestinationAdded:
                data.airport && plan.setDestinationAirport(data.airport, false);
                break;
            case OriginDestChangeType.DestinationRemoved:
                plan.removeDestinationAirport(false);
                break;
        }
        this.sendEvent('fplOriginDestChanged', data, false);
    }
    /**
     * Sends a origin/dest change event.
     * @param planIndex The index of the flight plan.
     * @param type The origin/destination change type.
     * @param airport The airport that was changed.
     */
    sendOriginDestChanged(planIndex, type, airport) {
        const data = { planIndex, type, airport };
        this.sendEvent('fplOriginDestChanged', data, true);
    }
    /**
     * A callback which is called in response to procedure changed sync events.
     * @param data The event data.
     */
    onProcedureDetailsChanged(data) {
        const plan = this.flightPlans[data.planIndex];
        if (!plan) {
            return;
        }
        plan.setProcedureDetails(data.details, false);
        this.sendEvent('fplProcDetailsChanged', data, false);
    }
    /**
     * Sends a procedure details change event.
     * @param planIndex The index of the flight plan.
     * @param details The details that were changed.
     */
    sendProcedureDetailsChanged(planIndex, details) {
        const data = { planIndex, details };
        this.sendEvent('fplProcDetailsChanged', data, true);
    }
    /**
     * A callback which is called in response to flight plan index changed sync events.
     * @param data The event data.
     */
    onPlanIndexChanged(data) {
        this.activePlanIndex = data.planIndex;
        this.sendEvent('fplIndexChanged', data, false);
    }
    /**
     * Sends an active plan index change event.
     * @param planIndex The index of the flight plan.
     */
    sendPlanIndexChanged(planIndex) {
        const data = { planIndex };
        this.sendEvent('fplIndexChanged', data, true);
    }
    /**
     * A callback which is called in response to user data set sync events.
     * @param data The event data.
     */
    onUserDataSet(data) {
        const plan = this.flightPlans[data.planIndex];
        if (!plan) {
            return;
        }
        plan.setUserData(data.key, data.data, false);
        this.sendEvent('fplUserDataSet', data, false);
    }
    /**
     * A callback which is called in response to user data delete sync events.
     * @param data The event data.
     */
    onUserDataDelete(data) {
        const plan = this.flightPlans[data.planIndex];
        if (!plan) {
            return;
        }
        plan.deleteUserData(data.key, false);
        this.sendEvent('fplUserDataDelete', data, false);
    }
    /**
     * Sends a user data set event.
     * @param planIndex The index of the flight plan.
     * @param key The key of the user data.
     * @param userData The data that was set.
     */
    sendUserDataSet(planIndex, key, userData) {
        const data = { planIndex, key, data: userData };
        this.sendEvent('fplUserDataSet', data, true);
    }
    /**
     * Sends a user data delete event.
     * @param planIndex The index of the flight plan.
     * @param key The key of the user data.
     */
    sendUserDataDelete(planIndex, key) {
        const data = { planIndex, key, data: undefined };
        this.sendEvent('fplUserDataDelete', data, true);
    }
    /**
     * A callback which is called in response to direct to data changed sync events.
     * @param data The event data.
     */
    onDirectToDataChanged(data) {
        const plan = this.flightPlans[data.planIndex];
        if (!plan) {
            return;
        }
        plan.setDirectToData(data.directToData.segmentIndex, data.directToData.segmentLegIndex, false);
        this.sendEvent('fplDirectToDataChanged', data, false);
    }
    /**
     * Sends a direct to data changed event.
     * @param planIndex The index of the flight plan.
     * @param directToData The direct to data.
     */
    sendDirectToData(planIndex, directToData) {
        const data = { planIndex, directToData: directToData };
        this.sendEvent('fplDirectToDataChanged', data, true);
    }
    /**
     * Method to set an active flight plan index.
     * @param planIndex The index of the flight plan to make active.
     */
    setActivePlanIndex(planIndex) {
        if (this.hasFlightPlan(planIndex)) {
            this.activePlanIndex = planIndex;
            this.sendPlanIndexChanged(planIndex);
        }
    }
    /**
     * Sends a local event and its sync counterpart.
     * @param topic The topic of the local event.
     * @param data The event data.
     * @param sync Whether to send the sync event.
     */
    sendEvent(topic, data, sync) {
        if (sync) {
            this.ignoreSync = true;
            this.publisher.pub(`fplsync_${topic}`, data, true, false);
            this.ignoreSync = false;
        }
        this.publisher.pub(topic, data, false, false);
    }
    /**
     * Gets an instance of FlightPlanner.
     * @param bus The event bus.
     * @param calculator A flight path calculator.
     * @param onLegNameRequested A callback fired when a flight plan leg is to be named.
     * @returns An instance of FlightPlanner.
     */
    static getPlanner(bus, calculator, onLegNameRequested) {
        var _a;
        return (_a = FlightPlanner.INSTANCE) !== null && _a !== void 0 ? _a : (FlightPlanner.INSTANCE = new FlightPlanner(bus, calculator, onLegNameRequested));
    }
    /**
     * Default Method for leg naming - builds leg names using default nomenclature.
     * @param leg The leg to build a name for.
     * @returns The name of the leg.
     */
    static buildDefaultLegName(leg) {
        let legDistanceNM;
        switch (leg.type) {
            case LegType.CA:
            case LegType.FA:
            case LegType.VA:
                return `${UnitType.METER.convertTo(leg.altitude1, UnitType.FOOT).toFixed(0)}FT`;
            case LegType.FM:
            case LegType.VM:
                return 'MANSEQ';
            case LegType.FC:
                legDistanceNM = Math.round(UnitType.METER.convertTo(leg.distance, UnitType.NMILE));
                return `D${leg.course.toFixed(0).padStart(3, '0')}${String.fromCharCode(64 + Utils.Clamp(legDistanceNM, 1, 26))}`;
            case LegType.CD:
            case LegType.FD:
            case LegType.VD:
                legDistanceNM = UnitType.METER.convertTo(leg.distance, UnitType.NMILE);
                return `${ICAO.getIdent(leg.originIcao)}${legDistanceNM.toFixed(1)}`;
            case LegType.CR:
            case LegType.VR:
                return `${ICAO.getIdent(leg.originIcao)}${leg.theta.toFixed(0)}`;
            case LegType.CI:
            case LegType.VI:
                return 'INTRCPT';
            case LegType.PI:
                return 'PROC. TURN';
            case LegType.HA:
            case LegType.HM:
            case LegType.HF:
                return 'HOLD';
            default:
                return ICAO.getIdent(leg.fixIcao);
        }
    }
}
