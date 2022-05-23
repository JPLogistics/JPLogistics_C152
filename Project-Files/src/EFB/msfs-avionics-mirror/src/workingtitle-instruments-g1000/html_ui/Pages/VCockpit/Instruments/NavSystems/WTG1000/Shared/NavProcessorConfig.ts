import { EventBus } from 'msfssdk/data';
import { NavProcessorConfig, NavSourceId, NavSourceType } from 'msfssdk/instruments';
import { NavSource } from 'msfssdk/instruments';
import { FlightPlanner, FlightPlannerEvents, FlightPlanActiveLegEvent } from 'msfssdk/flightplan';
import { LNavDataEvents } from 'garminsdk/navigation';

/**
 * A configuration for the G1000 NavProcessor, including a custrom simvar
 * publisher configured with your LNav simvars for GPS data publishing.
 */
export class NPConfig extends NavProcessorConfig {
  /**
   * Create an NPConfig.
   * @param bus The event bus
   * @param planner A flight planner for LNav data
   */
  constructor(bus: EventBus, planner: FlightPlanner) {
    super();
    this.numGps = 0;
    this.numAdf = 1;
    this.courseIncEvents.add('AS1000_PFD_CRS_INC');
    this.courseIncEvents.add('AS1000_MFD_CRS_INC');
    this.courseDecEvents.add('AS1000_PFD_CRS_DEC');
    this.courseDecEvents.add('AS1000_MFD_CRS_DEC');
    this.courseSyncEvents.add('AS1000_PFD_CRS_PUSH');
    this.courseSyncEvents.add('AS1000_MFD_CRS_PUSH');
    this.additionalSources.push(new LNavNavSource(bus, planner));
  }
}

/** A custom nav data source that provides info from our flight plan manager. */
export class LNavNavSource implements NavSource {
  public readonly srcId: NavSourceId = { type: NavSourceType.Gps, index: 1 };
  public readonly hasCdi = true;
  public readonly hasDme = true;
  public readonly hasGlideslope = false;
  public readonly hasLocalizer = false;
  public readonly signal = null;
  public readonly activeCdi = false;
  public readonly isLocalizerFrequency = false;


  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public validHander = (valid: boolean, source: NavSourceId): void => { };
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public identHandler = (ident: string | null, source: NavSourceId): void => { };
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public brgHandler = (brg: number | null, source: NavSourceId): void => { };
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public distHandler = (dist: number | null, source: NavSourceId): void => { };

  private planner: FlightPlanner;
  private _activeForCount = 0;
  private _dist: number | null = null;
  private _brg: number | null = null;
  private _ident: string | null = null;
  private _valid = false;

  /**
   * Create an LNavNavSource.
   * @param bus An event bus.
   * @param planner The flight planner.
   */
  constructor(bus: EventBus, planner: FlightPlanner) {
    this.planner = planner;
    const fpl = bus.getSubscriber<FlightPlannerEvents>();
    const lnav = bus.getSubscriber<LNavDataEvents>();

    fpl.on('fplActiveLegChange').handle((change) => {
      this.onLegChange(change);
    });

    lnav.on('lnavdata_waypoint_distance').withPrecision(1).handle((dist: number) => {
      this.distance = dist;
    });

    lnav.on('lnavdata_waypoint_bearing_mag').whenChangedBy(1).handle((brg: number) => {
      this.bearing = brg;
    });
  }

  /**
   * Get the validity of the source.
   * @returns Whether the source is valid.
   */
  public get valid(): boolean {
    return this._valid;
  }

  /**
   * Set the validity of the source.
   * @param valid Whether the source is valid.
   */
  public set valid(valid: boolean) {
    this._valid = valid;
    this.validHander(this.valid, this.srcId);
  }

  /**
   * Get the distance to the active waypoint.
   * @returns The distance in nm or null.
   */
  public get distance(): number | null {
    return this._dist;
  }

  /**
   * Set the tistance to the active waypoint.
   * @param dist The distance in nm or null.
   */
  public set distance(dist: number | null) {
    this._dist = dist;
    this.activeBrg && this.distHandler(this.distance, this.srcId);
  }

  /**
   * Get the bearing to the current waypoint.
   * @returns The bearing in degrees or null.
   */
  public get bearing(): number | null {
    return this._brg;
  }

  /**
   * Set the bearing to the current waypoint.
   * @param brg The bearing in degrees.
   */
  public set bearing(brg: number | null) {
    this._brg = brg;
    this.activeBrg && this.brgHandler(this.bearing, this.srcId);
  }

  /**
   * Get the ident of the current waypoint.
   * @returns The ident as a string or null.
   */
  public get ident(): string | null {
    return this._ident;
  }

  /**
   * Set the ident of the current waypoint.
   * @param ident The ident as a string or null.
   */
  public set ident(ident: string | null) {
    this._ident = ident;
    if (ident === null) {
      this.valid = false;
    } else {
      this.valid = true;
    }
    this.activeBrg && this.identHandler(this.ident, this.srcId);
  }


  /**
   * Get active bearing status.
   * @returns Whether we are active for bearing data.
   */
  public get activeBrg(): boolean {
    return this._activeForCount > 0;
  }

  /**
   * Set active bearing status.
   */
  public set activeBrg(active: boolean) {
    if (active) {
      this._activeForCount++;
    } else if (this._activeForCount > 0) {
      this._activeForCount--;
    }

    if (!this.activeBrg) {
      this.brgHandler(null, this.srcId);
      this.distHandler(null, this.srcId);
      this.identHandler(null, this.srcId);
    } else {
      this.brgHandler(this.bearing, this.srcId);
      this.distHandler(this.distance, this.srcId);
      // See if we need to update our ident info before displaying.
      const plan = this.planner.hasActiveFlightPlan() ? this.planner.getActiveFlightPlan() : undefined;
      if (plan && plan.length > 0 && plan.activeLateralLeg < plan.length) {
        const ident = plan.getLeg(plan.activeLateralLeg).name;
        if (ident) {
          this.ident = ident;
        }
      }
      this.identHandler(this.ident, this.srcId);
    }
  }

  /**
   * Handle a change in the active leg.
   * @param change The change event.
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private onLegChange(change?: FlightPlanActiveLegEvent): void {
    const plan = this.planner.getActiveFlightPlan();
    if (plan.length > 0 && plan.activeLateralLeg < plan.length) {
      const leg = plan.getLeg(plan.activeLateralLeg);
      this.ident = leg.name ? leg.name : null;
    }
  }
}