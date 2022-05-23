import { BitFlags } from 'msfssdk';
import { FlightPlan, LegDefinition, LegDefinitionFlags } from 'msfssdk/flightplan';
import { FacilityLoader, FacilityWaypointCache, LegType } from 'msfssdk/navigation';

import {
  FixIcaoWaypointsRecord, FlightPathTerminatorWaypointsRecord, FlightPlanLegWaypointsRecord, ProcedureTurnLegWaypointsRecord
} from '../../../../Shared/Map/MapFlightPlanWaypointRecord';
import { MapWaypointRenderer, MapWaypointRenderRole } from '../../../../Shared/Map/MapWaypointRenderer';

/**
 * Manages transition preview waypoint records.
 */
export class MFDProcMapTransitionWaypointRecordManager {
  private readonly legWaypointRecords = new Map<LegDefinition, FlightPlanLegWaypointsRecord>();

  private _isBusy = false;

  /**
   * Constructor.
   * @param facLoader This manager's facility loader.
   * @param facWaypointCache This manager's facility waypoint cache.
   * @param waypointRenderer This manager's waypoint renderer.
   * @param renderRole The role(s) under which waypoints should be registered.
   */
  constructor(
    private readonly facLoader: FacilityLoader,
    private readonly facWaypointCache: FacilityWaypointCache,
    private readonly waypointRenderer: MapWaypointRenderer,
    private readonly renderRole: MapWaypointRenderRole,
  ) {
  }

  /**
   * Checks whether this manager is busy with a waypoint refresh.
   * @returns Whether this manager is busy with a waypoint refresh.
   */
  public isBusy(): boolean {
    return this._isBusy;
  }

  // eslint-disable-next-line jsdoc/require-throws
  /**
   * Refreshes this manager's waypoint records, keeping them up to date with a specified flight plan.
   * @param flightPlan A flight plan.
   * @param repick Whether to repick waypoints.
   * @param pickPosition The position within each transition from which to pick waypoints. Ignored if `repick` is
   * false. Defaults to `first`.
   */
  public async refreshWaypoints(
    flightPlan: FlightPlan | null,
    repick: boolean,
    pickPosition?: 'first' | 'last'
  ): Promise<void> {
    if (this._isBusy) {
      throw new Error('MFDProcMapTransitionWaypointRecordManager: cannot refresh waypoints while busy');
    }

    this._isBusy = true;

    if (!flightPlan) {
      // Remove all waypoint records.
      for (const record of this.legWaypointRecords.values()) {
        record.destroy();
      }
      this.legWaypointRecords.clear();

      this._isBusy = false;
      return;
    }

    if (repick) {
      const legsToDisplay = new Set<LegDefinition>();

      if ((pickPosition ?? 'first') === 'first') {
        this.pickFirst(flightPlan, legsToDisplay);
      } else {
        this.pickLast(flightPlan, legsToDisplay);
      }

      // Remove records of legs that are no longer in the set of legs to display.
      for (const record of this.legWaypointRecords.values()) {
        if (legsToDisplay.has(record.leg)) {
          legsToDisplay.delete(record.leg);
        } else {
          record.destroy();
          this.legWaypointRecords.delete(record.leg);
        }
      }

      // Create new records for legs to display that don't already have records.
      for (const leg of legsToDisplay) {
        const record = this.createLegWaypointsRecord(leg);
        this.legWaypointRecords.set(leg, record);
      }
    }

    const waypointRefreshes: Promise<void>[] = [];
    for (const record of this.legWaypointRecords.values()) {
      waypointRefreshes.push(record.refresh(false));
    }

    await Promise.all(waypointRefreshes);

    this._isBusy = false;
  }

  /**
   * Picks the first waypoint in each transition to display.
   * @param flightPlan The transition preview flight plan.
   * @param legsToDisplay A set of legs from which to display waypoints.
   */
  private pickFirst(flightPlan: FlightPlan, legsToDisplay: Set<LegDefinition>): void {
    let isFirst = true;
    for (const leg of flightPlan.legs()) {
      if (isFirst && !BitFlags.isAny(leg.flags, LegDefinitionFlags.DirectTo | LegDefinitionFlags.VectorsToFinal)) {
        legsToDisplay.add(leg);
      }

      isFirst = leg.leg.type === LegType.Discontinuity;
    }
  }

  /**
   * Picks the last waypoint in each transition to display.
   * @param flightPlan The transition preview flight plan.
   * @param legsToDisplay A set of legs from which to display waypoints.
   */
  private pickLast(flightPlan: FlightPlan, legsToDisplay: Set<LegDefinition>): void {
    let lastLeg: LegDefinition | undefined;
    for (const leg of flightPlan.legs()) {
      if (lastLeg && leg.leg.type === LegType.Discontinuity && !BitFlags.isAny(lastLeg.flags, LegDefinitionFlags.DirectTo | LegDefinitionFlags.VectorsToFinal)) {
        legsToDisplay.add(lastLeg);
      }

      lastLeg = leg;
    }

    if (lastLeg) {
      legsToDisplay.add(lastLeg);
    }
  }

  /**
   * Creates a FlightPlanLegWaypointsRecord for a specified flight plan leg.
   * @param leg A flight plan leg.
   * @returns A FlightPlanLegWaypointsRecord for the specified flight plan leg.
   */
  private createLegWaypointsRecord(leg: LegDefinition): FlightPlanLegWaypointsRecord {
    switch (leg.leg.type) {
      case LegType.CD:
      case LegType.VD:
      case LegType.CR:
      case LegType.VR:
      case LegType.FC:
      case LegType.FD:
      case LegType.FA:
      case LegType.CA:
      case LegType.VA:
      case LegType.FM:
      case LegType.VM:
      case LegType.CI:
      case LegType.VI:
        return new FlightPathTerminatorWaypointsRecord(leg, this.waypointRenderer, this.facLoader, this.renderRole, this.renderRole);
      case LegType.PI:
        return new ProcedureTurnLegWaypointsRecord(leg, this.waypointRenderer, this.facLoader, this.facWaypointCache, this.renderRole, this.renderRole);
      default:
        return new FixIcaoWaypointsRecord(leg, this.waypointRenderer, this.facLoader, this.facWaypointCache, this.renderRole, this.renderRole);
    }
  }
}