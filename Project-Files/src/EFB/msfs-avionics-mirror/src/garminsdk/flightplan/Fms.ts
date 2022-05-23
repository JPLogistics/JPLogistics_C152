import { BitFlags, GeoPoint, GeoPointInterface, MagVar, Subject, UnitType } from 'msfssdk';
import { ConsumerSubject, ControlEvents, EventBus } from 'msfssdk/data';
import { GNSSEvents, NavComSimVars, NavEvents, NavSourceId, NavSourceType } from 'msfssdk/instruments';
import {
  AirportFacility, ApproachProcedure, Facility, FacilityType, FixTypeFlags, FlightPlanLeg, ICAO, IntersectionFacility, RunwayUtils,
  LegType, OneWayRunway, AirwayObject, FacilityLoader, UserFacility, FacilityFrequency, AltitudeRestrictionType,
  FacilityRepository, VisualFacility, ExtendedApproachType, RnavTypeFlags, AdditionalApproachType, DepartureProcedure, ArrivalProcedure
} from 'msfssdk/navigation';
import { ActiveLegType, FlightPlan, FlightPlanner, FlightPlannerEvents, FlightPlanSegment, FlightPlanSegmentType, LegDefinition, FlightPathCalculator, LegDefinitionFlags, VerticalData } from 'msfssdk/flightplan';
import { BottomTargetPathCalculator, VNavControlEvents, VNavDataEvents } from 'msfssdk/autopilot';

import { GarminControlEvents } from '../instruments/GarminControlEvents';
import { FmsUtils } from './FmsUtils';

export enum DirectToState {
  NONE,
  TOEXISTING,
  TORANDOM
}

export enum ProcedureType {
  DEPARTURE,
  ARRIVAL,
  APPROACH,
  VISUALAPPROACH
}

export enum AirwayLegType {
  NONE,
  ENTRY,
  EXIT,
  ONROUTE,
  EXIT_ENTRY
}

/** FMS Approach Details */
export type ApproachDetails = {
  /** Whether an approach is loaded */
  approachLoaded: boolean,
  /** The Approach Type */
  approachType: ExtendedApproachType,
  /** The Approach RNAV Type */
  approachRnavType: RnavTypeFlags,
  /** Whether the approach is active */
  approachIsActive: boolean,
  /** Whether the approach is circling */
  approachIsCircling: boolean
}

/** Interface for inverting the plan */
interface LegList {
  /** the leg icao */
  icao: string;
  /** the airway to this leg, if any */
  airway?: string;
}

/**
 * A leg in an insert procedure object.
 */
type InsertProcedureObjectLeg = FlightPlanLeg & {
  /** Leg definition flags to apply when adding the leg to the flight plan. */
  legDefinitionFlags?: number;
};

/**
 * A type definition for inserting procedure legs and runway, if it exists.
 */
type InsertProcedureObject = {
  /** The Procedure Legs */
  procedureLegs: InsertProcedureObjectLeg[],
  /** The OneWayRunway Object if it exists */
  runway?: OneWayRunway
}

/**
 * A fms menu system tracker.
 */
export class Fms {
  public static readonly PRIMARY_PLAN_INDEX = 0;
  public static readonly DTO_RANDOM_PLAN_INDEX = 1;
  public static readonly PROC_PREVIEW_PLAN_INDEX = 2;

  private static readonly geoPointCache = [new GeoPoint(0, 0)];

  public readonly ppos = new GeoPoint(0, 0);

  private readonly facRepo = FacilityRepository.getRepository(this.bus);
  public readonly facLoader = new FacilityLoader(this.facRepo);
  public readonly calculator: FlightPathCalculator = new FlightPathCalculator(this.facLoader, { defaultClimbRate: 300, defaultSpeed: 85, bankAngle: 15 });

  public approachDetails: ApproachDetails = {
    approachLoaded: false,
    approachType: ApproachType.APPROACH_TYPE_UNKNOWN,
    approachRnavType: RnavTypeFlags.None,
    approachIsActive: false,
    approachIsCircling: false
  };

  private readonly navActiveFreqs: Record<1 | 2, ConsumerSubject<number>>;

  private approachFrequency = Subject.create<FacilityFrequency | undefined>(undefined);
  private _lastApproachFrequencyEventValue: FacilityFrequency | undefined = undefined;
  private cdiSource: NavSourceId = { type: NavSourceType.Gps, index: 1 };
  private missedApproachActive = false;

  /**
   * Initialize an instance of the FMS.
   * @param bus is the event bus
   * @param flightPlanner is the flight planner
   * @param verticalPathCalculator is the optional Vertical Path Calculator.
   */
  constructor(
    public readonly bus: EventBus,
    public readonly flightPlanner: FlightPlanner,
    public readonly verticalPathCalculator?: BottomTargetPathCalculator
  ) {

    const sub = this.bus.getSubscriber<GNSSEvents & NavEvents & FlightPlannerEvents & NavComSimVars & ControlEvents & GarminControlEvents & VNavControlEvents>();

    sub.on('gps-position').atFrequency(1).handle(pos => this.ppos.set(pos.lat, pos.long));
    sub.on('cdi_select').handle(source => this.cdiSource = source);

    sub.on('fplActiveLegChange').handle(data => this.onActiveLegChanged(data.type, data.planIndex));
    sub.on('fplLoaded').handle(() => this.checkApproachState());

    const obsCourse = ConsumerSubject.create(sub.on('gps_obs_value'), 0);
    let obsWasActive = false;
    sub.on('gps_obs_active').whenChanged().handle(isActive => {
      if (isActive) {
        obsWasActive = true;
      } else {
        if (obsWasActive) {
          this.convertObsToDirectTo(obsCourse.get());
        }

        obsWasActive = false;
      }
    });

    this.navActiveFreqs = {
      1: ConsumerSubject.create(sub.on('nav_active_frequency_1'), 0),
      2: ConsumerSubject.create(sub.on('nav_active_frequency_2'), 0)
    };

    this.approachFrequency.sub((v) => {
      if (v !== this._lastApproachFrequencyEventValue) {
        this.bus.getPublisher<ControlEvents>().pub('approach_freq_set', v, true);
      }
    });

    sub.on('approach_freq_set').handle((v) => {
      this._lastApproachFrequencyEventValue = v;
      this.approachFrequency.set(v);
    });

    sub.on('activate_missed_approach').handle(v => {
      this.missedApproachActive = v;
      if (this.missedApproachActive) {
        this.bus.getPublisher<ControlEvents>().pub('suspend_sequencing', false, true);
        this.setApproachDetails(undefined, undefined, undefined, false);
      }
    });

    sub.on('approach_details_set').handle(this.onApproachDetailsSet);
  }

  /**
   * Initializes the primary flight plan. Does nothing if the primary flight plan already exists.
   */
  public async initPrimaryFlightPlan(): Promise<void> {
    if (this.flightPlanner.hasFlightPlan(Fms.PRIMARY_PLAN_INDEX)) {
      return;
    }

    this.flightPlanner.createFlightPlan(Fms.PRIMARY_PLAN_INDEX);
    await this.emptyPrimaryFlightPlan();
  }

  /**
   * Checks whether an indexed flight plan exists.
   * @param index A flight plan index.
   * @returns Whether a flight plan at the specified index exists.
   */
  public hasFlightPlan(index: number): boolean {
    return this.flightPlanner.hasFlightPlan(index);
  }

  /**
   * Gets a specified flightplan, or by default the primary flight plan.
   * @param index The index of the flight plan.
   * @returns the requested flight plan
   * @throws Error if no flight plan exists at the specified index.
   */
  public getFlightPlan(index = Fms.PRIMARY_PLAN_INDEX): FlightPlan {
    return this.flightPlanner.getFlightPlan(index);
  }

  /**
   * Checks whether the primary flight plan exists.
   * @returns Whether the primary flight plan exists.
   */
  public hasPrimaryFlightPlan(): boolean {
    return this.flightPlanner.hasFlightPlan(Fms.PRIMARY_PLAN_INDEX);
  }

  /**
   * Gets the primary flight plan.
   * @returns The primary flight plan.
   * @throws Error if the primary flight plan does not exist.
   */
  public getPrimaryFlightPlan(): FlightPlan {
    return this.flightPlanner.getFlightPlan(Fms.PRIMARY_PLAN_INDEX);
  }

  /**
   * Checks whether the Direct To Random flight plan exists.
   * @returns Whether the Direct To Random flight plan exists.
   */
  public hasDirectToFlightPlan(): boolean {
    return this.flightPlanner.hasFlightPlan(Fms.DTO_RANDOM_PLAN_INDEX);
  }

  /**
   * Gets the Direct To Random flight plan.
   * @returns The Direct To Random flight plan.
   * @throws Error if the Direct To Random flight plan does not exist.
   */
  public getDirectToFlightPlan(): FlightPlan {
    return this.flightPlanner.getFlightPlan(Fms.DTO_RANDOM_PLAN_INDEX);
  }

  /**
   * Handles when a flight plan active leg changes.
   * @param legType The type of flight plan active leg change.
   * @param planIndex The index of the plan whose active leg changed.
   */
  private onActiveLegChanged(legType: ActiveLegType, planIndex: number): void {
    if (legType === ActiveLegType.Lateral && planIndex === 0) {
      const activePlan = this.flightPlanner.getActiveFlightPlan();
      if (activePlan.length > 0 && !this.missedApproachActive) {
        const activeSegment = activePlan.getSegment(activePlan.getSegmentIndex(Math.max(0, activePlan.activeLateralLeg)));
        if (activeSegment.segmentType === FlightPlanSegmentType.Approach && activePlan.activeLateralLeg - activeSegment.offset > 0) {
          this.setApproachDetails(undefined, undefined, undefined, true);
        } else {
          this.setApproachDetails(undefined, undefined, undefined, false);
        }
      } else {
        this.setApproachDetails(undefined, undefined, undefined, false);
      }
      if (
        !this.missedApproachActive
        && activePlan.activeLateralLeg < activePlan.length - 1
        && BitFlags.isAll(activePlan.getLeg(activePlan.activeLateralLeg).flags, LegDefinitionFlags.MissedApproach)
      ) {
        this.bus.getPublisher<ControlEvents>().pub('activate_missed_approach', true, true);
      }
    }
  }

  /**
   * A method to check the current approach state.
   */
  private async checkApproachState(): Promise<void> {
    const plan = this.getFlightPlan();
    let approachLoaded = false;
    let approachIsActive = false;
    let approachType: ExtendedApproachType | undefined;
    let approachRnavType: RnavTypeFlags | undefined;
    let approachIsCircling = false;
    if (plan.destinationAirport && (plan.procedureDetails.approachIndex > -1 || plan.getUserData('visual_approach') !== undefined)) {
      approachLoaded = true;
      if (plan.length > 0 && plan.activeLateralLeg < plan.length && plan.activeLateralLeg > 0) {
        const segment = plan.getSegment(plan.getSegmentIndex(plan.activeLateralLeg));
        approachIsActive = segment.segmentType === FlightPlanSegmentType.Approach;
      }
      if (plan.procedureDetails.approachIndex > -1) {
        const facility = await this.facLoader.getFacility(FacilityType.Airport, plan.destinationAirport);
        const approach = facility.approaches[plan.procedureDetails.approachIndex];
        if (approach) {
          approachType = approach.approachType;
          approachRnavType = FmsUtils.getBestRnavType(approach.rnavTypeFlags);
          approachIsCircling = !approach.runway;
        }
      } else {
        approachType = AdditionalApproachType.APPROACH_TYPE_VISUAL;
        approachRnavType = RnavTypeFlags.None;
      }

    }
    this.setApproachDetails(approachLoaded, approachType, approachRnavType, approachIsActive, approachIsCircling);
  }

  /**
   * Removes the direct to existing legs from the primary flight plan. If a direct to existing is currently active,
   * this will effectively cancel it.
   * @param lateralLegIndex The index of the leg to set as the active lateral leg after the removal operation. Defaults
   * to the index of the current active primary flight plan leg.
   */
  private removeDirectToExisting(lateralLegIndex?: number): void {
    const plan = this.getFlightPlan();
    const directToData = plan.directToData;
    if (directToData && directToData.segmentIndex > -1) {
      plan.removeLeg(directToData.segmentIndex, directToData.segmentLegIndex + 1, true);
      plan.removeLeg(directToData.segmentIndex, directToData.segmentLegIndex + 1, true);
      plan.removeLeg(directToData.segmentIndex, directToData.segmentLegIndex + 1, true);

      const activateIndex = lateralLegIndex ?? plan.activeLateralLeg;
      const adjustedActivateIndex = activateIndex - Utils.Clamp(activateIndex - (plan.getSegment(directToData.segmentIndex).offset + directToData.segmentLegIndex), 0, 3);

      plan.setDirectToData(-1, true);
      plan.setCalculatingLeg(adjustedActivateIndex);
      plan.setLateralLeg(adjustedActivateIndex);
      plan.calculate(0);
    }
  }

  /**
   * Checks whether a leg in the primary flight plan can be manually activated.
   * @param segmentIndex The index of the segment in which the leg resides.
   * @param segmentLegIndex The index of the leg in its segment.
   * @returns Whether the leg can be manually activated.
   */
  public canActivateLeg(segmentIndex: number, segmentLegIndex: number): boolean {
    const plan = this.hasPrimaryFlightPlan() && this.getPrimaryFlightPlan();

    if (!plan) {
      return false;
    }

    const leg = plan.tryGetLeg(segmentIndex, segmentLegIndex);

    if (!leg || BitFlags.isAll(leg.flags, LegDefinitionFlags.DirectTo) || leg === plan.getLeg(0)) {
      return false;
    }

    switch (leg.leg.type) {
      case LegType.CF:
      case LegType.FC:
      case LegType.FD:
        return true;
      case LegType.CI:
      case LegType.VI:
      case LegType.FA:
      case LegType.CA:
      case LegType.VA:
      case LegType.VM:
        return false;
    }

    const prevLeg = plan.getPrevLeg(segmentIndex, segmentLegIndex) as LegDefinition;
    switch (prevLeg.leg.type) {
      case LegType.VA:
      case LegType.CA:
      case LegType.VM:
      case LegType.Discontinuity:
        return false;
    }

    return true;
  }

  /**
   * Checks whether a leg in the primary flight plan is a valid direct to target.
   * @param segmentIndex The index of the segment in which the leg resides.
   * @param segmentLegIndex The index of the leg in its segment.
   * @returns Whether the leg is a valid direct to target.
   * @throws Error if a leg could not be found at the specified location.
   */
  public canDirectTo(segmentIndex: number, segmentLegIndex: number): boolean {
    const plan = this.hasPrimaryFlightPlan() && this.getPrimaryFlightPlan();

    if (!plan) {
      return false;
    }

    const leg = plan.tryGetLeg(segmentIndex, segmentLegIndex);

    if (!leg || leg.leg.fixIcao === '' || leg.leg.fixIcao === ICAO.emptyIcao) {
      return false;
    }

    switch (leg.leg.type) {
      case LegType.IF:
      case LegType.TF:
      case LegType.DF:
      case LegType.CF:
      case LegType.AF:
      case LegType.RF:
        return true;
    }

    return false;
  }

  /**
   * Gets the current Direct To State.
   * @returns the DirectToState.
   */
  public getDirectToState(): DirectToState {
    if (this.flightPlanner.activePlanIndex == 1) {
      const plan = this.getDirectToFlightPlan();
      if (plan.segmentCount > 0 && plan.getSegment(0).segmentType === FlightPlanSegmentType.RandomDirectTo) {
        return DirectToState.TORANDOM;
      }
    } else {
      const plan = this.getPrimaryFlightPlan();
      const directDataExists = plan.directToData.segmentIndex > -1 && plan.directToData.segmentLegIndex > -1;
      if (directDataExists && plan.segmentCount >= plan.directToData.segmentIndex
        && plan.getLegIndexFromLeg(plan.getSegment(plan.directToData.segmentIndex).legs[plan.directToData.segmentLegIndex]) === plan.activeLateralLeg - 3) {
        return DirectToState.TOEXISTING;
      }
    }
    return DirectToState.NONE;
  }

  /**
   * Gets the ICAO string of the current Direct To target.
   * @returns The ICAO string of the current Direct To target, or undefined if Direct To is not active.
   */
  public getDirectToTargetIcao(): string | undefined {
    return this.getDirectToLeg()?.fixIcao;
  }

  /**
   * Gets the current DTO Target Flight Plan Leg.
   * @returns the FlightPlanLeg.
   */
  private getDirectToLeg(): FlightPlanLeg | undefined {
    switch (this.getDirectToState()) {
      case DirectToState.TORANDOM: {
        const plan = this.getDirectToFlightPlan();
        return plan.getSegment(0).legs[2].leg;
      }
      case DirectToState.TOEXISTING: {
        const plan = this.getFlightPlan();
        return plan.getSegment(plan.directToData.segmentIndex).legs[plan.directToData.segmentLegIndex + FmsUtils.DTO_LEG_OFFSET].leg;
      }
    }
    return undefined;
  }

  /**
   * Checks if a segment is the first enroute segment that is not an airway.
   * @param segmentIndex is the segment index of the segment to check
   * @returns whether or not the segment is the first enroute segment that is not an airway.
   */
  public isFirstEnrouteSegment(segmentIndex: number): boolean {
    const plan = this.getFlightPlan();
    for (let i = 0; i < plan.segmentCount; i++) {
      const segment = plan.getSegment(i);
      if (segment.segmentType === FlightPlanSegmentType.Enroute && !segment.airway) {
        return i === segmentIndex;
      }
    }
    return false;
  }

  /**
   * Adds a user facility.
   * @param userFacility the facility to add.
   */
  public addUserFacility(userFacility: UserFacility): void {
    this.facRepo.add(userFacility);
  }

  /**
   * Removes a user facility.
   * @param userFacility the facility to remove.
   */
  public removeUserFacility(userFacility: UserFacility): void {
    this.facRepo.remove(userFacility);
  }

  /**
   * Adds a visual or runway facility from the FlightPlanLeg.
   * @param leg the leg to build the facility from.
   * @param visualRunwayDesignation is the visual runway this facility belongs to.
   */
  private addVisualFacilityFromLeg(leg: FlightPlanLeg, visualRunwayDesignation: string): void {
    const fac: VisualFacility = {
      icao: leg.fixIcao,
      lat: leg.lat !== undefined ? leg.lat : 0,
      lon: leg.lon !== undefined ? leg.lon : 0,
      approach: `VISUAL ${visualRunwayDesignation}`,
      city: '',
      name: `${visualRunwayDesignation} - ${ICAO.getIdent(leg.fixIcao)}`,
      region: '',
      magvar: 0
    };
    this.facRepo.add(fac);
  }

