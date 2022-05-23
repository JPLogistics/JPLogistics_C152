import { MagVar, NavMath, UnitType } from 'msfssdk';
import { FlightPathUtils, FlightPlan } from 'msfssdk/flightplan';
import { FacilityWaypointCache, ICAO, LegTurnDirection, LegType } from 'msfssdk/navigation';

import { Fms } from 'garminsdk/flightplan';

import { HoldStore } from './HoldStore';

/**
 * A controller for the Hold dialog.
 */
export class HoldController {

  private readonly facWaypointCache = FacilityWaypointCache.getCache();

  /**
   * Creates an instance of a HoldController.
   * @param store The hold store to use with this instance.
   * @param fms The FMS to use with this instance.
   */
  constructor(private readonly store: HoldStore, private readonly fms: Fms) {
    store.indexes.sub(async i => {
      try {
        const plan = this.fms.hasFlightPlan(store.indexes.get().planIndex) && this.fms.getFlightPlan(store.indexes.get().planIndex);
        const leg = plan && plan.getSegment(i.segmentIndex).legs[i.legIndex];
        if (plan && leg) {
          this.store.fixIcao.set(leg.leg.fixIcao);

          const nextLeg = plan.getNextLeg(i.segmentIndex, i.legIndex);
          if (nextLeg && nextLeg.leg.type === LegType.HM && nextLeg.leg.fixIcao === leg.leg.fixIcao) {
            // If the next leg is already a hold, pre-populate the existing hold parameters.

            const isTime = nextLeg.leg.distanceMinutes;

            this.store.isInbound.set(0);
            this.store.turnDirection.set(nextLeg.leg.turnDirection === LegTurnDirection.Left ? 0 : 1);
            this.store.course.set(nextLeg.leg.course);
            this.store.isTime.set(isTime ? 0 : 1);
            if (isTime) {
              this.store.time.set(nextLeg.leg.distance, UnitType.MINUTE);
            } else {
              this.store.distance.set(nextLeg.leg.distance, UnitType.METER);
            }
          } else {
            // Pre-populate the course with the final course of the parent leg.

            this.store.isInbound.set(0);

            if (leg.calculated && leg.calculated.endLat !== undefined && leg.calculated.endLon !== undefined) {
              const course = FlightPathUtils.getLegFinalCourse(leg.calculated);
              this.store.course.set(course !== undefined ? MagVar.trueToMagnetic(course, leg.calculated.endLat, leg.calculated.endLon) : 0);
            } else {
              this.store.course.set(0);
            }
          }

          try {
            const fac = await this.fms.facLoader.getFacility(ICAO.getFacilityType(leg.leg.fixIcao), leg.leg.fixIcao);
            this.store.waypoint.set(this.facWaypointCache.get(fac));
          } catch { /** Continue */ }
          return;
        }
      } catch {
        // noop
      }

      this.store.fixIcao.set('');
      this.store.waypoint.set(null);
    }, true);
  }

  /**
   * Resets the hold dialog data.
   */
  public reset(): void {
    this.store.indexes.set({ segmentIndex: -1, legIndex: -1, planIndex: Fms.PRIMARY_PLAN_INDEX });
    this.store.distance.set(4);
    this.store.time.set(60);
    this.store.isInbound.set(0);
    this.store.isTime.set(0);
    this.store.turnDirection.set(1);
  }

  /**
   * Accepts the currently defined hold and adds it to the flight plan.
   */
  public accept(): void {
    const indexes = this.store.indexes.get();

    if (indexes.segmentIndex < 0 || indexes.legIndex < 0) {
      return;
    }

    const isTime = this.store.isTime.get() === 0 ? true : false;
    const leg = FlightPlan.createLeg({
      type: LegType.HM,
      turnDirection: this.store.turnDirection.get() + 1,
      course: this.store.isInbound.get() === 1 ? NavMath.normalizeHeading(this.store.course.get() + 180) : this.store.course.get(),
      distance: isTime ? this.store.time.get().asUnit(UnitType.MINUTE) : this.store.distance.get().asUnit(UnitType.METER),
      distanceMinutes: isTime,
      fixIcao: this.store.fixIcao.get()
    });

    if (this.fms.hasFlightPlan(indexes.planIndex)) {
      const plan = this.fms.getFlightPlan(indexes.planIndex);
      const nextLeg = plan.getNextLeg(indexes.segmentIndex, indexes.legIndex);

      // If we are editing a hold, delete the old leg.
      if (nextLeg && nextLeg.leg.type === LegType.HM && nextLeg.leg.fixIcao === leg.fixIcao) {
        const segment = plan.getSegmentFromLeg(nextLeg);
        segment && this.fms.removeWaypoint(segment.segmentIndex, segment.legs.indexOf(nextLeg));
      }

      this.fms.insertHold(indexes.planIndex, indexes.segmentIndex, indexes.legIndex, leg);
      this.reset();
    } else { this.reset(); }
  }
}