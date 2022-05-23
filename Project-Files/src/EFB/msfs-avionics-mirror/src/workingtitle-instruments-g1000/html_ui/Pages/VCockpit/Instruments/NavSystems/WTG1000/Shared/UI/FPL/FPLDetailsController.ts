/// <reference types="msfstypes/JS/Avionics" />

import { BitFlags, FSComponent, NodeReference, SubscribableArrayEventType, UnitType } from 'msfssdk';
import { EventBus } from 'msfssdk/data';
import { ADCEvents, APEvents } from 'msfssdk/instruments';
import { FacilityType, FixTypeFlags, ICAO } from 'msfssdk/navigation';
import {
  OriginDestChangeType, PlanChangeType, FlightPlan, FlightPlanProcedureDetailsEvent, FlightPlanIndicationEvent,
  FlightPlanCalculatedEvent, FlightPlanOriginDestEvent, FlightPlanLegEvent, FlightPlanSegmentEvent,
  FlightPlannerEvents, FlightPlanSegmentType, LegDefinitionFlags
} from 'msfssdk/flightplan';
import { VNavEvents, VNavUtils } from 'msfssdk/autopilot';

import { DirectToState, Fms } from 'garminsdk/flightplan';
import { FPLDetailsStore } from './FPLDetailsStore';
import { FPLSection } from '../../../PFD/Components/UI/FPL/FPLSection';
import { FPLOrigin } from '../../../PFD/Components/UI/FPL/FPLSectionOrigin';
import { ActiveLegDefinition, ActiveLegStates, FplActiveLegArrow } from '../UIControls/FplActiveLegArrow';
import { G1000ControlEvents } from '../../G1000Events';


/**
 * The scroll mode for FPL.
 */
export enum ScrollMode {
  MANUAL,
  AUTO
}

/**
 * Controller for FPLDetails
 */
export class FPLDetailsController {
  public readonly sectionRefs: NodeReference<FPLSection>[] = [];
  public readonly originRef = FSComponent.createRef<FPLOrigin>();
  public readonly legArrowRef = FSComponent.createRef<FplActiveLegArrow>();
  public hasVnav = false;
  private isInitialized = false;
  public airwaysCollapsed = false;
  public scrollMode = ScrollMode.MANUAL;
  /** First time this view is loaded, we need to force scroll to the active leg */
  private didInitScroll = false;

  /**
   * Constructor
   * @param store the store instance
   * @param fms the fms
   * @param bus the bus
   * @param scrollToActiveLegCb the callback for scroll to active leg
   */
  constructor(private readonly store: FPLDetailsStore, private readonly fms: Fms, private readonly bus: EventBus, private readonly scrollToActiveLegCb: () => void) {
    if (this.fms.verticalPathCalculator) {
      this.hasVnav = true;
    }
  }

