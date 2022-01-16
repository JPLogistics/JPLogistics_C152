import { BitFlags, GeoPoint, UnitType } from 'msfssdk';
import { EventBus } from 'msfssdk/data';
import { AltitudeRestrictionType, FacilityType, FixTypeFlags, ICAO, LegType } from 'msfssdk/navigation';
import { ADCEvents } from 'msfssdk/instruments';
import { FlightPlan, FlightPlanLegEvent, FlightPlanner, FlightPlannerEvents, FlightPlanSegment, LegDefinitionFlags, FlightPlanSegmentEvent, FlightPlanSegmentType, LegDefinition } from 'msfssdk/flightplan';
import { VNavConstraint, VNavLeg, VNavPlanSegment } from 'msfssdk/autopilot';
import { Fms } from '../FlightPlan/Fms';
import { LNavEvents } from './Directors/LNavDirector';
import { G1000ControlEvents } from '../G1000Events';

/**
 * A cursor for storing data while iterating in reverse
 * over the current flight plan.
 */
interface ReverseIteratorCursor {
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
 * Details about the next TOD and BOD.
 */
export interface TodBodDetails {
  /** The index of the leg that contains the next TOD. */
  todLegIndex: number,

  /** The index of the leg that contains the next BOD. */
  bodLegIndex: number,

  /** The distance the TOD is from the end of the leg. */
  distanceFromLegEnd: number,

  /** The distance the plane is from the TOD. */
  distanceFromTod: number,

  /** The distance the plane is from the BOD. */
  distanceFromBod: number,

  /** The index of the leg that contains the current VNAV constraint. */
  currentConstraintIndex: number
}

/**
 * Handles the calculation of the VNAV flight path.
 */
export class VNavPathCalculator {
  private flightPathAngle = 3;
  private maxFlightPathAngle = 6;

  private segments: VNavPlanSegment[] = [];

  private constraints: VNavConstraint[] = [];

  private destLegIndex = 0;

  private fafLegIndex = 0;

  private missedApproachStartIndex = -1;

  private isSuspended = false;

  private verticalDirectIndex = -1;

  public currentAlongLegDistance: number | undefined;

  private planChanged = false;

  // private lastUpdateTime = 0;

  private readonly cursor: ReverseIteratorCursor = {
    segment: new FlightPlanSegment(-1, -1, []),
    legIndex: -1,
    legDefinition: {
      leg: FlightPlan.createLeg({}),
      flags: LegDefinitionFlags.None,
      verticalData: { altDesc: AltitudeRestrictionType.Unused, altitude1: 0, altitude2: 0 }
    },
    index: 0
  };

  private currentAltitude = 0;

  public lpvFpa = 0;

  /**
   * Creates an instance of the VNavPathCalculator.
   * @param bus The EventBus to use with this instance.
   * @param flightPlanner The flight planner to use with this instance.
   */
  constructor(private readonly bus: EventBus, private readonly flightPlanner: FlightPlanner) {
    const fpl = bus.getSubscriber<FlightPlannerEvents>();

    fpl.on('fplCopied').handle(e => e.planIndex === 0 && this.onPlanChanged());
    fpl.on('fplCreated').handle(e => e.planIndex === 0 && this.onPlanChanged());
    fpl.on('fplLegChange').handle(e => {
      if (e.planIndex === 0) {
        this.onPlanChanged(e);
      }
    });
    fpl.on('fplLoaded').handle(e => e.planIndex === 0 && this.onPlanChanged());
    fpl.on('fplSegmentChange').handle(e => {
      if (e.planIndex === 0) {
        this.onPlanChanged(undefined, e);
      }
    });
    fpl.on('fplIndexChanged').handle(() => this.onPlanChanged());

    fpl.on('fplCalculated').handle(e => e.planIndex === 0 && this.onPlanCalculated());

    bus.getSubscriber<ADCEvents>().on('alt').handle(alt => this.currentAltitude = UnitType.FOOT.convertTo(alt, UnitType.METER));

    bus.getSubscriber<LNavEvents>().on('suspChanged').handle(v => this.isSuspended = v);

    bus.getSubscriber<G1000ControlEvents>().on('vnav_fpa_set').handle(this.setFpaHandler);
  }

  /**
   * Gets a VNAV leg from the plan.
   * @param index The index of the leg to get.
   * @returns The requested VNAV leg.
   * @throws Not found if the index is not valid.
   */
  public getLeg(index: number): VNavLeg {
    for (let i = 0; i < this.segments.length; i++) {
      const segment = this.segments[i];
      if (index >= segment.offset && index < segment.offset + segment.legs.length) {
        return segment.legs[index - segment.offset];
      }
    }

    throw new Error(`Leg with index ${index} not found`);
  }

  /**
   * Gets a VNAV leg from the plan from a specified segment.
   * @param segmentIndex The segment index of the leg to get.
   * @param legIndex The index of the leg to get within the specified segment.
   * @returns The requested VNAV leg.
   * @throws Not found if the index is not valid.
   */
  public getLegFromSegment(segmentIndex: number, legIndex: number): VNavLeg {
    const segment = this.segments[segmentIndex];
    const leg = segment.legs[legIndex];
    if (segment && leg) {
      return leg;
    } else {
      throw new Error(`Leg from segment ${segmentIndex} index ${legIndex} not found`);
    }
  }

