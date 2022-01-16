import { LegDefinition } from 'msfssdk/flightplan';
import { FacilityLoader, ICAO } from 'msfssdk/navigation';
import { FacilityWaypointCache } from '../Navigation/FacilityWaypointCache';
import { CustomWaypoint, FacilityWaypoint, FlightPathWaypoint, Waypoint } from '../Navigation/Waypoint';
import { MapWaypointRenderer, MapWaypointRenderRole } from './MapWaypointRenderer';

/**
 * A record of waypoints associated with a flight plan leg. Each record is responsible for keeping its waypoints up to
 * date with any relevant changes to its associated leg and registering its waypoints with a waypoint renderer.
 */
export interface FlightPlanLegWaypointsRecord {
  /** The flight plan leg associated with this record. */
  readonly leg: LegDefinition;

  /**
   * Refreshes this record's waypoints, keeping them up to date with this record's associated flight plan leg.
   * @param isActive Whether this record's leg is the active leg.
   */
  refresh(isActive: boolean): Promise<void>;

  /**
   * Destroys this record. Deregisters all this record's waypoints with this record's waypoint renderer.
   */
  destroy(): void;
}

/**
 * An abstract implementation of FlightPlanLegWaypointsRecord.
 */
export abstract class AbstractFlightPlanLegWaypointsRecord implements FlightPlanLegWaypointsRecord {
  private static uidSource = 0;

  protected uid = `flightplan-wptrecord-${AbstractFlightPlanLegWaypointsRecord.uidSource++}`;
  protected isActive = false;

  /**
   * Constructor.
   * @param leg The flight plan leg associated with this record.
   * @param waypointRenderer The renderer used to render this record's waypoints.
   * @param facLoader The facility loader used by this waypoint.
   * @param inactiveRenderRole The role(s) under which the waypoint should be registered when it is part of an inactive
   * leg.
   * @param activeRenderRole The role(s) under which the waypoint should be registered when it is part of an active
   * leg.
   */
  constructor(
    public readonly leg: LegDefinition,
    protected readonly waypointRenderer: MapWaypointRenderer,
    protected readonly facLoader: FacilityLoader,
    protected readonly inactiveRenderRole: MapWaypointRenderRole,
    protected readonly activeRenderRole: MapWaypointRenderRole
  ) {
  }

  // eslint-disable-next-line jsdoc/require-jsdoc
  public abstract refresh(isActive: boolean): Promise<void>;

  // eslint-disable-next-line jsdoc/require-jsdoc
  public abstract destroy(): void;

  /**
   * Registers a waypoint with this record's waypoint renderer.
   * @param waypoint A waypoint.
   * @param role The role(s) under which the waypoint should be registered.
   */
  protected registerWaypoint(waypoint: Waypoint, role: MapWaypointRenderRole): void {
    this.waypointRenderer.register(waypoint, role, this.uid);
  }

  /**
   * Removes a registration for a waypoint from this record's waypoint renderer.
   * @param waypoint A waypoint.
   * @param role The role(s) from which the waypoint should be deregistered.
   */
  protected deregisterWaypoint(waypoint: Waypoint, role: MapWaypointRenderRole): void {
    this.waypointRenderer.deregister(waypoint, role, this.uid);
  }
}

/**
 * A record with a single waypoint based on its flight plan leg's fixIcao property.
 */
export class FixIcaoWaypointsRecord extends AbstractFlightPlanLegWaypointsRecord {
  protected _waypoint: Waypoint | null = null;

  /**
   * Constructor.
   * @param leg The flight plan leg associated with this record.
   * @param waypointRenderer The renderer used to render this record's waypoints.
   * @param facLoader The facility loader used by this waypoint.
   * @param facWaypointCache The facility waypoint cache used by this record.
   * @param inactiveRenderRole The role(s) under which the waypoint should be registered when it is part of an inactive
   * leg.
   * @param activeRenderRole The role(s) under which the waypoint should be registered when it is part of an active
   * leg.
   */
  constructor(
    leg: LegDefinition,
    waypointRenderer: MapWaypointRenderer,
    facLoader: FacilityLoader,
    protected readonly facWaypointCache: FacilityWaypointCache,
    inactiveRenderRole: MapWaypointRenderRole,
    activeRenderRole: MapWaypointRenderRole
  ) {
    super(leg, waypointRenderer, facLoader, inactiveRenderRole, activeRenderRole);
  }