  /**
   * Method to insert a waypoint to the flightplan.
   * @param segmentIndex is index of the segment to add the waypoint to
   * @param facility is the new facility to add a leg to.
   * @param legIndex is the index to insert the waypoint (if none, append)
   * @returns whether the waypoint was successfully inserted.
   */
  public insertWaypoint(segmentIndex: number, facility: Facility, legIndex?: number): boolean {
    const leg = FlightPlan.createLeg({
      type: LegType.TF,
      fixIcao: facility.icao
    });

    const plan = this.getFlightPlan();
    const segment = plan.getSegment(segmentIndex);
    const prevLeg = plan.getPrevLeg(segmentIndex, legIndex ?? Infinity);
    const nextLeg = plan.getNextLeg(segmentIndex, legIndex === undefined ? Infinity : legIndex - 1);

    // Make sure we are not inserting a duplicate leg
    if ((prevLeg && this.isDuplicateLeg(prevLeg.leg, leg)) || (nextLeg && this.isDuplicateLeg(leg, nextLeg.leg))) {
      return false;
    }

    // Deal with whether this insert is in an airway segment
    if (segment.airway) {
      legIndex ??= segment.legs.length - 1;

      // Get the displaced legs from the airway segment
      const legsToMove: FlightPlanLeg[] = [];
      const legsLength = segment.legs.length;
      for (let i = legIndex; i < legsLength; i++) {
        legsToMove.push(segment.legs[i].leg);
      }

      // Save the airway name
      const airway = segment.airway?.split('.')[0] ?? '';

      const nextSegment = plan.getSegment(segmentIndex + 1);

      const needFirstAirwaySegment = legIndex > 0; // We don't need to keep the original airway segment around if we've displaced all of its enroute waypoints.
      const needSecondAirwaySegment = legsToMove.length > 2; // Only create a second airway segment if we've displaced at least three waypoints in the original airway
      const needNewEnrouteSegment = needFirstAirwaySegment && (needSecondAirwaySegment || nextSegment.airway || nextSegment.segmentType !== FlightPlanSegmentType.Enroute);

      const firstAirwaySegmentIndex = needFirstAirwaySegment ? segmentIndex : -1;
      const enrouteSegmentIndex = needFirstAirwaySegment ? segmentIndex + 1 : segmentIndex - 1;
      const secondAirwaySegmentIndex = needSecondAirwaySegment ? enrouteSegmentIndex + 1 : -1;

      if (needNewEnrouteSegment) {
        this.planInsertSegmentOfType(FlightPlanSegmentType.Enroute, segmentIndex + 1);
      }
      if (needSecondAirwaySegment) {
        this.planInsertSegmentOfType(FlightPlanSegmentType.Enroute, segmentIndex + 1);
      }

      // Add the inserted leg to its enroute segment
      this.planAddLeg(enrouteSegmentIndex, leg);

      if (!needFirstAirwaySegment) {
        this.planRemoveSegment(segmentIndex);
      } else {
        for (let i = legsLength - 1; i >= legIndex; i--) {
          this.planRemoveLeg(segmentIndex, i, true, true);
        }
      }

      if (legsToMove.length > 0) {
        this.planAddLeg(enrouteSegmentIndex, legsToMove[0]); // Always add first displaced waypoint to the enroute segment in case it is an airway entry

        const toAddSegmentIndex = secondAirwaySegmentIndex < 0 ? enrouteSegmentIndex : secondAirwaySegmentIndex;
        for (let i = 1; i < legsToMove.length; i++) {
          this.planAddLeg(toAddSegmentIndex, legsToMove[i]);
        }
      }

      // Update names of the airway segments as appropriate.

      if (firstAirwaySegmentIndex >= 0) {
        segment.airway = airway + '.' + segment.legs[legIndex - 1].name;
        plan.setAirway(firstAirwaySegmentIndex, segment.airway);
      }

      if (secondAirwaySegmentIndex >= 0) {
        const newAirwaySegment = plan.getSegment(secondAirwaySegmentIndex);
        newAirwaySegment.airway = airway + '.' + newAirwaySegment.legs[newAirwaySegment.legs.length - 1].name;
        plan.setAirway(secondAirwaySegmentIndex, newAirwaySegment.airway);
      }

      return true;
    }

    this.planAddLeg(segmentIndex, leg, legIndex);
    return true;
  }

  /**
   * Removes a leg to a waypoint from the primary flight plan.
   * @param segmentIndex The index of the segment containing the leg to remove.
   * @param segmentLegIndex The index of the leg to remove in its segment.
   * @returns Whether the waypoint was successfully removed.
   */
  public removeWaypoint(segmentIndex: number, segmentLegIndex: number): boolean {
    const plan = this.hasPrimaryFlightPlan() && this.getPrimaryFlightPlan();
    if (!plan) {
      return false;
    }

    const leg = plan.tryGetLeg(segmentIndex, segmentLegIndex);

    if (!leg || BitFlags.isAny(leg.leg.fixTypeFlags, FixTypeFlags.FAF | FixTypeFlags.MAP)) {
      return false;
    }

    const legDeleted = this.planRemoveLeg(segmentIndex, segmentLegIndex);
    const nextLeg = plan.tryGetLeg(segmentIndex, segmentLegIndex);
    if (legDeleted && nextLeg && (nextLeg.leg.type === LegType.HA || nextLeg.leg.type === LegType.HM || nextLeg.leg.type === LegType.HF)) {
      if (plan.tryGetLeg(segmentIndex, segmentLegIndex)) {
        this.planRemoveLeg(segmentIndex, segmentLegIndex, true, true, true);
      }
    }

    return legDeleted;
  }

  /**
   * Gets the airway leg type of a flight plan leg.
   * @param plan The flight plan containing the query leg.
   * @param segmentIndex The index of the flight plan segment containing the query leg.
   * @param segmentLegIndex The index of the query leg in its segment.
   * @returns The airway leg type of the query leg.
   */
  private getAirwayLegType(plan: FlightPlan, segmentIndex: number, segmentLegIndex: number): AirwayLegType {
    const segment = plan.getSegment(segmentIndex);
    const segmentIsAirway = segment.airway !== undefined;
    const nextSegmentIsAirway = segmentIndex + 1 < plan.segmentCount && plan.getSegment(segmentIndex + 1).airway !== undefined;
    const legIsLast = segmentLegIndex == segment.legs.length - 1;
    if ((segmentIsAirway && legIsLast && nextSegmentIsAirway)) {
      return AirwayLegType.EXIT_ENTRY;
    }
    if ((legIsLast && nextSegmentIsAirway)) {
      return AirwayLegType.ENTRY;
    }
    if (segmentIsAirway) {
      if (legIsLast) {
        return AirwayLegType.EXIT;
      }
      return AirwayLegType.ONROUTE;
    }
    return AirwayLegType.NONE;
  }

  /**
   * Method to get the distance of an airway segment.
   * @param segmentIndex is the index of the segment of the airway.
   * @returns the cumulative distance for the airway segment.
   */
  public getAirwayDistance(segmentIndex: number): number {
    const plan = this.getFlightPlan();
    const segment = plan.getSegment(segmentIndex);
    const entrySegment = plan.getSegment(segmentIndex - 1);
    const entryCumulativeDistance = entrySegment.legs[entrySegment.legs.length - 1]?.calculated?.cumulativeDistance;
    const exitCumulativeDistance = segment.legs[segment.legs.length - 1]?.calculated?.cumulativeDistance;
    return exitCumulativeDistance && entryCumulativeDistance ? exitCumulativeDistance - entryCumulativeDistance : -1;
  }

  /**
   * Method to add a new origin airport and runway to the flight plan.
   * @param airport is the facility of the origin airport.
   * @param runway is the onewayrunway
   */
  public setOrigin(airport: AirportFacility | undefined, runway?: OneWayRunway): void {
    const plan = this.getFlightPlan();
    const segmentIndex = this.ensureOnlyOneSegmentOfType(FlightPlanSegmentType.Departure);

    if (airport) {
      plan.setOriginAirport(airport.icao);
      plan.setOriginRunway(runway);
      this.planClearSegment(segmentIndex, FlightPlanSegmentType.Departure);
      this.planAddOriginDestinationLeg(true, segmentIndex, airport, runway);

      const prevLeg = plan.getPrevLeg(segmentIndex, 1);
      const nextLeg = plan.getNextLeg(segmentIndex, 0);
      if (prevLeg && nextLeg && this.isDuplicateLeg(prevLeg.leg, nextLeg.leg)) {
        this.planRemoveDuplicateLeg(prevLeg, nextLeg);
      }
    } else {
      plan.removeOriginAirport();
      this.setApproachDetails(false, ApproachType.APPROACH_TYPE_UNKNOWN, RnavTypeFlags.None, false);
      this.planClearSegment(segmentIndex, FlightPlanSegmentType.Departure);
    }

    plan.calculate(0);
  }

  /**
   * Method to add a new destination airport and runway to the flight plan.
   * @param airport is the facility of the destination airport.
   * @param runway is the selected runway at the destination facility.
   */
  public setDestination(airport: AirportFacility | undefined, runway?: OneWayRunway): void {
    const plan = this.getFlightPlan();
    const destSegmentIndex = this.ensureOnlyOneSegmentOfType(FlightPlanSegmentType.Destination);

    if (airport) {
      plan.setDestinationAirport(airport.icao);
      plan.setDestinationRunway(runway);
      this.planClearSegment(destSegmentIndex, FlightPlanSegmentType.Destination);

      const hasArrival = plan.procedureDetails.arrivalIndex > -1;
      const hasApproach = plan.procedureDetails.approachIndex > -1;

      if (!hasArrival && !hasApproach) {
        this.planAddOriginDestinationLeg(false, destSegmentIndex, airport, runway);
      }
    } else {
      plan.removeDestinationAirport();
      this.planClearSegment(destSegmentIndex, FlightPlanSegmentType.Destination);
    }

    plan.calculate(0);
  }

  /**
   * Method to remove runway or airport legs from segments where they shouldn't exist.
   */
  public removeDestLegFromSegments(): void {
    const plan = this.getFlightPlan();
    const destination = plan.destinationAirport;
    const hasArrival = plan.procedureDetails.arrivalIndex > -1;
    const hasApproach = plan.procedureDetails.approachIndex > -1 || plan.getUserData('visual_approach');
    const destinationSegmentIndex = this.ensureOnlyOneSegmentOfType(FlightPlanSegmentType.Destination);
    const destinationSegment = plan.getSegment(destinationSegmentIndex);

    if (hasApproach && destination) {
      if (hasArrival) {
        const arrivalSegmentIndex = this.ensureOnlyOneSegmentOfType(FlightPlanSegmentType.Arrival);
        const arrival = plan.getSegment(arrivalSegmentIndex);
        const lastArrivalLegIcao = arrival.legs[arrival.legs.length - 1].leg.fixIcao;
        if (lastArrivalLegIcao === destination || lastArrivalLegIcao.search('R') === 0) {
          this.planRemoveLeg(arrivalSegmentIndex, arrival.legs.length - 1);
        }
      }
      if (destinationSegment.legs.length > 0) {
        this.planClearSegment(destinationSegmentIndex, FlightPlanSegmentType.Destination);
      }
    } else if (hasArrival && destination) {
      if (destinationSegment.legs.length > 0) {
        this.planClearSegment(destinationSegmentIndex, FlightPlanSegmentType.Destination);
      }
    }
  }

  /**
   * Method to ensure only one segment of a specific type exists in the flight plan and optionally insert it if needed.
   * @param segmentType is the segment type we want to evaluate.
   * @param insert is whether to insert the segment if missing
   * @returns segmentIndex of the only segment of this type in the flight plan.
   */
  private ensureOnlyOneSegmentOfType(segmentType: FlightPlanSegmentType, insert = true): number {
    const plan = this.getFlightPlan();
    let segmentIndex: number;

    const selectedSegments = plan.segmentsOfType(segmentType);
    const segmentIndexArray: number[] = [];

    for (const element of selectedSegments) {
      segmentIndexArray.push(element.segmentIndex);
    }

    if (segmentIndexArray.length === 0) {
      if (insert) {
        segmentIndex = this.planInsertSegmentOfType(segmentType);
      } else {
        segmentIndex = -1;
      }
    } else if (segmentIndexArray.length > 1) {
      for (let i = 0; i < segmentIndexArray.length; i++) {
        this.planRemoveSegment(segmentIndexArray[i]);
      }
      segmentIndex = this.planInsertSegmentOfType(segmentType);
    } else {
      segmentIndex = segmentIndexArray[0];
    }
    return segmentIndex;
  }

  /**
   * Method to invert the flightplan.
   */
  public invertFlightplan(): void {
    const plan = this.getFlightPlan();
    const activeLegIcao = plan.getLeg(plan.activeLateralLeg).leg.fixIcao;

    if (plan.directToData.segmentIndex >= 0 && plan.directToData.segmentLegIndex >= 0) {
      this.removeDirectToExisting();
    }

    if (!Simplane.getIsGrounded() && activeLegIcao) {
      this.createDirectToRandom(activeLegIcao);
    }

    const newOriginIcao = plan.destinationAirport;
    const newDestinationIcao = plan.originAirport;
    const lastEnrouteSegmentIndex = this.findLastEnrouteSegmentIndex(plan);

    if (lastEnrouteSegmentIndex === 1 && plan.getSegment(1).legs.length > 0) {
      //case for when there is only 1 enroute segment and it has at least 1 waypoint, a simple reversal is all that's required.
      const segment = Object.assign({}, plan.getSegment(1));
      this.emptyPrimaryFlightPlan();
      for (let l = segment.legs.length - 1; l >= 0; l--) {
        plan.addLeg(1, segment.legs[l].leg);
      }
    } else if (lastEnrouteSegmentIndex > 1) {
      //case for when there is more than 1 enroute segment we know we have to deal with airways
      const legs: LegList[] = [];
      for (let i = 1; i <= lastEnrouteSegmentIndex; i++) {
        //create a temporary list of legs that looks like what a flight plan import looks like with ICAO and the airway
        //we fly FROM the leg on.
        const oldSegment = plan.getSegment(i);
        const airway = oldSegment.airway ? oldSegment.airway?.split('.')[0] : undefined;
        for (const leg of oldSegment.legs) {
          const legListItem: LegList = { icao: leg.leg.fixIcao, airway: airway };
          legs.push(legListItem);
        }
      }
      //after the array of legs is complete, we just reverse it
      legs.reverse();
      this.emptyPrimaryFlightPlan();

      let currentSegment = 1;
      let lastLegWasAirway = false;

      //last we go through each leg and use the same logic we use for the flight plan import to go through each leg and create airway
      //segments as appropriate for these legs.
      for (let i = 0; i < legs.length; i++) {
        const wpt = legs[i];
        const segment = plan.getSegment(currentSegment);
        if (wpt.airway) {
          const leg = FlightPlan.createLeg({
            type: LegType.TF,
            fixIcao: wpt.icao
          });
          plan.addLeg(currentSegment, leg);
          if (!lastLegWasAirway) {
            plan.insertSegment(currentSegment + 1, FlightPlanSegmentType.Enroute, wpt.airway);
            currentSegment += 1;
          }
          for (let j = i + 1; j < legs.length; j++) {
            i++;
            const airwayLeg = FlightPlan.createLeg({
              type: LegType.TF,
              fixIcao: legs[j].icao
            });
            plan.addLeg(currentSegment, airwayLeg);

            if (legs[j].airway !== wpt.airway) {
              lastLegWasAirway = legs[j].airway ? true : false;
              break;
            }
          }

          plan.setAirway(currentSegment, wpt.airway + '.' + ICAO.getIdent(legs[i].icao));

          currentSegment += 1;
          plan.insertSegment(currentSegment, FlightPlanSegmentType.Enroute, lastLegWasAirway ? legs[i].airway : undefined);

        } else {
          let leg: FlightPlanLeg | undefined = undefined;
          leg = FlightPlan.createLeg({
            type: LegType.TF,
            fixIcao: wpt.icao
          });
          if (leg) {
            plan.addLeg(currentSegment, leg);
            if (lastLegWasAirway) {
              plan.setAirway(currentSegment, segment.airway + '.' + ICAO.getIdent(wpt.icao));
              currentSegment += 1;
              plan.insertSegment(currentSegment, FlightPlanSegmentType.Enroute);
            }
            lastLegWasAirway = false;
          }
        }
      }

      if (plan.getSegment(currentSegment).airway) {
        currentSegment += 1;
        plan.insertSegment(currentSegment, FlightPlanSegmentType.Enroute);
      }
    } else {
      this.emptyPrimaryFlightPlan();
    }

    if (newOriginIcao) {
      this.facLoader.getFacility(FacilityType.Airport, newOriginIcao).then((facility) => {
        this.setOrigin(facility as AirportFacility);
      });
    }

    if (newDestinationIcao) {
      this.facLoader.getFacility(FacilityType.Airport, newDestinationIcao).then((facility) => {
        this.setDestination(facility as AirportFacility);
      });
    }

    this.setApproachDetails(false, ApproachType.APPROACH_TYPE_UNKNOWN, RnavTypeFlags.None, false);
    plan.calculate(0);
  }

  /**
   * Method to add or replace a departure procedure in the flight plan.
   * @param facility is the facility that contains the procedure to add.
   * @param departureIndex is the index of the departure
   * @param departureRunwayIndex is the index of the runway transition
   * @param enrouteTransitionIndex is the index of the enroute transition
   * @param oneWayRunway is the one way runway to set as the origin leg.
   */
  public insertDeparture(
    facility: AirportFacility,
    departureIndex: number,
    departureRunwayIndex: number,
    enrouteTransitionIndex: number,
    oneWayRunway?: OneWayRunway | undefined
  ): void {
    const plan = this.getFlightPlan();
    plan.setDeparture(facility.icao, departureIndex, enrouteTransitionIndex, departureRunwayIndex);
    const segmentIndex = this.ensureOnlyOneSegmentOfType(FlightPlanSegmentType.Departure);

    this.planClearSegment(segmentIndex, FlightPlanSegmentType.Departure);

    const insertProcedureObject: InsertProcedureObject = this.buildDepartureLegs(facility, departureIndex, enrouteTransitionIndex, departureRunwayIndex, oneWayRunway);

    if (oneWayRunway) {
      plan.setOriginAirport(facility.icao);
      plan.setOriginRunway(oneWayRunway);
    } else if (plan.originAirport == facility.icao && plan.procedureDetails.originRunway) {
      const originLeg = FmsUtils.buildRunwayLeg(facility, plan.procedureDetails.originRunway, true);
      insertProcedureObject.procedureLegs.splice(0, 1, originLeg);
    } else {
      plan.setOriginAirport(facility.icao);
    }

    insertProcedureObject.procedureLegs.forEach(l => this.planAddLeg(segmentIndex, l));

    const nextLeg = plan.getNextLeg(segmentIndex, Infinity);
    const depSegment = plan.getSegment(segmentIndex);
    const lastDepLeg = depSegment.legs[depSegment.legs.length - 1];
    if (nextLeg && lastDepLeg && this.isDuplicateLeg(lastDepLeg.leg, nextLeg.leg)) {
      this.planRemoveDuplicateLeg(lastDepLeg, nextLeg);
    }

    this.setVerticalData(plan, segmentIndex);

    plan.calculate(0);
  }

  /**
   * Method to insert the arrival legs.
   * @param facility is the facility to build legs from.
   * @param procedureIndex is the procedure index to build legs from.
   * @param enrouteTransitionIndex is the enroute transition index to build legs from.
   * @param runwayTransitionIndex is the runway transition index to build legs from.
   * @param oneWayRunway is the one way runway, if one is specified in the procedure.
   * @returns InsertProcedureObject to insert into the flight plan.
   */
  private buildDepartureLegs(facility: AirportFacility,
    procedureIndex: number,
    enrouteTransitionIndex: number,
    runwayTransitionIndex: number,
    oneWayRunway?: OneWayRunway): InsertProcedureObject {

    const departure = facility.departures[procedureIndex];
    const enRouteTransition = departure.enRouteTransitions[enrouteTransitionIndex];
    const runwayTransition = departure.runwayTransitions[runwayTransitionIndex];
    const insertProcedureObject: InsertProcedureObject = { procedureLegs: [] };

    let originLeg;
    if (oneWayRunway) {
      originLeg = FmsUtils.buildRunwayLeg(facility, oneWayRunway, true);
    } else {
      originLeg = FlightPlan.createLeg({
        lat: facility.lat,
        lon: facility.lon,
        type: LegType.IF,
        fixIcao: facility.icao
      });
    }

    insertProcedureObject.procedureLegs.push(originLeg);

    if (runwayTransition !== undefined && runwayTransition.legs.length > 0) {
      runwayTransition.legs.forEach((leg) => {
        insertProcedureObject.procedureLegs.push(FlightPlan.createLeg(leg));
      });
    }

    for (let i = 0; i < departure.commonLegs.length; i++) {
      const leg = FlightPlan.createLeg(departure.commonLegs[i]);
      if (i == 0 && insertProcedureObject.procedureLegs.length > 0 &&
        this.isDuplicateIFLeg(insertProcedureObject.procedureLegs[insertProcedureObject.procedureLegs.length - 1], leg)) {
        insertProcedureObject.procedureLegs[insertProcedureObject.procedureLegs.length - 1] =
          this.mergeDuplicateLegData(insertProcedureObject.procedureLegs[insertProcedureObject.procedureLegs.length - 1], leg);
        continue;
      }
      insertProcedureObject.procedureLegs.push(leg);
    }

    if (enRouteTransition) {
      for (let i = 0; i < enRouteTransition.legs.length; i++) {
        const leg = FlightPlan.createLeg(enRouteTransition.legs[i]);
        if (i == 0 && insertProcedureObject.procedureLegs.length > 0 &&
          this.isDuplicateIFLeg(insertProcedureObject.procedureLegs[insertProcedureObject.procedureLegs.length - 1], leg)) {
          insertProcedureObject.procedureLegs[insertProcedureObject.procedureLegs.length - 1] =
            this.mergeDuplicateLegData(insertProcedureObject.procedureLegs[insertProcedureObject.procedureLegs.length - 1], leg);
          continue;
        }
        insertProcedureObject.procedureLegs.push(enRouteTransition.legs[i]);
      }
    }

    return insertProcedureObject;
  }

