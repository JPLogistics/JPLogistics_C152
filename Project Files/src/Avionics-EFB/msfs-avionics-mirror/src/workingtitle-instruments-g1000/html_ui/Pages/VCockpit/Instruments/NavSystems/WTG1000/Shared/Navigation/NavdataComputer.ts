import { BitFlags, GeoCircle, GeoPoint, GeoPointInterface, MagVar, NavMath, UnitType } from 'msfssdk';
import { EventBus, SimVarValueType } from 'msfssdk/data';
import { AirportFacility, FacilityType, FixTypeFlags, LegType, FacilityLoader, RnavTypeFlags, AdditionalApproachType } from 'msfssdk/navigation';
import {
  FlightPlanSegment, FlightPlanSegmentType, LegDefinition, FlightPlanner, FlightPlannerEvents,
  FlightPlanOriginDestEvent, OriginDestChangeType, FlightPathUtils, FlightPathVectorFlags, LegDefinitionFlags
} from 'msfssdk/flightplan';

import { LNavData, LNavDirector, LNavEvents, TransitionMode } from '../Autopilot/Directors/LNavDirector';
import { CDIScaleLabel, LNavVars } from '../Autopilot/LNavSimVars';
import { G1000ControlEvents } from '../G1000Events';
import { ApproachDetails } from '../FlightPlan/Fms';
import { GNSSEvents } from 'msfssdk/instruments';

/**
 * A class that calculates displayed lateral nav data information from
 * supplied lnav values.
 */
export class NavdataComputer {
  private readonly vec3Cache = [new Float64Array(3)];
  private readonly geoPointCache = [new GeoPoint(0, 0), new GeoPoint(0, 0), new GeoPoint(0, 0)];
  private readonly geoCircleCache = [new GeoCircle(new Float64Array(3), 0)];

  private readonly planePos = new GeoPoint(0, 0);

  private obsAvailable = false;
  private approachDetails: ApproachDetails = {
    approachLoaded: false,
    approachType: ApproachType.APPROACH_TYPE_UNKNOWN,
    approachRnavType: RnavTypeFlags.None,
    approachIsActive: false,
    approachIsCircling: false
  };

  private originFacility?: AirportFacility;

  private destinationFacility?: AirportFacility;

  /**
   * Creates a new instance of the NavdataComputer.
   * @param bus The event bus to use with this instance.
   * @param flightPlanner The flight planner to use with this instance.
   * @param facilityLoader The facility loader to use with this instance.
   */
  constructor(private bus: EventBus, private flightPlanner: FlightPlanner, private facilityLoader: FacilityLoader) {
    const sub = this.bus.getSubscriber<GNSSEvents & LNavEvents & FlightPlannerEvents & G1000ControlEvents>();

    sub.on('gps-position').handle(lla => { this.planePos.set(lla.lat, lla.long); });
    sub.on('dataChanged').handle(this.onDataChange.bind(this));
    sub.on('fplOriginDestChanged').handle(this.flightPlanOriginDestChanged.bind(this));
    sub.on('approach_details_set').handle(d => { this.approachDetails = d; });
  }

  /**
   * A callback fired when the LNAV data changes.
   * @param data The new LNAV data.
   */
  private onDataChange(data: LNavData): void {
    const magVar = MagVar.get(this.planePos);

    this.computeTrackingVars(data, magVar);
    this.computeCDIScaling(data);
    //SimVar.SetSimVarValue(LNavVars.CurrentVector, 'number', data.vectorIndex);

    if (this.flightPlanner.hasActiveFlightPlan()) {
      const plan = this.flightPlanner.getActiveFlightPlan();

      const currentLeg = data.currentLegIndex >= 0 && data.currentLegIndex < plan.length ? plan.getLeg(data.currentLegIndex) : undefined;
      if (currentLeg) {
        this.setObsAvailable(currentLeg.leg.type);
      }
    }
  }