  /**
   * Gets a VNAV leg from the plan from a specified segment.
   * @returns The vnav segments.
   * @throws Not found if the index is not valid.
   */
  public getSegments(): VNavPlanSegment[] {
    return this.segments;
  }

  /**
   * Gets the VNAV desired altitude.
   * @param index The leg index to get the target for.
   * @param distanceAlongLeg The distance along the leg the aircraft is presently.
   * @returns The current VNAV desired altitude.
   */
  public getDesiredAltitude(index: number, distanceAlongLeg: number): number {
    const priorConstraint = this.getPriorConstraintFromLegIndex(index);
    if (priorConstraint && priorConstraint.nextVnavEligibleLegIndex && index < priorConstraint.nextVnavEligibleLegIndex) {
      return priorConstraint.altitude;
    }
    const leg = this.getLeg(index);
    return leg.altitude + this.altitudeForDistance(leg.fpa, leg.distance - distanceAlongLeg);
  }

  /**
   * Gets the current LPV distance.
   * @param index The current leg index.
   * @param distanceAlongLeg The distance along the leg the aircraft is presently.
   * @param ppos The current position from LNAV Data State
   * @returns The current LPV distance.
   */
  public getLpvDistance(index: number, distanceAlongLeg: number, ppos: GeoPoint): number {
    let globalLegIndex = 0;
    let distance = 0;
    const plan = this.flightPlanner.getFlightPlan(Fms.PRIMARY_PLAN_INDEX);
    const destLeg = plan.getLeg(this.destLegIndex);

    if (index <= this.destLegIndex) {
      for (let segmentIndex = 0; segmentIndex < this.segments.length; segmentIndex++) {
        const segment = this.segments[segmentIndex];
        for (let legIndex = 0; legIndex < segment.legs.length; legIndex++) {
          const leg = segment.legs[legIndex];

          if (globalLegIndex <= this.destLegIndex) {
            if (index === globalLegIndex) {
              distance += leg.distance - distanceAlongLeg;
            } else if (globalLegIndex > index) {
              distance += segment.legs[legIndex].distance;
            }
          }

          globalLegIndex++;
        }
      }

      if (
        ICAO.isFacility(destLeg.leg.fixIcao)
        && ICAO.getFacilityType(destLeg.leg.fixIcao) !== FacilityType.RWY
        && plan.procedureDetails.destinationRunway !== undefined
        && destLeg.calculated && destLeg.calculated.endLat !== undefined && destLeg.calculated.endLon !== undefined
      ) {
        const runway = plan.procedureDetails.destinationRunway;
        const runwayGeoPoint = new GeoPoint(runway.latitude, runway.longitude);

        if (index === this.destLegIndex && this.isSuspended) {
          distance = UnitType.GA_RADIAN.convertTo(runwayGeoPoint.distance(ppos), UnitType.METER);
        } else {
          distance += UnitType.GA_RADIAN.convertTo(runwayGeoPoint.distance(destLeg.calculated.endLat, destLeg.calculated.endLon), UnitType.METER);
        }
      }
    }

    return distance;
  }

  /**
   * Gets the LPV desired altitude.
   * @param distance The current LPV distance.
   * @returns The current LPV desired altitude.
   */
  public getDesiredLpvAltitude(distance: number): number {
    return this.getLpvRunwayAltitude() + this.altitudeForDistance(this.lpvFpa, distance + 100);
  }

  /**
   * Gets the LPV runway altitude.
   * @returns The LPV runway altitude.
   */
  public getLpvRunwayAltitude(): number {
    const plan = this.flightPlanner.getFlightPlan(Fms.PRIMARY_PLAN_INDEX);
    const destLeg = plan.getLeg(this.destLegIndex);
    let destAltitude = destLeg.leg.altitude1;

    if (
      ICAO.isFacility(destLeg.leg.fixIcao)
      && ICAO.getFacilityType(destLeg.leg.fixIcao) !== FacilityType.RWY
      && plan.procedureDetails.destinationRunway !== undefined
    ) {
      destAltitude = plan.procedureDetails.destinationRunway.elevation;
    }

    return destAltitude;
  }

  /**
   * Gets the VNAV target altitude for the given leg index.
   * @param index The index of the leg.
   * @returns The next VNAV target altitude, or undefined if none exists.
   */
  public getTargetAltitude(index: number): number | undefined {
    const priorConstraint = this.getPriorConstraintFromLegIndex(index);
    if (priorConstraint && priorConstraint.nextVnavEligibleLegIndex && index < priorConstraint.nextVnavEligibleLegIndex) {
      return priorConstraint.altitude;
    }

    let i = this.constraints.length - 1;
    while (i >= 0) {
      const constraint = this.constraints[i];
      if (index <= constraint.index && constraint.isTarget && !constraint.isBeyondFaf) {
        return constraint.altitude;
      }

      i--;
    }
  }