  /** Initializes fpldetails controller */
  public initialize(): void {
    this.store.activeLegState.sub(() => {
      this.onActiveLegStateChange();
    });

    this.store.activeLeg.sub(() => {
      this.onActiveLegStateChange();
    });

    this.store.segments.sub((index, type) => {
      if (type === SubscribableArrayEventType.Removed) {
        this.sectionRefs.splice(index, 1);
      }
    });

    //Attempt to load the first flight plan on construction
    this.onFlightPlanLoaded({ planIndex: 0 });

    //this.initActiveLeg();
    this.isInitialized = true;

    this.bus.getSubscriber<ADCEvents>().on('alt').atFrequency(1).handle(alt => this.store.currentAltitude = alt);

    const ap = this.bus.getSubscriber<APEvents>();
    ap.on('ap_altitude_selected').withPrecision(0).handle((sAlt) => {
      this.store.selectedAltitude = sAlt;
    });

    const fpl = this.bus.getSubscriber<FlightPlannerEvents & VNavEvents>();

    fpl.on('fplSegmentChange').handle((event) => {
      this.onSegmentChange(event);
      if (event.type !== PlanChangeType.Changed && event.segmentIndex <= this.store.activeLeg.get().segmentIndex) {
        // We need to explicitly update the active leg state because the segment change can change the active leg
        // without changing the global index of the active leg.
        this.store.activeLegState.set(ActiveLegStates.NONE);
        this.updateActiveLegState();
      }
    });
    fpl.on('fplLegChange').handle((event) => {
      this.onLegChange(event);

      const activeLegInfo = this.store.activeLeg.get();
      if (
        event.type !== PlanChangeType.Changed
        && (
          event.segmentIndex < activeLegInfo.segmentIndex
          || event.segmentIndex === activeLegInfo.segmentIndex && event.legIndex <= activeLegInfo.legIndex
        )
      ) {
        // We need to explicitly update the active leg state because the leg change can change the active leg
        // without changing the global index of the active leg.
        this.store.activeLegState.set(ActiveLegStates.NONE);
        this.updateActiveLegState();
      }
    });
    fpl.on('fplActiveLegChange').handle(this.updateActiveLegState.bind(this));
    fpl.on('fplOriginDestChanged').handle(this.onOriginDestChanged.bind(this));
    fpl.on('fplCalculated').handle(this.onPlanCalculated.bind(this));
    fpl.on('fplLoaded').handle(this.onFlightPlanLoaded.bind(this));
    fpl.on('fplIndexChanged').handle(this.onPlanIndexChanged.bind(this));
    fpl.on('fplProcDetailsChanged').handle(this.onProcDetailsChanged.bind(this));
    fpl.on('vnav_path_calculated').handle(this.onVnavUpdated.bind(this));
    fpl.on('fplDirectToDataChanged').handle(this.updateActiveLegState.bind(this));

    this.bus.getSubscriber<G1000ControlEvents>().on('activate_vertical_direct').handle(this.onVerticalDirect.bind(this));
  }

  /**
   * A method to initialize the active leg.
   * TODO: REMOVE THIS WHEN THE ROOT PROBLEM IS FIXED
   */
  public initActiveLeg(): void {
    this.updateActiveLegState();
  }

  /**
   * A method to initialize the dto leg.
   * TODO: REMOVE THIS WHEN THE ROOT PROBLEM IS FIXED
   */
  public initDtoLeg(): void {
    if (this.fms.flightPlanner.activePlanIndex == 1) {
      const e: FlightPlanIndicationEvent = {
        planIndex: 1
      };
      this.onPlanIndexChanged(e);
    }
  }

  /**
   * A callback fired when a proc details event is received from the bus.
   * @param e The event that was captured.
   */
  private onProcDetailsChanged(e: FlightPlanProcedureDetailsEvent): void {
    if (e.planIndex == 0 && e.details.arrivalFacilityIcao !== this.store.facilityInfo.arrivalFacility?.icao) {
      if (e.details.arrivalFacilityIcao !== undefined) {
        this.store.loader.getFacility(FacilityType.Airport, e.details.arrivalFacilityIcao)
          .then(facility => {
            this.store.facilityInfo.arrivalFacility = facility;
            this.updateSectionsHeaderEmptyRow();
          });
      } else {
        this.store.facilityInfo.arrivalFacility = undefined;
        this.updateSectionsHeaderEmptyRow();
      }
    } else if (e.planIndex == 0) {
      this.updateSectionsHeaderEmptyRow();
    }
  }

