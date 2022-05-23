import { AltitudeRestrictionType, ICAO } from '../navigation/Facilities';
import { FlightPlanSegment, FlightPlanSegmentType, ProcedureDetails } from './FlightPlanning';
export var PlanChangeType;
(function (PlanChangeType) {
    PlanChangeType["Added"] = "Added";
    PlanChangeType["Inserted"] = "Inserted";
    PlanChangeType["Removed"] = "Removed";
    PlanChangeType["Changed"] = "Changed";
    PlanChangeType["Cleared"] = "Cleared";
})(PlanChangeType || (PlanChangeType = {}));
export var ActiveLegType;
(function (ActiveLegType) {
    ActiveLegType["Lateral"] = "Lateral";
    ActiveLegType["Vertical"] = "Vertical";
    ActiveLegType["Calculating"] = "Calculating";
})(ActiveLegType || (ActiveLegType = {}));
export var OriginDestChangeType;
(function (OriginDestChangeType) {
    OriginDestChangeType["OriginAdded"] = "OriginAdded";
    OriginDestChangeType["OriginRemoved"] = "OriginRemoved";
    OriginDestChangeType["DestinationAdded"] = "DestinationAdded";
    OriginDestChangeType["DestinationRemoved"] = "DestinationRemoved";
})(OriginDestChangeType || (OriginDestChangeType = {}));
/**
 * A flight plan managed by the flight plan system.
 */