  /**
   * Gets the VNAV TOD/BOD details.
   * @param index The current leg index.
   * @param distanceAlongLeg The distance the plane is along the current leg.
   * @returns The distance the plane is from the next TOD.
   */
  public todBodDetails(index: number, distanceAlongLeg: number): TodBodDetails {
    const details: TodBodDetails = {
      todLegIndex: -1,
      bodLegIndex: -1,
      distanceFromLegEnd: 0,
      distanceFromTod: 0,
      distanceFromBod: 0,
      currentConstraintIndex: -1
    };

    let globalIndex = 0;
    const constraint = this.getConstraintFromLegIndex(index);
    details.currentConstraintIndex = constraint && constraint.index ? constraint.index : -1;
    const priorConstraint = this.getPriorConstraintFromLegIndex(index);

    if (priorConstraint?.nextVnavEligibleLegIndex !== undefined && priorConstraint.nextVnavEligibleLegIndex > index) {
      return details;
    }

    for (let i = 0; i < this.segments.length && details.bodLegIndex === -1; i++) {
      const segment = this.segments[i];
      for (let l = 0; l < segment.legs.length; l++) {
        const leg = segment.legs[l];
        if (globalIndex >= index) {
          if (details.todLegIndex === -1) {
            if (index === globalIndex) {
              details.distanceFromTod = leg.distance - distanceAlongLeg;
            } else {
              details.distanceFromTod += leg.distance;
            }

            if (leg.todDistance !== undefined && leg.altitude <= this.currentAltitude) {
              details.todLegIndex = globalIndex;
              details.distanceFromTod -= leg.todDistance;
              details.distanceFromLegEnd = leg.todDistance;
            }
          }

          if (leg.isBod) {
            details.bodLegIndex = globalIndex;
            const plan = this.flightPlanner.getFlightPlan(Fms.PRIMARY_PLAN_INDEX);
            const currentLeg = plan.getLeg(plan.activeLateralLeg);
            let bodDistanceInMeters = 0;

            if (plan.activeLateralLeg === globalIndex && currentLeg.calculated) {
              bodDistanceInMeters = currentLeg.calculated.distanceWithTransitions - distanceAlongLeg;
            } else if (plan.activeLateralLeg < globalIndex) {
              const bodLeg = plan.getLeg(globalIndex);
              if (bodLeg.calculated && currentLeg.calculated && bodLeg.calculated.cumulativeDistanceWithTransitions && currentLeg.calculated.cumulativeDistanceWithTransitions) {
                bodDistanceInMeters = (bodLeg.calculated.cumulativeDistanceWithTransitions - currentLeg.calculated.cumulativeDistanceWithTransitions)
                  + (currentLeg.calculated.distanceWithTransitions - distanceAlongLeg);
              }
            }
            details.distanceFromBod = bodDistanceInMeters;
            if (details.todLegIndex < index) {
              details.distanceFromTod = 0;
            }
            return details;
          }
        }
        globalIndex++;
      }
    }
    if (details.todLegIndex < index) {
      details.distanceFromTod = 0;
    }
    return details;
  }

  /**
   * Gets and returns the FAF altitude.
   * @returns the FAF constraint altitude.
   */
  public getFafAltitude(): number {
    return this.getLeg(this.fafLegIndex).altitude;
  }

  /**
   * Gets and returns the FAF Leg Index.
   * @returns the FAF Leg Index.
   */
  public getFafLegIndex(): number {
    return this.fafLegIndex;
  }

  /**
   * Gets and returns whether the input leg index is a path end.
   * @param legIndex is the global leg index to check.
   * @returns whether the input leg index is a path end.
   */
  public getIsPathEnd(legIndex: number): boolean {
    const constraintIndex = this.constraints.findIndex(c => c.index === legIndex);
    if (constraintIndex > -1 && this.constraints[constraintIndex].isPathEnd) {
      return true;
    }
    return false;
  }

  /**
   * Gets and returns the current constraint altitude.
   * @param index is the global leg index to check.
   * @returns the altitude or undefined.
   */
  public getCurrentConstraintAltitude(index: number): number | undefined {
    const priorConstraint = this.getPriorConstraintFromLegIndex(index);
    const currentConstraint = this.getConstraintFromLegIndex(index);
    if (priorConstraint && priorConstraint.nextVnavEligibleLegIndex && index < priorConstraint.nextVnavEligibleLegIndex) {
      return priorConstraint.altitude;
    } else {
      return currentConstraint && currentConstraint.altitude ? currentConstraint.altitude : undefined;
    }
  }

  /**
   * Gets and returns the next constraint altitude.
   * @param index is the global leg index to check.
   * @returns the altitude or undefined.
   */
  public getNextConstraintAltitude(index: number): number | undefined {
    const currentConstraint = this.getConstraintFromLegIndex(index);
    return currentConstraint && currentConstraint.altitude ? currentConstraint.altitude : undefined;
  }

