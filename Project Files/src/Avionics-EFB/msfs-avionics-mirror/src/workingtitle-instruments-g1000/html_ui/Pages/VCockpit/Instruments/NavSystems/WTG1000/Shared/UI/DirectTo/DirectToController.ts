import { NavAngleUnit, Subject } from 'msfssdk';
import { FlightPlan } from 'msfssdk/flightplan';
import { Facility } from 'msfssdk/navigation';
import { DirectToState, Fms } from '../../FlightPlan/Fms';
import { FacilityWaypoint, Waypoint } from '../../Navigation/Waypoint';
import { UiView } from '../UiView';
import { ViewService } from '../ViewService';
import { DirectToInputData } from './DirectTo';
import { DirectToStore } from './DirectToStore';

/**
 * Data on a direct to existing target leg.
 */
type DirectToExistingData = {
  /** The index of the segment in which the target leg resides. */
  segmentIndex: number;

  /** The index of the target leg in its segment. */
  segmentLegIndex: number;

  /** The ICAO of the target leg fix. */
  icao: string;
}

/** The controller for the DTO view */
export class DirectToController {
  private static readonly BEARING_MAGNETIC = NavAngleUnit.create(true);

  public readonly inputIcao = Subject.create('');
  public readonly canActivate = Subject.create(false);

  public readonly matchedWaypointsChangedHandler = this.onMatchedWaypointsChanged.bind(this);
  public readonly waypointChangedHandler = this.onWaypointChanged.bind(this);
  public readonly inputEnterPressedHandler = this.onInputEnterPressed.bind(this);

  private directToExistingData: DirectToExistingData | null = null;

  private goToActivateOnWaypoint = false;

  /**
   * Creates an instance of direct to controller.
   * @param store This controller's associated direct to menu store.
   * @param fms The flight management system.
   * @param viewService The view service used by this controller.
   * @param goToActivateFunc A function which focuses the Activate button of this controller's associated view.
   */
  constructor(
    private readonly store: DirectToStore,
    private readonly fms: Fms,
    private readonly viewService: ViewService,
    private readonly goToActivateFunc: () => void
  ) {
  }

  /**
   * Initializes the direct to target based on input data. If the input data is defined, the target will be set to that
   * defined by the input data. If the input data is undefined, an attempt will be made to set the target to the
   * following, in order:
   * * The current active direct to target.
   * * The current active flight plan leg.
   * * The next leg in the primary flight plan, following the active leg, that is a valid direct to target.
   * * The previous leg in the primary flight plan, before the active leg, that is a valid direct to target.
   * @param dtoData The input data.
   */
  public initializeTarget(dtoData: DirectToInputData | undefined): void {
    const primaryPlan = this.fms.hasPrimaryFlightPlan() && this.fms.getPrimaryFlightPlan();
    this.directToExistingData = null;
    let targetIcao = '';

    if (primaryPlan && dtoData?.legIndex !== undefined && dtoData?.segmentIndex !== undefined) {
      // Input defines a DTO existing target

      try {
        if (this.fms.canDirectTo(dtoData.segmentIndex, dtoData.legIndex)) {
          this.directToExistingData = DirectToController.createDtoExistingData(primaryPlan, dtoData.segmentIndex, dtoData.legIndex);
        } else {
          this.directToExistingData = this.searchForValidDtoExistingLeg(dtoData.segmentIndex, dtoData.legIndex);
        }
      } catch {
        // noop
      }
    } else if (dtoData !== undefined) {
      // Input defines a DTO random target

      targetIcao = dtoData.icao;
    } else {
      // No input -> initialize to current DTO target, or search for a valid DTO existing target starting with the
      // active leg

      const dtoState = this.fms.getDirectToState();
      if (dtoState === DirectToState.TOEXISTING && primaryPlan) {
        this.directToExistingData = {
          icao: primaryPlan.getLeg(primaryPlan.activeLateralLeg).leg.fixIcao,
          segmentIndex: primaryPlan.directToData.segmentIndex,
          segmentLegIndex: primaryPlan.directToData.segmentLegIndex
        };
      } else if (dtoState === DirectToState.TORANDOM) {
        const dtoPlan = this.fms.getDirectToFlightPlan();
        targetIcao = dtoPlan.getLeg(dtoPlan.activeLateralLeg).leg.fixIcao;
      } else if (primaryPlan && primaryPlan.length > 0) {
        this.directToExistingData = this.searchForValidDtoExistingLeg(Math.min(primaryPlan.activeLateralLeg, primaryPlan.length - 1));
      }
    }

    if (this.directToExistingData) {
      targetIcao = this.directToExistingData.icao;
    }

    if (this.inputIcao.get() === targetIcao) {
      this.syncCourseInput();
    } else {
      this.inputIcao.set(targetIcao);
    }
  }