  /**
   * A callback fired when a vnav updated message is recevied from the bus.
   * @param planIndex The index of the vertical plan that was updated by the path calculator.
   */
  private onVnavUpdated(planIndex: number): void {
    if (this.hasVnav && this.fms.verticalPathCalculator !== undefined && planIndex === Fms.PRIMARY_PLAN_INDEX) {

      const verticalPlan = this.fms.verticalPathCalculator.getVerticalFlightPlan(Fms.PRIMARY_PLAN_INDEX);
      const segments = VNavUtils.getVerticalSegmentsFromPlan(verticalPlan);

      let maxAltitude = UnitType.FOOT.convertTo(Math.max(this.store.selectedAltitude, Math.round(this.store.currentAltitude / 100) * 100), UnitType.METER);
      let minAltitude = this.fms.verticalPathCalculator.getFirstDescentConstraintAltitude(Fms.PRIMARY_PLAN_INDEX);

      if (segments && segments.length > 0) {
        //start with segment 1 to skip departure segment for now
        for (let i = 1; i < segments?.length; i++) {
          const section = this.sectionRefs[i]?.instance;
          if (section !== undefined) {
            for (let j = 0; j < segments[i].legs.length; j++) {
              const segment = segments[i];
              if (segment !== undefined) {
                const vnavLeg = segments[i].legs[j];
                if (vnavLeg) {
                  if (vnavLeg.altitude && vnavLeg.isAdvisory && vnavLeg.altitude > maxAltitude) {
                    const newAltitude = minAltitude ? Math.max(minAltitude, maxAltitude) : maxAltitude;
                    section.setLegAltitude(j, vnavLeg, newAltitude);
                  } else {
                    section.setLegAltitude(j, vnavLeg);
                  }

                  section.setIsUserConstraint(j, this.fms.isConstraintUser(i, j));
                  if (!vnavLeg.isAdvisory) {
                    maxAltitude = vnavLeg.altitude;
                    minAltitude = 0;
                  }
                }
              }
            }
          }
        }
      }
      if (this.fms.getDirectToState() === DirectToState.TOEXISTING) {
        const lateralPlan = this.fms.getFlightPlan();
        const vnavLeg = VNavUtils.getVerticalLegFromPlan(verticalPlan, lateralPlan.activeLateralLeg);
        const section = this.sectionRefs[lateralPlan.directToData.segmentIndex];
        section?.instance.setLegAltitude(lateralPlan.directToData.segmentLegIndex, vnavLeg);
        section?.instance.setIsUserConstraint(lateralPlan.directToData.segmentLegIndex, this.fms.isConstraintUser(lateralPlan.directToData.segmentIndex, vnavLeg.legIndex));
      }
    }
  }

  /**
   * A callback fired when the Vertical Direct softkey is pressed.
   * @param state The event value was captured.
   */
  private onVerticalDirect(state: boolean): void {
    if (state && this.hasVnav && this.fms.verticalPathCalculator !== undefined) {
      const plan = this.fms.getFlightPlan();
      if (plan.length > 0 && this.sectionRefs.length > 0) {
        for (let i = 0; i < this.sectionRefs.length; i++) {
          const section = this.sectionRefs[i]?.instance;
          if (section.onVnavDirect()) {
            return;
          }
        }
      }
    }
  }

  /**
   * A callback fired when a new plan is loaded.
   * @param e The event that was captured.
   */
  private onFlightPlanLoaded(e: FlightPlanIndicationEvent): void {
    const plan = this.fms.flightPlanner.getFlightPlan(e.planIndex);
    if (plan.originAirport !== undefined) {
      this.onOriginDestChanged({ planIndex: e.planIndex, airport: plan.originAirport, type: OriginDestChangeType.OriginAdded });
    }

    for (let i = 0; i < plan.segmentCount; i++) {
      const segment = plan.getSegment(i);
      this.onSegmentChange({ planIndex: e.planIndex, segmentIndex: i, segment: segment, type: PlanChangeType.Added });
      for (let l = 0; l < segment.legs.length; l++) {
        this.onLegChange({
          planIndex: e.planIndex,
          segmentIndex: i, legIndex: l, leg: segment.legs[l], type: PlanChangeType.Added
        });
      }
    }

    if (plan.procedureDetails.arrivalIndex > -1) {
      this.onProcDetailsChanged({ planIndex: e.planIndex, details: plan.procedureDetails });
    }

    if (plan.destinationAirport !== undefined) {
      this.onOriginDestChanged({ planIndex: e.planIndex, airport: plan.destinationAirport, type: OriginDestChangeType.DestinationAdded });
    }

    if (e.planIndex === this.fms.flightPlanner.activePlanIndex) {
      this.store.activeLegState.set(ActiveLegStates.NONE);
      this.updateActiveLegState();
    }
  }

