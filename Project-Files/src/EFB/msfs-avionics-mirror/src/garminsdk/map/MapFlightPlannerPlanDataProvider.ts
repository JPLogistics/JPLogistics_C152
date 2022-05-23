import { NumberUnitInterface, NumberUnitSubject, SubEvent, Subject, Subscribable, UnitFamily, UnitType } from 'msfssdk';
import { VNavPathMode, VNavEvents, VNavState } from 'msfssdk/autopilot';
import { ConsumerSubject, EventBus } from 'msfssdk/data';
import { ActiveLegType, FlightPlan, FlightPlanner, FlightPlannerEvents } from 'msfssdk/flightplan';
import { NavEvents } from 'msfssdk/instruments';
import { LNavData, LNavEvents } from '../autopilot/directors/LNavDirector';
import { LNavSimVars } from '../autopilot/LNavSimVars';
import { MapFlightPlanLayerDataProvider, MapFlightPlanLayerLNavData } from './layers/MapFlightPlanLayer';

/**
 * A map flight plan layer data provider which provides a displayed flight plan from a flight planner.
 */
export class MapFlightPlannerPlanDataProvider implements MapFlightPlanLayerDataProvider {
  private readonly planSub = Subject.create<FlightPlan | null>(null);
  public readonly plan: Subscribable<FlightPlan | null> = this.planSub;

  public readonly planModified = new SubEvent<void>();

  public readonly planCalculated = new SubEvent<void>();

  private readonly activeLegIndexSub = Subject.create(0);
  public readonly activeLateralLegIndex: Subscribable<number> = this.activeLegIndexSub;

  private readonly lnavDataSub = Subject.create<MapFlightPlanLayerLNavData | undefined>(
    undefined,
    (a, b) => {
      if (a === b) {
        return true;
      }

      if (a && b) {
        return a.currentLegIndex === b.currentLegIndex
          && a.vectorIndex === b.vectorIndex
          && a.transitionMode === b.transitionMode
          && a.isSuspended === b.isSuspended;
      }

      return false;
    }
  );
  public readonly lnavData: Subscribable<MapFlightPlanLayerLNavData | undefined> = this.lnavDataSub;

  public readonly vnavState: Subscribable<VNavState>;
  public readonly vnavPathMode: Subscribable<VNavPathMode>;

  private readonly vnavTodLegIndexSub = Subject.create(-1);
  public readonly vnavTodLegIndex: Subscribable<number> = this.vnavTodLegIndexSub;

  private readonly vnavBodLegIndexSub = Subject.create(-1);
  public readonly vnavBodLegIndex: Subscribable<number> = this.vnavBodLegIndexSub;

  private readonly vnavTodLegDistanceSub = NumberUnitSubject.createFromNumberUnit(UnitType.METER.createNumber(0));
  public readonly vnavTodLegDistance: Subscribable<NumberUnitInterface<UnitFamily.Distance>> = this.vnavTodLegDistanceSub;

  private readonly vnavDistanceToTodSub = NumberUnitSubject.createFromNumberUnit(UnitType.METER.createNumber(0));
  public readonly vnavDistanceToTod: Subscribable<NumberUnitInterface<UnitFamily.Distance>> = this.vnavDistanceToTodSub;

  private readonly obsCourseSub = Subject.create<number | undefined>(undefined);
  public readonly obsCourse: Subscribable<number | undefined> = this.obsCourseSub;

  private planIndex = -1;

  private lnavDataValue: LNavData | undefined = undefined;

  private vnavTodLegIndexValue = -1;
  private vnavBodLegIndexValue = -1;
  private vnavTodLegDistanceMeters = 0;

  private isObsActive = false;
  private obsCourseValue = 0;