  /**
   * Searches for a valid Direct To Existing target in the primary flight plan, starting from a specified flight plan
   * leg. The search begins with the specified leg, then proceeds forwards in the plan. If no valid leg is found, the
   * search then returns to the leg immediately prior to the specified leg and proceeds backwards in the plan.
   * @param segmentIndex The index of the segment that contains the starting leg.
   * @param segmentLegIndex The index of the starting leg in its segment.
   */
  private searchForValidDtoExistingLeg(segmentIndex: number, segmentLegIndex: number): DirectToExistingData | null;
  /**
   * Searches for a valid Direct To Existing target in the primary flight plan, starting from a specified flight plan
   * leg. The search begins with the specified leg, then proceeds forwards in the plan. If no valid leg is found, the
   * search then returns to the leg immediately prior to the specified leg and proceeds backwards in the plan.
   * @param legIndex The global index of the starting leg.
   */
  private searchForValidDtoExistingLeg(legIndex: number): DirectToExistingData | null;
  // eslint-disable-next-line jsdoc/require-jsdoc
  private searchForValidDtoExistingLeg(arg1: number, arg2?: number): DirectToExistingData | null {
    const plan = this.fms.getPrimaryFlightPlan();
    const legIndex = arg2 === undefined
      ? arg1
      : plan.getSegment(arg1).offset + arg2;

    let dtoExisting = null;

    // search forwards in plan
    const len = plan.length;
    for (let i = legIndex; i < len; i++) {
      const currSegmentIndex = plan.getSegmentIndex(i);
      const currSegmentLegIndex = i - plan.getSegment(currSegmentIndex).offset;
      if (this.fms.canDirectTo(currSegmentIndex, currSegmentLegIndex)) {
        dtoExisting = DirectToController.createDtoExistingData(plan, currSegmentIndex, currSegmentLegIndex);
        break;
      }
    }

    if (!dtoExisting) {
      // search backwards in plan
      for (let i = legIndex - 1; i >= 0; i--) {
        const currSegmentIndex = plan.getSegmentIndex(i);
        const currSegmentLegIndex = i - plan.getSegment(currSegmentIndex).offset;
        if (this.fms.canDirectTo(currSegmentIndex, currSegmentLegIndex)) {
          dtoExisting = DirectToController.createDtoExistingData(plan, currSegmentIndex, currSegmentLegIndex);
          break;
        }
      }
    }

    return dtoExisting;
  }

  /**
   * Responds to changes in the waypoint input's matched waypoints list.
   * @param waypoints The matched waypoints.
   */
  private onMatchedWaypointsChanged(waypoints: readonly FacilityWaypoint<Facility>[]): void {
    this.store.setMatchedWaypoints(waypoints);
  }

  /**
   * Responds to changes in the waypoint input's selected waypoint.
   * @param waypoint The selected waypoint.
   */
  private async onWaypointChanged(waypoint: Waypoint | null): Promise<void> {
    const facility = waypoint instanceof FacilityWaypoint ? waypoint.facility : null;

    if (facility?.icao !== this.directToExistingData?.icao) {
      this.directToExistingData = null;
      const plan = this.fms.hasPrimaryFlightPlan() && this.fms.getPrimaryFlightPlan();

      if (plan && facility) {
        for (let i = 0; i < plan.length; i++) {
          const segmentIndex = plan.getSegmentIndex(i);
          const segment = plan.getSegment(segmentIndex);
          const segmentLegIndex = i - segment.offset;
          const leg = segment.legs[segmentLegIndex];
          if (leg.leg.fixIcao === facility.icao && this.fms.canDirectTo(segmentIndex, segmentLegIndex)) {
            const directToExistingData = {
              segmentIndex,
              segmentLegIndex,
              icao: facility.icao
            };
            this.directToExistingData = directToExistingData;
          }
        }
      }
    }

    this.store.waypoint.set(waypoint);
    this.syncCourseInput();

    const canActivate = !!facility;
    this.canActivate.set(canActivate);

    if (canActivate && this.goToActivateOnWaypoint) {
      this.goToActivateFunc();
    }

    this.goToActivateOnWaypoint = false;
  }