  /**
   * A callback fired when the plan index changes (used for handling direct to display).
   * @param e The event that was captured.
   */
  private onPlanIndexChanged(e: FlightPlanIndicationEvent): void {
    if (e.planIndex === 1 && this.isInitialized) {
      const plan = this.fms.getDirectToFlightPlan();
      const segment = plan.getSegment(0);
      if (segment.segmentType === FlightPlanSegmentType.RandomDirectTo) {
        const lastLeg = plan.tryGetLeg(plan.length - 1);
        this.originRef.instance.onDirectToRandomActive(ICAO.getIdent(segment.legs[2].leg.fixIcao), lastLeg);
      } else {
        this.originRef.instance.removeDirectToRandom(this.fms.getFlightPlan(0));
      }
    } else if (this.isInitialized) {
      const plan = this.fms.getFlightPlan(0);
      this.originRef.instance.removeDirectToRandom(plan);
    }

    this.updateActiveLegState();
  }


  /**
   * A callback fired when the plan is calculated.
   * @param e The event that was captured.
   */
  private onPlanCalculated(e: FlightPlanCalculatedEvent): void {

    if (e.planIndex !== 0) {
      return;
    }
    const plan = this.fms.flightPlanner.getFlightPlan(e.planIndex);

    let sectionIndex = 0;
    for (const segment of plan.segments()) {
      const section = this.sectionRefs[sectionIndex]?.instance;
      if (section !== undefined) {
        for (let i = 0; i < segment.legs.length; i++) {
          const calc = segment.legs[i].calculated;
          calc && section.updateFromLegCalculations(i);
        }
      } else {
        console.warn(`onPlanCalculated: Found no section ref for segment ${segment.segmentIndex} !`);
      }
      sectionIndex++;
    }

    //this.updateActiveLegState();
  }

  /**
   * A callback fired when the origin or destination is updated.
   * @param e The event that was captured.
   */
  private onOriginDestChanged(e: FlightPlanOriginDestEvent): void {
    if (e.planIndex !== 0) {
      return;
    }
    switch (e.type) {
      case OriginDestChangeType.OriginAdded:
        if (e.airport !== undefined) {
          this.store.loader.getFacility(FacilityType.Airport, e.airport)
            .then(facility => {
              this.store.facilityInfo.originFacility = facility;
              this.updateSectionsHeaderEmptyRow();
            });
        }
        break;
      case OriginDestChangeType.DestinationAdded:
        if (e.airport !== undefined) {
          this.store.loader.getFacility(FacilityType.Airport, e.airport)
            .then(facility => {
              this.store.facilityInfo.destinationFacility = facility;
              this.updateSectionsHeaderEmptyRow();
            });
        }
        break;
      case OriginDestChangeType.OriginRemoved:
        this.store.facilityInfo.originFacility = undefined;
        this.updateSectionsHeaderEmptyRow();
        break;
      case OriginDestChangeType.DestinationRemoved:
        this.store.facilityInfo.destinationFacility = undefined;
        this.updateSectionsHeaderEmptyRow();
        break;
    }

    this.originRef.instance.onOriginDestChanged(e);
  }