  /**
   * Method to add or replace an arrival procedure in the flight plan.
   * @param facility is the facility that contains the procedure to add.
   * @param arrivalIndex is the index of the arrival procedure.
   * @param arrivalRunwayTransitionIndex is the index of the arrival runway transition.
   * @param enrouteTransitionIndex is the index of the enroute transition.
   * @param oneWayRunway is the one way runway to set as the destination leg.
   */
  public insertArrival(
    facility: AirportFacility,
    arrivalIndex: number,
    arrivalRunwayTransitionIndex: number,
    enrouteTransitionIndex: number,
    oneWayRunway?: OneWayRunway | undefined
  ): void {
    const plan = this.getFlightPlan();
    plan.setArrival(facility.icao, arrivalIndex, enrouteTransitionIndex, arrivalRunwayTransitionIndex);

    if (plan.length > 0 && plan.procedureDetails.approachIndex < 0 && plan.destinationAirport) {
      if (!this.moveDirectToDestinationLeg(plan, FlightPlanSegmentType.Enroute)) {
        if (plan.getLeg(plan.activeLateralLeg).leg.fixIcao === plan.destinationAirport && plan.destinationAirport !== facility.icao && plan.activeLateralLeg === plan.length - 1) {
          const lastEnrouteSegmentIndex = this.findLastEnrouteSegmentIndex(plan);
          const newDestinationLeg = FlightPlan.createLeg({ fixIcao: plan.destinationAirport, type: LegType.TF });
          this.planAddLeg(lastEnrouteSegmentIndex, newDestinationLeg);
        }
      }
    }

    if (plan.procedureDetails.approachIndex < 0) {
      plan.setDestinationAirport(facility.icao);
      plan.setDestinationRunway(oneWayRunway);
    }

    const segmentIndex = this.ensureOnlyOneSegmentOfType(FlightPlanSegmentType.Arrival);

    if (plan.getSegment(segmentIndex).legs.length > 0) {
      this.planClearSegment(segmentIndex, FlightPlanSegmentType.Arrival);
    }

    const insertProcedureObject: InsertProcedureObject = this.buildArrivalLegs(facility, arrivalIndex, enrouteTransitionIndex, arrivalRunwayTransitionIndex, oneWayRunway);

    let directTargetLeg: FlightPlanLeg | undefined;
    let handleDirectToDestination = false;
    const directToState = this.getDirectToState();

    if (plan.procedureDetails.approachIndex > -1) {
      insertProcedureObject.procedureLegs.pop();
    } else if (directToState === DirectToState.TOEXISTING) {
      directTargetLeg = this.getDirectToLeg();
      if (directTargetLeg?.fixIcao === plan.destinationAirport &&
        directTargetLeg?.fixIcao === insertProcedureObject.procedureLegs[insertProcedureObject.procedureLegs.length - 1].fixIcao) {
        insertProcedureObject.procedureLegs.pop();
        handleDirectToDestination = true;
      }
    }

    insertProcedureObject.procedureLegs.forEach(l => this.planAddLeg(segmentIndex, l));

    const arrSegment = plan.getSegment(segmentIndex);
    const prevLeg = plan.getPrevLeg(segmentIndex, 0);
    const firstArrLeg = arrSegment.legs[0];
    if (prevLeg && firstArrLeg && this.isDuplicateLeg(prevLeg.leg, firstArrLeg.leg)) {
      this.planRemoveDuplicateLeg(prevLeg, firstArrLeg);
    }

    this.removeDestLegFromSegments();

    const nextLeg = plan.getNextLeg(segmentIndex, Infinity);
    const lastArrLeg = arrSegment.legs[arrSegment.legs.length - 1];
    if (nextLeg && lastArrLeg && this.isDuplicateLeg(lastArrLeg.leg, nextLeg.leg)) {
      this.planRemoveDuplicateLeg(lastArrLeg, nextLeg);
    }

    if (handleDirectToDestination) {
      this.moveDirectToDestinationLeg(plan, FlightPlanSegmentType.Arrival, segmentIndex);
      this.activateLeg(segmentIndex, arrSegment.legs.length - 1);
    } else if (directToState === DirectToState.TOEXISTING && directTargetLeg && directTargetLeg.fixIcao === plan.destinationAirport) {
      this.removeDirectToExisting();
      this.createDirectToRandom(plan.destinationAirport);
    }

    this.setVerticalData(plan, segmentIndex);

    plan.calculate(0);
  }

  /**
   * Method to insert the arrival legs.
   * @param facility is the facility to build legs from.
   * @param procedureIndex is the procedure index to build legs from.
   * @param enrouteTransitionIndex is the enroute transition index to build legs from.
   * @param runwayTransitionIndex is the runway transition index to build legs from.
   * @param oneWayRunway is the one way runway, if one is specified in the procedure.
   * @returns InsertProcedureObject to insert into the flight plan.
   */
  private buildArrivalLegs(facility: AirportFacility,
    procedureIndex: number,
    enrouteTransitionIndex: number,
    runwayTransitionIndex: number,
    oneWayRunway?: OneWayRunway): InsertProcedureObject {

    const arrival = facility.arrivals[procedureIndex];
    const enRouteTransition = arrival.enRouteTransitions[enrouteTransitionIndex];
    const runwayTransition = arrival.runwayTransitions[runwayTransitionIndex];
    const insertProcedureObject: InsertProcedureObject = { procedureLegs: [] };

    if (enRouteTransition !== undefined && enRouteTransition.legs.length > 0) {
      enRouteTransition.legs.forEach((leg) => {
        insertProcedureObject.procedureLegs.push(FlightPlan.createLeg(leg));
      });
    }

    for (let i = 0; i < arrival.commonLegs.length; i++) {
      const leg = FlightPlan.createLeg(arrival.commonLegs[i]);
      if (i == 0 && insertProcedureObject.procedureLegs.length > 0 &&
        this.isDuplicateIFLeg(insertProcedureObject.procedureLegs[insertProcedureObject.procedureLegs.length - 1], leg)) {
        insertProcedureObject.procedureLegs[insertProcedureObject.procedureLegs.length - 1] =
          this.mergeDuplicateLegData(insertProcedureObject.procedureLegs[insertProcedureObject.procedureLegs.length - 1], leg);
        continue;
      }
      insertProcedureObject.procedureLegs.push(leg);
    }

    if (runwayTransition) {
      for (let i = 0; i < runwayTransition.legs.length; i++) {
        const leg = FlightPlan.createLeg(runwayTransition.legs[i]);
        if (i == 0 && insertProcedureObject.procedureLegs.length > 0 &&
          this.isDuplicateIFLeg(insertProcedureObject.procedureLegs[insertProcedureObject.procedureLegs.length - 1], leg)) {
          insertProcedureObject.procedureLegs[insertProcedureObject.procedureLegs.length - 1] =
            this.mergeDuplicateLegData(insertProcedureObject.procedureLegs[insertProcedureObject.procedureLegs.length - 1], leg);
          continue;
        }
        insertProcedureObject.procedureLegs.push(leg);
      }
    }

    const destinationLeg = oneWayRunway
      ? FmsUtils.buildRunwayLeg(facility, oneWayRunway, false)
      : FlightPlan.createLeg({
        lat: facility.lat,
        lon: facility.lon,
        type: LegType.TF,
        fixIcao: facility.icao
      });

    insertProcedureObject.procedureLegs.push(destinationLeg);

    this.tryInsertIFLeg(insertProcedureObject);

    return insertProcedureObject;
  }

  /**
   * Method to move a direct to destination to a specified target segment.
   * @param plan is the primary flight plan.
   * @param targetSegmentType is the target segment type.
   * @param arrivalSegmentIndex is the arrival segment index
   * @returns whether a direct to destination was moved.
   */
  private moveDirectToDestinationLeg(plan: FlightPlan, targetSegmentType: FlightPlanSegmentType, arrivalSegmentIndex?: number): boolean {
    if (this.getDirectToState() === DirectToState.TOEXISTING) {
      const directTargetSegmentIndex = targetSegmentType === FlightPlanSegmentType.Arrival ? arrivalSegmentIndex : this.findLastEnrouteSegmentIndex(plan);
      if (directTargetSegmentIndex !== undefined && directTargetSegmentIndex > 0 && plan.getLeg(plan.activeLateralLeg).leg.fixIcao === plan.destinationAirport) {
        const destinationLeg = Object.assign({}, plan.getSegment(plan.directToData.segmentIndex).legs[plan.directToData.segmentLegIndex].leg);
        const directTargetLeg = Object.assign({}, plan.getLeg(plan.activeLateralLeg).leg);
        const directOriginLeg = Object.assign({}, plan.getLeg(plan.activeLateralLeg - 1).leg);
        const discoLeg = Object.assign({}, plan.getLeg(plan.activeLateralLeg - 2).leg);

        const newDirectLegIndex = plan.getSegment(directTargetSegmentIndex).legs.length;

        plan.removeLeg(plan.directToData.segmentIndex, plan.directToData.segmentLegIndex);
        plan.removeLeg(plan.directToData.segmentIndex, plan.directToData.segmentLegIndex);
        plan.removeLeg(plan.directToData.segmentIndex, plan.directToData.segmentLegIndex);
        plan.removeLeg(plan.directToData.segmentIndex, plan.directToData.segmentLegIndex);

        plan.setDirectToData(directTargetSegmentIndex, newDirectLegIndex);

        plan.addLeg(directTargetSegmentIndex, destinationLeg);
        plan.addLeg(directTargetSegmentIndex, discoLeg, undefined, LegDefinitionFlags.DirectTo);
        plan.addLeg(directTargetSegmentIndex, directOriginLeg, undefined, LegDefinitionFlags.DirectTo);
        const newActiveLeg = plan.addLeg(directTargetSegmentIndex, directTargetLeg, undefined, LegDefinitionFlags.DirectTo);
        const newActiveLegIndex = plan.getLegIndexFromLeg(newActiveLeg);

        plan.setCalculatingLeg(newActiveLegIndex);
        plan.setLateralLeg(newActiveLegIndex);
        plan.planIndex !== this.flightPlanner.activePlanIndex && plan.calculate(newActiveLegIndex);

        return true;
      }
    }
    return false;
  }

  /**
   * Method to find the last enroute segment of the supplied flight plan.
   * @param plan is the flight plan to find the last enroute segment in.
   * @returns a segment index.
   */
  private findLastEnrouteSegmentIndex(plan: FlightPlan): number {
    let enrouteSegmentFound = 0;
    for (let i = 1; i < plan.segmentCount; i++) {
      const segment = plan.getSegment(i);
      if (segment.segmentType === FlightPlanSegmentType.Enroute) {
        enrouteSegmentFound = i;
      }
    }
    return enrouteSegmentFound;
  }

  /**
   * Method manage the destination leg in the last enroute segment.
   * @param plan is the flight plan.
   * @param currentDestination is the currently set destination airport icao.
   */
  private manageAirportLeg(plan: FlightPlan, currentDestination: string | undefined): void {
    if (plan.procedureDetails.arrivalIndex > -1 || !currentDestination || Simplane.getIsGrounded()) {
      //if we don't have a destination set, or an arrival is selected, don't add the airport to enroute
      return;
    }
    const lastEnrouteSegmentIndex = this.findLastEnrouteSegmentIndex(plan);
    const segment = plan.getSegment(lastEnrouteSegmentIndex);
    const lastLegIndex = segment.legs.length - 1;

    if (currentDestination && (lastLegIndex < 0 || segment.legs[lastLegIndex].leg.fixIcao !== currentDestination)) {
      //if a destination is set, AND either (a) the last enroute segment is empty OR (b) the last enroute segment isn't empty and
      //the last leg of the last enroute segment is not already the current destination
      this.planAddLeg(lastEnrouteSegmentIndex, FlightPlan.createLeg({ fixIcao: currentDestination, type: LegType.TF }));
    }
  }

  /**
   * Method to check whether an approach can load, or only activate.
   * @returns true if the approach can be loaded and not activated, otherwise the approach can only be immediatly activated.
   */
  public canApproachLoad(): boolean {
    const plan = this.getFlightPlan();
    if (plan.length > 0) {
      const activeSegment = plan.getSegment(plan.getSegmentIndex(plan.activeLateralLeg));
      if (activeSegment.segmentType !== FlightPlanSegmentType.Approach && plan.length > 1) {
        return true;
      }
    }
    return false;
  }

  private insertApproachOpId = 0;

  /**
   * Method to add or replace an approach procedure in the flight plan.
   * @param facility is the facility that contains the procedure to add.
   * @param approachIndex is the index of the approach procedure.
   * @param approachTransitionIndex is the index of the approach transition.
   * @param visualRunwayNumber is the visual runway number, if any.
   * @param visualRunwayDesignator is the visual runway designator, if any.
   * @param transStartIndex is the starting leg index for the transition, if any.
   * @param skipCourseReversal Whether to skip the course reversal. False by default.
   * @param skipAutotune Whether to skip autotuning of the approach frequency, if one exists, to the nav radios. False
   * by default.
   * @returns A Promise which is fulfilled with whether the approach was inserted.
   */
  public async insertApproach(
    facility: AirportFacility,
    approachIndex: number,
    approachTransitionIndex: number,
    visualRunwayNumber?: number,
    visualRunwayDesignator?: RunwayDesignator,
    transStartIndex?: number,
    skipCourseReversal = false,
    skipAutotune = false
  ): Promise<boolean> {

    const plan = this.getFlightPlan();
    let visualRunway: OneWayRunway | undefined;

    if (visualRunwayNumber !== undefined && visualRunwayDesignator !== undefined) {
      visualRunway = RunwayUtils.matchOneWayRunway(facility, visualRunwayNumber, visualRunwayDesignator);
      if (!visualRunway) {
        return false;
      }
    }

    const opId = ++this.insertApproachOpId;
    const insertProcedureObject = await this.buildApproachLegs(facility, approachIndex, approachTransitionIndex, visualRunway, transStartIndex, skipCourseReversal);

    if (opId !== this.insertApproachOpId) {
      return false;
    }

    let skipDestinationLegCheck = false;

    const approachRunway = insertProcedureObject.runway;
    const approachRunwayIcao = approachRunway ? RunwayUtils.getRunwayFacilityIcao(facility, approachRunway) : undefined;
    const isDtoExistingToRunwayActive = approachRunway
      && this.getDirectToState() === DirectToState.TOEXISTING
      && plan.getLeg(plan.activeLateralLeg).leg.fixIcao[0] === 'R';

    const isDtoExistingToApproachRunway = isDtoExistingToRunwayActive && approachRunway && plan.getLeg(plan.activeLateralLeg).leg.fixIcao === approachRunwayIcao;

    let dtoExistingToRunwayIcao = '';
    let dtoExistingToRunwayCourse: number | undefined = undefined;

    if (isDtoExistingToRunwayActive) {
      const dtoLeg = plan.getLeg(plan.activeLateralLeg);
      dtoExistingToRunwayIcao = dtoLeg.leg.fixIcao;
      dtoExistingToRunwayCourse = dtoLeg.leg.type === LegType.DF ? undefined : dtoLeg.leg.course;

      // Do not remove the destination runway leg if it is part of an arrival and the target of a direct to existing
      skipDestinationLegCheck = plan.getSegment(plan.directToData.segmentIndex).segmentType === FlightPlanSegmentType.Arrival;
    }

    if (visualRunway) {
      plan.setUserData('visual_approach', `${visualRunway.designation}`);
    } else if (plan.getUserData('visual_approach')) {
      plan.deleteUserData('visual_approach');
    }

    plan.setApproach(facility.icao, approachIndex, approachTransitionIndex);

    if (plan.procedureDetails.arrivalIndex < 0) {
      if (!this.moveDirectToDestinationLeg(plan, FlightPlanSegmentType.Enroute)) {
        this.manageAirportLeg(plan, plan.destinationAirport);
      } else {
        skipDestinationLegCheck = true;
      }
    }
    plan.setDestinationAirport(facility.icao);

    if (!skipDestinationLegCheck) {
      this.removeDestLegFromSegments();
    }

    const segmentIndex = this.ensureOnlyOneSegmentOfType(FlightPlanSegmentType.Approach);

    if (plan.getSegment(segmentIndex).legs.length > 0) {
      this.planClearSegment(segmentIndex, FlightPlanSegmentType.Approach);
    }

    if (insertProcedureObject.runway) {
      plan.setDestinationRunway(insertProcedureObject.runway);
    }

    let haveAddedMap = false;
    insertProcedureObject.procedureLegs.forEach((l) => {
      let isMissedLeg = false;
      if (visualRunway !== undefined) {
        this.addVisualFacilityFromLeg(l, visualRunway.designation);
        if (haveAddedMap) {
          isMissedLeg = true;
        }
        if (l.fixTypeFlags & FixTypeFlags.MAP) {
          haveAddedMap = true;
        }
      }

      let flags = l.legDefinitionFlags ?? LegDefinitionFlags.None;
      if (isMissedLeg) {
        flags |= LegDefinitionFlags.MissedApproach;
      }

      this.planAddLeg(segmentIndex, l, undefined, flags);
    });

    const prevLeg = plan.getPrevLeg(segmentIndex, 0);
    const firstAppLeg = plan.getSegment(segmentIndex).legs[0];
    if (prevLeg && firstAppLeg && this.isDuplicateLeg(prevLeg.leg, firstAppLeg.leg)) {
      this.planRemoveDuplicateLeg(prevLeg, firstAppLeg);
    }

    // Adds missed approach legs
    if (!visualRunway && insertProcedureObject.procedureLegs.length > 0) {
      const missedLegs = facility.approaches[approachIndex].missedLegs ?? [];
      if (missedLegs.length > 0) {
        let maphIndex = -1;
        for (let m = missedLegs.length - 1; m >= 0; m--) {
          switch (missedLegs[m].type) {
            case LegType.HA:
            case LegType.HF:
            case LegType.HM:
              maphIndex = m - 1;
              break;
          }
        }
        for (let n = 0; n < missedLegs.length; n++) {
          const newLeg = FlightPlan.createLeg(missedLegs[n]);
          if (maphIndex >= 0 && n === maphIndex) {
            newLeg.fixTypeFlags |= FixTypeFlags.MAHP;
            this.planAddLeg(segmentIndex, newLeg, undefined, LegDefinitionFlags.MissedApproach);
          } else {
            this.planAddLeg(segmentIndex, newLeg, undefined, LegDefinitionFlags.MissedApproach);
          }
        }
      }
    }

    const approachType = visualRunway ? AdditionalApproachType.APPROACH_TYPE_VISUAL : facility.approaches[approachIndex].approachType;
    const rnavTypeFlag = visualRunway ? RnavTypeFlags.None : FmsUtils.getBestRnavType(facility.approaches[approachIndex].rnavTypeFlags);
    const approachIsCircling = !visualRunway && !facility.approaches[approachIndex].runway ? true : false;
    this.setApproachDetails(true, approachType, rnavTypeFlag, false, approachIsCircling);

    this.setVerticalData(plan, segmentIndex);

    this.loadApproachFrequency(facility, approachIndex);

    if (!skipAutotune) {
      this.setLocFrequency(1);
      this.setLocFrequency(2);
    }

    await plan.calculate();

    if (opId !== this.insertApproachOpId) {
      return false;
    }

    if (isDtoExistingToRunwayActive && this.getDirectToState() !== DirectToState.TOEXISTING) {
      // Direct To Existing to the destination runway was canceled as a result of adding the approach
      if (isDtoExistingToApproachRunway) {
        // DTO target runway matches the runway of the loaded approach -> need to reactivate DTO to the new runway leg
        // in the approach
        const runwayLegIndex = plan.getSegment(segmentIndex).legs.findIndex(leg => leg.leg.fixIcao === approachRunwayIcao);
        if (runwayLegIndex >= 0) {
          this.createDirectToExisting(segmentIndex, runwayLegIndex, dtoExistingToRunwayCourse);
        }
      } else {
        // DTO target runway does not match the runway of the loaded approach (or the approach is circling only) ->
        // activate DTO random to the old runway
        this.createDirectToRandom(dtoExistingToRunwayIcao, dtoExistingToRunwayCourse);
      }
    }

    return true;
  }