  /**
   * Gets and returns the vertical direct constraint based on an input index.
   * @param selectedIndex The global leg index selected for vertical direct.
   * @param activeIndex The active leg index.
   * @returns The Vnav Constraint for the vertical direct or undefined.
   */
  public getVerticalDirectConstraintFromIndex(selectedIndex: number, activeIndex: number): VNavConstraint | undefined {
    if (this.constraints.length > 0) {
      if (selectedIndex < activeIndex) {
        return this.getConstraintFromLegIndex(activeIndex);
      }
      for (let c = this.constraints.length - 1; c >= 0; c--) {
        const constraint = this.constraints[c];
        if (constraint.index === selectedIndex || (c === this.constraints.length - 1 && selectedIndex < constraint.index)) {
          return constraint;
        } else if (c < this.constraints.length - 1 && constraint.index > selectedIndex) {
          return this.constraints[c + 1];
        }
      }
    }
    return undefined;
  }

  /**
   * Activates a vertical direct to a constraint index.
   * @param constraintIndex The global leg index of the constraint to go direct to.
   */
  public activateVerticalDirect(constraintIndex: number): void {
    this.verticalDirectIndex = constraintIndex;
    const plan = this.flightPlanner.getFlightPlan(Fms.PRIMARY_PLAN_INDEX);
    this.buildVerticalPath(plan, this.verticalDirectIndex);
  }

  /**
   * Sets an FPA on the current constraint when an event is received from the VNAV Profile Window via the bus.
   * @param fpa The FPA to set the constraint to manually.
   */
  private setFpaHandler = (fpa: number): void => {
    const plan = this.flightPlanner.getFlightPlan(Fms.PRIMARY_PLAN_INDEX);
    const constraint = this.getConstraintFromLegIndex(plan.activeLateralLeg);
    const leg = plan.tryGetLeg(plan.activeLateralLeg);
    if (leg && constraint) {
      leg.verticalData.fpa = fpa;
      constraint.fpa = fpa;
      constraint.type = 'manual';
      this.computeVnavPath();
    }
  }

  /**
   * Sets planChanged to true to flag that a plan change has been received over the bus.
   * @param legChangeEvent The FlightPlanLegEvent, if any.
   * @param segmentChangeEvent The FlightPlanSegmentEvent, if any.
   */
  private onPlanChanged(legChangeEvent?: FlightPlanLegEvent, segmentChangeEvent?: FlightPlanSegmentEvent): void {
    const plan = this.flightPlanner.getFlightPlan(Fms.PRIMARY_PLAN_INDEX);

    if (this.verticalDirectIndex > -1) {
      if (legChangeEvent !== undefined) {
        const globalIndex = plan.getSegment(legChangeEvent.segmentIndex).offset + legChangeEvent.legIndex;
        if (globalIndex <= this.verticalDirectIndex) {
          this.verticalDirectIndex = -1;
        }
      } else if (segmentChangeEvent !== undefined) {
        const verticalDirectSegmentIndex = plan.getSegmentIndex(this.verticalDirectIndex);
        if (segmentChangeEvent.segmentIndex <= verticalDirectSegmentIndex) {
          this.verticalDirectIndex = -1;
        }
      }
    }

    this.planChanged = true;
    this.currentAlongLegDistance = undefined;
  }

  /**
   * Method fired on a flight plan change event to rebuild the vertical path.
   */
  private onPlanCalculated(): void {
    const plan = this.flightPlanner.getFlightPlan(Fms.PRIMARY_PLAN_INDEX);

    if (this.planChanged) {
      this.buildVerticalPath(plan, this.verticalDirectIndex > -1 ? this.verticalDirectIndex : undefined);
    } else {
      this.computeVnavPath();
    }
  }