  /**
   * A callback fired when the origin or destination changes in the flight plan.
   * @param e The event that was captured.
   */
  private flightPlanOriginDestChanged(e: FlightPlanOriginDestEvent): void {
    if (e.airport !== undefined) {
      this.facilityLoader.getFacility(FacilityType.Airport, e.airport).then(fac => {
        switch (e.type) {
          case OriginDestChangeType.OriginAdded:
            this.originFacility = fac;
            break;
          case OriginDestChangeType.DestinationAdded:
            this.destinationFacility = fac;
            break;
        }
      });
    }

    if (e.type === OriginDestChangeType.OriginRemoved) {
      this.originFacility = undefined;
    }

    if (e.type === OriginDestChangeType.DestinationRemoved) {
      this.destinationFacility = undefined;
    }
  }

  /**
   * Computes the nav tracking data, such as XTK, DTK, and distance to turn.
   * @param data The LNAV data to compute with.
   * @param magVar The computed current location magvar.
   */
  private computeTrackingVars(data: LNavData, magVar: number): void {
    let xtk = 0;
    let dtk = 0;
    let distance = 0;
    let distanceToTurn = 0;
    let totalDistance = 0;
    let isTracking = false;

    const plan = this.flightPlanner.hasActiveFlightPlan() && this.flightPlanner.getActiveFlightPlan();

    const currentLeg = plan && data.currentLegIndex >= 0 && data.currentLegIndex < plan.length ? plan.getLeg(data.currentLegIndex) : undefined;
    const nextLeg = plan && data.nextLegIndex >= 0 && data.nextLegIndex < plan.length ? plan.getLeg(data.nextLegIndex) : undefined;

    if (data.transitionMode === TransitionMode.Egress && nextLeg?.calculated?.flightPath.length) {
      const circle = FlightPathUtils.setGeoCircleFromVector(nextLeg.calculated.flightPath[0], this.geoCircleCache[0]);
      xtk = UnitType.GA_RADIAN.convertTo(circle.distance(this.planePos), UnitType.NMILE);
      dtk = nextLeg.calculated.initialDtk ?? 0;

      distance = this.getActiveDistance(nextLeg, this.planePos);
      distanceToTurn = this.getDistanceToTurn(nextLeg, this.planePos);

      isTracking = true;
    } else if (currentLeg?.calculated?.flightPath.length) {
      const legCalc = currentLeg.calculated;
      let vector = legCalc.flightPath[
        data.transitionMode === TransitionMode.None
          ? data.vectorIndex
          : data.transitionMode === TransitionMode.Ingress
            ? 0
            : legCalc.flightPath.length - 1
      ];

      switch (currentLeg.leg.type) {
        case LegType.DF:
          vector = legCalc.flightPath[legCalc.flightPath.length - 1];
          break;
        case LegType.HM:
        case LegType.HF:
        case LegType.HA: {
          const vectors = data.transitionMode === TransitionMode.None
            ? LNavDirector.getVectorsForTransitionMode(legCalc, data.transitionMode, data.isSuspended)
            : legCalc.flightPath;
          const searchStartIndex = data.transitionMode === TransitionMode.None
            ? data.vectorIndex
            : data.transitionMode === TransitionMode.Ingress
              ? 0
              : 3;

          for (let i = searchStartIndex; i < vectors.length; i++) {
            const holdVector = vectors[i];
            if (BitFlags.isAll(holdVector.flags, FlightPathVectorFlags.HoldLeg)) {
              vector = holdVector;
              break;
            }
          }
        }
      }

      if (vector !== undefined) {
        const circle = FlightPathUtils.setGeoCircleFromVector(vector, this.geoCircleCache[0]);
        const alongTrackPos = circle.closest(this.planePos, this.vec3Cache[0]);

        xtk = UnitType.GA_RADIAN.convertTo(circle.distance(this.planePos), UnitType.NMILE);
        dtk = MagVar.trueToMagnetic(circle.bearingAt(alongTrackPos), magVar);

        distance = this.getActiveDistance(currentLeg, this.planePos);
        distanceToTurn = this.getDistanceToTurn(currentLeg, this.planePos);

        totalDistance = this.getTotalDistance(distance);

        isTracking = true;
      }
    }

    SimVar.SetSimVarValue(LNavVars.DTK, SimVarValueType.Degree, dtk);
    SimVar.SetSimVarValue(LNavVars.XTK, SimVarValueType.NM, xtk);
    SimVar.SetSimVarValue(LNavVars.Distance, SimVarValueType.Meters, distance);
    SimVar.SetSimVarValue(LNavVars.DistanceToTurn, SimVarValueType.Meters, distanceToTurn);
    SimVar.SetSimVarValue(LNavVars.DistanceToDestination, SimVarValueType.Meters, totalDistance);
    SimVar.SetSimVarValue(LNavVars.IsTrackingWaypoint, SimVarValueType.Bool, isTracking);
  }