  // eslint-disable-next-line jsdoc/require-returns
  /**
   * This record's waypoint.
   */
  public get waypoint(): Waypoint | null {
    return this._waypoint;
  }

  // eslint-disable-next-line jsdoc/require-jsdoc
  public async refresh(isActive: boolean): Promise<void> {
    const icao = this.leg.leg.fixIcao;
    if (!this._waypoint && icao !== '' && icao !== ICAO.emptyIcao) {
      this._waypoint = await this.getFacilityWaypoint(icao);

      if (this._waypoint) {
        this.registerWaypoint(this._waypoint, this.inactiveRenderRole);
        if (this.isActive) {
          this.registerWaypoint(this._waypoint, this.activeRenderRole);
        }
      }
    }

    if (isActive !== this.isActive) {
      if (this._waypoint) {
        isActive
          ? this.registerWaypoint(this._waypoint, this.activeRenderRole)
          : this.deregisterWaypoint(this._waypoint, this.activeRenderRole);
      }
      this.isActive = isActive;
    }
  }

  /**
   * Gets a facility waypoint from an ICAO string.
   * @param icao A facility ICAO string.
   * @returns a facility waypoint, or null if one could not be created.
   */
  private async getFacilityWaypoint(icao: string): Promise<FacilityWaypoint<any> | null> {
    try {
      const facility = await this.facLoader.getFacility(ICAO.getFacilityType(icao), icao);
      return this.facWaypointCache.get(facility);
    } catch (e) {
      // noop
    }

    return null;
  }

  // eslint-disable-next-line jsdoc/require-jsdoc
  public destroy(): void {
    if (!this._waypoint) {
      return;
    }

    this.deregisterWaypoint(this._waypoint, this.inactiveRenderRole);
    this.isActive && this.deregisterWaypoint(this._waypoint, this.activeRenderRole);
  }
}

/**
 * A record with a single flight path waypoint representing its flight plan leg's terminator fix.
 */
export class FlightPathTerminatorWaypointsRecord extends AbstractFlightPlanLegWaypointsRecord {
  protected _waypoint: FlightPathWaypoint | null = null;

  // eslint-disable-next-line jsdoc/require-returns
  /**
   * This record's flight path waypoint.
   */
  public get waypoint(): FlightPathWaypoint | null {
    return this._waypoint;
  }

  // eslint-disable-next-line jsdoc/require-jsdoc
  public async refresh(isActive: boolean): Promise<void> {
    const lastVector = this.leg.calculated?.flightPath[this.leg.calculated.flightPath.length - 1];

    if (lastVector) {
      if (!this._waypoint || !this._waypoint.location.equals(lastVector.endLat, lastVector.endLon)) {
        this.cleanUpWaypoint();
        this._waypoint = new FlightPathWaypoint(lastVector.endLat, lastVector.endLon, this.leg.name ?? '');

        this.registerWaypoint(this._waypoint, this.inactiveRenderRole);
        if (this.isActive) {
          this.registerWaypoint(this._waypoint, this.activeRenderRole);
        }
      }
    } else {
      this.cleanUpWaypoint();
    }

    if (isActive !== this.isActive) {
      if (this._waypoint) {
        isActive
          ? this.registerWaypoint(this._waypoint, this.activeRenderRole)
          : this.deregisterWaypoint(this._waypoint, this.activeRenderRole);
      }
      this.isActive = isActive;
    }
  }

  // eslint-disable-next-line jsdoc/require-jsdoc
  public destroy(): void {
    this.cleanUpWaypoint();
  }