  /**
   * Syncs the course input value with the bearing to the selected waypoint.
   */
  private syncCourseInput(): void {
    const bearing = this.store.waypointInfoStore.bearing.get().asUnit(DirectToController.BEARING_MAGNETIC);
    if (!isNaN(bearing)) {
      const crs = Math.round(bearing) % 360;
      this.store.courseTens.set(Math.floor(crs / 10));
      this.store.courseOnes.set(crs % 10);
    } else {
      this.store.courseTens.set(0);
      this.store.courseOnes.set(0);
    }
    this.store.course.set(undefined);
  }

  /**
   * Responds to Enter button press events from the waypoint input.
   */
  private onInputEnterPressed(): void {
    const matchedWaypoints = this.store.matchedWaypoints;

    if (matchedWaypoints.length > 1) {
      const dialog = this.viewService.open('WptDup', true).setInput(matchedWaypoints);
      dialog.onAccept.on((sender: UiView<any, Facility, readonly FacilityWaypoint<Facility>[]>, facility: Facility | null) => {
        this.onWptDupDialogAccept(facility);
      });
    } else {
      this.goToActivateFunc();
    }
  }

  /**
   * Responds to accept events from the waypoint duplicate dialog.
   * @param facility The facility returned by the waypoint duplicate dialog.
   */
  private onWptDupDialogAccept(facility: Facility | null): void {
    if (!facility) {
      return;
    }

    if (this.inputIcao.get() === facility.icao) {
      // If the selected waypoint is equal to the disambiguated waypoint, force notify the waypoint input control
      // (otherwise it will not think disambiguation has occurred) then manually select the activate button since
      // the onWaypointChanged callback won't be called.
      this.inputIcao.notify();
      this.goToActivateFunc();
    } else {
      this.goToActivateOnWaypoint = true;
      this.inputIcao.set(facility.icao);
    }
  }

  /**
   * Activates a Direct To to the selected waypoint.
   * @param holdAt Whether to hold at the selected waypoint.
   */
  public activateSelected(holdAt = false): void {
    const selectedWaypoint = this.store.waypoint.get();
    const facility = selectedWaypoint instanceof FacilityWaypoint ? selectedWaypoint.facility : null;
    const course = this.store.course.get();
    if (facility) {
      if (this.directToExistingData) {
        this.fms.createDirectToExisting(this.directToExistingData.segmentIndex, this.directToExistingData.segmentLegIndex, course);
        holdAt && this.holdAt(this.directToExistingData.segmentIndex, this.directToExistingData.segmentLegIndex);
      } else {
        this.fms.createDirectToRandom(facility, course);
        holdAt && this.holdAt();
      }
    }
  }

  /**
   * Opens the Hold dialog targeted at the created direct to.
   * @param segmentIndex The segment index of the direct to existing.
   * @param legIndex The leg index of the direct to existing.
   */
  private holdAt(segmentIndex?: number, legIndex?: number): void {
    if (segmentIndex !== undefined && legIndex !== undefined) {
      this.viewService.open('HoldAt', false).setInput({ segmentIndex, legIndex: legIndex + 3, planIndex: Fms.PRIMARY_PLAN_INDEX });
    } else {
      this.viewService.open('HoldAt', false).setInput({ segmentIndex: 0, legIndex: 2, planIndex: Fms.DTO_RANDOM_PLAN_INDEX });
    }
  }

  /**
   * Creates a direct to existing data object for a flight plan leg.
   * @param plan A flight plan.
   * @param segmentIndex The index of the segment in which the leg resides.
   * @param segmentLegIndex The index of the leg in its segment.
   * @returns A direct to existing data object.
   */
  protected static createDtoExistingData(plan: FlightPlan, segmentIndex: number, segmentLegIndex: number): DirectToExistingData {
    return {
      icao: plan.getSegment(segmentIndex).legs[segmentLegIndex].leg.fixIcao,
      segmentIndex,
      segmentLegIndex
    };
  }
}