  /**
   * Method to insert the approach legs.
   * @param facility The facility to build legs from.
   * @param approachIndex The approach procedure index to build legs from.
   * @param approachTransitionIndex The transition index to build legs from.
   * @param visualRunway If this is a visual approach, the visual approach one way runway object.
   * @param transStartIndex The starting leg index for the transition, if any.
   * @param skipCourseReversal Whether to skip the course reversal.
   * @returns A Promise which is fulfilled with an `InsertProcedureObject` containing the flight plan legs to insert
   * into the flight plan.
   */
  private async buildApproachLegs(
    facility: AirportFacility,
    approachIndex: number,
    approachTransitionIndex: number,
    visualRunway?: OneWayRunway,
    transStartIndex?: number,
    skipCourseReversal?: boolean
  ): Promise<InsertProcedureObject> {
    const isVisual = !!visualRunway;
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const approach = isVisual ? FmsUtils.buildVisualApproach(facility, visualRunway!, 1, 2.5) : facility.approaches[approachIndex];
    const transition = approach.transitions[approachTransitionIndex];
    const isVtf = approachTransitionIndex < 0;
    const insertProcedureObject: InsertProcedureObject = { procedureLegs: [] };

    if (transition !== undefined && transition.legs.length > 0) {
      const startIndex = transStartIndex !== undefined ? transStartIndex : 0;
      for (let t = startIndex; t < transition.legs.length; t++) {
        insertProcedureObject.procedureLegs.push(FlightPlan.createLeg(transition.legs[t]));
      }
    }

    const lastTransitionLeg = insertProcedureObject.procedureLegs[insertProcedureObject.procedureLegs.length - 1];

    if (isVtf) {
      insertProcedureObject.procedureLegs.push(FlightPlan.createLeg({ type: LegType.Discontinuity }));
    }

    const finalLegs = approach.finalLegs;
    for (let i = 0; i < finalLegs.length; i++) {
      const leg = FlightPlan.createLeg(finalLegs[i]);
      if (i === 0 && lastTransitionLeg && this.isDuplicateIFLeg(lastTransitionLeg, leg)) {
        insertProcedureObject.procedureLegs[insertProcedureObject.procedureLegs.length - 1] = this.mergeDuplicateLegData(lastTransitionLeg, leg);
        continue;
      }

      if (!isVisual && leg.fixIcao[0] === 'R') {
        const approachRunway = RunwayUtils.matchOneWayRunway(facility, approach.runwayNumber, approach.runwayDesignator);
        if (approachRunway) {
          insertProcedureObject.runway = approachRunway;
          const runwayLeg = FmsUtils.buildRunwayLeg(facility, approachRunway, false);
          runwayLeg.altitude1 += 15; //Runway leg altitude should be 50 feet above threshold

          insertProcedureObject.procedureLegs.push(runwayLeg);
        }
      } else if (isVisual && i === finalLegs.length - 1) {
        insertProcedureObject.runway = visualRunway;
        insertProcedureObject.procedureLegs.push(leg);
        if (approach.missedLegs.length > 0) {
          insertProcedureObject.procedureLegs.push(approach.missedLegs[0]);
        }
      } else {
        insertProcedureObject.procedureLegs.push(leg);
        if (isVtf && BitFlags.isAll(leg.fixTypeFlags, FixTypeFlags.FAF)) {
          await this.insertVtfLegs(insertProcedureObject, leg, finalLegs[i - 1], finalLegs[i + 1]);
        }
      }
    }

    if (!isVisual) {
      this.tryInsertIFLeg(insertProcedureObject);
      this.tryReconcileIAFLeg(insertProcedureObject);
      this.manageFafAltitudeRestriction(insertProcedureObject);
      this.tryCleanupHold(insertProcedureObject);
      if (skipCourseReversal) {
        this.tryRemoveCourseReversal(insertProcedureObject);
      }
      this.tryInsertMap(insertProcedureObject);

      if (!insertProcedureObject.runway && approach.runway) {
        insertProcedureObject.runway = RunwayUtils.matchOneWayRunway(facility, approach.runwayNumber, approach.runwayDesignator);
      }

      return insertProcedureObject;
    }

    return insertProcedureObject;
  }

  /**
   * Inserts vectors-to-final legs into an insert procedure object. Vectors to final legs consist of a discontinuity
   * leg followed by a CF leg to the final approach fix. The course of the CF leg (the vectors-to-final course) is
   * defined as follows:
   * * If the leg to the faf is a CF leg, the VTF course is equal to the CF leg course.
   * * If the leg to the faf is not an IF leg, the VTF course is defined by the great-circle path from the fix
   * immediately prior to the faf to the faf.
   * * If the leg to the faf is an IF leg, the VTF course is defined by the great-circle path from the faf to the fix
   * immediately following it.
   *
   * If a VTF course cannot be defined, then no vectors-to-final legs are inserted.
   * @param proc The insert procedure object to which to insert the vectors-to-final legs.
   * @param fafLeg The leg to the final approach fix in the procedure.
   * @param prevLeg The leg immediately prior to the faf leg.
   * @param nextLeg The leg immediately after the faf leg.
   */
  private async insertVtfLegs(proc: InsertProcedureObject, fafLeg: FlightPlanLeg, prevLeg?: FlightPlanLeg, nextLeg?: FlightPlanLeg): Promise<void> {
    if (fafLeg.type === LegType.CF) {
      // faf leg is a CF -> copy the leg into the VTF sequence.

      const discoLeg: InsertProcedureObjectLeg = FlightPlan.createLeg({ type: LegType.ThruDiscontinuity });
      discoLeg.legDefinitionFlags = LegDefinitionFlags.VectorsToFinal;
      proc.procedureLegs.push(discoLeg);
      proc.procedureLegs.push(Object.assign({ legDefinitionFlags: LegDefinitionFlags.VectorsToFinal }, fafLeg));
    } else {
      try {
        const fafFacility = await this.facLoader.getFacility(ICAO.getFacilityType(fafLeg.fixIcao), fafLeg.fixIcao);
        const fafPoint = Fms.geoPointCache[0].set(fafFacility);

        let course;
        if (fafLeg.type === LegType.IF) {
          // faf leg is an IF, meaning it is the first leg in the approach -> get the course from the next leg.

          let nextLegFixIcao = '';
          switch (nextLeg?.type) {
            case LegType.IF:
            case LegType.TF:
            case LegType.DF:
            case LegType.CF:
            case LegType.AF:
            case LegType.RF:
            case LegType.HF:
            case LegType.HM:
            case LegType.HA:
              nextLegFixIcao = nextLeg.fixIcao;
          }

          const nextLegFacility = await this.facLoader.getFacility(ICAO.getFacilityType(nextLegFixIcao), nextLegFixIcao);
          course = MagVar.trueToMagnetic(fafPoint.bearingTo(nextLegFacility), fafPoint);
        } else {
          // faf leg is not the first leg in the approach -> get the course from the previous leg.

          let prevLegFixIcao = '';
          switch (prevLeg?.type) {
            case LegType.IF:
            case LegType.TF:
            case LegType.DF:
            case LegType.CF:
            case LegType.AF:
            case LegType.RF:
            case LegType.HF:
            case LegType.HM:
            case LegType.HA:
              prevLegFixIcao = prevLeg.fixIcao;
          }

          const prevLegFacility = await this.facLoader.getFacility(ICAO.getFacilityType(prevLegFixIcao), prevLegFixIcao);
          course = MagVar.trueToMagnetic(fafPoint.bearingFrom(prevLegFacility), fafPoint);
        }

        const discoLeg: InsertProcedureObjectLeg = FlightPlan.createLeg({ type: LegType.Discontinuity });
        discoLeg.legDefinitionFlags = LegDefinitionFlags.VectorsToFinal;
        const vtfLeg: InsertProcedureObjectLeg = FlightPlan.createLeg({
          type: LegType.CF,
          fixIcao: fafLeg.fixIcao,
          course,
          fixTypeFlags: fafLeg.fixTypeFlags,
          altDesc: fafLeg.altDesc,
          altitude1: fafLeg.altitude1,
          altitude2: fafLeg.altitude2
        });
        vtfLeg.legDefinitionFlags = LegDefinitionFlags.VectorsToFinal;

        proc.procedureLegs.push(discoLeg);
        proc.procedureLegs.push(vtfLeg);
      } catch {
        // noop
      }
    }
  }

  /**
   * Manages the altitude constraints when adding a procedure by creating a VerticalData object for each leg.
   * @param plan The Flight Plan.
   * @param segmentIndex The segment index for the inserted procedure.
   */
  private setVerticalData(plan: FlightPlan, segmentIndex: number): void {
    const segment = plan.getSegment(segmentIndex);
    for (let l = 0; l < segment.legs.length; l++) {
      const leg = segment.legs[l];
      const altitude1 = leg.leg.altitude1;
      const altitude2 = leg.leg.altitude2;
      const altDesc = leg.leg.altDesc;
      const verticalData: VerticalData = {
        altDesc: altDesc,
        altitude1: altitude1,
        altitude2: altitude2
      };
      plan.setLegVerticalData(segmentIndex, l, verticalData);
    }
  }

  /**
   * Method to set a user altitude constraint.
   * @param segmentIndex The segment index to insert the constraint at.
   * @param segmentLegIndex The leg index to insert the constraint at.
   * @param altitude The altitude to set the constraint at; if undefined, delete user constraint.
   * @param revert Whether to revert the constraint data to the nav data constraint.
   */
  public setUserConstraint(segmentIndex: number, segmentLegIndex: number, altitude?: number, revert = false): void {
    if (this.hasPrimaryFlightPlan()) {
      const plan = this.getPrimaryFlightPlan();
      const verticalData: VerticalData = {
        altDesc: altitude !== undefined ? AltitudeRestrictionType.At : AltitudeRestrictionType.Unused,
        altitude1: altitude !== undefined ? UnitType.FOOT.convertTo(altitude, UnitType.METER) : 0,
        altitude2: 0
      };
      if (revert) {
        const leg = plan.tryGetLeg(segmentIndex, segmentLegIndex);
        if (leg !== null) {
          const altitude1 = leg.leg.altitude1;
          const altitude2 = leg.leg.altitude2;
          const altDesc = leg.leg.altDesc;
          verticalData.altDesc = altDesc;
          verticalData.altitude1 = altitude1;
          verticalData.altitude2 = altitude2;
        }
      }
      plan.setLegVerticalData(segmentIndex, segmentLegIndex, verticalData);

      const directToData = plan.directToData;
      if (this.getDirectToState() === DirectToState.TOEXISTING && segmentIndex === directToData.segmentIndex
        && segmentLegIndex === directToData.segmentLegIndex + FmsUtils.DTO_LEG_OFFSET) {
        plan.setLegVerticalData(segmentIndex, directToData.segmentLegIndex, verticalData);
      }

      plan.calculate();
    }
  }


  /**
   * Method to check if a leg has a user specified constraint.
   * @param segmentIndex The segment index to insert the constraint at.
   * @param segmentLegIndex The leg index to insert the constraint at.
   * @returns Whether the leg has a user constraint.
   */
  public isConstraintUser(segmentIndex: number, segmentLegIndex: number): boolean {
    if (this.hasPrimaryFlightPlan()) {
      const plan = this.getPrimaryFlightPlan();
      const leg = plan.tryGetLeg(segmentIndex, segmentLegIndex);
      if (leg?.verticalData.altDesc !== leg?.leg.altDesc || leg?.verticalData.altitude1 !== leg?.leg.altitude1 || leg?.verticalData.altitude2 !== leg?.leg.altitude2) {
        return true;
      }
    }
    return false;
  }

  /**
   * Method to check if a leg constraint can be reverted to the nav data constraint.
   * @param segmentIndex The segment index to insert the constraint at.
   * @param segmentLegIndex The leg index to insert the constraint at.
   * @returns Whether the leg has a nav data constraint to be reverted to.
   */
  public hasConstraint(segmentIndex: number, segmentLegIndex: number): number | undefined {
    if (this.hasPrimaryFlightPlan()) {
      const plan = this.getPrimaryFlightPlan();
      const leg = plan.tryGetLeg(segmentIndex, segmentLegIndex);
      if (leg !== null && leg.leg.altDesc !== AltitudeRestrictionType.Unused) {
        switch (leg.leg.altDesc) {
          case AltitudeRestrictionType.At:
          case AltitudeRestrictionType.AtOrAbove:
          case AltitudeRestrictionType.AtOrBelow:
            return UnitType.METER.convertTo(leg.leg.altitude1, UnitType.FOOT);
          case AltitudeRestrictionType.Between:
            return UnitType.METER.convertTo(leg.leg.altitude2, UnitType.FOOT);
        }
      }
    }
    return undefined;
  }

  /**
   * Manages the altitude constraints for FAF legs where vertical angle info is also provided.
   * @param proc A procedure object.
   * @returns the procedure object, after it has been changed.
   */
  private manageFafAltitudeRestriction(proc: InsertProcedureObject): InsertProcedureObject {
    proc.procedureLegs.forEach(leg => {
      if (leg.fixTypeFlags === FixTypeFlags.FAF && leg.altitude2 > 0) {
        const alt = leg.altitude1 <= leg.altitude2 ? leg.altitude1 : leg.altitude2;
        leg.altDesc = AltitudeRestrictionType.AtOrAbove;
        leg.altitude1 = alt;
        leg.altitude2 = 0;
      }
    });
    return proc;
  }


  /**
   * Inserts an IF leg at the beginning of a procedure if it begins with a leg type which defines a fixed origin.
   * @param proc A procedure object.
   * @returns the procedure object, after it has been changed.
   */
  private tryInsertIFLeg(proc: InsertProcedureObject): InsertProcedureObject {
    const firstLeg = proc.procedureLegs[0];
    let icao: string | undefined;
    switch (firstLeg?.type) {
      case LegType.HA:
      case LegType.HF:
      case LegType.HM:
      case LegType.PI:
      case LegType.FD:
      case LegType.FC:
        icao = firstLeg.fixIcao;
        break;
      case LegType.FM:
      case LegType.VM:
        icao = firstLeg.originIcao;
        break;
    }

    if (icao && icao !== ICAO.emptyIcao) {
      proc.procedureLegs.unshift(FlightPlan.createLeg({
        type: LegType.IF,
        fixIcao: icao,
        fixTypeFlags: firstLeg.fixTypeFlags & (FixTypeFlags.IF | FixTypeFlags.IAF)
      }));

      if (firstLeg?.type === LegType.HF || firstLeg?.type === LegType.PI) {
        proc.procedureLegs[0].altDesc = firstLeg.altDesc;
        proc.procedureLegs[0].altitude1 = firstLeg.altitude1;
        proc.procedureLegs[0].altitude2 = firstLeg.altitude2;
      }

      // need to remove IF/IAF flags from the original first leg (now the second leg)
      const replacementLeg = FlightPlan.createLeg(proc.procedureLegs[1]);
      replacementLeg.fixTypeFlags = replacementLeg.fixTypeFlags & ~(FixTypeFlags.IF | FixTypeFlags.IAF);
      if (firstLeg?.type !== LegType.PI) {
        replacementLeg.altDesc = AltitudeRestrictionType.Unused;
        replacementLeg.altitude1 = 0;
        replacementLeg.altitude2 = 0;
      }
      proc.procedureLegs[1] = replacementLeg;
    }

    return proc;
  }

  /**
   * Checks the approach legs for an IAF fix type flag, and if one exists, amend the approach to ensure that
   * the IAF is not on a hold/pt leg and that we do not add legs prior to the IAF except in cases where we needed to add
   * an IF leg type.
   * @param proc A procedure object.
   * @returns the procedure object, after it has been changed.
   */
  private tryReconcileIAFLeg(proc: InsertProcedureObject): InsertProcedureObject {
    let iafIndex = -1;
    for (let i = 0; i < proc.procedureLegs.length; i++) {
      const leg = proc.procedureLegs[i];
      if (leg.fixTypeFlags === FixTypeFlags.IAF) {
        iafIndex = i;
        switch (leg.type) {
          case LegType.HA:
          case LegType.HF:
          case LegType.HM:
          case LegType.PI:
          case LegType.FD:
          case LegType.FC:
            if (iafIndex > 0) {
              leg.fixTypeFlags &= ~FixTypeFlags.IAF;
              proc.procedureLegs[iafIndex - 1].fixTypeFlags |= FixTypeFlags.IAF;
              iafIndex--;
            }
        }
        break;
      }
    }
    return proc;
  }

  /**
   * Inserts a MAP fix type flag if none exists on the approach.
   * @param proc A procedure object.
   * @returns the procedure object, after it has been changed.
   */
  private tryInsertMap(proc: InsertProcedureObject): InsertProcedureObject {
    let addMap = true;
    let runwayIndex = -1;

    for (let i = 0; i < proc.procedureLegs.length; i++) {
      const leg = proc.procedureLegs[i];
      if (leg.fixTypeFlags === FixTypeFlags.MAP) {
        addMap = false;
        break;
      }
      if (leg.fixIcao.search('R') === 0) {
        runwayIndex = i;
        break;
      }
    }

    if (addMap && runwayIndex > -1) {
      proc.procedureLegs[runwayIndex].fixTypeFlags = FixTypeFlags.MAP;
    }

    return proc;
  }

  /**
   * Method to remove the duplicate leg after the hold leg.
   * @param proc A procedure object.
   * @returns the procedure object, after it has been changed.
   */
  private tryCleanupHold(proc: InsertProcedureObject): InsertProcedureObject {
    for (let i = 0; i < proc.procedureLegs.length; i++) {
      const leg = proc.procedureLegs[i];
      if (leg.type === LegType.HF) {
        const next = proc.procedureLegs[i + 1];
        if (leg.fixIcao === next.fixIcao && next.type === LegType.IF) {
          proc.procedureLegs.splice(i + 1, 1);
        }
      }
    }
    return proc;
  }

  /**
   * Method to remove a course reversal in an approach procedure.
   * @param proc A procedure object.
   * @returns the procedure object, after it has been changed.
   */
  private tryRemoveCourseReversal(proc: InsertProcedureObject): InsertProcedureObject {
    let canRemove = false;
    if (proc.procedureLegs.length > 2) {
      const leg = proc.procedureLegs[1];
      switch (leg.type) {
        case LegType.HA:
        case LegType.HF:
        case LegType.HM:
        case LegType.PI:
          canRemove = true;
      }
    }
    if (canRemove) {
      proc.procedureLegs.splice(1, 1);
    }
    return proc;
  }

  /**
   * Method to remove the departure from the flight plan.
   */
  public async removeDeparture(): Promise<void> {
    const plan = this.getFlightPlan();
    const segmentIndex = this.ensureOnlyOneSegmentOfType(FlightPlanSegmentType.Departure);

    plan.setDeparture();

    this.planClearSegment(segmentIndex, FlightPlanSegmentType.Departure);
    if (plan.originAirport) {
      const airport = await this.facLoader.getFacility(FacilityType.Airport, plan.originAirport);
      const updatedSegmentIndex = this.ensureOnlyOneSegmentOfType(FlightPlanSegmentType.Departure);
      this.planAddOriginDestinationLeg(true, updatedSegmentIndex, airport, plan.procedureDetails.originRunway);

      const prevLeg = plan.getPrevLeg(updatedSegmentIndex, 1);
      const nextLeg = plan.getNextLeg(updatedSegmentIndex, 0);
      if (prevLeg && nextLeg && this.isDuplicateLeg(prevLeg.leg, nextLeg.leg)) {
        this.planRemoveDuplicateLeg(prevLeg, nextLeg);
      }
    }

    plan.calculate(0);
  }

  /**
   * Method to remove the arrival from the flight plan.
   */
  public async removeArrival(): Promise<void> {
    const plan = this.getFlightPlan();
    const segmentIndex = this.ensureOnlyOneSegmentOfType(FlightPlanSegmentType.Arrival);

    plan.setArrival();

    this.planRemoveSegment(segmentIndex);
    if (plan.procedureDetails.approachIndex < 0 && plan.destinationAirport) {
      const airport = await this.facLoader.getFacility(FacilityType.Airport, plan.destinationAirport);
      const destSegmentIndex = this.ensureOnlyOneSegmentOfType(FlightPlanSegmentType.Destination);
      this.planAddOriginDestinationLeg(false, destSegmentIndex, airport, plan.procedureDetails.destinationRunway);
    }

    const prevLeg = plan.getPrevLeg(segmentIndex, 0);
    const nextLeg = plan.getNextLeg(segmentIndex, -1);
    if (prevLeg && nextLeg && this.isDuplicateLeg(prevLeg.leg, nextLeg.leg)) {
      this.planRemoveDuplicateLeg(prevLeg, nextLeg);
    }

    plan.calculate(0);
  }