  /**
   * Resets the VNAV plan segments, legs, and constraints based on the new plan.
   * @param plan The Flight Plan.
   * @param verticalDirectIndex The vertical direct index, if any
   */
  private buildVerticalPath(plan: FlightPlan, verticalDirectIndex?: number): void {
    this.fafLegIndex = this.getFafIndex(plan);
    this.constraints.length = 0;
    let currentConstraintAlt = 0;
    let priorConstraintAlt = Number.POSITIVE_INFINITY;
    let pathIsDirect = false;
    let constraintContainsManualLeg = false;
    let currentConstraint = this.createConstraint(0, 0, '$DEFAULT', 'normal');
    this.segments.length = 0;
    this.destLegIndex = Math.max(0, plan.length - 1);
    this.missedApproachStartIndex = this.destLegIndex;
    const directToData = plan.directToData;
    const directToGlobalLegIndex = directToData.segmentIndex > 0 && directToData.segmentLegIndex > -1 ?
      plan.getSegment(directToData.segmentIndex).offset + directToData.segmentLegIndex : -1;

    // Iterate forward through the plan to build the constraints
    for (const segment of plan.segments()) {
      // Add the plan segments to the VNav Path Calculator Segments
      this.segments[segment.segmentIndex] = {
        offset: segment.offset,
        legs: []
      };

      let missedApproachFound = false;

      for (let legIndex = 0; legIndex < segment.legs.length; legIndex++) {
        const planLeg = segment.legs[legIndex];
        const leg = this.createLeg(segment.segmentIndex, legIndex, planLeg.name ?? '', planLeg.calculated?.distanceWithTransitions ?? undefined);
        const globalLegIndex = segment.offset + legIndex;

        switch (planLeg.leg.type) {
          case LegType.CI:
          case LegType.VI:
          case LegType.FM:
          case LegType.VM:
            constraintContainsManualLeg = true;
        }

        //Check if the leg is part of the missed approach, and set the missed approach start and dest leg indexes.
        if (segment.segmentType === FlightPlanSegmentType.Approach && !missedApproachFound && BitFlags.isAll(planLeg.flags, LegDefinitionFlags.MissedApproach)) {
          this.missedApproachStartIndex = globalLegIndex;
          this.destLegIndex = Math.max(0, globalLegIndex - 1);
          missedApproachFound = true;
        }

        //Check if we are in a vertical direct
        if (verticalDirectIndex !== undefined && verticalDirectIndex === globalLegIndex) {
          currentConstraint.type = 'direct';
          pathIsDirect = true;
        }

        //Check if we in a direct to (or approach is activated)
        if (directToData.segmentIndex === segment.segmentIndex && legIndex === directToData.segmentLegIndex + 3
          && BitFlags.isAll(planLeg.flags, LegDefinitionFlags.DirectTo)) {
          currentConstraint.type = 'direct';
          pathIsDirect = true;
          currentConstraint.legs.length = 0;
          if (this.constraints.length > 0) {
            this.constraints.length = 0;
          }
        }

        // Check if this leg has a constraint
        let legIsConstraint = false;
        if (segment.segmentType !== FlightPlanSegmentType.Origin && segment.segmentType !== FlightPlanSegmentType.Departure &&
          planLeg.verticalData && planLeg.verticalData.altDesc !== AltitudeRestrictionType.Unused && globalLegIndex <= this.fafLegIndex && !missedApproachFound) {

          currentConstraintAlt = this.getConstraintAltitude(planLeg);

          // If the current constraint altitude is higher than the prior constraint altitude,
          // then mark it as invalid and don't process the constraint.
          const tempConstraintDistance = this.getConstraintDistance(currentConstraint);
          const fpaTempValue = this.getFpa(leg.distance + tempConstraintDistance, Math.abs(currentConstraintAlt - priorConstraintAlt));
          const currentWithPrecision = Math.round(currentConstraintAlt * 10) / 10;
          const priorWithPrecision = Math.round(priorConstraintAlt * 10) / 10;
          if ((verticalDirectIndex !== undefined && verticalDirectIndex > globalLegIndex) ||
            (globalLegIndex <= directToGlobalLegIndex)) {
            legIsConstraint = false;
          } else if (currentWithPrecision > priorWithPrecision || (!constraintContainsManualLeg &&
            (priorConstraintAlt < Number.POSITIVE_INFINITY && fpaTempValue > 6))) {
            leg.invalidConstraintAltitude = currentConstraintAlt;
          } else {
            legIsConstraint = true;
          }
        }

        // Add the leg to the current constraint.
        currentConstraint.legs.unshift(leg);
        this.segments[segment.segmentIndex].legs.push(leg);

        switch (planLeg.leg.type) {
          case LegType.HA:
          case LegType.HM:
          case LegType.HF:
          case LegType.VM:
          case LegType.FM:
            if (this.constraints.length > 0) {
              const priorConstraint = this.constraints[0];
              priorConstraint.isPathEnd = true;
              priorConstraint.isTarget = true;
              priorConstraint.nextVnavEligibleLegIndex = globalLegIndex + 1;
            }
        }

        const isLastLeg = globalLegIndex === plan.length - 1;

        // If the current leg has a valid constraint, set the constraint details on the current constraint,
        // then add a new empty constraint
        if (legIsConstraint || isLastLeg) {

          currentConstraint.index = globalLegIndex;
          currentConstraint.name = isLastLeg ? '$DEST' : planLeg.name ?? '';
          currentConstraint.type = isLastLeg ? 'dest' : pathIsDirect ? 'direct' : 'normal';

          //If we happen to be in the destination segment (i.e. the end of the plan)
          //set the alt to the next constraint alt so that the segment is flat
          currentConstraint.altitude = globalLegIndex > this.fafLegIndex ? priorConstraintAlt : currentConstraintAlt;

          // TODO: Is this still needed?
          if (pathIsDirect) {
            currentConstraint.isTarget = true;
          }

          // If this is the FAF, set target and path end
          if (globalLegIndex === this.fafLegIndex) {
            currentConstraint.isTarget = true;
            currentConstraint.isPathEnd = true;
          }

          if (planLeg.verticalData.fpa && plan.activeLateralLeg <= globalLegIndex && plan.activeLateralLeg >= currentConstraint.legs[currentConstraint.legs.length - 1].legIndex) {
            currentConstraint.fpa = planLeg.verticalData.fpa;
            currentConstraint.type = 'manual';
          } else if (planLeg.verticalData.fpa) {
            planLeg.verticalData.fpa = undefined;
          }

          // Add the current constraint to the array of constraints in reverse order
          if (!isLastLeg) {
            this.constraints.unshift(currentConstraint);
            constraintContainsManualLeg = false;
            pathIsDirect = false;
          }

          // Set the prior constraint altitude from the current constraint before creating a new 
          priorConstraintAlt = currentConstraint.altitude;

          // Create a new empty constraint
          if (!isLastLeg) {
            currentConstraint = this.createConstraint(plan.length - 1, 0, '$DEFAULT', 'normal');
          }
        }
      }
    }

    this.calcLpvFpa(plan, this.fafLegIndex, this.destLegIndex);
    this.planChanged = false;
    this.computeVnavPath();
  }


