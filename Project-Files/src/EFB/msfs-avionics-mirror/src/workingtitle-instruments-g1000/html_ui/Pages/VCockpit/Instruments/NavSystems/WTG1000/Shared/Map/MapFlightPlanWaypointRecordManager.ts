import { BitFlags } from 'msfssdk';
import { FlightPlan, LegDefinition, LegDefinitionFlags } from 'msfssdk/flightplan';
import { FacilityLoader, FacilityWaypointCache, LegType } from 'msfssdk/navigation';

import {
  FixIcaoWaypointsRecord, FlightPathTerminatorWaypointsRecord, FlightPlanLegWaypointsRecord, ProcedureTurnLegWaypointsRecord
} from './MapFlightPlanWaypointRecord';
import { MapWaypointRenderer, MapWaypointRenderRole } from './MapWaypointRenderer';

/**
 * Manages flight plan waypoint records.
 */
export class MapFlightPlanWaypointRecordManager {
  private readonly legWaypointRecords = new Map<LegDefinition, FlightPlanLegWaypointsRecord>();

  private _isBusy = false;

  /**
   * Constructor.
   * @param facLoader This manager's facility loader.
   * @param facWaypointCache This manager's facility waypoint cache.
   * @param waypointRenderer This manager's waypoint renderer.
   * @param inactiveRenderRole The role(s) under which waypoints should be registered when they are part of an inactive
   * leg.
   * @param activeRenderRole The role(s) under which waypoints should be registered when they are part of an active
   * leg.
   */
  constructor(
    private readonly facLoader: FacilityLoader,
    private readonly facWaypointCache: FacilityWaypointCache,
    private readonly waypointRenderer: MapWaypointRenderer,
    private readonly inactiveRenderRole: MapWaypointRenderRole,
    private readonly activeRenderRole: MapWaypointRenderRole
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
   * @param activeLegIndex The global index of the active flight plan leg, or -1 if there is no active leg.
   * @param repick Whether to repick waypoints.
   * @param startIndex The global index of the first flight plan leg from which to pick waypoints, inclusive. Defaults
   * to 0. Ignored if `repick` is false.
   * @param endIndex The global index of the last flight plan leg from which to pick waypoints, inclusive. Defaults to
   * `flightPlan.length - 1`. Ignored if `repick` is false.
   */
  public async refreshWaypoints(
    flightPlan: FlightPlan | null,
    activeLegIndex: number,
    repick: boolean,
    startIndex?: number,
    endIndex?: number
  ): Promise<void> {
    if (this._isBusy) {
      throw new Error('MapFlightPlanWaypointRecordManager: cannot refresh waypoints while busy');
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

    const activeLeg = flightPlan.tryGetLeg(activeLegIndex);

    if (repick) {
      startIndex ??= 0;
      endIndex ??= flightPlan.length - 1;

      const legsToDisplay = new Set<LegDefinition>();
      // Gather all legs to display.
      let legIndex = startIndex;
      for (const leg of flightPlan.legs(false, startIndex)) {
        if (legIndex > endIndex) {
          break;
        }

        if (!BitFlags.isAny(leg.flags, LegDefinitionFlags.DirectTo | LegDefinitionFlags.VectorsToFinal) || legIndex === flightPlan.activeLateralLeg) {
          legsToDisplay.add(leg);
        }

        legIndex++;
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
      waypointRefreshes.push(record.refresh(record.leg === activeLeg));
    }

    await Promise.all(waypointRefreshes);

    this._isBusy = false;
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
        return new FlightPathTerminatorWaypointsRecord(leg, this.waypointRenderer, this.facLoader, this.inactiveRenderRole, this.activeRenderRole);
      case LegType.PI:
        return new ProcedureTurnLegWaypointsRecord(leg, this.waypointRenderer, this.facLoader, this.facWaypointCache, this.inactiveRenderRole, this.activeRenderRole);
      default:
        return new FixIcaoWaypointsRecord(leg, this.waypointRenderer, this.facLoader, this.facWaypointCache, this.inactiveRenderRole, this.activeRenderRole);
    }
  }
}