  /**
   * Computes the CDI scaling for the given LNAV data.
   * @param data The LNAV data to compute with.
   */
  private computeCDIScaling(data: LNavData): void {
    let scaling = 2.0;
    let scalingLabel = CDIScaleLabel.Enroute;
    const flightPlan = this.flightPlanner.hasActiveFlightPlan() ? this.flightPlanner.getActiveFlightPlan() : undefined;

    if (flightPlan && flightPlan.length > 0 && flightPlan.activeLateralLeg < flightPlan.length) {
      const activeSegment = flightPlan.getSegment(flightPlan.getSegmentIndex(flightPlan.activeLateralLeg));

      let previousLeg: LegDefinition | undefined;
      try {
        previousLeg = flightPlan.getLeg(flightPlan.activeLateralLeg - 1);
      } catch { /*Do nothing*/ }

      //We are currently in the departure segment
      if (activeSegment.segmentType === FlightPlanSegmentType.Departure) {
        scaling = 0.3;
        scalingLabel = CDIScaleLabel.Departure;

        const prevLegType = previousLeg?.leg.type;
        if (prevLegType && prevLegType !== LegType.IF && prevLegType !== LegType.CA && prevLegType !== LegType.FA) {
          scaling = 1.0;
          scalingLabel = CDIScaleLabel.Terminal;
        }
      }

      //We are not in the departure segment any longer
      if (this.originFacility !== undefined && activeSegment.segmentType !== FlightPlanSegmentType.Departure) {
        const distance = UnitType.GA_RADIAN.convertTo(this.planePos.distance(this.originFacility), UnitType.NMILE);
        scaling = 2.0 - NavMath.clamp(31 - distance, 0, 1);

        if (distance <= 30) {
          scalingLabel = CDIScaleLabel.Terminal;
        }
      }

      //Check for distance to destination
      if (this.destinationFacility !== undefined && activeSegment.segmentType !== FlightPlanSegmentType.Departure) {
        const distance = UnitType.GA_RADIAN.convertTo(this.planePos.distance(this.destinationFacility), UnitType.NMILE);
        scaling = 2.0 - NavMath.clamp(31 - distance, 0, 1);

        if (distance <= 30) {
          scalingLabel = CDIScaleLabel.Terminal;
        }
      }

      //Check for distance from arrival start
      if (activeSegment.segmentType === FlightPlanSegmentType.Arrival && activeSegment.legs.length > 1) {
        const firstArrivalLeg = activeSegment.legs[1];

        //If we're going from the start of the arrival (i.e. the second leg)
        if (
          flightPlan.activeLateralLeg === activeSegment.offset + 1
          && firstArrivalLeg.calculated?.startLat !== undefined
          && firstArrivalLeg.calculated?.startLon !== undefined
          && firstArrivalLeg.calculated?.endLat !== undefined
          && firstArrivalLeg.calculated?.endLon !== undefined
        ) {
          const start = this.geoPointCache[1].set(firstArrivalLeg.calculated.startLat, firstArrivalLeg.calculated.startLon);
          const end = this.geoPointCache[2].set(firstArrivalLeg.calculated.endLat, firstArrivalLeg.calculated.endLon);
          const distance = NavMath.alongTrack(start, end, this.planePos);
          scaling = 2.0 - NavMath.clamp(distance, 0, 1);

          if (distance >= 1) {
            scalingLabel = CDIScaleLabel.Terminal;
          }
        } else if (flightPlan.activeLateralLeg > activeSegment.offset + 1) {
          scaling = 1.0;
          scalingLabel = CDIScaleLabel.Terminal;
        }
      }

      //We are in the approach
      if (activeSegment.segmentType === FlightPlanSegmentType.Approach) {

        scaling = 1.0;
        scalingLabel = CDIScaleLabel.Terminal;

        const fafIndex = this.getFafIndex(activeSegment);

        const currentLeg = data.currentLegIndex >= 0 && data.currentLegIndex < flightPlan.length ? flightPlan.getLeg(data.currentLegIndex) : undefined;

        if (fafIndex !== undefined && flightPlan.activeLateralLeg === fafIndex) {
          const fafCalc = flightPlan.getLeg(fafIndex).calculated;

          if (fafCalc?.endLat !== undefined && fafCalc?.endLon !== undefined) {
            const distance = UnitType.GA_RADIAN.convertTo(this.planePos.distance(fafCalc.endLat, fafCalc.endLon), UnitType.NMILE);
            scaling = 1.0 - (0.7 * (NavMath.clamp(2 - distance, 0, 2) / 2));

            if (distance <= 2) {
              scalingLabel = this.getApproachCdiScale();
            }
          }
        } else if (currentLeg?.calculated?.endLat && currentLeg?.calculated?.endLon && fafIndex !== undefined && flightPlan.activeLateralLeg > fafIndex) {

          if (currentLeg && BitFlags.isAll(currentLeg.flags, LegDefinitionFlags.MissedApproach)) {
            scaling = 1.0;
            scalingLabel = CDIScaleLabel.MissedApproach;
          } else {
            const legLength = currentLeg.calculated.distance;
            const distance = UnitType.GA_RADIAN.convertTo(this.planePos.distance(currentLeg.calculated.endLat, currentLeg.calculated.endLon), UnitType.NMILE);

            scaling = 0.3 - (0.112 * (NavMath.clamp(legLength - distance, 0, legLength) / legLength));
            scalingLabel = this.getApproachCdiScale();
          }
        }
      }
    }

    SimVar.SetSimVarValue(LNavVars.CDIScale, SimVarValueType.NM, scaling);
    SimVar.SetSimVarValue(LNavVars.CDIScaleLabel, SimVarValueType.Number, scalingLabel);
  }

