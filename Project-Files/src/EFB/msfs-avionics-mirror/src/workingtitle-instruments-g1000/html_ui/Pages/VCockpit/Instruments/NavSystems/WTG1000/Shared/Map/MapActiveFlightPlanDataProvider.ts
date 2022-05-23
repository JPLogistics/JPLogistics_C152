import { EventBus } from 'msfssdk/data';
import { FlightPlanner, FlightPlannerEvents } from 'msfssdk/flightplan';
import { MapFlightPlanLayerDataProvider } from './Layers/MapFlightPlanLayer';
import { MapFlightPlannerPlanDataProvider } from './MapFlightPlannerPlanDataProvider';

/**
 * A map flight plan layer data provider which provides the active flight plan to be displayed.
 */
export class MapActiveFlightPlanDataProvider implements MapFlightPlanLayerDataProvider {
  private readonly provider = new MapFlightPlannerPlanDataProvider(this.bus, this.planner);

  public readonly plan = this.provider.plan;
  public readonly planModified = this.provider.planModified;
  public readonly planCalculated = this.provider.planCalculated;
  public readonly activeLateralLegIndex = this.provider.activeLateralLegIndex;
  public readonly lnavData = this.provider.lnavData;
  public readonly vnavState = this.provider.vnavState;
  public readonly vnavPathMode = this.provider.vnavPathMode;
  public readonly vnavTodLegIndex = this.provider.vnavTodLegIndex;
  public readonly vnavBodLegIndex = this.provider.vnavBodLegIndex;
  public readonly vnavTodLegDistance = this.provider.vnavTodLegDistance;
  public readonly vnavDistanceToTod = this.provider.vnavDistanceToTod;
  public readonly obsCourse = this.provider.obsCourse;

  /**
   * Constructor.
   * @param bus The event bus.
   * @param planner The flight planner.
   */
  constructor(protected readonly bus: EventBus, protected readonly planner: FlightPlanner) {
    const plannerEvents = bus.getSubscriber<FlightPlannerEvents>();
    plannerEvents.on('fplIndexChanged').handle(data => { this.provider.setPlanIndex(data.planIndex); });

    this.provider.setPlanIndex(planner.activePlanIndex);
  }
}