  /**
   * Computes the VNAV descent path.
   */
  private computeVnavPath(): void {

    this.fillLegAndConstraintDistances();

    if (!this.computeFlightPathAngles()) {
      const plan = this.flightPlanner.getFlightPlan(Fms.PRIMARY_PLAN_INDEX);
      this.buildVerticalPath(plan, this.verticalDirectIndex > -1 ? this.verticalDirectIndex : undefined);
      return;
    }

    for (let constraintIndex = 0; constraintIndex < this.constraints.length; constraintIndex++) {
      const constraint = this.constraints[constraintIndex];
      let todDistance = constraint.todDistance;
      let altitude = constraint.altitude;

      //If the next constraint altitude is going to bust our current altitude, adjust the
      //constraint segment TOD distance to match our current altitude
      const nextAlt = constraint.altitude + this.altitudeForDistance(constraint.fpa, constraint.distance);
      if (nextAlt > this.currentAltitude) {
        todDistance = this.distanceForAltitude(constraint.fpa, this.currentAltitude - altitude);
      }

      for (let legIndex = 0; legIndex < constraint.legs.length; legIndex++) {
        const leg = constraint.legs[legIndex];
        leg.fpa = constraint.index <= this.fafLegIndex ? constraint.fpa : 0;
        leg.altitude = altitude;

        altitude += this.altitudeForDistance(leg.fpa, leg.distance);

        if (legIndex === 0) {
          leg.isAdvisory = false;
        } else {
          leg.isAdvisory = true;
        }

        if (legIndex === 0 && constraint.isTarget) {
          leg.isBod = true;
        } else {
          leg.isBod = false;
        }

        if (leg.distance >= todDistance && !constraint.isBeyondFaf) {
          leg.todDistance = todDistance;
        } else {
          leg.todDistance = undefined;
          todDistance -= leg.distance;
        }
      }
    }

    this.calcLpvFpa(this.flightPlanner.getFlightPlan(Fms.PRIMARY_PLAN_INDEX), this.fafLegIndex, this.destLegIndex);
    this.notify();
  }

  /**
   * Fills the VNAV plan leg and constraint segment distances.
   */
  private fillLegAndConstraintDistances(): void {
    this.iterateReverse(cursor => this.segments[cursor.segment.segmentIndex].legs[cursor.legIndex].distance = cursor.legDefinition.calculated?.distanceWithTransitions ?? 0);

    for (let constraintIndex = 0; constraintIndex < this.constraints.length; constraintIndex++) {
      const constraint = this.constraints[constraintIndex];
      constraint.distance = this.getConstraintDistance(constraint);
    }
  }

  /**
   * Gets a constraint segment distance from the constraint legs.
   * @param constraint The constraint to calculate a distance for.
   * @returns The constraint distance.
   */
  private getConstraintDistance(constraint: VNavConstraint): number {
    let distance = 0;

    for (let legIndex = 0; legIndex < constraint.legs.length; legIndex++) {
      distance += constraint.legs[legIndex].distance;
    }

    return distance;
  }