  /**
   * Gets the index of the FAF in a segment.
   * @param segment The segment to search.
   * @returns The index of the FAF if found.
   */
  private getFafIndex(segment: FlightPlanSegment): number | undefined {
    let fafLeg = segment.legs[segment.legs.length - 2];
    let fafIndex = segment.legs.length - 2;

    for (let i = 0; i < segment.legs.length; i++) {
      const leg = segment.legs[i];
      if (leg.leg.fixTypeFlags & FixTypeFlags.FAF) {
        fafLeg = leg;
        fafIndex = i;
        break;
      }
    }

    if (fafLeg !== undefined) {
      return segment.offset + fafIndex;
    }
  }

  /**
   * Gets the active distance from the plane position to the leg end.
   * @param leg The leg to get the distance for.
   * @param pos The current plane position.
   * @returns The distance, in meters.
   */
  private getActiveDistance(leg: LegDefinition, pos: GeoPointInterface): number {
    const finalVector = leg.calculated?.flightPath[leg.calculated.flightPath.length - 1];
    if (finalVector !== undefined) {
      return UnitType.GA_RADIAN.convertTo(pos.distance(finalVector.endLat, finalVector.endLon), UnitType.METER);
    }

    return 0;
  }

  /**
   * Gets the total distance from the plane position to the destination leg.
   * @param activeDistance The distance from the present position to the current leg end.
   * @returns The distance, in meters.
   */
  private getTotalDistance(activeDistance: number): number {
    const plan = this.flightPlanner.getActiveFlightPlan();
    const activeLegCumulativeDistance = plan.activeLateralLeg < plan.length
      ? plan.getLeg(plan.activeLateralLeg).calculated?.cumulativeDistanceWithTransitions
      : undefined;
    let lastLegIndex = Math.max(0, plan.length - 1);
    if (plan.length > 1) {
      const finalSegment = plan.getSegment(plan.getSegmentIndex(plan.length - 1));

      for (let i = finalSegment.legs.length - 1; i >= 0; i--) {
        const leg = finalSegment.legs[i];
        if (!BitFlags.isAll(leg.flags, LegDefinitionFlags.MissedApproach)) {
          lastLegIndex = i + finalSegment.offset;
          break;
        }
      }
    }

    const destinationLegCumulativeDistance = plan.getLeg(lastLegIndex).calculated?.cumulativeDistanceWithTransitions;
    if (destinationLegCumulativeDistance !== undefined && activeLegCumulativeDistance !== undefined && activeDistance >= 0) {
      return destinationLegCumulativeDistance - activeLegCumulativeDistance + activeDistance;
    }
    return 0;
  }