  /**
   * Deregisters this record's waypoint, if it exists, from the waypoint renderer.
   */
  private cleanUpWaypoint(): void {
    if (!this._waypoint) {
      return;
    }

    this.deregisterWaypoint(this._waypoint, this.inactiveRenderRole);
    this.isActive && this.deregisterWaypoint(this._waypoint, this.activeRenderRole);
  }
}

/**
 * A record for procedure turn (PI) legs. Maintains two waypoints, both located at the PI leg's origin fix. The first
 * waypoint is a standard FacilityWaypoint which is never rendered in an active flight plan waypoint role. The second
 * is a ProcedureTurnWaypoint with an ident string equal to the PI leg's given name and which can be rendered in an
 * active flight plan waypoint role.
 */
export class ProcedureTurnLegWaypointsRecord extends AbstractFlightPlanLegWaypointsRecord {
  private fixIcaoRecord: FixIcaoWaypointsRecord;

  private ptWaypoint: ProcedureTurnLegWaypoint | null = null;

  /**
   * Constructor.
   * @param leg The flight plan leg associated with this record.
   * @param waypointRenderer The renderer used to render this record's waypoints.
   * @param facLoader The facility loader used by this waypoint.
   * @param facWaypointCache The facility waypoint cache used by this record.
   * @param inactiveRenderRole The role(s) under which the waypoint should be registered when it is part of an inactive
   * leg.
   * @param activeRenderRole The role(s) under which the waypoint should be registered when it is part of an active
   * leg.
   */
  constructor(
    leg: LegDefinition,
    waypointRenderer: MapWaypointRenderer,
    facLoader: FacilityLoader,
    facWaypointCache: FacilityWaypointCache,
    inactiveRenderRole: MapWaypointRenderRole,
    activeRenderRole: MapWaypointRenderRole
  ) {
    super(leg, waypointRenderer, facLoader, inactiveRenderRole, activeRenderRole);

    this.fixIcaoRecord = new FixIcaoWaypointsRecord(leg, waypointRenderer, facLoader, facWaypointCache, inactiveRenderRole, activeRenderRole);
  }

  // eslint-disable-next-line jsdoc/require-jsdoc
  public async refresh(isActive: boolean): Promise<void> {
    await this.fixIcaoRecord.refresh(false);
    if (!this.ptWaypoint && this.fixIcaoRecord.waypoint) {
      this.ptWaypoint = new ProcedureTurnLegWaypoint(this.fixIcaoRecord.waypoint.location.lat, this.fixIcaoRecord.waypoint.location.lon, this.leg.name ?? '');
      this.registerWaypoint(this.ptWaypoint, this.inactiveRenderRole);
      if (this.isActive) {
        this.deregisterWaypoint(this.ptWaypoint, this.activeRenderRole);
      }
    }

    if (isActive !== this.isActive) {
      if (this.ptWaypoint) {
        isActive
          ? this.registerWaypoint(this.ptWaypoint, this.activeRenderRole)
          : this.deregisterWaypoint(this.ptWaypoint, this.activeRenderRole);
      }
      this.isActive = isActive;
    }
  }

  // eslint-disable-next-line jsdoc/require-jsdoc
  public destroy(): void {
    this.fixIcaoRecord.destroy();

    if (!this.ptWaypoint) {
      return;
    }

    this.deregisterWaypoint(this.ptWaypoint, this.inactiveRenderRole);
    this.isActive && this.deregisterWaypoint(this.ptWaypoint, this.activeRenderRole);
  }
}

/**
 * A waypoint marking a procedure turn leg.
 */
export class ProcedureTurnLegWaypoint extends CustomWaypoint {
  public static readonly UID_PREFIX = 'PI';

  /**
   * Constructor.
   * @param lat The latitude of this waypoint.
   * @param lon The longitude of this waypoint.
   * @param ident The ident string of this waypoint.
   */
  constructor(lat: number, lon: number, public readonly ident: string) {
    super(lat, lon, `${ProcedureTurnLegWaypoint.UID_PREFIX}_${ident}`);
  }
}