  /**
   * Computes the flight path angles for each constraint segment.
   * @returns Whether the flight path angles were computed.
   */
  private computeFlightPathAngles(): boolean {
    let isCurrentlyDirect = false;

    for (let i = 0; i < this.constraints.length; i++) {
      const currentConstraint = this.constraints[i];
      const nextConstraint = this.constraints[i + 1];

      currentConstraint.legs.forEach((leg) => {
        if (leg.invalidConstraintAltitude) {
          return false;
        }
      });

      if (currentConstraint.type === 'manual') {
        // If we have manually set an FPA on this constraint, do not calculate the FPA.
        continue;
      }

      if (currentConstraint.type !== 'direct') {
        currentConstraint.fpa = this.flightPathAngle;
      }

      currentConstraint.isTarget = isCurrentlyDirect ? false : true;

      if (currentConstraint.index === this.fafLegIndex) {
        currentConstraint.isTarget = true;
      }

      if (currentConstraint.index > this.fafLegIndex) {
        currentConstraint.isBeyondFaf = true;
      }

      if (nextConstraint !== undefined && nextConstraint.type !== 'dep' && !nextConstraint.isPathEnd) {
        const directFpa = this.getFpa(currentConstraint.distance, nextConstraint.altitude - currentConstraint.altitude);
        const endAltitude = currentConstraint.altitude + this.altitudeForDistance(this.flightPathAngle, currentConstraint.distance);

        const todDistance = this.distanceForAltitude(this.flightPathAngle, nextConstraint.altitude - currentConstraint.altitude);
        currentConstraint.todDistance = todDistance;

        //If going direct is within a half a degree of the default FPA, or if we were unable to meet
        //the next constraint, go direct
        if (Math.abs(directFpa - this.flightPathAngle) <= 0.5 || endAltitude < nextConstraint.altitude) {

          // Check if the FPA will exceed the max flight path angle and if so, invalidate the constraint.
          if (directFpa > this.maxFlightPathAngle && i !== 0) {
            return false;
          } else {
            currentConstraint.fpa = directFpa;
            isCurrentlyDirect = true;
            currentConstraint.todDistance = currentConstraint.distance;
          }

        } else if (currentConstraint.altitude === nextConstraint.altitude || currentConstraint.isBeyondFaf) {
          currentConstraint.fpa = 0;
          isCurrentlyDirect = false;
        } else {
          isCurrentlyDirect = false;
        }
      } else {
        isCurrentlyDirect = false;
      }

      //If the constraint is a direct, check if an FPA > 3 is required and, if so, attempt to set the max FPA
      if (currentConstraint.type === 'direct' && currentConstraint.fpa === 0 && this.currentAlongLegDistance !== undefined) {
        const plan = this.flightPlanner.getActiveFlightPlan();
        const legsToConstraint = currentConstraint.index - plan.activeLateralLeg;
        let distance = 0;

        for (let l = 0; l <= legsToConstraint; l++) {
          const leg = currentConstraint.legs[l];
          distance += leg.distance;
        }

        distance -= this.currentAlongLegDistance;

        const fpaRequired = this.getFpa(distance, 50 + this.currentAltitude - currentConstraint.altitude);
        //If the constraint is a vertical direct, don't clamp at 3 degrees
        const minFpaClamp = this.verticalDirectIndex === currentConstraint.index ? 0 : 3;
        currentConstraint.fpa = Utils.Clamp(fpaRequired, minFpaClamp, this.maxFlightPathAngle);
        currentConstraint.todDistance = this.distanceForAltitude(currentConstraint.fpa, this.currentAltitude - currentConstraint.altitude);
      }
    }
    return true;
  }

  /**
   * Calculates the LPV flight path angle using the destination elevation
   * and FAF altitude restriction.
   * @param plan The plan to calculate from.
   * @param fafIndex The leg index of the FAF.
   * @param destIndex The leg index of the destination.
   */
  private calcLpvFpa(plan: FlightPlan, fafIndex: number, destIndex: number): void {
    if (plan.length < 2 || fafIndex > plan.length || destIndex > plan.length) {
      return;
    }

    const fafLeg = plan.getLeg(fafIndex);
    const destLeg = plan.getLeg(destIndex);

    let fafToDestDistance = 0;
    for (let i = fafIndex + 1; i <= destIndex; i++) {
      const leg = plan.getLeg(i);
      if (leg.calculated !== undefined) {
        fafToDestDistance += leg.calculated.distance;
      }
    }

    let destAltitude = destLeg.leg.altitude1;

    if (
      ICAO.isFacility(destLeg.leg.fixIcao)
      && ICAO.getFacilityType(destLeg.leg.fixIcao) !== FacilityType.RWY
      && plan.procedureDetails.destinationRunway !== undefined
      && destLeg.calculated && destLeg.calculated.endLat !== undefined && destLeg.calculated.endLon !== undefined
    ) {
      const runway = plan.procedureDetails.destinationRunway;
      const runwayGeoPoint = new GeoPoint(runway.latitude, runway.longitude);
      destAltitude = runway.elevation;
      fafToDestDistance += UnitType.GA_RADIAN.convertTo(runwayGeoPoint.distance(destLeg.calculated.endLat, destLeg.calculated.endLon), UnitType.METER);
    }

    this.lpvFpa = this.getFpa(fafToDestDistance + 225, fafLeg.leg.altitude1 - destAltitude + 15);
  }

  /**
   * Gets the FAF index in the plan.
   * @param plan The flight plan.
   * @returns The FAF index in the plan.
   */
  private getFafIndex(plan: FlightPlan): number {
    let fafIndex = -1;

    this.iterateReverse(cursor => {
      if (fafIndex === -1 && cursor.legDefinition.leg.fixTypeFlags & FixTypeFlags.FAF) {
        fafIndex = cursor.legIndex + cursor.segment.offset;
      }
    });

    fafIndex = fafIndex > -1 ? fafIndex : fafIndex = plan.length - 2;

    return fafIndex;
  }

  /**
   * Gets an increase in altitude for a given flight path angle and
   * lateral distance.
   * @param fpa The flight path angle to use, in degrees.
   * @param distance The lateral distance.
   * @returns The increase in altitude.
   */
  private altitudeForDistance(fpa: number, distance: number): number {
    return Math.tan(UnitType.DEGREE.convertTo(fpa, UnitType.RADIAN)) * distance;
  }