  /**
   * Constructor.
   * @param bus The event bus.
   * @param planner The flight planner.
   */
  constructor(protected readonly bus: EventBus, protected readonly planner: FlightPlanner) {
    const plannerEvents = bus.getSubscriber<FlightPlannerEvents>();
    plannerEvents.on('fplCreated').handle(data => { data.planIndex === this.planIndex && this.updatePlan(); });
    plannerEvents.on('fplDeleted').handle(data => { data.planIndex === this.planIndex && this.updatePlan(); });
    plannerEvents.on('fplLoaded').handle(data => { data.planIndex === this.planIndex && this.updatePlan(); });
    plannerEvents.on('fplIndexChanged').handle(() => { this.updateActivePlanRelatedSubs(); });

    plannerEvents.on('fplLegChange').handle(data => { data.planIndex === this.planIndex && this.planModified.notify(this); });
    plannerEvents.on('fplSegmentChange').handle(data => { data.planIndex === this.planIndex && this.planModified.notify(this); });
    plannerEvents.on('fplOriginDestChanged').handle(data => { data.planIndex === this.planIndex && this.planModified.notify(this); });
    plannerEvents.on('fplActiveLegChange').handle(data => { data.planIndex === this.planIndex && data.type === ActiveLegType.Lateral && this.updateActiveLegIndex(); });
    plannerEvents.on('fplCalculated').handle(data => { data.planIndex === this.planIndex && this.planCalculated.notify(this); });

    const lnavEvents = bus.getSubscriber<LNavSimVars & LNavEvents>();
    lnavEvents.on('dataChanged').whenChanged().handle(data => {
      this.lnavDataValue = data;
      this.updateLNavData();
    });

    const vnavEvents = bus.getSubscriber<VNavEvents>();
    this.vnavState = ConsumerSubject.create(vnavEvents.on('vnav_state').whenChanged(), VNavState.Disabled);
    this.vnavPathMode = ConsumerSubject.create(vnavEvents.on('vnav_path_mode').whenChanged(), VNavPathMode.None);
    vnavEvents.on('vnav_tod_global_leg_index').whenChanged().handle(legIndex => {
      this.vnavTodLegIndexValue = legIndex;
      this.updateVNavTodLegIndex();
    });
    vnavEvents.on('vnav_bod_global_leg_index').whenChanged().handle(legIndex => {
      this.vnavBodLegIndexValue = legIndex;
      this.updateVNavBodLegIndex();
    });
    vnavEvents.on('vnav_tod_leg_distance').withPrecision(0).handle(distance => {
      this.vnavTodLegDistanceMeters = distance;
      this.updateVNavTodLegDistance();
    });
    vnavEvents.on('vnav_tod_distance').withPrecision(0).handle(distance => {
      this.vnavDistanceToTodSub.set(distance, UnitType.METER);
    });

    const navEvents = this.bus.getSubscriber<NavEvents>();
    navEvents.on('gps_obs_active').whenChanged().handle(isActive => {
      this.isObsActive = isActive;
      this.updateObsCourse();
    });
    navEvents.on('gps_obs_value').whenChanged().handle(course => {
      this.obsCourseValue = course;
      this.updateObsCourse();
    });
  }

  /**
   * Sets the index of the displayed plan.
   * @param index The index of the displayed plan.
   */
  public setPlanIndex(index: number): void {
    if (index === this.planIndex) {
      return;
    }

    this.planIndex = index;
    this.updatePlan();
    this.updateActivePlanRelatedSubs();
  }

  /**
   * Updates the displayed plan.
   */
  private updatePlan(): void {
    if (this.planner.hasFlightPlan(this.planIndex)) {
      this.planSub.set(this.planner.getFlightPlan(this.planIndex));
    } else {
      this.planSub.set(null);
    }
  }

  /**
   * Updates subjects related to the active plan.
   */
  private updateActivePlanRelatedSubs(): void {
    this.updateActiveLegIndex();
    this.updateLNavData();
    this.updateVNavTodLegIndex();
    this.updateVNavBodLegIndex();
    this.updateVNavTodLegDistance();
    this.updateObsCourse();
  }

  /**
   * Updates the active leg index.
   */
  private updateActiveLegIndex(): void {
    const plan = this.plan.get();
    this.activeLegIndexSub.set(plan && this.planIndex === this.planner.activePlanIndex ? plan.activeLateralLeg : -1);
  }

  /**
   * Updates the active LNAV leg vector index.
   */
  private updateLNavData(): void {
    this.lnavDataSub.set(this.planIndex === this.planner.activePlanIndex ? this.lnavDataValue : undefined);
  }

  /**
   * Updates the index of the VNAV top-of-descent leg.
   */
  private updateVNavTodLegIndex(): void {
    this.vnavTodLegIndexSub.set(this.planIndex === this.planner.activePlanIndex ? this.vnavTodLegIndexValue : -1);
  }

  /**
   * Updates the index of the VNAV bottom-of-descent leg.
   */
  private updateVNavBodLegIndex(): void {
    this.vnavBodLegIndexSub.set(this.planIndex === this.planner.activePlanIndex ? this.vnavBodLegIndexValue : -1);
  }

  /**
   * Updates the distance from the VNAV top-of-descent point to the end of the top-of-descent leg.
   */
  private updateVNavTodLegDistance(): void {
    this.vnavTodLegDistanceSub.set(this.planIndex === this.planner.activePlanIndex ? this.vnavTodLegDistanceMeters : 0, UnitType.METER);
  }

  /**
   * Updates the OBS course.
   */
  private updateObsCourse(): void {
    this.obsCourseSub.set(this.planIndex === this.planner.activePlanIndex && this.isObsActive ? this.obsCourseValue : undefined);
  }
}