  /**
   * Gets the active distance from the plane position to the next leg turn.
   * @param leg The leg to get the distance for.
   * @param pos The current plane position.
   * @returns The distance, in meters.
   */
  private getDistanceToTurn(leg: LegDefinition, pos: GeoPointInterface): number {
    if (leg.calculated !== undefined) {
      const firstEgressVector = leg.calculated.egress[0];
      if (firstEgressVector) {
        return UnitType.GA_RADIAN.convertTo(pos.distance(firstEgressVector.startLat, firstEgressVector.startLon), UnitType.METER);
      } else {
        return this.getActiveDistance(leg, pos);
      }
    }

    return 0;
  }

  /**
   * Checks and sets whether obs is available on the current leg and sends an event over the bus to update the softkeymenu.
   * @param currentLegType The current leg type.
   */
  private setObsAvailable(currentLegType: LegType): void {
    let newObsAvailable = false;
    switch (currentLegType) {
      case LegType.AF:
      case LegType.CD:
      case LegType.CF:
      case LegType.CR:
      case LegType.DF:
      case LegType.IF:
      case LegType.RF:
      case LegType.TF:
        newObsAvailable = true;
        break;
    }
    if (newObsAvailable !== this.obsAvailable) {
      this.obsAvailable = newObsAvailable;
      this.bus.getPublisher<G1000ControlEvents>().pub('obs_available', this.obsAvailable, true, true);
    }
  }

  /**
   * Checks and returns the CDI Scale when in an approach.
   * @returns The CDIScaleLabel appropriate for the approach.
   */
  private getApproachCdiScale(): CDIScaleLabel {
    switch (this.approachDetails.approachType) {
      case ApproachType.APPROACH_TYPE_GPS:
      case ApproachType.APPROACH_TYPE_RNAV:
        switch (this.approachDetails.approachRnavType) {
          case RnavTypeFlags.LPV:
            return CDIScaleLabel.LPV;
          case RnavTypeFlags.LP:
            return this.approachDetails.approachIsCircling ? CDIScaleLabel.LP : CDIScaleLabel.LPPlusV;
          case RnavTypeFlags.LNAVVNAV:
            return CDIScaleLabel.LNavVNav;
        }
        return this.approachDetails.approachIsCircling ? CDIScaleLabel.LNav : CDIScaleLabel.LNavPlusV;
      case AdditionalApproachType.APPROACH_TYPE_VISUAL:
        return CDIScaleLabel.Visual;
      default:
        return CDIScaleLabel.Terminal;
    }
  }
}