  /**
   * Gets a lateral distance for a given altitude increase and flight
   * path angle.
   * @param fpa The flight path angle to use, in degrees.
   * @param altitude The increase in altitude.
   * @returns The lateral distance.
   */
  private distanceForAltitude(fpa: number, altitude: number): number {
    return altitude / Math.tan(UnitType.DEGREE.convertTo(fpa, UnitType.RADIAN));
  }

  /**
   * Gets the flight path angle for a given distance and altitude.
   * @param distance The distance to get the angle for.
   * @param altitude The altitude to get the angle for.
   * @returns The required flight path angle, in degrees.
   */
  private getFpa(distance: number, altitude: number): number {
    return UnitType.RADIAN.convertTo(Math.atan(altitude / distance), UnitType.DEGREE);
  }

  /**
   * Gets the leg index for the current constraint.
   * @param index The current leg index.
   * @returns Index if the current constraint, or -1 if none is found.
   */
  private getCurrentConstraintIndex(index: number): number {
    for (let c = this.constraints.length - 1; c >= 0; c--) {
      const constraintIndex = this.constraints[c].index;
      if (constraintIndex >= index) {
        return constraintIndex;
      }
    }
    return -1;
  }

  /**
   * Gets the VNAV Constraint that contains the supplied leg index.
   * @param legIndex The flight plan leg index to find the constraint for.
   * @returns The VNAV Constraint that contains the input leg index.
   */
  public getConstraintFromLegIndex(legIndex: number): VNavConstraint | undefined {
    if (this.constraints.length > 0) {
      const constraintIndex = this.constraints.findIndex(c => c.index === this.getCurrentConstraintIndex(legIndex));
      return this.constraints[constraintIndex];
    }
    return undefined;
  }

  /**
   * Gets the first VNAV Constraint Altitude.
   * @returns The first VNAV constraint altitude in the plan.
   */
  public getFirstDescentConstraintAltitude(): number | undefined {
    if (this.constraints.length > 0) {
      for (let i = this.constraints.length - 1; i >= 0; i--) {
        const constraint = this.constraints[i];
        if (constraint.type !== 'dep') {
          return constraint.altitude;
        }
      }
    }
    return undefined;
  }

  /**
   * Gets the VNAV Constraint immediately prior to the constraint that contains a flight plan leg.
   * @param index The global leg index of a flight plan leg.
   * @returns The VNAV Constraint immediately prior to the constraint that contains the flight plan leg with the
   * specified global leg index.
   */
  private getPriorConstraintFromLegIndex(index: number): VNavConstraint | undefined {
    for (let c = 0; c < this.constraints.length; c++) {
      if (this.constraints[c].index < index) {
        return this.constraints[c];
      }
    }
    return undefined;
  }

  /**
   * Gets the constraint for a leg altitude restriction.
   * @param leg The leg to get the constraint for.
   * @returns The altitude constraint.
   */
  private getConstraintAltitude(leg: LegDefinition): number {
    switch (leg.verticalData.altDesc) {
      case AltitudeRestrictionType.At:
      case AltitudeRestrictionType.AtOrAbove:
      case AltitudeRestrictionType.AtOrBelow:
        return leg.verticalData.altitude1;
      case AltitudeRestrictionType.Between:
        return leg.verticalData.altitude2;
    }
    return Number.POSITIVE_INFINITY;
  }

  /**
   * Iterates through the active flight plan in reverse order.
   * @param each The function to call for each flight plan leg.
   */
  private iterateReverse(each: (data: ReverseIteratorCursor) => void): void {
    const plan = this.flightPlanner.getFlightPlan(Fms.PRIMARY_PLAN_INDEX);
    let segmentIndex = plan.segmentCount - 1;
    let index = 0;

    while (segmentIndex >= 0) {
      const segment = plan.getSegment(segmentIndex);
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

  /**
   * Creates a new empty constraint.
   * @param index The leg index of the constraint.
   * @param altitude The altitude of the constraint.
   * @param name The name of the leg for the constraint.
   * @param type The type of constraint.
   * @returns A new empty constraint.
   */
  private createConstraint(index: number, altitude: number, name: string, type: 'normal' | 'dest' | 'cruise' | 'dep' | 'missed' = 'normal'): VNavConstraint {
    return {
      index,
      altitude,
      name,
      isTarget: false,
      isPathEnd: false,
      todDistance: 0,
      distance: 0,
      fpa: 0,
      legs: [],
      type,
      isBeyondFaf: false
    };
  }

  /**
   * Creates a new VNAV plan leg.
   * @param segmentIndex The segment index for the leg.
   * @param legIndex The index of the leg within the segment.
   * @param name The name of the leg.
   * @param distance The leg distance.
   * @returns A new VNAV plan leg.
   */
  private createLeg(segmentIndex: number, legIndex: number, name: string, distance = 0): VNavLeg {
    return {
      segmentIndex,
      legIndex,
      fpa: 0,
      altitude: 0,
      isUserDefined: false,
      distance: distance,
      isBod: false,
      isAdvisory: true,
      name
    };
  }

  /**
   * Sends an event on the fpl bus that the vertical plan has been updated.
   */
  private notify(): void {
    this.bus.pub('vnavUpdated', true, false);
  }
}