  /**
   * Method to remove the approach from the flight plan.
   */
  public async removeApproach(): Promise<void> {
    this.loadApproachFrequency();
    this.setApproachDetails(false, ApproachType.APPROACH_TYPE_UNKNOWN, RnavTypeFlags.None, false);

    const plan = this.getFlightPlan();
    const hasArrival = plan.procedureDetails.arrivalIndex >= 0;
    const segmentIndex = this.ensureOnlyOneSegmentOfType(FlightPlanSegmentType.Approach);

    if (hasArrival) {
      const lastEnrouteSegmentIndex = this.findLastEnrouteSegmentIndex(plan);
      const segment = plan.getSegment(lastEnrouteSegmentIndex);
      const lastLegIndex = segment && segment.legs.length > 0 ? segment.legs.length - 1 : 0;
      if (plan.destinationAirport && segment.legs[lastLegIndex] && segment.legs[lastLegIndex].leg.fixIcao === plan.destinationAirport) {
        this.planRemoveLeg(lastEnrouteSegmentIndex, lastLegIndex);
      }
      plan.setDestinationRunway();
      if (plan.procedureDetails.arrivalFacilityIcao && plan.procedureDetails.arrivalFacilityIcao !== plan.destinationAirport) {
        const arrivalFacility = await this.facLoader.getFacility(FacilityType.Airport, plan.procedureDetails.arrivalFacilityIcao);
        this.setDestination(arrivalFacility);
      }
    }

    plan.setApproach();

    this.planRemoveSegment(segmentIndex);
    if (plan.destinationAirport) {
      const airport = await this.facLoader.getFacility(FacilityType.Airport, plan.destinationAirport);
      const destLegSegmentIndex = hasArrival
        ? this.ensureOnlyOneSegmentOfType(FlightPlanSegmentType.Arrival)
        : this.ensureOnlyOneSegmentOfType(FlightPlanSegmentType.Destination);
      this.planAddOriginDestinationLeg(false, destLegSegmentIndex, airport, plan.procedureDetails.destinationRunway);
    }

    const prevLeg = plan.getPrevLeg(segmentIndex, 0);
    const nextLeg = plan.getNextLeg(segmentIndex, -1);
    if (prevLeg && nextLeg && this.isDuplicateLeg(prevLeg.leg, nextLeg.leg)) {
      this.planRemoveDuplicateLeg(prevLeg, nextLeg);
    }

    if (plan.getUserData('visual_approach')) {
      plan.deleteUserData('visual_approach');
    }

    plan.calculate(0);
  }

  /**
   * Method to activate a leg in the flight plan.
   * @param segmentIndex is the index of the segment containing the leg to activate.
   * @param legIndex is the index of the leg in the selected segment activate.
   * @param fplnIndex is the index of the flight plan in which to activate the leg.
   * @param inhibitImmediateSequence Whether to inhibit immediate automatic sequencing past the activated leg.
   */
  public activateLeg(segmentIndex: number, legIndex: number, fplnIndex = 0, inhibitImmediateSequence = false): void {
    const plan = this.getFlightPlan(fplnIndex);
    const indexInFlightplan = plan.getSegment(segmentIndex).offset + legIndex;

    if (fplnIndex === 0 && this.flightPlanner.activePlanIndex > 0) {
      this.flightPlanner.setActivePlanIndex(0);
    }

    if (this.missedApproachActive) {
      const segment = plan.getSegment(segmentIndex);
      if (segment.legs[legIndex] && !BitFlags.isAll(segment.legs[legIndex].flags, LegDefinitionFlags.MissedApproach)) {
        this.bus.getPublisher<ControlEvents>().pub('activate_missed_approach', false, true);
      }
    }

    if (
      fplnIndex === 0
      && (segmentIndex < plan.directToData.segmentIndex || (segmentIndex === plan.directToData.segmentIndex && legIndex <= plan.directToData.segmentLegIndex))
    ) {
      this.removeDirectToExisting(indexInFlightplan);
    } else {
      plan.setCalculatingLeg(indexInFlightplan);
      plan.setLateralLeg(indexInFlightplan);
      plan.calculate(Math.max(0, indexInFlightplan - 1));
    }

    const controlEvents = this.bus.getPublisher<ControlEvents>();

    controlEvents.pub('suspend_sequencing', false, true);
    if (inhibitImmediateSequence) {
      controlEvents.pub('lnav_inhibit_next_sequence', true, true);
    }
  }

  /**
   * Activates a vertical direct to a selected constraint.
   * @param constraintGlobalLegIndex The global leg index of the constraint to set vertical direct to.
   * @returns Whether the vertical direct was activated or not.
   */
  public activateVerticalDirect(constraintGlobalLegIndex: number): boolean {
    if (this.flightPlanner.hasFlightPlan(Fms.PRIMARY_PLAN_INDEX) && this.verticalPathCalculator) {
      const lateralPlan = this.flightPlanner.getFlightPlan(Fms.PRIMARY_PLAN_INDEX);
      const verticalData: VerticalData = {
        altDesc: AltitudeRestrictionType.Unused,
        altitude1: 0,
        altitude2: 0
      };
      if (lateralPlan.length > constraintGlobalLegIndex) {
        for (let i = 0; i < constraintGlobalLegIndex; i++) {
          lateralPlan.setLegVerticalData(i, verticalData);
        }
        this.verticalPathCalculator.activateVerticalDirect(Fms.PRIMARY_PLAN_INDEX, constraintGlobalLegIndex);
        return true;
      }
    }
    return false;
  }

  /**
   * Checks whether an approach can be activated. An approach can be activated if and only if the primary flight plan
   * has a non-vectors-to-final approach loaded.
   * @returns Whether an approach can be activated.
   */
  public canActivateApproach(): boolean {
    const plan = this.hasPrimaryFlightPlan() && this.getPrimaryFlightPlan();
    if (!plan) {
      return false;
    }

    return FmsUtils.isApproachLoaded(plan) && !FmsUtils.isVtfApproachLoaded(plan);
  }

  /**
   * Activates an approach. Activating an approach activates a Direct To to the first approach waypoint of the primary
   * flight plan, and attempts to load the primary approach frequency (if one exists) to the nav radios. If the primary
   * flight plan does not have an approach loaded, this method has no effect.
   */
  public activateApproach(): void {
    if (!this.canActivateApproach()) {
      return;
    }

    const approachSegmentIndex = this.ensureOnlyOneSegmentOfType(FlightPlanSegmentType.Approach, false);
    this.createDirectToExisting(approachSegmentIndex, 0);
    this.setLocFrequency(1, true);
    this.setLocFrequency(2, true);
  }

  /**
   * Checks whether vectors-to-final can be activated. VTF can be activated if and only if the primary flight plan has
   * an approach loaded.
   * @returns Whether vectors-to-final can be activated.
   */
  public canActivateVtf(): boolean {
    const plan = this.hasPrimaryFlightPlan() && this.getPrimaryFlightPlan();
    if (!plan) {
      return false;
    }

    return FmsUtils.isApproachLoaded(plan);
  }

  /**
   * Activates vectors-to-final. Activating vectors-to-final activates the primary flight plan's vectors-to-final leg,
   * and attempts to load the primary approach frequency (if one exists) to the nav radios. If the primary flight plan
   * has a non-VTF approach loaded, it will be replaced by its VTF counterpart. If the primary flight plan has no
   * approach loaded, this method has no effect.
   */
  public async activateVtf(): Promise<void> {
    if (!this.canActivateVtf()) {
      return;
    }

    const plan = this.getPrimaryFlightPlan();

    let vtfLeg = FmsUtils.getApproachVtfLeg(plan);
    let approachType: ExtendedApproachType = ApproachType.APPROACH_TYPE_UNKNOWN;
    if (!vtfLeg) {
      // if a VTF approach is not loaded; replace the current approach with its VTF counterpart.

      try {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        const airport = await this.facLoader.getFacility(FacilityType.Airport, plan.procedureDetails.approachFacilityIcao!);
        const visApproachRwyDesignation = plan.getUserData<string>('visual_approach');
        if (plan.procedureDetails.approachIndex >= 0) {
          await this.insertApproach(airport, plan.procedureDetails.approachIndex, -1);
          approachType = airport.approaches[plan.procedureDetails.approachIndex].approachType;
        } else {
          let runway;
          if (visApproachRwyDesignation) {
            runway = RunwayUtils.matchOneWayRunwayFromDesignation(airport, visApproachRwyDesignation);
          }

          if (!runway) {
            return;
          }
          approachType = AdditionalApproachType.APPROACH_TYPE_VISUAL;
          await this.insertApproach(airport, -1, -1, runway.direction, runway.runwayDesignator);
        }

        vtfLeg = FmsUtils.getApproachVtfLeg(plan);
      } catch {
        return;
      }
    } else {
      approachType = this.approachDetails.approachType;
    }

    if (!vtfLeg) {
      return;
    }

    const segment = plan.getSegmentFromLeg(vtfLeg);
    if (!segment) {
      return;
    }

    this.activateLeg(segment.segmentIndex, segment.legs.indexOf(vtfLeg), Fms.PRIMARY_PLAN_INDEX, true);
    this.setLocFrequency(1, true);
    this.setLocFrequency(2, true);

    switch (approachType) {
      case ApproachType.APPROACH_TYPE_ILS:
      case ApproachType.APPROACH_TYPE_LDA:
      case ApproachType.APPROACH_TYPE_LOCALIZER:
      case ApproachType.APPROACH_TYPE_LOCALIZER_BACK_COURSE:
      case ApproachType.APPROACH_TYPE_SDF:
      case ApproachType.APPROACH_TYPE_VOR:
      case ApproachType.APPROACH_TYPE_VORDME:
        this.bus.getPublisher<ControlEvents>().pub('cdi_src_set', { type: NavSourceType.Nav, index: 1 }, true);
        break;
    }
  }

  /**
   * Method to check if the approach is VTF.
   * @returns whether the approach is VTF.
   */
  public isApproachVtf(): boolean {
    if (!this.hasPrimaryFlightPlan()) {
      return false;
    }
    const plan = this.getPrimaryFlightPlan();
    return FmsUtils.isVtfApproachLoaded(plan);
  }

  /**
   * Method to check if there is a currently loaded missed approach to be activated.
   * @returns whether the approach can activate
   */
  public canMissedApproachActivate(): boolean {
    const plan = this.getFlightPlan();
    if (this.cdiSource.type === NavSourceType.Gps && plan && plan.activeLateralLeg < plan.length - 1 && plan.segmentCount > 0) {
      const segmentIndex = plan.getSegmentIndex(plan.activeLateralLeg);
      if (segmentIndex > 0) {
        const segment = plan.getSegment(segmentIndex);
        if (
          segment.segmentType === FlightPlanSegmentType.Approach
          && BitFlags.isAll(segment.legs[segment.legs.length - 1].flags, LegDefinitionFlags.MissedApproach)
        ) {
          for (let i = 0; i < segment.legs.length; i++) {
            const leg = segment.legs[i];
            if (leg.leg.fixTypeFlags === FixTypeFlags.FAF) {
              if (plan.activeLateralLeg - segment.offset >= i) {
                return true;
              }
            }
          }
        }
      }
    }
    return false;
  }

  /**
   * Method to activate the missed approach.
   */
  public activateMissedApproach(): void {
    if (this.canMissedApproachActivate()) {
      this.bus.getPublisher<ControlEvents>().pub('activate_missed_approach', true, true);
    }
  }

  /**
   * Creates and activates a Direct To a waypoint not in the primary flight plan.
   * @param icao The ICAO for the Direct To destination.
   * @param course The magnetic course for the Direct To. If undefined, the Direct To will be initiated from the
   * airplane's present position.
   */
  public createDirectToRandom(icao: string, course?: number): void;
  /**
   * Creates and activates a Direct To a waypoint not in the primary flight plan.
   * @param waypoint The Direct To destination.
   * @param course The magnetic course for the Direct To. If undefined, the Direct To will be initiated from the
   * airplane's present position.
   */
  public createDirectToRandom(waypoint: Facility, course?: number): void;
  // eslint-disable-next-line jsdoc/require-jsdoc
  public createDirectToRandom(target: string | Facility, course?: number): void {
    const icao = typeof target === 'string' ? target : target.icao;
    const plan = this.flightPlanner.createFlightPlan(1);

    plan.setCalculatingLeg(0);
    plan.setLateralLeg(0);

    for (let i = plan.segmentCount - 1; i >= 0; i--) {
      if (plan.getSegment(i) !== undefined) {
        plan.removeSegment(i);
      }
    }

    plan.insertSegment(0, FlightPlanSegmentType.RandomDirectTo, undefined, true);
    const segment = plan.getSegment(0);

    if (segment) {
      const discoLeg = FlightPlan.createLeg({ type: LegType.Discontinuity });
      // Dup the disco leg if we have a defined course so that DTO sequences are always 3 legs long
      const dtoOriginLeg = course === undefined ? this.createDTOOriginLeg(this.ppos) : discoLeg;
      const dtoTargetLeg = this.createDTODirectLeg(icao, undefined, course);

      plan.addLeg(0, discoLeg, 0, LegDefinitionFlags.DirectTo);
      plan.addLeg(0, dtoOriginLeg, 1, LegDefinitionFlags.DirectTo);
      plan.addLeg(0, dtoTargetLeg, 2, LegDefinitionFlags.DirectTo);
      plan.calculate(0);

      plan.setCalculatingLeg(2);
      plan.setLateralLeg(2);

      if (this.flightPlanner.activePlanIndex !== 1) {
        this.flightPlanner.setActivePlanIndex(1);
      }

      this.bus.getPublisher<ControlEvents>().pub('suspend_sequencing', false, true);
    }
  }

  /**
   * Method to create a direct to an existing waypoint in the plan. This method will also then call activateLeg.
   * @param segmentIndex is the index of the segment containing the leg to activate as direct to.
   * @param legIndex is the index of the leg in the specified segment to activate as direct to.
   * @param course The magnetic course for the Direct To. If undefined, the Direct To will be initiated from the
   * airplane's present position.
   */
  public createDirectToExisting(segmentIndex: number, legIndex: number, course?: number): void {
    const plan = this.getFlightPlan();
    const segment = plan.getSegment(segmentIndex);
    const leg = segment.legs[legIndex];

    let legIndexDelta = 0;

    if (plan.directToData.segmentIndex > -1 && plan.directToData.segmentLegIndex > -1) {
      legIndexDelta -= plan.directToData.segmentIndex === segmentIndex && legIndex > plan.directToData.segmentLegIndex ? 3 : 0;

      if (this.getDirectToState() === DirectToState.TOEXISTING) {
        this.removeDirectToExisting();
      } else {
        plan.removeLeg(plan.directToData.segmentIndex, plan.directToData.segmentLegIndex + 1);
        plan.removeLeg(plan.directToData.segmentIndex, plan.directToData.segmentLegIndex + 1);
        plan.removeLeg(plan.directToData.segmentIndex, plan.directToData.segmentLegIndex + 1);
      }
    }

    plan.setDirectToData(segmentIndex, legIndex + legIndexDelta);

    if (segment && leg) {
      const discoLeg = FlightPlan.createLeg({ type: LegType.Discontinuity });
      // Dup the disco leg if we have a defined course so that DTO sequences are always 3 legs long
      const dtoOriginLeg = course === undefined ? this.createDTOOriginLeg(this.ppos) : discoLeg;
      const dtoTargetLeg = this.createDTODirectLeg(leg.leg.fixIcao, leg.leg, course);

      plan.addLeg(segmentIndex, discoLeg, legIndex + legIndexDelta + 1, LegDefinitionFlags.DirectTo);
      plan.addLeg(segmentIndex, dtoOriginLeg, legIndex + legIndexDelta + 2, LegDefinitionFlags.DirectTo);
      plan.addLeg(segmentIndex, dtoTargetLeg, legIndex + legIndexDelta + FmsUtils.DTO_LEG_OFFSET, (leg.flags & LegDefinitionFlags.MissedApproach) | LegDefinitionFlags.DirectTo);

      plan.setLegVerticalData(segmentIndex, legIndex + legIndexDelta + FmsUtils.DTO_LEG_OFFSET, leg.verticalData);

      this.activateLeg(segmentIndex, legIndex + legIndexDelta + FmsUtils.DTO_LEG_OFFSET);
    }
  }

  /**
   * Creates a Direct-To origin IF leg.
   * @param ppos The current plane position.
   * @returns a Direct-To origin IF leg.
   */
  private createDTOOriginLeg(ppos: GeoPointInterface): FlightPlanLeg {
    return FlightPlan.createLeg({
      type: LegType.IF,
      lat: ppos.lat,
      lon: ppos.lon
    });
  }

  /**
   * Creates a Direct-To DF leg.
   * @param icao is the icao.
   * @param leg The FlightPlanLeg.
   * @param course The magnetic course for the Direct To.
   * @returns a Direct-To DF leg.
   */
  private createDTODirectLeg(icao: string, leg?: FlightPlanLeg, course?: number): FlightPlanLeg {
    let legType: LegType;
    if (course === undefined) {
      legType = LegType.DF;
      const planeHeading = SimVar.GetSimVarValue('PLANE HEADING DEGREES TRUE', 'degrees');
      course = planeHeading === 0 ? 360 : planeHeading;
    } else {
      legType = LegType.CF;
    }

    if (leg) {
      const directLeg = Object.assign({}, leg);
      directLeg.type = legType;
      directLeg.course = course as number;
      return directLeg;
    } else {
      return FlightPlan.createLeg({
        type: legType,
        fixIcao: icao,
        course
      });
    }
  }

  /**
   * Empties the primary flight plan.
   */
  public async emptyPrimaryFlightPlan(): Promise<void> {
    if (!this.flightPlanner.hasFlightPlan(Fms.PRIMARY_PLAN_INDEX)) {
      return;
    }

    const plan = this.flightPlanner.getFlightPlan(Fms.PRIMARY_PLAN_INDEX);
    const directToState = this.getDirectToState();
    if (directToState === DirectToState.TOEXISTING || (directToState !== DirectToState.TORANDOM && !Simplane.getIsGrounded() && plan.activeLateralLeg > 0)) {
      const directToIcao = plan.getLeg(plan.activeLateralLeg).leg.fixIcao;
      if (directToIcao) {
        const facType = ICAO.getFacilityType(directToIcao);
        const fac = await this.facLoader.getFacility(facType, directToIcao);
        this.createDirectToRandom(fac);
      }
    }

    for (let i = plan.segmentCount - 1; i >= 0; i--) {
      this.planRemoveSegment(i);
    }
    plan.addSegment(0, FlightPlanSegmentType.Departure);
    plan.addSegment(1, FlightPlanSegmentType.Enroute);
    plan.addSegment(2, FlightPlanSegmentType.Destination);

    plan.removeOriginAirport();
    plan.removeDestinationAirport();
    plan.setDirectToData(-1);
    this.setApproachDetails(false, ApproachType.APPROACH_TYPE_UNKNOWN, RnavTypeFlags.None, false);

    plan.setCalculatingLeg(0);
    plan.setLateralLeg(0);
    plan.setVerticalLeg(0);
  }