  /**
   * Manages the state of the active/direct leg indications based on the store.activeLegState subject state.
   */
  private onActiveLegStateChange(): void {
    this.clearActiveWaypoints();
    const state = this.store.activeLegState.get();
    const plan = this.fms.getFlightPlan();
    const activeLegDef = this.store.activeLeg.get();
    const section = this.sectionRefs[activeLegDef.segmentIndex]?.instance;
    this.legArrowRef.instance.updateArrows(state, activeLegDef, plan);

    switch (state) {
      case ActiveLegStates.NORMAL: {
        let segmentLegIndex = activeLegDef.legIndex;
        const leg = plan.tryGetLeg(activeLegDef.segmentIndex, activeLegDef.legIndex);
        if (leg && BitFlags.isAll(leg.flags, LegDefinitionFlags.VectorsToFinal) && BitFlags.isAny(leg.leg.fixTypeFlags, FixTypeFlags.FAF)) {
          // If the VTF leg is active -> set the active leg index to that of the non-VTF faf leg, since that is the one
          // being displayed
          segmentLegIndex -= 2;
          if (plan.directToData.segmentIndex === activeLegDef.segmentIndex && plan.directToData.segmentLegIndex === segmentLegIndex - 3) {
            segmentLegIndex -= 3;
          }
        }
        section?.setActiveLeg(segmentLegIndex);
        break;
      }
      case ActiveLegStates.EXISTING_DIRECT:
        section?.setActiveLeg(activeLegDef.legIndex);
        break;
    }
    if (!this.didInitScroll || this.scrollMode === ScrollMode.AUTO) {
      this.scrollToActiveLegCb();
      this.didInitScroll = true;
    }

    this.manageCollapsedAirways(plan);
    this.notifyActiveLegState(plan);
  }

  /**
   * Updates the active leg state subjects.
   */
  private updateActiveLegState(): void {
    const plan = this.fms.getFlightPlan();

    const directToState = this.fms.getDirectToState();
    if (directToState === DirectToState.TORANDOM) {
      this.store.activeLegState.set(ActiveLegStates.RANDOM_DIRECT);
      return;
    } else if (directToState === DirectToState.TOEXISTING) {
      this.store.activeLegState.set(ActiveLegStates.EXISTING_DIRECT);
      const activeLeg: ActiveLegDefinition =
        { legIndex: plan.directToData.segmentLegIndex, segmentIndex: plan.directToData.segmentIndex };
      this.store.activeLeg.set(activeLeg);
      return;
    } else if (plan.activeLateralLeg < plan.length) {
      this.store.activeLegState.set(ActiveLegStates.NORMAL);
      const leg = plan.getLeg(plan.activeLateralLeg);
      const activeSegment = plan.getSegmentFromLeg(leg);
      if (activeSegment) {
        const activeLegIndexInSegment = plan.activeLateralLeg - activeSegment.offset;
        const activeLeg: ActiveLegDefinition = { legIndex: activeLegIndexInSegment, segmentIndex: activeSegment.segmentIndex };
        this.store.activeLeg.set(activeLeg);
        return;
      }
    }
    this.store.activeLegState.set(ActiveLegStates.NONE);
  }

  /**
   * A callback fired when a flight plan leg changes.
   * @param e The event that was captured.
   */
  private onLegChange(e: FlightPlanLegEvent): void {
    if (e.planIndex !== 0) {
      return;
    }
    const section = this.sectionRefs[e.segmentIndex]?.instance;
    switch (e.type) {
      case PlanChangeType.Added: {
        const plan = this.fms.getFlightPlan();
        const segment = plan.getSegment(e.segmentIndex);
        const leg = segment.legs[e.legIndex];
        const isAirwayLeg = segment.airway !== undefined;
        const isExitLeg = isAirwayLeg && leg?.name === segment.airway?.split('.')[1];
        if (this.hasVnav) {
          section && leg && section.addLeg(e.legIndex, {
            legDefinition: leg, isActive: false, isDirectTo: false,
            targetAltitude: -1, isAdvisory: true, isAirwayFix: isAirwayLeg, isAirwayExitFix: isExitLeg
          });
        } else {
          section && leg && section.addLeg(e.legIndex, {
            legDefinition: leg, isActive: false, isDirectTo: false,
            isAirwayFix: isAirwayLeg, isAirwayExitFix: isExitLeg
          });
        }
        break;
      }
      case PlanChangeType.Removed:
        section && section.removeLeg(e.legIndex);
        break;
    }
  }