export class FlightPlan {
    /**
     * Creates an instance of a FlightPlan.
     * @param planIndex The index within the flight planner of this flight plan.
     * @param calculator The flight path calculator to use to calculate the flight path.
     * @param onLegNameRequested A callback fired when a flight plan leg is to be named.
     */
    constructor(planIndex, calculator, onLegNameRequested) {
        this.planIndex = planIndex;
        this.calculator = calculator;
        this.onLegNameRequested = onLegNameRequested;
        this._activeLateralLeg = 0;
        this._activeVerticalLeg = 0;
        this._activeCalculatingLeg = 0;
        /** The direct to metadata for this plan. */
        this.directToData = { segmentIndex: -1, segmentLegIndex: -1 };
        /** Events fired when the plan is modified. */
        this.events = {};
        /** The details about the selected procedures. */
        this.procedureDetails = new ProcedureDetails();
        /** The flight plan segments that make up this flight plan. */
        this.planSegments = [];
        /** User assignable data. */
        this.userData = {};
    }
    // eslint-disable-next-line jsdoc/require-returns
    /** The ICAO of the origin airport in the flight plan, if any. */
    get originAirport() {
        return this._originAirport;
    }
    // eslint-disable-next-line jsdoc/require-returns
    /** The ICAO of the destination airport in the flight plan, if any. */
    get destinationAirport() {
        return this._destinationAirport;
    }
    // eslint-disable-next-line jsdoc/require-returns
    /** The global index of the currently active lateral navigation leg. */
    get activeLateralLeg() {
        return this._activeLateralLeg;
    }
    // eslint-disable-next-line jsdoc/require-returns
    /** The global index of the currently active vertical navigation leg. */
    get activeVerticalLeg() {
        return this._activeVerticalLeg;
    }
    // eslint-disable-next-line jsdoc/require-returns
    /** The global index of the currently active calculating leg. */
    get activeCalculatingLeg() {
        return this._activeCalculatingLeg;
    }
    /**
     * Gets the current number of legs in the flight plan.
     * @returns The number of legs in the plan.
     */
    get length() {
        const segment = this.planSegments[this.planSegments.length - 1];
        if (segment !== undefined) {
            return segment.offset + segment.legs.length;
        }
        return 0;
    }
    /**
     * Gets the current number of segments in the flight plan.
     * @returns The number of legs in the plan.
     */
    get segmentCount() {
        return this.planSegments.length;
    }
    /**
     * Gets this flight plan's legs.
     * @param reverse Whether to get the legs in reverse order. False by default.
     * @param startIndex The global leg index of the leg with which to start. Defaults to 0 if `reverse` is false or
     * `this.length` if `reverse` is true.
     * @returns A generator which yields this flight plan's legs.
     */
    legs(reverse = false, startIndex) {
        return reverse ? this._legsReverse(startIndex) : this._legs(startIndex);
    }
    /**
     * Gets this flight plan's legs in forward order.
     * @param startIndex The global leg index of the leg with which to start. Defaults to 0.
     * @yields This flight plan's legs in forward order.
     */
    *_legs(startIndex) {
        startIndex !== null && startIndex !== void 0 ? startIndex : (startIndex = 0);
        for (let i = 0; i < this.planSegments.length; i++) {
            const segment = this.planSegments[i];
            if (segment !== undefined) {
                for (let l = Math.max(0, startIndex - segment.offset); l < segment.legs.length; l++) {
                    yield segment.legs[l];
                }
            }
        }
    }
    /**
     * Gets this flight plan's legs in reverse order.
     * @param startIndex The global leg index of the leg with which to start. Defaults to `this.length - 1`.
     * @yields This flight plan's legs in reverse order.
     */
    *_legsReverse(startIndex) {
        startIndex !== null && startIndex !== void 0 ? startIndex : (startIndex = this.length);
        for (let i = this.planSegments.length - 1; i >= 0; i--) {
            const segment = this.planSegments[i];
            if (segment) {
                for (let l = Math.min(segment.legs.length - 1, startIndex - segment.offset); l >= 0; l--) {
                    yield segment.legs[l];
                }
            }
        }
    }
    /**
     * Gets the segments for the flightplan.
     * @yields The flight plan segments.
     */
    *segments() {
        for (let i = 0; i < this.planSegments.length; i++) {
            const segment = this.planSegments[i];
            if (segment !== undefined) {
                yield segment;
            }
        }
    }
    /**
     * Gets all of the segments of a given type.
     * @param segmentType The type of the segments to retrieve.
     * @yields The segments of the requested type.
     */
    *segmentsOfType(segmentType) {
        for (const segment of this.segments()) {
            if (segment.segmentType == segmentType) {
                yield segment;
            }
        }
    }
    /**
     * Adds a segment to the flight plan at a specified index.
     * @param segmentIndex The index of the flight plan segment.
     * @param segmentType The type of segment this will be.
     * @param airway The airway this segment is made up of, if any.
     * @param notify Whether or not to send notifications after the operation.
     * @returns The new flight plan segment.
     */
    addSegment(segmentIndex, segmentType = FlightPlanSegmentType.Enroute, airway, notify = true) {
        const segment = new FlightPlanSegment(segmentIndex, -1, [], segmentType, airway);
        this.planSegments[segmentIndex] = segment;
        this.reflowSegmentOffsets();
        notify && this.events.onSegmentChanged && this.events.onSegmentChanged(segmentIndex, PlanChangeType.Added, segment);
        return segment;
    }
    /**
     * Inserts a segment into the flight plan at the specified index and
     * reflows the subsequent segments.
     * @param segmentIndex The index to insert the flight plan segment.
     * @param segmentType The type of segment this will be.
     * @param airway The airway this segment is made up of, if any
     * @param notify Whether or not to send notifications after the operation.
     * @returns The new flight plan segment.
     */
    insertSegment(segmentIndex, segmentType = FlightPlanSegmentType.Enroute, airway, notify = true) {
        const segment = this.planSegments[segmentIndex];
        if (segment !== undefined) {
            const newSegment = new FlightPlanSegment(segmentIndex, -1, [], segmentType, airway);
            this.planSegments.splice(segmentIndex, 0, newSegment);
            this.reflowSegments();
            this.reflowSegmentOffsets();
            notify && this.events.onSegmentChanged && this.events.onSegmentChanged(segmentIndex, PlanChangeType.Inserted, newSegment);
            return newSegment;
        }
        else {
            return this.addSegment(segmentIndex, segmentType, airway, notify);
        }
    }
    /**
     * Reflows the flight plan segments after an insert.
     */
    reflowSegments() {
        for (let i = 0; i < this.planSegments.length; i++) {
            const segment = this.planSegments[i];
            if (segment !== undefined && segment.segmentIndex !== i) {
                segment.segmentIndex = i;
            }
        }
    }
    /**
     * Deletes a segment from the flight plan, leaving an empty segment at the specified index.
     * @param segmentIndex The index of the segment to remove.
     * @param notify Whether or not to send notifications after the operation.
     */
    deleteSegment(segmentIndex, notify = true) {
        const segment = this.planSegments[segmentIndex];
        if (segmentIndex === this.planSegments.length - 1) {
            this.planSegments.splice(segmentIndex, 1);
        }
        else {
            delete this.planSegments[segmentIndex];
        }
        if (this.directToData.segmentIndex === segmentIndex) {
            // TODO: Do we want to automatically do this?
            //this.setDirectToData(-1);
        }
        this.reflowSegmentOffsets();
        notify && this.events.onSegmentChanged && this.events.onSegmentChanged(segmentIndex, PlanChangeType.Removed, segment);
    }
    /**
     * Removes a segment from the flight plan and reflows the segments following
     * the removed segment, not leaving an empty segment at the specified index.
     * @param segmentIndex The index of the segment to remove.
     * @param notify Whether or not to send notifications after the operation.
     */
    removeSegment(segmentIndex, notify = true) {
        const segment = this.planSegments[segmentIndex];
        this.planSegments.splice(segmentIndex, 1);
        this.reflowSegments();
        this.reflowSegmentOffsets();
        notify && this.events.onSegmentChanged && this.events.onSegmentChanged(segmentIndex, PlanChangeType.Removed, segment);
    }
    /**
     * Gets a flight plan segment from the plan.
     * @param segmentIndex The index of the segment to get; if not specified returns the active segment.
     * @returns The requested flight plan segment.
     * @throws An error if the flight plan segment could not be found.
     */
    getSegment(segmentIndex) {
        if (segmentIndex === undefined) {
            let calculatedSegmentIndex = 0;
            for (const segment of this.segments()) {
                if (this.activeLateralLeg == 0 && segment.legs.length == 0) {
                    calculatedSegmentIndex++;
                }
                else if (this.activeLateralLeg > segment.offset + segment.legs.length) {
                    calculatedSegmentIndex++;
                }
                else {
                    break;
                }
            }
            const segment = this.planSegments[calculatedSegmentIndex];
            if (segment !== undefined) {
                return segment;
            }
        }
        else if (segmentIndex >= 0) {
            const segment = this.planSegments[segmentIndex];
            if (segment !== undefined) {
                return segment;
            }
        }
        throw new Error(`Flight plan segment with segment index ${segmentIndex} could not be found.`);
    }
    /**
     * Adds a leg to the flight plan.
     * @param segmentIndex The segment to add the leg to.
     * @param leg The leg to add to the plan.
     * @param segmentLegIndex The index of the leg in the segment to insert. Will add to the end of the segment if omitted.
     * @param flags Leg definition flags to apply to the new leg. Defaults to `None` (0).
     * @param notify Whether or not to send notifications after the operation.
     * @returns the leg that was added.
     */
    addLeg(segmentIndex, leg, segmentLegIndex, flags = 0, notify = true) {
        const segment = this.getSegment(segmentIndex);
        const legDefinition = {
            name: this.onLegNameRequested(leg),
            leg,
            flags,
            verticalData: {
                altDesc: AltitudeRestrictionType.Unused,
                altitude1: 0,
                altitude2: 0
            }
        };
        if (segmentLegIndex === undefined) {
            segment.legs.push(legDefinition);
            segmentLegIndex = segment.legs.length - 1;
        }
        else {
            segment.legs.splice(segmentLegIndex, 0, legDefinition);
        }
        this.reflowSegmentOffsets();
        notify && this.events.onLegChanged && this.events.onLegChanged(segmentIndex, segmentLegIndex, PlanChangeType.Added, legDefinition);
        return legDefinition;
    }
    // eslint-disable-next-line jsdoc/require-jsdoc
    getLeg(arg1, arg2) {
        const leg = this._tryGetLeg(arg1, arg2);
        if (leg) {
            return leg;
        }
        throw new Error(`Leg with ${arg2 === undefined ? `index ${arg1}` : `segmentIndex ${arg1}, segmentLegIndex ${arg2}`} could not be found.`);
    }
    // eslint-disable-next-line jsdoc/require-jsdoc
    tryGetLeg(arg1, arg2) {
        return this._tryGetLeg(arg1, arg2);
    }
    /**
     * Attempts to get a leg from the flight plan.
     * @param arg1 The global leg index of the leg to get, or the index of the segment containing the leg to get.
     * @param arg2 The index of the leg to get in its segment.
     * @returns A flight plan leg, or `null` if one could not be found at the specified index.
     */
    _tryGetLeg(arg1, arg2) {
        var _a, _b;
        if (arg2 === undefined) {
            const legIndex = arg1;
            for (const segment of this.segments()) {
                if (segment.offset <= legIndex && legIndex < segment.offset + segment.legs.length) {
                    return segment.legs[legIndex - segment.offset];
                }
            }
            return null;
        }
        else {
            const segmentIndex = arg1;
            const segmentLegIndex = arg2;
            return (_b = (_a = this.planSegments[segmentIndex]) === null || _a === void 0 ? void 0 : _a.legs[segmentLegIndex]) !== null && _b !== void 0 ? _b : null;
        }
    }
    /**
     * Removes a leg from the flight plan.
     * @param segmentIndex The segment to add the leg to.
     * @param segmentLegIndex The index of the leg in the segment to remove. Will remove from the end of the segment if ommitted.
     * @param notify Whether or not to send notifications after the operation.
     * @returns the leg that was removed, or null if a leg was not removed.
     */
    removeLeg(segmentIndex, segmentLegIndex, notify = true) {
        const segment = this.getSegment(segmentIndex);
        let legDefinition;
        if (segmentLegIndex === undefined) {
            legDefinition = segment.legs.pop();
            segmentLegIndex = segment.legs.length;
        }
        else {
            const deleted = segment.legs.splice(segmentLegIndex, 1);
            legDefinition = deleted[0];
        }
        if (this.directToData.segmentIndex === segmentIndex && this.directToData.segmentLegIndex === segmentLegIndex) {
            // TODO: Do we want to automatically do this?
            //this.setDirectToData(-1);
        }
        this.reflowSegmentOffsets();
        notify && legDefinition && this.events.onLegChanged && this.events.onLegChanged(segmentIndex, segmentLegIndex, PlanChangeType.Removed, legDefinition);
        return legDefinition !== null && legDefinition !== void 0 ? legDefinition : null;
    }
    /**
     * Calculates the flight path for the plan.
     * @param globalLegIndex The global leg index to start calculating from.
     * @param notify Whether or not to send notifications after the operation.
     */
    async calculate(globalLegIndex, notify = true) {
        const legs = [...this.legs()];
        await this.calculator.calculateFlightPath(legs, this.activeLateralLeg, globalLegIndex === undefined ? this.activeCalculatingLeg : globalLegIndex);
        notify && this.events.onCalculated && this.events.onCalculated(globalLegIndex);
    }
    /**
     * Sets the origin airport in the flight plan.
     * @param facilityIcao The origin airport to set.
     * @param notify Whether or not to send notifications after the operation.
     */
    setOriginAirport(facilityIcao, notify = true) {
        this._originAirport = facilityIcao;
        notify && this.events.onOriginDestChanged && this.events.onOriginDestChanged(OriginDestChangeType.OriginAdded, facilityIcao);
    }
    /**
     * Removes the origin airport from the flight plan.
     * @param notify Whether or not to send notifications after the operation.
     */
    removeOriginAirport(notify = true) {
        const facilityIcao = this._originAirport;
        this._originAirport = undefined;
        this.procedureDetails.departureIndex = -1;
        this.procedureDetails.departureRunwayIndex = -1;
        this.procedureDetails.departureTransitionIndex = -1;
        this.procedureDetails.originRunway = undefined;
        notify && this.events.onOriginDestChanged && this.events.onOriginDestChanged(OriginDestChangeType.OriginRemoved, facilityIcao);
    }
    /**
     * Sets the destination airport in the flight plan.
     * @param facilityIcao The destination airport to set.
     * @param notify Whether or not to send notifications after the operation.
     */
    setDestinationAirport(facilityIcao, notify = true) {
        this._destinationAirport = facilityIcao;
        notify && this.events.onOriginDestChanged && this.events.onOriginDestChanged(OriginDestChangeType.DestinationAdded, facilityIcao);
    }
    /**
     * Removes the destination airport from the flight plan.
     * @param notify Whether or not to send notifications after the operation.
     */
    removeDestinationAirport(notify = true) {
        const facilityIcao = this._destinationAirport;
        this._destinationAirport = undefined;
        this.procedureDetails.approachIndex = -1;
        this.procedureDetails.approachTransitionIndex = -1;
        this.procedureDetails.arrivalIndex = -1;
        this.procedureDetails.arrivalRunwayTransitionIndex = -1;
        this.procedureDetails.arrivalTransitionIndex = -1;
        this.procedureDetails.destinationRunway = undefined;
        notify && this.events.onOriginDestChanged && this.events.onOriginDestChanged(OriginDestChangeType.DestinationRemoved, facilityIcao);
    }
    /**
     * Sets the active lateral leg index in the flight plan.
     * @param globalLegIndex The global leg index to set.
     * @param notify Whether or not to send notifications after the operation.
     */
    setLateralLeg(globalLegIndex, notify = true) {
        let previousLegIndex = -1;
        let previousSegmentIndex = -1;
        let segmentIndex = -1;
        let segmentLegIndex = -1;
        if (this.length > 0) {
            previousSegmentIndex = this.getSegmentIndex(this._activeLateralLeg);
            if (previousSegmentIndex > -1) {
                previousLegIndex = this._activeLateralLeg - this.getSegment(previousSegmentIndex).offset;
            }
            this._activeLateralLeg = Utils.Clamp(globalLegIndex, 0, this.length - 1);
            segmentIndex = this.getSegmentIndex(this._activeLateralLeg);
            if (segmentIndex > -1) {
                segmentLegIndex = this._activeLateralLeg - this.getSegment(segmentIndex).offset;
            }
        }
        else {
            this._activeLateralLeg = 0;
        }
        notify
            && this.events.onActiveLegChanged
            && this.events.onActiveLegChanged(this._activeLateralLeg, segmentIndex, segmentLegIndex, previousSegmentIndex, previousLegIndex, ActiveLegType.Lateral);
    }
    /**
     * Sets the active lateral leg index in the flight plan.
     * @param globalLegIndex The global leg index to set.
     * @param notify Whether or not to send notifications after the operation.
     */
    setVerticalLeg(globalLegIndex, notify = true) {
        let previousLegIndex = -1;
        let previousSegmentIndex = -1;
        let segmentIndex = -1;
        let segmentLegIndex = -1;
        if (this.length > 0) {
            previousSegmentIndex = this.getSegmentIndex(this._activeVerticalLeg);
            if (previousSegmentIndex > -1) {
                previousLegIndex = this._activeVerticalLeg - this.getSegment(previousSegmentIndex).offset;
            }
            this._activeVerticalLeg = Utils.Clamp(globalLegIndex, 0, this.length - 1);
            segmentIndex = this.getSegmentIndex(this._activeVerticalLeg);
            if (segmentIndex > -1) {
                segmentLegIndex = this._activeVerticalLeg - this.getSegment(segmentIndex).offset;
            }
        }
        else {
            this._activeVerticalLeg = 0;
        }
        notify
            && this.events.onActiveLegChanged
            && this.events.onActiveLegChanged(this._activeVerticalLeg, segmentIndex, segmentLegIndex, previousSegmentIndex, previousLegIndex, ActiveLegType.Vertical);
    }
    /**
     * Sets the active calculating leg index in the flight plan.
     * @param globalLegIndex The global leg index to set.
     * @param notify Whether or not to send notifications after the operation.
     */
    setCalculatingLeg(globalLegIndex, notify = true) {
        let previousLegIndex = -1;
        let previousSegmentIndex = -1;
        let segmentIndex = -1;
        let segmentLegIndex = -1;
        if (this.length > 0) {
            previousSegmentIndex = this.getSegmentIndex(this._activeCalculatingLeg);
            if (previousSegmentIndex > -1) {
                previousLegIndex = this._activeCalculatingLeg - this.getSegment(previousSegmentIndex).offset;
            }
            this._activeCalculatingLeg = Utils.Clamp(globalLegIndex, 0, this.length - 1);
            segmentIndex = this.getSegmentIndex(this._activeCalculatingLeg);
            if (segmentIndex > -1) {
                segmentLegIndex = this._activeCalculatingLeg - this.getSegment(segmentIndex).offset;
            }
        }
        else {
            this._activeCalculatingLeg = 0;
        }
        notify
            && this.events.onActiveLegChanged
            && this.events.onActiveLegChanged(this._activeCalculatingLeg, segmentIndex, segmentLegIndex, previousSegmentIndex, previousLegIndex, ActiveLegType.Calculating);
    }
    /**
     * Sets the flight plan procedure details.
     * @param details The details of the flight plan's procedures.
     * @param notify Whether or not to send notifications after the operation.
     */
    setProcedureDetails(details, notify = true) {
        Object.assign(this.procedureDetails, details);
        notify && this.events.onProcedureDetailsChanged && this.events.onProcedureDetailsChanged(this.procedureDetails);
    }
    /**
     * Gets the global index of a flight plan leg in this flight plan.
     * @param leg A flight plan leg definition.
     * @returns the global index of the leg, or -1 if the leg is not in this flight plan.
     */
    getLegIndexFromLeg(leg) {
        let index = 0;
        for (const toCompare of this.legs()) {
            if (toCompare === leg) {
                return index;
            }
            index++;
        }
        return -1;
    }
    /**
     * Gets the flight plan segment to which a leg belongs.
     * @param leg A flight plan leg definition.
     * @returns The segment to which the leg belongs, or null if the leg is not in this flight plan.
     */
    getSegmentFromLeg(leg) {
        for (const segment of this.segments()) {
            if (segment.legs.includes(leg)) {
                return segment;
            }
        }
        return null;
    }
    /**
     * Gets the segment index for a given global leg index.
     * @param globalLegIndex The global leg index to get the segment index for.
     * @returns The segment index for the given global leg index, or -1 if not found.
     */
    getSegmentIndex(globalLegIndex) {
        for (const segment of this.segments()) {
            if (segment.offset <= globalLegIndex && globalLegIndex < segment.offset + segment.legs.length) {
                return segment.segmentIndex;
            }
        }
        return -1;
    }
    /**
     * Gets the segment leg index (the index of the leg in its segment) for a given global leg index.
     * @param globalLegIndex The global leg index to get the segment leg index for.
     * @returns The segment leg index, or -1 if not found.
     */
    getSegmentLegIndex(globalLegIndex) {
        const segmentIndex = this.getSegmentIndex(globalLegIndex);
        if (segmentIndex === -1) {
            return -1;
        }
        return globalLegIndex - this.getSegment(segmentIndex).offset;
    }
    /**
     * Gets the leg immediately previous to a position in this flight plan specified by segment index and leg index.
     * @param segmentIndex A segment index.
     * @param legIndex A leg index.
     * @returns the leg immediately previous to the specified position, or null if there is no such leg.
     */
    getPrevLeg(segmentIndex, legIndex) {
        var _a, _b;
        if (segmentIndex < 0) {
            return null;
        }
        segmentIndex = Math.min(segmentIndex, this.planSegments.length);
        legIndex = Math.min(legIndex, (_b = (_a = this.planSegments[segmentIndex]) === null || _a === void 0 ? void 0 : _a.legs.length) !== null && _b !== void 0 ? _b : 0);
        let segment = this.planSegments[segmentIndex];
        let leg = segment === null || segment === void 0 ? void 0 : segment.legs[legIndex - 1];
        while (!leg && --segmentIndex >= 0) {
            segment = this.planSegments[segmentIndex];
            if (segment) {
                leg = segment.legs[segment.legs.length - 1];
            }
        }
        return leg !== null && leg !== void 0 ? leg : null;
    }
    /**
     * Gets the leg immediately after a position in this flight plan specified by segment index and leg index.
     * @param segmentIndex A segment index.
     * @param legIndex A leg index.
     * @returns the leg immediately after the specified position, or null if there is no such leg.
     */
    getNextLeg(segmentIndex, legIndex) {
        if (segmentIndex >= this.planSegments.length) {
            return null;
        }
        segmentIndex = Math.max(segmentIndex, -1);
        legIndex = Math.max(legIndex, -1);
        let segment = this.planSegments[segmentIndex];
        let leg = segment === null || segment === void 0 ? void 0 : segment.legs[legIndex + 1];
        while (!leg && ++segmentIndex < this.planSegments.length) {
            segment = this.planSegments[segmentIndex];
            if (segment) {
                leg = segment.legs[0];
            }
        }
        return leg !== null && leg !== void 0 ? leg : null;
    }
    // eslint-disable-next-line jsdoc/require-jsdoc
    setDirectToData(arg1, arg2, arg3) {
        if (typeof arg1 !== 'number') {
            // arg1 is a LegDefinition or null.
            arg1 = arg1 ? this.getLegIndexFromLeg(arg1) : -1;
        }
        let segmentIndex = -1;
        let segmentLegIndex = -1;
        let notify = true;
        if (typeof arg2 !== 'number') {
            const globalLegIndex = arg1;
            if (globalLegIndex >= 0) {
                segmentIndex = this.getSegmentIndex(globalLegIndex);
                if (segmentIndex >= 0) {
                    segmentLegIndex = globalLegIndex - this.getSegment(segmentIndex).offset;
                }
            }
            notify = arg2 !== null && arg2 !== void 0 ? arg2 : true;
        }
        else {
            segmentIndex = arg1;
            segmentLegIndex = arg2;
            notify = arg3 !== null && arg3 !== void 0 ? arg3 : true;
        }
        this.directToData.segmentIndex = segmentIndex;
        this.directToData.segmentLegIndex = segmentLegIndex;
        notify && this.events.onDirectDataChanged && this.events.onDirectDataChanged(this.directToData);
    }
    // eslint-disable-next-line jsdoc/require-jsdoc
    setLegVerticalData(arg1, arg2, arg3, arg4) {
        let notify = true;
        let segmentIndex = -1;
        let segmentLegIndex = -1;
        let verticalData;
        if (typeof arg2 !== 'number') {
            segmentIndex = this.getSegmentIndex(arg1);
            const segment = this.getSegment(segmentIndex);
            segmentLegIndex = arg1 - segment.offset;
            verticalData = arg2;
            notify = arg3 !== undefined ? arg3 : notify;
        }
        else {
            segmentIndex = arg1;
            segmentLegIndex = arg2;
            verticalData = arg3;
            notify = arg4 !== undefined ? arg4 : notify;
        }
        const leg = this.tryGetLeg(segmentIndex, segmentLegIndex);
        if (leg) {
            Object.assign(leg.verticalData, verticalData);
            notify && this.events.onLegChanged && this.events.onLegChanged(segmentIndex, segmentLegIndex, PlanChangeType.Changed, leg);
        }
        else {
            console.warn(`Failed to set Leg Vertical Data for Segment ${segmentIndex} Leg ${segmentLegIndex}.`);
        }
    }
    /**
     * Sets the airway for a segment.
     * @param segmentIndex A segment index.
     * @param airway The airway name.
     * @param notify is whether to send an event for this change
     */
    setAirway(segmentIndex, airway, notify = true) {
        const segment = this.getSegment(segmentIndex);
        if (!airway) {
            segment.airway = undefined;
        }
        else {
            segment.airway = airway;
        }
        this.events.onSegmentChanged && notify && this.events.onSegmentChanged(segmentIndex, PlanChangeType.Changed, segment);
    }
    /**
     * Sets user data in the flight plan.
     * @param key The key of the user data.
     * @param data The data to set.
     * @param notify Whether or not to notify subscribers.
     */
    setUserData(key, data, notify = true) {
        this.userData[key] = data;
        this.events.onUserDataSet && notify && this.events.onUserDataSet(key, data);
    }
    /**
     * Sets user data in the flight plan.
     * @param key The key of the user data.
     * @param notify Whether or not to notify subscribers.
     */
    deleteUserData(key, notify = true) {
        if (this.userData[key] !== undefined) {
            delete this.userData[key];
        }
        this.events.onUserDataDelete && notify && this.events.onUserDataDelete(key);
    }
    /**
     * Gets user data from the flight plan.
     * @param key The key of the user data.
     * @returns The user data, if found.
     */
    getUserData(key) {
        return this.userData[key];
    }
    /**
     * Reflows all flight plan segment offsets after a plan change.
     */
    reflowSegmentOffsets() {
        let nextOffset = undefined;
        for (let i = 0; i < this.planSegments.length; i++) {
            const segment = this.planSegments[i];
            if (segment) {
                if (nextOffset === undefined) {
                    segment.offset = 0;
                }
                else {
                    segment.offset = nextOffset;
                }
                nextOffset = segment.legs.length + segment.offset;
            }
        }
    }
    /**
     * Sets the origin runway in procedure details.
     * @param runway The oneway runway to set as the origin, or undefined
     * @param notify Whether or not to notify subscribers.
     */
    setOriginRunway(runway = undefined, notify = true) {
        this.procedureDetails.originRunway = runway;
        const details = new ProcedureDetails;
        Object.assign(details, this.procedureDetails);
        this.events.onProcedureDetailsChanged && notify && this.events.onProcedureDetailsChanged(details);
    }
    /**
     * Sets the destination runway in procedure details.
     * @param runway The oneway runway to set as the destination, or undefined
     * @param notify Whether or not to notify subscribers.
     */
    setDestinationRunway(runway = undefined, notify = true) {
        this.procedureDetails.destinationRunway = runway;
        const details = new ProcedureDetails;
        Object.assign(details, this.procedureDetails);
        this.events.onProcedureDetailsChanged && notify && this.events.onProcedureDetailsChanged(details);
    }
    /**
     * Sets the departure procedure details.
     * @param facilityIcao The facility ICAO of the facility containing the procedure
     * @param departureIndex The index of the departure in the origin airport information
     * @param departureTransitionIndex The index of the departure transition in the origin airport departure information
     * @param departureRunwayIndex The index of the selected runway in the original airport departure information
     * @param notify Whether or not to notify subscribers.
     */
    setDeparture(facilityIcao = undefined, departureIndex = -1, departureTransitionIndex = -1, departureRunwayIndex = -1, notify = true) {
        this.procedureDetails.departureIndex = departureIndex;
        this.procedureDetails.departureFacilityIcao = facilityIcao;
        this.procedureDetails.departureTransitionIndex = departureTransitionIndex;
        this.procedureDetails.departureRunwayIndex = departureRunwayIndex;
        const details = new ProcedureDetails;
        Object.assign(details, this.procedureDetails);
        this.events.onProcedureDetailsChanged && notify && this.events.onProcedureDetailsChanged(details);
    }
    /**
     * Sets the arrival procedure details.
     * @param facilityIcao The facility ICAO of the facility containing the procedure
     * @param arrivalIndex The index of the arrival in the destination airport information
     * @param arrivalTransitionIndex index of the arrival transition in the destination airport arrival information
     * @param arrivalRunwayTransitionIndex The index of the selected runway transition at the destination airport arrival information
     * @param notify Whether or not to notify subscribers
     */
    setArrival(facilityIcao = undefined, arrivalIndex = -1, arrivalTransitionIndex = -1, arrivalRunwayTransitionIndex = -1, notify = true) {
        this.procedureDetails.arrivalIndex = arrivalIndex;
        this.procedureDetails.arrivalFacilityIcao = facilityIcao;
        this.procedureDetails.arrivalTransitionIndex = arrivalTransitionIndex;
        this.procedureDetails.arrivalRunwayTransitionIndex = arrivalRunwayTransitionIndex;
        const details = new ProcedureDetails;
        Object.assign(details, this.procedureDetails);
        this.events.onProcedureDetailsChanged && notify && this.events.onProcedureDetailsChanged(details);
    }
    /**
     * Sets the approach procedure details.
     * @param facilityIcao The facility ICAO of the facility containing the procedure
     * @param approachIndex The index of the apporach in the destination airport information
     * @param approachTransitionIndex The index of the approach transition in the destination airport approach information
     * @param notify Whether or not to notify subscribers
     */
    setApproach(facilityIcao = undefined, approachIndex = -1, approachTransitionIndex = -1, notify = true) {
        this.procedureDetails.approachIndex = approachIndex;
        this.procedureDetails.approachFacilityIcao = facilityIcao;
        this.procedureDetails.approachIndex = approachIndex;
        this.procedureDetails.approachTransitionIndex = approachTransitionIndex;
        const details = new ProcedureDetails;
        Object.assign(details, this.procedureDetails);
        this.events.onProcedureDetailsChanged && notify && this.events.onProcedureDetailsChanged(details);
    }
    /**
     * Copies the flight plan.
     * @param planIndex The flight plan index to assign to this plan, or the same plan
     * index if not provided.
     * @returns The copied flight plan.
     */
    copy(planIndex) {
        if (planIndex === undefined) {
            planIndex = this.planIndex;
        }
        const newPlan = new FlightPlan(planIndex, this.calculator, this.onLegNameRequested);
        newPlan.setProcedureDetails(this.procedureDetails, false);
        newPlan.setDirectToData(this.directToData.segmentIndex, this.directToData.segmentLegIndex);
        for (const segment of this.segments()) {
            newPlan.addSegment(segment.segmentIndex, segment.segmentType, segment.airway, false);
            for (const leg of segment.legs) {
                const newLeg = newPlan.addLeg(segment.segmentIndex, leg.leg, undefined, leg.flags, false);
                const legIndex = newPlan.getLegIndexFromLeg(newLeg);
                newPlan.setLegVerticalData(legIndex, leg.verticalData);
            }
        }
        if (this.originAirport !== undefined) {
            newPlan.setOriginAirport(this.originAirport, false);
        }
        if (this.destinationAirport !== undefined) {
            newPlan.setDestinationAirport(this.destinationAirport, false);
        }
        newPlan.setLateralLeg(this.activeLateralLeg);
        newPlan.setVerticalLeg(this.activeVerticalLeg);
        newPlan.setCalculatingLeg(this.activeCalculatingLeg);
        for (const key in this.userData) {
            newPlan.setUserData(key, this.userData[key], false);
        }
        return newPlan;
    }
}
/**
 * Creates a default instance of a flight plan leg.
 * @param partial A portion of leg options to apply.
 * @returns A default instance of a flight plan leg.
 */
FlightPlan.createLeg = (partial) => Object.assign({
    type: 0,
    fixIcao: ICAO.emptyIcao,
    arcCenterFixIcao: ICAO.emptyIcao,
    originIcao: ICAO.emptyIcao,
    flyOver: 0,
    turnDirection: 0,
    trueDegrees: 0,
    theta: 0,
    rho: 0,
    distance: 0,
    distanceMinutes: 0,
    speedRestriction: 0,
    altDesc: 0,
    altitude1: 0,
    altitude2: 0,
    course: 0,
    fixTypeFlags: 0
}, partial);