  /**
   * Builds a flight plan to preview a procedure.
   * @param calculator The flight path calculator to assign to the preview plan.
   * @param facility The airport facility to load the approach from
   * @param procType The type of procedure to preview.
   * @param procIndex The procedure index selected.
   * @param transIndex The transition index selected.
   * @param oneWayRunway The one way runway to build the preview with, if any.
   * @param rwyTransIndex The runway transition index selected, if any.
   * @param visualRunwayNumber is the visual runway number, if any.
   * @param visualRunwayDesignator is the visual runway designator, if any.
   * @param transStartIndex The transition start offset, if any.
   * @returns A Promise which is fulfilled with whether the preview plan was successfully built.
   */
  public async buildProcedurePreviewPlan(
    calculator: FlightPathCalculator,
    facility: AirportFacility,
    procType: ProcedureType,
    procIndex: number,
    transIndex: number,
    oneWayRunway?: OneWayRunway,
    rwyTransIndex?: number,
    visualRunwayNumber?: number,
    visualRunwayDesignator?: RunwayDesignator,
    transStartIndex?: number
  ): Promise<FlightPlan> {
    const plan = new FlightPlan(0, calculator, FlightPlanner.buildDefaultLegName);

    let procedureLegObject: InsertProcedureObject | undefined;
    switch (procType) {
      case ProcedureType.APPROACH:
        procedureLegObject = await this.buildApproachLegs(facility, procIndex, transIndex, undefined, transStartIndex !== undefined ? transStartIndex : 0);
        plan.addSegment(0, FlightPlanSegmentType.Approach, undefined, false);
        break;
      case ProcedureType.ARRIVAL: {
        const runwayIndex = rwyTransIndex ?? -1;
        procedureLegObject = this.buildArrivalLegs(facility, procIndex, transIndex, runwayIndex, oneWayRunway);
        plan.addSegment(0, FlightPlanSegmentType.Arrival, undefined, false);
        break;
      }
      case ProcedureType.DEPARTURE: {
        const runwayIndex = rwyTransIndex ?? -1;
        procedureLegObject = this.buildDepartureLegs(facility, procIndex, transIndex, runwayIndex, oneWayRunway);
        plan.addSegment(0, FlightPlanSegmentType.Departure, undefined, false);
        break;
      }
      case ProcedureType.VISUALAPPROACH:
        if (visualRunwayNumber !== undefined && visualRunwayDesignator !== undefined) {
          const visualRunway = RunwayUtils.matchOneWayRunway(facility, visualRunwayNumber, visualRunwayDesignator);
          procedureLegObject = await this.buildApproachLegs(facility, -1, -1, visualRunway);
          plan.addSegment(0, FlightPlanSegmentType.Approach, undefined, false);
        }
        break;
    }

    if (procedureLegObject && procedureLegObject.procedureLegs.length > 0) {
      // remove discontinuity legs from the start of the procedure
      while (procedureLegObject.procedureLegs[0]?.type === LegType.Discontinuity) {
        procedureLegObject.procedureLegs.shift();
      }

      if (procedureLegObject.procedureLegs[0].type !== LegType.IF) {
        const replacementLeg = FlightPlan.createLeg({
          type: LegType.IF,
          fixIcao: procedureLegObject.procedureLegs[0].fixIcao,
          fixTypeFlags: procedureLegObject.procedureLegs[0].fixTypeFlags,
        });
        procedureLegObject.procedureLegs.splice(0, 1, replacementLeg);
      }
      procedureLegObject.procedureLegs.forEach((l) => {
        plan.addLeg(0, l, undefined, l.legDefinitionFlags ?? LegDefinitionFlags.None, false);
      });
      if (procType === ProcedureType.APPROACH) {
        // Adds missed approach legs
        if (!visualRunwayNumber && !visualRunwayDesignator && procedureLegObject.procedureLegs.length > 0) {
          const missedLegs = facility.approaches[procIndex].missedLegs ?? [];
          if (missedLegs && missedLegs.length > 0) {
            let maphIndex = -1;
            for (let m = missedLegs.length - 1; m >= 0; m--) {
              switch (missedLegs[m].type) {
                case LegType.HA:
                case LegType.HF:
                case LegType.HM:
                  maphIndex = m - 1;
                  break;
              }
            }
            for (let n = 0; n < missedLegs.length; n++) {
              const newLeg = FlightPlan.createLeg(missedLegs[n]);
              if (maphIndex > 0 && n === maphIndex) {
                newLeg.fixTypeFlags |= FixTypeFlags.MAHP;
                plan.addLeg(0, newLeg, undefined, LegDefinitionFlags.MissedApproach, false);
              } else {
                plan.addLeg(0, newLeg, undefined, LegDefinitionFlags.MissedApproach, false);
              }
            }
          }
        }
      }
      await plan.calculate(0);
      return plan;
    } else {
      return plan;
    }
  }

  /**
   * Builds a flight plan to preview procedure transitions.
   * @param calculator The flight path calculator to assign to the preview plan.
   * @param facility The airport facility to which the procedure to preview belongs.
   * @param procType The type of procedure to preview.
   * @param procIndex The index of the procedure to preview.
   * @param rwyTransIndex The index of the procedure's runway transition.
   * @returns The index of the procedure transition preview plan.
   */
  public async buildProcedureTransitionPreviewPlan(
    calculator: FlightPathCalculator,
    facility: AirportFacility,
    procType: ProcedureType,
    procIndex: number,
    rwyTransIndex?: number
  ): Promise<FlightPlan> {
    const plan = new FlightPlan(0, calculator, FlightPlanner.buildDefaultLegName);

    let legs: FlightPlanLeg[] | undefined;
    switch (procType) {
      case ProcedureType.DEPARTURE:
        if (facility.departures[procIndex] && rwyTransIndex !== undefined) {
          legs = this.buildDepartureTransitionPreviewLegs(facility.departures[procIndex], rwyTransIndex);
        }
        break;
      case ProcedureType.ARRIVAL:
        if (facility.arrivals[procIndex] && rwyTransIndex !== undefined) {
          legs = this.buildArrivalTransitionPreviewLegs(facility.arrivals[procIndex], rwyTransIndex);
        }
        break;
      case ProcedureType.APPROACH:
        if (facility.approaches[procIndex]) {
          legs = this.buildApproachTransitionPreviewLegs(facility.approaches[procIndex]);
        }
        break;
    }

    if (legs && legs.length > 0) {
      plan.addSegment(0, FlightPlanSegmentType.Enroute, undefined, false);
      legs.forEach((l) => {
        plan.addLeg(0, l, undefined, 0, false);
      });
      await plan.calculate(0);
    }

    return plan;
  }

  /**
   * Builds a sequence of legs for a departure transition preview. The sequence consists of the legs of each departure
   * transition in order. Discontinuity legs separate legs of different transitions.
   * @param departure A departure.
   * @param rwyTransIndex The runway transition index of the departure.
   * @returns A sequence of legs for a departure transition preview.
   */
  private buildDepartureTransitionPreviewLegs(departure: DepartureProcedure, rwyTransIndex: number): FlightPlanLeg[] {
    const runwayTransition = departure.runwayTransitions[rwyTransIndex];

    if (!runwayTransition && departure.runwayTransitions.length > 0) {
      return [];
    }

    const insertProcObject: InsertProcedureObject = { procedureLegs: [] };
    const legs: FlightPlanLeg[] = [];
    const preTransitionLegs: FlightPlanLeg[] = [];

    const lastCommonLeg = departure.commonLegs[departure.commonLegs.length - 1];

    const lastPreTransitionLeg = lastCommonLeg ?? runwayTransition.legs[runwayTransition.legs.length - 1];
    const secondLastPreTransitionLeg = lastPreTransitionLeg
      ? lastCommonLeg
        ? departure.commonLegs[departure.commonLegs.length - 2] ?? runwayTransition.legs[runwayTransition.legs.length - 1]
        : runwayTransition.legs[runwayTransition.legs.length - 2]
      : undefined;

    secondLastPreTransitionLeg && preTransitionLegs.push(secondLastPreTransitionLeg);
    lastPreTransitionLeg && preTransitionLegs.push(lastPreTransitionLeg);

    const transitions = departure.enRouteTransitions;
    for (let i = 0; i < transitions.length; i++) {
      const transition = transitions[i];

      if (transition.legs.length > 0) {
        insertProcObject.procedureLegs.push(...preTransitionLegs);
        for (let j = 0; j < transition.legs.length; j++) {
          const leg = transition.legs[j];

          if (j === 0 && lastPreTransitionLeg && this.isDuplicateIFLeg(lastPreTransitionLeg, leg)) {
            continue;
          }

          insertProcObject.procedureLegs.push(leg);
        }

        this.tryCleanupHold(insertProcObject);

        legs.push(...insertProcObject.procedureLegs, FlightPlan.createLeg({ type: LegType.Discontinuity }));

        insertProcObject.procedureLegs.length = 0;
      }
    }

    return legs;
  }

  /**
   * Builds a sequence of legs for an arrival transition preview. The sequence consists of the legs of each arrival
   * transition in order. Discontinuity legs separate legs of different transitions.
   * @param arrival An arrival.
   * @param rwyTransIndex The runway transition index of the arrival.
   * @returns A sequence of legs for an arrival transition preview.
   */
  private buildArrivalTransitionPreviewLegs(arrival: ArrivalProcedure, rwyTransIndex: number): FlightPlanLeg[] {
    const runwayTransition = arrival.runwayTransitions[rwyTransIndex];

    if (!runwayTransition && arrival.runwayTransitions.length > 0) {
      return [];
    }

    const insertProcObject: InsertProcedureObject = { procedureLegs: [] };
    const legs: FlightPlanLeg[] = [];

    const firstCommonLeg = arrival.commonLegs[0];

    const firstPostTransitionLeg = firstCommonLeg ?? runwayTransition.legs[0];
    const secondPostTransitionLeg = firstPostTransitionLeg
      ? firstCommonLeg
        ? arrival.commonLegs[1] ?? runwayTransition.legs[0]
        : runwayTransition.legs[1]
      : undefined;

    const transitions = arrival.enRouteTransitions;
    for (let i = 0; i < transitions.length; i++) {
      const transition = transitions[i];

      if (transition.legs.length > 0) {
        for (let j = 0; j < transition.legs.length; j++) {
          insertProcObject.procedureLegs.push(transition.legs[j]);
        }

        const lastTransitionLeg = insertProcObject.procedureLegs[insertProcObject.procedureLegs.length - 1];

        if (firstPostTransitionLeg && !this.isDuplicateIFLeg(lastTransitionLeg, firstPostTransitionLeg)) {
          insertProcObject.procedureLegs.push(firstPostTransitionLeg);

          // need to add the second post-transition leg if the last transition leg is a PI leg and first post-
          // transition leg is an IF so that the calculator can get an inbound course for the PI leg.
          if (lastTransitionLeg.type === LegType.PI && firstPostTransitionLeg.type === LegType.IF && secondPostTransitionLeg) {
            insertProcObject.procedureLegs.push(secondPostTransitionLeg);
          }
        }

        this.tryInsertIFLeg(insertProcObject);
        this.tryCleanupHold(insertProcObject);

        legs.push(...insertProcObject.procedureLegs, FlightPlan.createLeg({ type: LegType.Discontinuity }));

        insertProcObject.procedureLegs.length = 0;
      }
    }

    return legs;
  }

  /**
   * Builds a sequence of legs for an approach transition preview. The sequence consists of the legs of each approach
   * transition in order, followed by the first leg of the final approach. Discontinuity legs separate legs of
   * different transitions.
   * @param approach An approach.
   * @returns A sequence of legs for an approach transition preview.
   */
  private buildApproachTransitionPreviewLegs(approach: ApproachProcedure): FlightPlanLeg[] {
    const insertProcObject: InsertProcedureObject = { procedureLegs: [] };
    const legs: FlightPlanLeg[] = [];

    const firstFinalLeg = approach.finalLegs[0];
    const secondFinalLeg = approach.finalLegs[1];

    const transitions = approach.transitions;
    for (let i = 0; i < transitions.length; i++) {
      const transition = transitions[i];

      if (transition.legs.length > 0) {
        for (let j = 0; j < transition.legs.length; j++) {
          insertProcObject.procedureLegs.push(transition.legs[j]);
        }

        const lastTransitionLeg = insertProcObject.procedureLegs[insertProcObject.procedureLegs.length - 1];

        if (firstFinalLeg && !this.isDuplicateIFLeg(lastTransitionLeg, firstFinalLeg)) {
          insertProcObject.procedureLegs.push(firstFinalLeg);

          // need to add the second final approach leg if the last transition leg is a PI leg and first final leg is
          // an IF so that the calculator can get an inbound course for the PI leg.
          if (lastTransitionLeg.type === LegType.PI && firstFinalLeg.type === LegType.IF && secondFinalLeg) {
            insertProcObject.procedureLegs.push(secondFinalLeg);
          }
        }

        this.tryInsertIFLeg(insertProcObject);
        this.tryCleanupHold(insertProcObject);

        legs.push(...insertProcObject.procedureLegs, FlightPlan.createLeg({ type: LegType.Discontinuity }));

        insertProcObject.procedureLegs.length = 0;
      }
    }

    return legs;
  }

  /**
   * Builds a temporary flight plan to preview an airway entry.
   * @param airway The airway object.
   * @param entry The entry intersection facility.
   * @param exit The exit intersection facility.
   * @returns the index of the temporary flight plan.
   */
  public buildAirwayPreviewSegment(airway: AirwayObject, entry: IntersectionFacility, exit: IntersectionFacility): number {
    this.flightPlanner.deleteFlightPlan(Fms.PROC_PREVIEW_PLAN_INDEX);
    const plan = this.flightPlanner.createFlightPlan(Fms.PROC_PREVIEW_PLAN_INDEX);
    const airwayLegObject = this.buildAirwayLegs(airway, entry, exit);
    plan.insertSegment(0, FlightPlanSegmentType.Enroute, airway.name, false);
    if (airwayLegObject.procedureLegs.length > 0) {
      airwayLegObject.procedureLegs.forEach((l) => {
        plan.addLeg(0, l, undefined, LegDefinitionFlags.None, false);
      });
      plan.calculate(0, true);
    }
    return Fms.PROC_PREVIEW_PLAN_INDEX;
  }

  /**
   * Adds an airway and airway segment to the flight plan.
   * @param airway The airway object.
   * @param entry The entry intersection facility.
   * @param exit The exit intersection facility.
   * @param segmentIndex Is the segment index for the entry leg.
   * @param legIndex Is the leg index of the entry leg in the segment of the
   */
  public insertAirwaySegment(airway: AirwayObject, entry: IntersectionFacility, exit: IntersectionFacility, segmentIndex: number, legIndex: number): void {
    const plan = this.getFlightPlan();
    const airwaySegmentIndex = this.prepareAirwaySegment(`${airway.name}.${ICAO.getIdent(exit.icao)}`, segmentIndex, legIndex);
    const airwayLegObject = this.buildAirwayLegs(airway, entry, exit);
    const airwayLegs = airwayLegObject.procedureLegs;

    for (let i = 1; i < airwayLegs.length; i++) {
      this.planAddLeg(airwaySegmentIndex, airwayLegs[i]);
    }

    // handle duplicates
    const airwaySegment = plan.getSegment(airwaySegmentIndex);
    const lastLeg = airwaySegment.legs[airwaySegment.legs.length - 1];
    const nextLeg = plan.getNextLeg(airwaySegmentIndex + 1, -1);
    if (lastLeg && nextLeg && this.isDuplicateLeg(lastLeg.leg, nextLeg.leg)) {
      const nextLegIndex = plan.getLegIndexFromLeg(nextLeg);
      const nextLegSegmentIndex = plan.getSegmentIndex(nextLegIndex);
      const nextLegSegment = plan.getSegment(nextLegSegmentIndex);
      if (this.getAirwayLegType(plan, nextLegSegmentIndex, nextLegIndex - nextLegSegment.offset) === AirwayLegType.ENTRY) {
        // the duplicated leg is an airway entry -> remove the segment containing it (the segment is guaranteed to
        // contain just the one leg)
        this.planRemoveSegment(nextLegSegmentIndex);
      } else {
        this.planRemoveDuplicateLeg(lastLeg, nextLeg);
      }
    }

    plan.calculate(0, true);
  }

  /**
   * Prepares a new, empty airway segment in the primary flight plan which is ready to accept airway legs. Also
   * modifies the segment containing the entry leg, if necessary, either splitting it following the entry leg if it is
   * a non-airway enroute segment, or removing all legs following the entry leg if it is an airway segment. If the
   * entry leg is the last leg in its segment, a new non-airway enroute segment will be inserted after the entry leg
   * segment if the entry leg segment is the last segment in the flight plan or if the following segment is not an
   * enroute segment. If the entry leg is the entry for an existing airway segment, the existing airway segment will be
   * removed.
   * @param airwayName The name of the airway.
   * @param entrySegmentIndex The index of the segment containing the airway entry leg.
   * @param entrySegmentLegIndex The index of the airway entry leg in its segment.
   * @returns The index of the new airway segment.
   */
  private prepareAirwaySegment(airwayName: string, entrySegmentIndex: number, entrySegmentLegIndex: number): number {
    const plan = this.getPrimaryFlightPlan();

    if (
      entrySegmentIndex < plan.directToData.segmentIndex
      || (entrySegmentIndex === plan.directToData.segmentIndex && entrySegmentLegIndex < plan.directToData.segmentLegIndex)
    ) {
      this.removeDirectToExisting();
    }

    const entrySegment = plan.getSegment(entrySegmentIndex);
    const nextSegment = entrySegmentIndex + 1 < plan.segmentCount ? plan.getSegment(entrySegmentIndex + 1) : undefined;
    let airwaySegmentIndex = entrySegmentIndex + 1;

    let removeLegsSegmentIndex = -1;
    let removeLegsFromIndex = -1;

    if (entrySegment.airway !== undefined) {
      // the entry leg is within an existing airway segment -> remove all legs in the same segment after the entry leg
      removeLegsSegmentIndex = entrySegmentIndex;
      removeLegsFromIndex = entrySegmentLegIndex + 1;
    } else if (entrySegmentLegIndex === entrySegment.legs.length - 1 && nextSegment?.airway !== undefined) {
      // the entry leg is the entry leg for an existing airway segment -> remove all legs from the existing airway segment
      removeLegsSegmentIndex = entrySegmentIndex + 1;
      removeLegsFromIndex = 0;
    }

    // remove legs as required
    if (removeLegsSegmentIndex >= 0) {
      const removeLegsSegment = plan.getSegment(removeLegsSegmentIndex);

      if (this.getAirwayLegType(plan, removeLegsSegmentIndex, removeLegsSegment.legs.length - 1) === AirwayLegType.EXIT_ENTRY) {
        // preserve the airway entry leg
        const lastLeg = removeLegsSegment.legs[removeLegsSegment.legs.length - 1];
        this.planInsertSegmentOfType(FlightPlanSegmentType.Enroute, removeLegsSegmentIndex + 1);
        this.planAddLeg(removeLegsSegmentIndex + 1, lastLeg.leg, 0);
      }

      if (removeLegsFromIndex > 0) {
        while (removeLegsSegment.legs.length > removeLegsFromIndex) {
          this.planRemoveLeg(removeLegsSegmentIndex, removeLegsSegment.legs.length - 1, true, true);
        }
      } else {
        this.planRemoveSegment(removeLegsSegmentIndex);
      }
    }

    if (entrySegment.legs.length - 1 > entrySegmentLegIndex) {
      // entry leg is not the last leg in its segment -> split the segment after the entry leg
      airwaySegmentIndex = this.splitSegment(plan, entrySegmentIndex, entrySegmentLegIndex);
    } else if (
      plan.getSegment(entrySegmentIndex).segmentType === FlightPlanSegmentType.Enroute
      && (nextSegment?.segmentType !== FlightPlanSegmentType.Enroute)
    ) {
      // entry leg is the last leg in its segment and the following segment doesn't exist or is not an enroute segment
      plan.insertSegment(airwaySegmentIndex, FlightPlanSegmentType.Enroute);
    }

    plan.insertSegment(airwaySegmentIndex, FlightPlanSegmentType.Enroute, airwayName);
    return airwaySegmentIndex;
  }

  /**
   * Splits a segment into two segments if type is enroute; if departure, remove legs after the legIndex, else do nothing.
   * @param plan is the flight plan to edit.
   * @param segmentIndex Is the segment index for the entry leg.
   * @param legIndex Is the leg index of the entry leg in the segment of the
   * @returns the segment number of the new airway segment if one was created, else the current segment or if no action was taken.
   */
  private splitSegment(plan: FlightPlan, segmentIndex: number, legIndex: number): number {
    const segment = plan.getSegment(segmentIndex);
    if (segment.segmentType === FlightPlanSegmentType.Enroute) {
      const nextSegmentIndex = this.planInsertSegmentOfType(FlightPlanSegmentType.Enroute, segmentIndex + 1);
      for (let i = legIndex + 1; i < segment.legs.length; i++) {
        const leg = segment.legs[i].leg;
        this.planAddLeg(nextSegmentIndex, leg);
        this.planRemoveLeg(segmentIndex, i);
      }
      return nextSegmentIndex;
    } else if (segment.segmentType === FlightPlanSegmentType.Departure) {
      for (let i = legIndex + 1; i < segment.legs.length; i++) {
        this.planRemoveLeg(segmentIndex, i);
      }
    }
    return segmentIndex;
  }

  /**
   * Builds a legs for an airway.
   * @param airway The airway object.
   * @param entry The entry intersection facility.
   * @param exit The exit intersection facility.
   * @returns the InsertProcedureObject.
   */
  private buildAirwayLegs(airway: AirwayObject, entry: IntersectionFacility, exit: IntersectionFacility): InsertProcedureObject {
    const insertAirwayObject: InsertProcedureObject = { procedureLegs: [] };
    const waypoints = airway.waypoints;
    const entryIndex = waypoints.findIndex((w) => w.icao === entry.icao);
    const exitIndex = waypoints.findIndex((w) => w.icao === exit.icao);
    const ascending = exitIndex > entryIndex;
    if (ascending) {
      for (let i = entryIndex; i <= exitIndex; i++) {
        const leg = FlightPlan.createLeg({
          fixIcao: waypoints[i].icao,
          type: i === entryIndex ? LegType.IF : LegType.TF
        });
        insertAirwayObject.procedureLegs.push(leg);
      }
    } else {
      for (let i = entryIndex; i >= exitIndex; i--) {
        const leg = FlightPlan.createLeg({
          fixIcao: waypoints[i].icao,
          type: i === entryIndex ? LegType.IF : LegType.TF
        });
        insertAirwayObject.procedureLegs.push(leg);
      }
    }
    return insertAirwayObject;
  }