  /**
   * A callback fired when a flight plan segment changes.
   * @param e The event that was captured.
   */
  private onSegmentChange(e: FlightPlanSegmentEvent): void {
    if (e.planIndex !== 0) {
      return;
    }
    switch (e.type) {
      case PlanChangeType.Added: {
        if (e.segmentIndex < this.sectionRefs.length) {
          this.store.segments.removeAt(e.segmentIndex);
        }
        e.segment && this.store.segments.insert(e.segment, e.segmentIndex);
        break;
      }
      case PlanChangeType.Inserted: {
        e.segment && this.store.segments.insert(e.segment, e.segmentIndex);
        break;
      }
      case PlanChangeType.Removed:
        this.store.segments.removeAt(e.segmentIndex);
        break;
    }

    this.updateSectionsHeaderEmptyRow();
  }

  /**
   * Updates all section headers and empty rows.
   */
  private updateSectionsHeaderEmptyRow(): void {
    for (let i = 0; i < this.sectionRefs.length; i++) {
      const sectionRef = this.sectionRefs[i];
      if (sectionRef) {
        sectionRef.instance.updateHeader();
        sectionRef.instance.updateEmptyRowVisibility();
      }
    }
  }

  /**
   * A method called to collapse the airways.
   */
  public collapseAirways(): void {
    this.airwaysCollapsed = !this.airwaysCollapsed;
    const plan = this.fms.getFlightPlan();
    const activeSegmentIndex = plan.getSegmentIndex(plan.activeLateralLeg);
    for (let i = 1; i < plan.segmentCount; i++) {
      if (i === activeSegmentIndex) {
        continue;
      }
      const segment = plan.getSegment(i);
      if (segment.segmentType === FlightPlanSegmentType.Enroute && segment.airway !== undefined) {
        const section = this.sectionRefs[i]?.instance;
        if (section !== undefined) {
          section.collapseLegs(this.airwaysCollapsed);
          continue;
        }
      }
    }
  }

  /**
   * A method called to manage collapsed airways when the active segment changes.
   * @param plan is the flight plan
   */
  private manageCollapsedAirways(plan: FlightPlan): void {
    const activeSegmentIndex = plan.getSegmentIndex(plan.activeLateralLeg);
    const fromSegmentIndex = plan.getSegmentIndex(plan.activeLateralLeg - 1);
    for (let i = 1; i < plan.segmentCount; i++) {
      const segment = plan.getSegment(i);
      if ((i === activeSegmentIndex || i === fromSegmentIndex) && segment.segmentType === FlightPlanSegmentType.Enroute) {
        const section = this.sectionRefs[i]?.instance;
        if (section !== undefined) {
          section.collapseLegs(false);
        }
      } else if (segment.segmentType === FlightPlanSegmentType.Enroute && segment.airway !== undefined) {
        const section = this.sectionRefs[i]?.instance;
        if (section !== undefined) {
          section.collapseLegs(this.airwaysCollapsed);
        }
      }
    }
  }

  /**
   * Notifies this controller's sections of the flight plan's active leg state.
   * @param plan The flight plan.
   */
  private notifyActiveLegState(plan: FlightPlan): void {
    if (plan.length > 0 && plan.segmentCount > 2) {
      const activeSegmentIndex = Utils.Clamp(plan.getSegmentIndex(plan.activeLateralLeg), 0, plan.segmentCount);
      let activeLegIndex = plan.activeLateralLeg - plan.getSegment(activeSegmentIndex).offset;
      if (this.fms.getDirectToState() === DirectToState.TOEXISTING) {
        activeLegIndex -= 3;
      }
      for (let i = 0; i < plan.segmentCount; i++) {
        const section = this.sectionRefs[i]?.instance;
        if (section !== undefined) {
          section.onActiveLegChanged(activeSegmentIndex, activeLegIndex);
        }
      }
    }
  }

  /**
   * Sets all legs in the displayed plan to inactive.
   */
  private clearActiveWaypoints(): void {
    this.sectionRefs.forEach((section) => {
      section.instance.cancelAllActiveLegs();
    });
  }
}