  /**
   * Method to remove an airway from the flight plan.
   * @param segmentIndex is the segment index of the airway to remove.
   */
  public removeAirway(segmentIndex: number): void {
    const plan = this.getFlightPlan();
    let combineSegments = false;
    const nextSegmentIsAirway = plan.getSegment(segmentIndex + 1).airway;
    if (segmentIndex > 0) {
      const priorSegmentEnrouteNonAirway = plan.getSegment(segmentIndex - 1).segmentType === FlightPlanSegmentType.Enroute
        && plan.getSegment(segmentIndex - 1).airway === undefined;
      const nextSegmentEnrouteNonAirway = plan.getSegment(segmentIndex + 1).segmentType === FlightPlanSegmentType.Enroute
        && plan.getSegment(segmentIndex + 1).airway === undefined;
      if (priorSegmentEnrouteNonAirway && nextSegmentEnrouteNonAirway) {
        combineSegments = true;
      }
      let entryLeg: FlightPlanLeg | undefined = undefined;
      if (nextSegmentIsAirway) {
        const segment = plan.getSegment(segmentIndex);
        entryLeg = segment.legs[segment.legs.length - 1].leg;
      }
      this.planRemoveSegment(segmentIndex);
      if (combineSegments) {
        this.mergeSegments(plan, segmentIndex - 1);
      }
      if (priorSegmentEnrouteNonAirway && entryLeg !== undefined) {
        this.planAddLeg(segmentIndex - 1, entryLeg);
      } else if (entryLeg !== undefined) {
        const newSegmentIndex = this.planInsertSegmentOfType(FlightPlanSegmentType.Enroute, segmentIndex);
        this.planAddLeg(newSegmentIndex, entryLeg);
      }
    }
    plan.calculate(0, true);
  }

  /**
   * Merges the legs of two consecutive segments into a single segment. All legs in the second segment are moved to the
   * first, and the second segment is removed from the flight plan.
   * @param plan The flight plan to modify.
   * @param segmentIndex The index of the first segment to merge.
   */
  private mergeSegments(plan: FlightPlan, segmentIndex: number): void {
    const segmentToGrow = plan.getSegment(segmentIndex);
    const segmentToRemove = plan.getSegment(segmentIndex + 1);

    const segmentToGrowOrigLength = segmentToGrow.legs.length;

    segmentToRemove.legs.forEach((l) => {
      plan.addLeg(segmentIndex, l.leg, undefined, l.flags);
    });

    if (plan.directToData.segmentIndex === segmentIndex + 1) {
      plan.setDirectToData(segmentIndex, segmentToGrowOrigLength + plan.directToData.segmentLegIndex);
    }

    this.planRemoveSegment(segmentIndex + 1);
  }

  /**
   * Inserts a hold-at-waypoint leg to the primary flight plan. The hold leg will be inserted immediately after the
   * specified parent leg. The hold leg must have the same fix as the parent leg.
   * @param planIndex The plan index to add the hold to.
   * @param segmentIndex The index of the segment that contains the hold's parent leg.
   * @param legIndex The index of the hold's parent leg in its segment.
   * @param holdLeg The hold leg to add.
   * @returns Whether the hold-at-waypoint leg was successfully inserted.
   */
  public insertHold(planIndex: number, segmentIndex: number, legIndex: number, holdLeg: FlightPlanLeg): boolean {
    const plan = this.hasFlightPlan(planIndex) && this.getFlightPlan(planIndex);
    if (!plan) {
      return false;
    }

    const prevLeg = plan.getPrevLeg(segmentIndex, legIndex + 1);
    if (prevLeg?.leg.fixIcao !== holdLeg.fixIcao) {
      return false;
    }

    if (planIndex === Fms.PRIMARY_PLAN_INDEX) {
      this.planAddLeg(segmentIndex, holdLeg, legIndex + 1);
      return true;
    } else {
      plan.addLeg(segmentIndex, holdLeg);
      this.bus.getPublisher<ControlEvents>().pub('suspend_sequencing', false, true);
      return true;
    }
  }

  /**
   * Returns the index of the last element in the array where predicate is true, and -1
   * otherwise.
   * @param array The source array to search in
   * @param predicate find calls predicate once for each element of the array, in descending
   * order, until it finds one where predicate returns true. If such an element is found,
   * findLastIndex immediately returns that element index. Otherwise, findLastIndex returns -1.
   * @param defaultReturn is the default value
   * @returns either the index or the default if the predicate criteria is not met
   */
  private findLastSegmentIndex(array: Array<FlightPlanSegment>, predicate:
    (value: FlightPlanSegment, index: number, obj: FlightPlanSegment[]) => boolean, defaultReturn = -1): number {
    let l = array.length;
    while (l--) {
      if (predicate(array[l], l, array)) {
        return array[l].segmentIndex;
      }
    }
    return defaultReturn;
  }

  /**
   * Adds a leg to the flight plan.
   * @param segmentIndex The segment to add the leg to.
   * @param leg The leg to add to the plan.
   * @param index The index of the leg in the segment to insert. Will add to the end of the segment if ommitted.
   * @param flags Leg definition flags to apply to the new leg. Defaults to `None` (0).
   * @param notify Whether or not to send notifications after the operation.
   */
  private planAddLeg(segmentIndex: number, leg: FlightPlanLeg, index?: number, flags = 0, notify = true): void {
    const plan = this.getFlightPlan();

    const dtoLegIndex = plan.directToData.segmentLegIndex;
    const dtoSegmentIndex = plan.directToData.segmentIndex;
    if (
      dtoSegmentIndex >= 0
      && (
        segmentIndex < dtoSegmentIndex
        || (segmentIndex === dtoSegmentIndex && index !== undefined && index <= dtoLegIndex)
      )
    ) {
      this.removeDirectToExisting();
    }

    const segment = plan.getSegment(segmentIndex);
    const addIndex = index !== undefined ? index : Math.max(segment.legs.length - 1, 0);
    if (
      segment.segmentType === FlightPlanSegmentType.Approach
      && addIndex > 0
      && BitFlags.isAll(segment.legs[addIndex - 1].flags, LegDefinitionFlags.MissedApproach)
    ) {
      flags |= LegDefinitionFlags.MissedApproach;
    }

    plan.addLeg(segmentIndex, leg, index, flags, notify);
    plan.calculate(plan.activeLateralLeg - 1);
    const activeSegmentIndex = plan.getSegmentIndex(plan.activeLateralLeg);
    if (activeSegmentIndex !== -1) {
      const activeLegIndex = plan.activeLateralLeg - plan.getSegment(activeSegmentIndex).offset;
      if (segmentIndex < activeSegmentIndex || (index && segmentIndex == activeSegmentIndex && index < activeLegIndex)) {
        const newActiveLegIndex = plan.activeLateralLeg + 1;
        plan.setCalculatingLeg(newActiveLegIndex);
        plan.setLateralLeg(newActiveLegIndex);
      }
    } else {
      console.error('planAddLeg: activeSegmentIndex was -1');
    }
  }

  /**
   * Removes a leg from the flight plan.
   * @param segmentIndex The segment to add the leg to.
   * @param segmentLegIndex The index of the leg in the segment to remove.
   * @param notify Whether or not to send notifications after the operation. True by default.
   * @param skipDupCheck Whether to skip checking for duplicates. False by default.
   * @param skipCancelDirectTo Whether to skip canceling a direct to existing if the removed leg is equal to or is
   * located before the direct to target. False by default.
   * @returns whether a leg was removed.
   */
  private planRemoveLeg(segmentIndex: number, segmentLegIndex: number, notify = true, skipDupCheck = false, skipCancelDirectTo = false): boolean {
    const plan = this.getFlightPlan();

    if (segmentIndex < 0 || segmentIndex >= plan.segmentCount) {
      return false;
    }

    const toRemoveLeg = plan.getSegment(segmentIndex).legs[segmentLegIndex];
    if (!toRemoveLeg) {
      return false;
    }

    const removeLegGlobalIndex = plan.getSegment(segmentIndex).offset + segmentLegIndex;

    const isDirectToExistingActive = this.getDirectToState() === DirectToState.TOEXISTING;

    let removed = false;
    const airwayLegType = this.getAirwayLegType(plan, segmentIndex, segmentLegIndex);

    if (airwayLegType !== AirwayLegType.NONE) {
      removed = this.removeLegAirwayHandler(plan, airwayLegType, segmentIndex, segmentLegIndex);
    } else {
      removed = plan.removeLeg(segmentIndex, segmentLegIndex, notify) !== null;

      if (!removed) {
        return false;
      }

      const dtoLegIndex = plan.directToData.segmentLegIndex;
      const dtoSegmentIndex = plan.directToData.segmentIndex;
      if (
        !skipCancelDirectTo
        && dtoSegmentIndex >= 0
        && (
          segmentIndex < dtoSegmentIndex
          || (segmentIndex === dtoSegmentIndex && segmentLegIndex <= dtoLegIndex)
        )
      ) {
        // Need to adjust direct to data to compensate for removed leg.
        if (segmentIndex === dtoSegmentIndex) {
          plan.directToData.segmentLegIndex--;
        }

        if (isDirectToExistingActive && segmentIndex === dtoSegmentIndex && segmentLegIndex === dtoLegIndex) {
          // Create a DTO random to replace the canceled DTO existing if we are directly removing the target leg of the DTO existing.
          const directIcao = plan.getSegment(plan.directToData.segmentIndex).legs[plan.directToData.segmentLegIndex + FmsUtils.DTO_LEG_OFFSET].leg.fixIcao;
          this.createDirectToRandom(directIcao);
        }

        this.removeDirectToExisting(plan.activeLateralLeg - 1);
      } else if (removeLegGlobalIndex < plan.activeLateralLeg || plan.activeLateralLeg >= plan.length) {
        const newActiveLegIndex = plan.activeLateralLeg - 1;
        plan.setCalculatingLeg(newActiveLegIndex);
        plan.setLateralLeg(newActiveLegIndex);
      }
    }

    const prevLeg = removeLegGlobalIndex - 1 >= 0 ? plan.getLeg(removeLegGlobalIndex - 1) : null;
    const nextLeg = removeLegGlobalIndex < plan.length ? plan.getLeg(removeLegGlobalIndex) : null;

    // Detect if we have created consecutive duplicate legs. If we have, we need to delete one of them.
    if (!skipDupCheck && prevLeg && nextLeg && this.isDuplicateLeg(prevLeg.leg, nextLeg.leg)) {
      this.planRemoveDuplicateLeg(prevLeg, nextLeg);
    }

    if (!skipDupCheck) {
      this.checkAndRemoveEmptySegment(plan, segmentIndex);
    }

    plan.calculate(plan.activeLateralLeg - 1);
    return true;
  }

  /**
   * Handles removing a leg that is either in an airway segment or is an entry for an airway segment.
   * @param plan The flight plan containing the leg to remove.
   * @param airwayLegType The type of the leg to remove with respect to its associated airway.
   * @param segmentIndex The index of the segment containing the leg to remove.
   * @param segmentLegIndex The index of the leg to remove in its segment.
   * @returns Whether this handler processed the remove request.
   */
  private removeLegAirwayHandler(plan: FlightPlan, airwayLegType: AirwayLegType, segmentIndex: number, segmentLegIndex: number): boolean {
    const removeLegGlobalIndex = plan.getSegment(segmentIndex).offset + segmentLegIndex;

    let removed = false;
    let needReconcileDto = plan.directToData.segmentIndex >= 0;

    if (
      segmentIndex < plan.directToData.segmentIndex
      || (segmentIndex === plan.directToData.segmentIndex && segmentLegIndex <= plan.directToData.segmentLegIndex)
    ) {
      // If there are DTO legs after the leg we are removing, we need to remove them (canceling the active DTO existing if necessary)

      if (this.getDirectToState() === DirectToState.TOEXISTING && segmentLegIndex === plan.directToData.segmentLegIndex) {
        // Create a DTO random to replace the canceled DTO existing if we are directly removing the target leg of the DTO existing.
        const directIcao = plan.getSegment(plan.directToData.segmentIndex).legs[plan.directToData.segmentLegIndex + FmsUtils.DTO_LEG_OFFSET].leg.fixIcao;
        this.createDirectToRandom(directIcao);
      }

      this.removeDirectToExisting();

      needReconcileDto = false;
    }

    switch (airwayLegType) {
      case AirwayLegType.ONROUTE: {
        const segment = plan.getSegment(segmentIndex);
        plan.removeLeg(segmentIndex, segmentLegIndex);

        if (segmentLegIndex > 0) {
          // Need to rename the airway segment with the new exit (if we removed the first leg after the entry, the
          // airway segment will be deleted so no need to bother)

          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          plan.setAirway(segmentIndex, segment.airway!.replace(/\..*/, `.${segment.legs[segmentLegIndex - 1].name}`));
        }

        // We need to move the leg immediately after the removed leg to the next enroute segment
        // (if the next enroute segment does not exist we will create one)

        if (plan.segmentCount <= segmentIndex + 1 || plan.getSegment(segmentIndex + 1).segmentType !== FlightPlanSegmentType.Enroute) {
          plan.insertSegment(segmentIndex + 1, FlightPlanSegmentType.Enroute);
        }

        const legAfterRemoved = segment.legs[segmentLegIndex].leg;
        plan.addLeg(segmentIndex + 1, legAfterRemoved, 0);
        plan.removeLeg(segmentIndex, segmentLegIndex);

        if (segmentLegIndex < segment.legs.length) {
          // There is at least one more leg in the original airway segment after the one we moved to the next enroute
          // segment -> move these remaining legs into a new airway segment

          const newEntrySegment = plan.getSegment(segmentIndex + 1);
          let newAirwaySegmentIndex = segmentIndex + 2;
          if (newEntrySegment.legs.length > 1) {
            // need to split the segment containing the entry leg of the new airway segment
            newAirwaySegmentIndex = this.splitSegment(plan, segmentIndex + 1, 0);
          }

          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          const airwayName = segment.airway!.replace(/\..*/, `.${segment.legs[segment.legs.length - 1].name}`);
          plan.insertSegment(newAirwaySegmentIndex, FlightPlanSegmentType.Enroute, airwayName);

          while (segment.legs.length > segmentLegIndex) {
            const leg = segment.legs[segmentLegIndex].leg;
            plan.removeLeg(segmentIndex, segmentLegIndex);
            plan.addLeg(newAirwaySegmentIndex, leg);
          }

          // If the newly added airway segment is the last enroute segment, we need to insert an empty enroute segment
          // after it to ensure that the last enroute segment in the plan is not an airway segment
          if (newAirwaySegmentIndex >= plan.segmentCount - 1 || plan.getSegment(newAirwaySegmentIndex + 1).segmentType !== FlightPlanSegmentType.Enroute) {
            plan.insertSegment(newAirwaySegmentIndex + 1, FlightPlanSegmentType.Enroute);
          }
        }

        removed = true;
        break;
      }
      case AirwayLegType.ENTRY: {
        if (plan.getSegment(segmentIndex).segmentType === FlightPlanSegmentType.Enroute) {
          // We need to remove the entry leg, then move the first leg in the airway segment out of the airway segment
          // and into the previous enroute segment to serve as the new entry leg.

          const segment = plan.getSegment(segmentIndex + 1);
          const leg = segment.legs[0].leg;
          plan.removeLeg(segmentIndex + 1, 0);
          this.checkAndRemoveEmptySegment(plan, segmentIndex + 1);

          this.planAddLeg(segmentIndex, leg);
        } else if (plan.getSegment(segmentIndex).segmentType === FlightPlanSegmentType.Departure) {
          // We need to remove the entry leg, then move the first leg in the airway segment out of the airway segment
          // and into a newly created enroute segment placed before the airway segment to serve as the new entry leg.

          this.planInsertSegmentOfType(FlightPlanSegmentType.Enroute, segmentIndex + 1);
          const segment = plan.getSegment(segmentIndex + 2);
          const leg = segment.legs[0].leg;
          plan.removeLeg(segmentIndex + 2, 0);
          this.checkAndRemoveEmptySegment(plan, segmentIndex + 2);

          this.planAddLeg(segmentIndex + 1, leg);
        }
        removed = plan.removeLeg(segmentIndex, segmentLegIndex) !== null;
        break;
      }
      case AirwayLegType.EXIT: {
        if (segmentLegIndex < 1) {
          // We are removing the only leg in the airway segment, so just delete the segment.

          this.removeAirway(segmentIndex);
          return true;
        } else {
          // Remove the leg, then change the name of the airway segment to reflect the new exit waypoint.

          const segment = plan.getSegment(segmentIndex);
          const airway = segment.airway?.split('.');
          segment.airway = airway && airway[0] ? airway[0] + '.' + segment.legs[segmentLegIndex - 1].name : segment.airway;
          plan.setAirway(segmentIndex, segment.airway);
          removed = plan.removeLeg(segmentIndex, segmentLegIndex) !== null;
        }
        break;
      }
      case AirwayLegType.EXIT_ENTRY: {
        // We need to move the first leg in the next airway segment out of that segment and into an enroute segment
        // before the next airway segment.

        const segment = plan.getSegment(segmentIndex + 1);
        const leg = segment.legs[0].leg;
        plan.removeLeg(segmentIndex + 1, 0);
        if (segmentLegIndex < 1) {
          // We are removing the only leg in the first airway segment, so just remove the segment.
          plan.removeSegment(segmentIndex);

          let prevSegmentIndex = segmentIndex - 1;
          const prevSegment = plan.getSegment(prevSegmentIndex);
          if (prevSegment.segmentType !== FlightPlanSegmentType.Enroute || prevSegment.airway !== undefined) {
            plan.insertSegment(segmentIndex, FlightPlanSegmentType.Enroute);
            prevSegmentIndex = segmentIndex;
          }

          plan.addLeg(prevSegmentIndex, leg);
        } else {
          // Remove the leg from the first airway segment, then change the name of the airway segment to reflect the
          // new exit waypoint.

          plan.removeLeg(segmentIndex, segmentLegIndex);
          plan.insertSegment(segmentIndex + 1, FlightPlanSegmentType.Enroute);
          plan.addLeg(segmentIndex + 1, leg);

          const firstAirwaySegment = plan.getSegment(segmentIndex);
          const airway = firstAirwaySegment.airway?.split('.');
          firstAirwaySegment.airway = airway && airway[0] ? airway[0] + '.' + firstAirwaySegment.legs[segmentLegIndex - 1].name : firstAirwaySegment.airway;
          plan.setAirway(segmentIndex, firstAirwaySegment.airway);
        }
        removed = true;
      }
    }

    if (removed) {
      if (needReconcileDto) {
        FmsUtils.reconcileDirectToData(plan);
      }

      if (removeLegGlobalIndex <= plan.activeLateralLeg || plan.activeLateralLeg >= plan.length) {
        const newActiveLegIndex = plan.activeLateralLeg - 1;
        plan.setCalculatingLeg(newActiveLegIndex);
        plan.setLateralLeg(newActiveLegIndex);
      }
    }

    return removed;
  }

  /**
   * Checks if a flight plan segment is empty, and removes the segment if it is eligible to be removed. Only Enroute
   * segments that are followed by another Enroute segment are eligible to be removed if empty.
   * @param plan A flight plan.
   * @param segmentIndex The index of the segment to check.
   * @returns Whether the segment was removed.
   */
  private checkAndRemoveEmptySegment(plan: FlightPlan, segmentIndex: number): boolean {
    if (this.checkIfRemoveLeftEmptySegmentToDelete(plan, segmentIndex)) {
      this.planRemoveSegment(segmentIndex);

      const prevSegmentIndex = segmentIndex - 1;
      const nextSegmentIndex = segmentIndex;
      const prevSegment = prevSegmentIndex >= 0 ? plan.getSegment(prevSegmentIndex) : undefined;
      const nextSegment = nextSegmentIndex < plan.segmentCount ? plan.getSegment(nextSegmentIndex) : undefined;
      if (
        prevSegment?.segmentType === FlightPlanSegmentType.Enroute
        && prevSegment.airway === undefined
        && nextSegment?.segmentType === FlightPlanSegmentType.Enroute
        && nextSegment.airway === undefined
      ) {
        // We are left with two consecutive non-airway enroute segments -> merge the two
        this.mergeSegments(plan, prevSegmentIndex);
      }

      return true;
    } else {
      return false;
    }
  }

  /**
   * Checks if a remove left an empty segment that also needs to be removed.
   * @param plan is the flight plan
   * @param segmentIndex The segment to add the leg to.
   * @returns whether to remove the segment.
   */
  private checkIfRemoveLeftEmptySegmentToDelete(plan: FlightPlan, segmentIndex: number): boolean {
    const segment = plan.getSegment(segmentIndex);
    let nextSegment: FlightPlanSegment | undefined;
    if (segmentIndex < plan.segmentCount - 1) {
      nextSegment = plan.getSegment(segmentIndex + 1);
    }
    if (segment.legs.length < 1) {
      switch (segment.segmentType) {
        case FlightPlanSegmentType.Enroute:
          if (nextSegment && nextSegment.segmentType === FlightPlanSegmentType.Enroute) {
            return true;
          }
          break;
        //TODO: Add more cases as appropriate
      }
    }
    return false;
  }


  /**
   * Adds an appropriate origin or destination leg (either an airport or runway fix) to the primary flight plan. Origin
   * legs are added to the beginning of the specified segment. Destination legs are added to the end of the specified
   * segment.
   * @param isOrigin Whether to add an origin leg.
   * @param segmentIndex The index of the segment to which to add the leg.
   * @param airport The origin airport.
   * @param runway The origin runway.
   */
  private planAddOriginDestinationLeg(isOrigin: boolean, segmentIndex: number, airport: AirportFacility, runway?: OneWayRunway): void {
    let leg;
    if (runway) {
      leg = FmsUtils.buildRunwayLeg(airport, runway, isOrigin);
    } else {
      leg = FlightPlan.createLeg({
        lat: airport.lat,
        lon: airport.lon,
        type: isOrigin ? LegType.IF : LegType.TF,
        fixIcao: airport.icao,
        altitude1: airport.runways[0].elevation + UnitType.FOOT.convertTo(50, UnitType.METER)
      });
    }

    if (leg) {
      this.planAddLeg(segmentIndex, leg, isOrigin ? 0 : undefined);
      if (!isOrigin) {
        const plan = this.getFlightPlan();
        const lastEnrouteSegmentIndex = this.findLastEnrouteSegmentIndex(plan);
        const lastEnrouteSegment = plan.getSegment(lastEnrouteSegmentIndex);
        for (let i = lastEnrouteSegment.legs.length - 1; i >= 0; i--) {
          if (lastEnrouteSegment.legs[i].leg.fixIcao === airport.icao) {
            this.planRemoveLeg(lastEnrouteSegmentIndex, i, true, true);
          }
        }
      }
    }
  }

  /**
   * Method to add a segment to the flightplan.
   * @param segmentType is the FlightPlanSegmentType.
   * @param index is the optional segment index to insert the segment.
   * @returns the segment index of the inserted segment.
   */
  private planInsertSegmentOfType(segmentType: FlightPlanSegmentType, index?: number): number {
    const plan = this.getFlightPlan();
    let segmentIndex = -1;

    if (index) {
      segmentIndex = index - 1;
    } else {
      const segments: FlightPlanSegment[] = [];
      for (const segment of plan.segments()) {
        segments.push(segment);
      }

      switch (segmentType) {
        case FlightPlanSegmentType.Origin:
          break;
        case FlightPlanSegmentType.Departure:
          segmentIndex = 0;
          break;
        case FlightPlanSegmentType.Arrival:
          segmentIndex = this.findLastSegmentIndex(segments, (v) => {
            return v.segmentType === FlightPlanSegmentType.Enroute;
          }, 2);
          break;
        case FlightPlanSegmentType.Approach:
          segmentIndex = this.findLastSegmentIndex(segments, (v) => {
            return v.segmentType === FlightPlanSegmentType.Enroute || v.segmentType === FlightPlanSegmentType.Arrival;
          }, 2);
          break;
        case FlightPlanSegmentType.MissedApproach:
          segmentIndex = this.findLastSegmentIndex(segments, (v) => {
            return v.segmentType === FlightPlanSegmentType.Approach;
          }, 2);
          break;
        case FlightPlanSegmentType.Destination:
          segmentIndex = this.findLastSegmentIndex(segments, (v) => {
            return v.segmentType === FlightPlanSegmentType.Enroute || v.segmentType === FlightPlanSegmentType.Arrival
              || v.segmentType === FlightPlanSegmentType.Approach;
          }, 5);
          break;
        default:
          segmentIndex = this.findLastSegmentIndex(segments, (v) => {
            return v.segmentType === FlightPlanSegmentType.Enroute || v.segmentType === FlightPlanSegmentType.Arrival
              || v.segmentType === FlightPlanSegmentType.Approach || v.segmentType === FlightPlanSegmentType.Destination;
          }, 1);
          segmentIndex--;
          break;
      }
    }
    return this.planInsertSegment(segmentIndex + 1, segmentType).segmentIndex;
  }

  /**
   * Method to remove all legs from a segment.
   * @param segmentIndex is the index of the segment to delete all legs from.
   * @param segmentType is the type if segment to delete all legs from, if known.
   */
  private planClearSegment(segmentIndex: number, segmentType?: FlightPlanSegmentType): void {
    this.planRemoveSegment(segmentIndex);
    this.planInsertSegment(segmentIndex, segmentType);
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
  private planInsertSegment(segmentIndex: number, segmentType: FlightPlanSegmentType = FlightPlanSegmentType.Enroute, airway?: string, notify = true): FlightPlanSegment {
    const plan = this.getFlightPlan();

    const segment = plan.insertSegment(segmentIndex, segmentType, airway, notify);
    plan.calculate(plan.activeLateralLeg - 1);

    if (plan.directToData.segmentIndex >= 0 && segmentIndex <= plan.directToData.segmentIndex) {
      plan.setDirectToData(plan.directToData.segmentIndex + 1, plan.directToData.segmentLegIndex);
    }

    return segment;
  }

  /**
   * Removes a segment from the flight plan and reflows the segments following
   * the removed segment, not leaving an empty segment at the specified index.
   * @param segmentIndex The index of the segment to remove.
   * @param notify Whether or not to send notifications after the operation.
   */
  private planRemoveSegment(segmentIndex: number, notify = true): void {
    const plan = this.getFlightPlan();

    const segment = plan.getSegment(segmentIndex);
    const activeSegmentIndex = plan.getSegmentIndex(plan.activeLateralLeg);

    if (plan.directToData.segmentIndex >= 0) {
      if (segmentIndex < plan.directToData.segmentIndex) {
        plan.setDirectToData(plan.directToData.segmentIndex - 1, plan.directToData.segmentLegIndex);
      } else if (segmentIndex === plan.directToData.segmentIndex) {
        plan.setDirectToData(-1);
      }
    }

    if (activeSegmentIndex === segmentIndex && !Simplane.getIsGrounded() && plan.length > 1) {
      const directIcao = plan.getLeg(plan.activeLateralLeg).leg.fixIcao;
      this.removeDirectToExisting();
      if (this.getDirectToState() !== DirectToState.TORANDOM) {
        this.createDirectToRandom(directIcao);
      }
    }

    const newActiveLegIndex = plan.activeLateralLeg - Utils.Clamp(plan.activeLateralLeg - segment.offset, 0, segment.legs.length);
    plan.setCalculatingLeg(newActiveLegIndex);
    plan.setLateralLeg(newActiveLegIndex);

    plan.removeSegment(segmentIndex, notify);
    plan.calculate(plan.activeLateralLeg - 1);
  }

  /**
   * Checks whether of two consecutive flight plan legs, the second is a duplicate of the first. The second leg is
   * considered a duplicate if and only if it is an IF, TF, or DF leg with the same terminator fix as the first leg,
   * which is also an IF, TF, or DF leg.
   * @param leg1 The first leg.
   * @param leg2 The second leg.
   * @returns whether the second leg is a duplicate of the first.
   */
  private isDuplicateLeg(leg1: FlightPlanLeg, leg2: FlightPlanLeg): boolean {
    if (
      leg2.type !== LegType.IF
      && leg2.type !== LegType.DF
      && leg2.type !== LegType.TF
      && leg2.type !== LegType.CF
    ) {
      return false;
    }

    return (leg1.type === LegType.IF
      || leg1.type === LegType.TF
      || leg1.type === LegType.DF
      || leg1.type === LegType.CF)
      && leg1.fixIcao === leg2.fixIcao;
  }

  /**
   * Checks whether of two consecutive flight plan legs, the second is an IF leg and is a duplicate of the first. The
   * IF leg is considered a duplicate if and only if its fix is the same as the fix at which the first leg terminates.
   * @param leg1 The first leg.
   * @param leg2 The second leg.
   * @returns whether the second leg is an duplicate IF leg of the first.
   */
  private isDuplicateIFLeg(leg1: FlightPlanLeg, leg2: FlightPlanLeg): boolean {
    if (leg2.type !== LegType.IF) {
      return false;
    }
    if (
      leg1.type !== LegType.TF
      && leg1.type !== LegType.DF
      && leg1.type !== LegType.RF
      && leg1.type !== LegType.CF
      && leg1.type !== LegType.AF
      && leg1.type !== LegType.IF
    ) {
      return false;
    }

    return leg1.fixIcao === leg2.fixIcao;
  }

  /**
   * Merges two duplicate legs such that the new merged leg contains the fix type and altitude data from the source leg
   * and all other data is derived from the target leg.
   * @param target The target leg.
   * @param source The source leg.
   * @returns the merged leg.
   */
  private mergeDuplicateLegData(target: FlightPlanLeg, source: FlightPlanLeg): FlightPlanLeg {
    const merged = FlightPlan.createLeg(target);
    merged.fixTypeFlags |= source.fixTypeFlags;
    merged.altDesc = source.altDesc;
    merged.altitude1 = source.altitude1;
    merged.altitude2 = source.altitude2;
    return merged;
  }

  /**
   * Deletes one of two consecutive duplicate legs. If one leg is in a procedure and the other is not, the leg that is
   * not in a procedure will be deleted. If the legs are in different procedures, the earlier leg will be deleted.
   * Otherwise, the later leg will be deleted. If the deleted leg is the target leg of a direct to, the legs in the
   * direct to sequence will be copied and moved to immediately follow the duplicate leg that was not deleted.
   * @param leg1 The first duplicate leg.
   * @param leg2 The second duplicate leg.
   * @returns the leg that was deleted, or null if neither leg was deleted.
   * @throws Error if direct to legs could not be updated.
   */
  private planRemoveDuplicateLeg(leg1: LegDefinition, leg2: LegDefinition): LegDefinition | null {
    const plan = this.getFlightPlan();

    const leg1Segment = plan.getSegmentFromLeg(leg1);
    const leg1Index = plan.getLegIndexFromLeg(leg1);
    const leg2Segment = plan.getSegmentFromLeg(leg2);
    const leg2Index = plan.getLegIndexFromLeg(leg2);

    if (!leg1Segment || !leg2Segment) {
      return null;
    }

    const isLeg1DirectToLeg = BitFlags.isAll(leg1.flags, LegDefinitionFlags.DirectTo);
    const isLeg2DirectToLeg = BitFlags.isAll(leg2.flags, LegDefinitionFlags.DirectTo);
    const dupDirectToLeg = isLeg1DirectToLeg ? leg1
      : isLeg2DirectToLeg ? leg2
        : null;

    if (dupDirectToLeg) {
      if (dupDirectToLeg.leg.type === LegType.IF) {
        // Technically this should never happen.
        return null;
      } else {
        // If one of the duplicates is the second leg in a direct to sequence, then the true duplicated leg is the
        // target leg of the DTO. In this case, we call this method with the DTO target leg replacing the DTO leg.
        const dtoTargetLeg = plan.getSegment(plan.directToData.segmentIndex).legs[plan.directToData.segmentLegIndex];
        return isLeg1DirectToLeg ? this.planRemoveDuplicateLeg(dtoTargetLeg, leg2) : this.planRemoveDuplicateLeg(leg1, dtoTargetLeg);
      }
    }

    const isLeg1InProc = leg1Segment.segmentType !== FlightPlanSegmentType.Enroute;
    const isLeg2InProc = leg2Segment.segmentType !== FlightPlanSegmentType.Enroute;
    let toDeleteSegment;
    let toDeleteIndex;
    let toDeleteLeg;
    if (
      (!isLeg1InProc && isLeg2InProc)
      || (isLeg1InProc && isLeg2InProc && leg1Segment !== leg2Segment)
      || BitFlags.isAny(leg2.leg.fixTypeFlags, FixTypeFlags.FAF | FixTypeFlags.MAP)
    ) {
      toDeleteSegment = leg1Segment;
      toDeleteIndex = leg1Index - leg1Segment.offset;
      toDeleteLeg = leg1;
    } else {
      toDeleteSegment = leg2Segment;
      toDeleteIndex = leg2Index - leg2Segment.offset;
      leg1.leg = this.mergeDuplicateLegData(leg1.leg, leg2.leg);
      toDeleteLeg = leg2;
    }

    if (toDeleteIndex >= 0) {
      const dtoTargetLeg = plan.directToData.segmentIndex < 0 ? null : plan.getSegment(plan.directToData.segmentIndex).legs[plan.directToData.segmentLegIndex];
      const needMoveDtoLegs = toDeleteLeg === dtoTargetLeg;
      if (needMoveDtoLegs) {
        const isDtoExistingActive = this.getDirectToState() === DirectToState.TOEXISTING;

        // If the removed leg was the target leg of a DTO existing, we need to shift the DTO legs to target the leg
        // that was not removed.

        const oldDiscoLeg = plan.removeLeg(plan.directToData.segmentIndex, plan.directToData.segmentLegIndex + 1);
        const oldDtoLeg1 = plan.removeLeg(plan.directToData.segmentIndex, plan.directToData.segmentLegIndex + 1);
        const oldDtoLeg2 = plan.removeLeg(plan.directToData.segmentIndex, plan.directToData.segmentLegIndex + 1);

        if (!oldDtoLeg1 || !oldDtoLeg2 || !oldDiscoLeg) {
          throw new Error(`Fms: Could not remove direct to legs starting at segment index ${plan.directToData.segmentIndex}, leg index ${plan.directToData.segmentLegIndex} during duplicate leg resolution.`);
        }

        const preservedLeg = toDeleteLeg === leg1 ? leg2 : leg1;
        const preservedLegIndex = plan.getLegIndexFromLeg(preservedLeg);

        const newTargetSegmentIndex = plan.getSegmentIndex(preservedLegIndex);
        const newTargetSegmentLegIndex = preservedLegIndex - plan.getSegment(newTargetSegmentIndex).offset;

        plan.setDirectToData(newTargetSegmentIndex, newTargetSegmentLegIndex);

        plan.addLeg(newTargetSegmentIndex, FlightPlan.createLeg(oldDiscoLeg.leg), newTargetSegmentLegIndex + 1, LegDefinitionFlags.DirectTo);
        plan.addLeg(newTargetSegmentIndex, FlightPlan.createLeg(oldDtoLeg1.leg), newTargetSegmentLegIndex + 2, LegDefinitionFlags.DirectTo);
        plan.addLeg(newTargetSegmentIndex, FlightPlan.createLeg(oldDtoLeg2.leg), newTargetSegmentLegIndex + 3, LegDefinitionFlags.DirectTo);

        if (isDtoExistingActive) {
          const newActiveLegIndex = preservedLegIndex + FmsUtils.DTO_LEG_OFFSET;
          plan.setCalculatingLeg(newActiveLegIndex);
          plan.setLateralLeg(newActiveLegIndex);
        }
      }

      const success = this.planRemoveLeg(toDeleteSegment.segmentIndex, toDeleteIndex, true, false, needMoveDtoLegs);
      if (success) {
        return toDeleteLeg;
      }
    }

    return null;
  }

  /**
   * Converts an OBS course to a Direct-To. The OBS leg is assumed to be the currently active flight plan leg.
   * @param obsCourse The OBS course, in degrees magnetic.
   */
  private convertObsToDirectTo(obsCourse: number): void {
    const dtoState = this.getDirectToState();

    if (dtoState === DirectToState.TORANDOM) {
      // Just replace the DTO random with one with a custom course
      const dtoTargetIcao = this.getDirectToTargetIcao();
      this.createDirectToRandom(dtoTargetIcao as string, obsCourse);
    } else if (dtoState === DirectToState.TOEXISTING) {
      const dtoData = this.getPrimaryFlightPlan().directToData;
      this.createDirectToExisting(dtoData.segmentIndex, dtoData.segmentLegIndex, obsCourse);
    } else {
      const plan = this.getPrimaryFlightPlan();
      const segmentIndex = plan.getSegmentIndex(plan.activeLateralLeg);
      const segmentLegIndex = plan.getSegmentLegIndex(plan.activeLateralLeg);
      if (segmentIndex >= 0 && segmentLegIndex >= 0) {
        this.createDirectToExisting(segmentIndex, segmentLegIndex, obsCourse);
      }
    }
  }

  /**
   * Loads an approach frequency into the fms.
   * @param facility The airport facility.
   * @param approachIndex The approach Index.
   */
  private loadApproachFrequency(facility?: AirportFacility, approachIndex?: number): void {
    this.approachFrequency.set(FmsUtils.getApproachFrequency(facility, approachIndex));
  }

  /**
   * Loads an approach frequency into the fms.
   * @param radioIndex The radio index to set (1 or 2).
   * @param forceNotify resets the subject to force a cross-instrument notification.
   */
  private setLocFrequency(radioIndex: 1 | 2, forceNotify = false): void {
    const approachFrequency = this.approachFrequency.get();
    if (forceNotify) {
      this.approachFrequency.set(undefined);
      this.approachFrequency.set(approachFrequency);
    }

    if (approachFrequency === undefined || Math.abs(this.navActiveFreqs[radioIndex].get() - approachFrequency.freqMHz) < 0.001) {
      return;
    }

    const setActive = this.cdiSource.type === NavSourceType.Gps || this.cdiSource.index !== radioIndex;

    SimVar.SetSimVarValue(`K:NAV${radioIndex}_STBY_SET_HZ`, 'Hz', approachFrequency.freqMHz * 1000000);
    if (setActive) {
      SimVar.SetSimVarValue(`K:NAV${radioIndex}_RADIO_SWAP`, 'Bool', 1);
    }
  }

  /**
   * Sets the approach details for the loaded approach and sends an event across the bus.
   * @param approachLoaded Whether an approach is loaded.
   * @param approachType The approach type.
   * @param approachRnavType The approach RNAV type.
   * @param approachIsActive Whether the approach is active.
   * @param approachIsCircling Whether the approach is a circling approach.
   */
  private setApproachDetails(
    approachLoaded?: boolean,
    approachType?: ExtendedApproachType,
    approachRnavType?: RnavTypeFlags,
    approachIsActive?: boolean,
    approachIsCircling?: boolean): void {
    const approachDetails: ApproachDetails = {
      approachLoaded: approachLoaded !== undefined ? approachLoaded : this.approachDetails.approachLoaded,
      approachType: approachType !== undefined ? approachType : this.approachDetails.approachType,
      approachRnavType: approachRnavType !== undefined ? approachRnavType : this.approachDetails.approachRnavType,
      approachIsActive: approachIsActive !== undefined ? approachIsActive : this.approachDetails.approachIsActive,
      approachIsCircling: approachIsCircling !== undefined ? approachIsCircling : this.approachDetails.approachIsCircling
    };
    if (approachDetails.approachIsActive && !approachDetails.approachLoaded) {
      this.checkApproachState();
      return;
    }

    if (approachDetails !== this.approachDetails) {
      this.approachDetails = approachDetails;

      this.bus.getPublisher<GarminControlEvents>().pub('approach_details_set', this.approachDetails, true);
      this.bus.getPublisher<ControlEvents>().pub('approach_available', approachDetails.approachIsActive && approachDetails.approachLoaded, true);
      this.bus.getPublisher<VNavDataEvents>().pub('gp_available', this.isGpAvailable(), true);
    }
  }

  /**
   * Checks whether the approach details indicate that a GP should be available for tracking and display.
   * @returns whether or not the GP is available.
   */
  private isGpAvailable(): boolean {
    if (this.approachDetails.approachLoaded && this.approachDetails.approachIsActive && !this.approachDetails.approachIsCircling) {
      switch (this.approachDetails.approachType) {
        case ApproachType.APPROACH_TYPE_GPS:
        case ApproachType.APPROACH_TYPE_RNAV:
        case AdditionalApproachType.APPROACH_TYPE_VISUAL:
          return true;
      }
    }
    return false;
  }

  /**
   * Sets the approach details when an approach_details_set event is received from the bus.
   * @param approachDetails The approachDetails received from the bus.
   */
  private onApproachDetailsSet = (approachDetails: ApproachDetails): void => {
    if (approachDetails !== this.approachDetails) {
      this.approachDetails = approachDetails;
    }
  };
}
